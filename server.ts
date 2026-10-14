import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Serve pdfjs wasm, cmaps, and worker assets locally
app.use('/pdfjs', express.static(path.resolve(__dirname, 'public/pdfjs')));

// Helper to convert raw PCM (24kHz, 16-bit, mono) into valid WAV format
function pcmToWav(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcmBuffer.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // SubChunk1Size (16 for PCM)
  header.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcmBuffer.length, 40);

  return Buffer.concat([header, pcmBuffer]);
}

// Lazy-loaded Gemini AI client
function getAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

// Resilient content generator that prioritizes fast available flash models
async function generateContentWithFallback(ai: GoogleGenAI, contents: any, config: any) {
  const models = ['gemini-2.5-flash', 'gemini-3.8-flash'];
  let lastError: any = null;

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config,
      });
      return response;
    } catch (err: any) {
      console.warn(`Model ${model} request returned:`, err?.status || err?.message || err);
      lastError = err;
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
  }
  throw lastError;
}

// 1. Endpoint: Analyze uploaded textbook photo / page
app.post('/api/analyze-page', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', rawText, pageNumber } = req.body;
    if (!imageBase64 && !rawText) {
      return res.status(400).json({ error: 'Nessuna immagine o testo fornito' });
    }

    const ai = getAIClient();
    if (!ai) {
      return res.status(500).json({
        error: 'Chiave API non configurata nel server',
        fallbackAvailable: true,
      });
    }

    // Clean base64 if it includes data URL scheme
    const cleanBase64 = imageBase64 ? imageBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '') : null;

    const prompt = `Sei un esperto insegnante madrelingua russo e glottodidatta per studenti italiani di livello A1.
L'utente ha scansionato o fotografato la pagina ${pageNumber ? String(pageNumber) : ''} del libro di testo di lingua russa (es. "Стартап А1").

COMPITO PRINCIPALE:
Trascrivi TUTTI i contenuti e gli esercizi presenti nella pagina e trasformali in elementi audio interattivi per lo studio della pronuncia.
Includi:
- Esercizi numerati (1, 2, 3...) di qualsiasi tipo: ascolto (🎧 Слушайте), ripetizione (Повторяйте), lettura (📖 Читайте), scrittura (✏️ Пишите), sillabe, dialoghi (Диалог), vocabolario (Словарь).
- Per ciascun esercizio, identifica TUTTI gli elementi da ascoltare (parole, lettere, sillabe, combinazioni, frasi del dialogo, domande e risposte).
- Per OGNI elemento audio:
  * "textRu": testo originale in cirillico
  * "label": etichetta descrittiva chiara
  * "ipa": trascrizione fonetica tra parentesi quadre
  * "italianPhonetic": pronuncia approssimata all'italiana (es. "privèt", "kak delà")
  * "audioTextToSpeak": testo esatto che la sintesi vocale deve pronunciare
  * "explanationIt": traduzione o significato in italiano

REGOLA CRUCIALE:
NON lasciare MAI l'array "exercises" vuoto. Se la pagina contiene testo in russo, frasi, vocabolario o spiegazioni con esempi, raggruppali in uno o più esercizi completi di elementi audio, così che lo studente possa sempre ascoltare la voce nativa per ogni riga!

Rispondi ESCLUSIVAMENTE in formato JSON valido:
{
  "lessonTitle": "Titolo Lezione o Argomento della Pagina",
  "pageNumber": "${pageNumber || '1'}",
  "overviewIt": "Sintesi chiara in italiano degli argomenti trattati in questa pagina",
  "exercises": [
    {
      "id": "ex_1",
      "number": "1",
      "titleRu": "Titolo originale in russo",
      "titleIt": "Traduzione del titolo in italiano",
      "type": "reading | listening | dialogue | vocabulary | cursive",
      "descriptionIt": "Istruzioni per lo studente in italiano",
      "exerciseNotesIt": "Consigli di pronuncia o grammatica per italiani",
      "audioItems": [
        {
          "id": "item_1",
          "textRu": "Привет",
          "label": "Привет",
          "ipa": "[prʲiˈvʲet]",
          "italianPhonetic": "privièt",
          "audioTextToSpeak": "Привет",
          "explanationIt": "Ciao (informale)"
        }
      ]
    }
  ],
  "vocabulary": [
    {
      "wordRu": "Привет",
      "ipa": "[prʲiˈvʲet]",
      "translationIt": "Ciao",
      "audioTextToSpeak": "Привет",
      "notesIt": "Saluto informale"
    }
  ]
}`;

    const parts: any[] = [{ text: prompt }];

    if (rawText && typeof rawText === 'string' && rawText.trim().length > 0) {
      parts.push({
        text: `TESTO ESTRATTO DAL DOCUMENTO PDF:\n${rawText.slice(0, 10000)}`,
      });
    }

    if (cleanBase64) {
      parts.push({
        inlineData: {
          data: cleanBase64,
          mimeType: mimeType || 'image/jpeg',
        },
      });
    }

    const response = await generateContentWithFallback(
      ai,
      [{ role: 'user', parts }],
      { responseMimeType: 'application/json' }
    );

    let responseText = (response.text || '{}').trim();
    if (responseText.startsWith('```')) {
      responseText = responseText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
    }

    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch (parseErr) {
      console.warn('JSON direct parse failed, attempting extraction:', parseErr);
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Risposta IA non valida');
      }
    }

    // Safety fallback: if exercises array is empty or missing, populate from vocabulary or text
    if (!Array.isArray(parsed.exercises) || parsed.exercises.length === 0) {
      console.log('Exercises was empty, auto-generating fallback from parsed data or raw text');
      const fallbackItems: any[] = [];

      if (Array.isArray(parsed.vocabulary) && parsed.vocabulary.length > 0) {
        parsed.vocabulary.forEach((v: any, i: number) => {
          fallbackItems.push({
            id: `fb-${i}`,
            textRu: v.wordRu || v.word || '',
            label: v.wordRu || v.word || '',
            ipa: v.ipa || '',
            italianPhonetic: v.ipa || '',
            audioTextToSpeak: v.audioTextToSpeak || v.wordRu || v.word || '',
            explanationIt: v.translationIt || v.translation || '',
          });
        });
      } else if (rawText && rawText.trim().length > 0) {
        const words = rawText
          .split(/[\n,.;:!?]+/)
          .map((w: string) => w.trim())
          .filter((w: string) => w.length > 1 && /[а-яА-ЯёЁ]/.test(w))
          .slice(0, 30);

        words.forEach((w: string, i: number) => {
          fallbackItems.push({
            id: `fb-text-${i}`,
            textRu: w,
            label: w,
            ipa: '',
            italianPhonetic: '',
            audioTextToSpeak: w,
            explanationIt: 'Parola estratta dalla pagina',
          });
        });
      }

      parsed.exercises = [
        {
          id: 'ex-generated-fallback',
          number: '1',
          titleRu: parsed.lessonTitle || 'Материалы страницы (Contenuti della Pagina)',
          titleIt: 'Ascolto e lettura dei contenuti estratti',
          type: 'standard_audio_list',
          descriptionIt: 'Clicca su ciascuna parola o frase per ascoltare la corretta pronuncia russa.',
          audioItems: fallbackItems,
        },
      ];
    }

    res.json(parsed);
  } catch (error: any) {
    console.error('Error analyzing page:', error);
    const isOverloaded = error?.status === 503 || error?.message?.includes('high demand') || error?.message?.includes('UNAVAILABLE');
    res.status(isOverloaded ? 503 : 500).json({
      error: isOverloaded
        ? 'I server AI stanno riscontrando un picco temporaneo di richieste. Riprova tra pochi istanti.'
        : error.message || 'Errore durante l\'analisi della pagina',
      isHighDemand: isOverloaded,
    });
  }
});

