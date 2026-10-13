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

    const prompt = `Sei un esperto insegnante di lingua russa madrelingua e glottodidatta per studenti italiani.
L'utente ha caricato una pagina o foto del libro di testo "Стартап А1" (o simile libro di russo A1).
Questa pagina contiene esercizi di ascolto (indicati con l'icona delle cuffie 🎧 o numeri come "Слушайте, повторяйте, читайте"), esercizi di scrittura ✏️ o lettura 📖.

Compito:
1. Trascrivi fedelmente e analizza tutti gli esercizi presenti nell'immagine.
2. Per ogni esercizio identifica:
   - Numero esercizio e titolo originale in russo (es. "1. Слушайте, повторяйте, читайте.")
   - Traduzione italiana del titolo (es. "Ascoltate, ripetete, leggete.")
   - Tipo di esercizio (fonetica/vocali, combinazioni, diagramma di lettura, parole, sillabe, dialogo)
   - Tutti gli elementi da ascoltare/pronunciare (lettere, suoni, sillabe, combinazioni come 'оа', 'ао', 'ау', parole come 'мир', 'май').
   - Per ogni elemento: testo in russo, trascrizione fonetica / IPA, istruzioni di pronuncia per un italiano (es. posizione della bocca, vocale dura vs dolce, riduzione vocalica).
   - Testo esatto che la voce guida deve pronunciare.
   - Note didattiche e consigli per italiani.

Rispondi ESCLUSIVAMENTE in formato JSON valido con questa struttura esatta:
{
  "lessonTitle": "УРОК ...",
  "pageNumber": "...",
  "overviewIt": "Breve descrizione in italiano di ciò che si impara in questa pagina",
  "exercises": [
    {
      "id": "ex_1",
      "number": "1",
      "titleRu": "Слушайте, повторяйте, читайте.",
      "titleIt": "Ascoltate, ripetete, leggete.",
      "type": "vowels_table",
      "descriptionIt": "Spiegazione per lo studente italiano",
      "audioItems": [
        {
          "id": "item_1",
          "textRu": "А а",
          "label": "Lettera А а",
          "ipa": "[a]",
          "italianPhonetic": "Come la 'a' italiana in 'casa', aperta e rilassata",
          "audioTextToSpeak": "Буква А, звук А. А.",
          "explanationIt": "Vocale dura."
        }
      ],
      "exerciseNotesIt": "Note o curiosità utili"
    }
  ],
  "vocabulary": [
    {
      "wordRu": "мир",
      "ipa": "[mʲir]",
      "translationIt": "pace / mondo",
      "audioTextToSpeak": "мир"
    }
  ]
}`;

    const parts: any[] = [{ text: prompt }];
    if (cleanBase64) {
      parts.push({
        inlineData: {
          data: cleanBase64,
          mimeType: mimeType || 'image/jpeg',
        },
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts,
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '{}';
    const parsed = JSON.parse(responseText);
    res.json(parsed);
  } catch (error: any) {
    console.error('Error analyzing page:', error);
    res.status(500).json({ error: error.message || 'Errore durante l\'analisi della pagina' });
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