// 2. Endpoint: High-fidelity Russian Text-to-Speech using Gemini TTS
app.post('/api/tts', async (req, res) => {
  try {
    const { text, speed = 1.0, voice = 'Puck' } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Nessun testo fornito' });
    }

    const ai = getAIClient();
    if (!ai) {
      return res.status(503).json({
        error: 'API key non configurata, usa il sintetizzatore locale',
        useLocalSpeech: true,
      });
    }

    // Direct Gemini TTS model
    const promptText = `Speak in clear, authentic Russian with perfect natural pronunciation for language learners: "${text}"`;

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [{ text: promptText }],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice || 'Puck' },
          },
        },
      },
    });

    const pcmChunks: Buffer[] = [];
    for await (const chunk of responseStream) {
      const data = chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (data) {
        pcmChunks.push(Buffer.from(data, 'base64'));
      }
    }

    if (pcmChunks.length === 0) {
      return res.status(502).json({ error: 'Nessun dato audio generato' });
    }

    const pcm = Buffer.concat(pcmChunks);
    const wav = pcmToWav(pcm, 24000, 1, 16);
    const base64Wav = wav.toString('base64');

    res.json({
      audioUrl: `data:audio/wav;base64,${base64Wav}`,
      durationEstimate: pcm.length / (24000 * 2),
    });
  } catch (error: any) {
    console.error('Error in TTS:', error);
    res.status(500).json({
      error: error.message || 'Errore TTS',
      useLocalSpeech: true,
    });
  }
});

// 3. Endpoint: Ask Russian Language Tutor
app.post('/api/ask-tutor', async (req, res) => {
  try {
    const { question, currentContext } = req.body;
    const ai = getAIClient();
    if (!ai) {
      return res.status(500).json({ error: 'API key non disponibile' });
    }

    const prompt = `Sei un tutor esperto di lingua russa dedicato a studenti italiani principianti (Livello A1).
Rispondi in modo chiaro, incoraggiante e pratico in italiano, con esempi fonetici russi (con accenti indicati e lettere tra parentesi quadre).
Contesto corrente della lezione: ${JSON.stringify(currentContext || {})}
Domanda dello studente: "${question}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    res.json({ answer: response.text });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Errore nel tutor' });
  }
});

// Vite or Static assets mounting
if (process.env.NODE_ENV !== 'production') {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on port ${port}`);
});
