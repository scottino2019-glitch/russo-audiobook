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
  // Use tested working models in order: 2.5-flash and 3.1-flash-lite are immediate, followed by latest and 3.8
  const models = ['gemini-2.5-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
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
      await new Promise((resolve) => setTimeout(resolve, 400));
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
L'utente ha aperto o scansionato la pagina ${pageNumber ? String(pageNumber) : ''} del libro di testo di lingua russa (es. "Стартап А1").

COMPITO PRINCIPALE:
Trascrivi TUTTI i contenuti e gli esercizi presenti nella pagina e trasformali in schede di ascolto audio interattive per lo studente.
Per OGNI esercizio presente nella pagina:
1. "number": numero esercizio ("1", "2", "3"...)
2. "titleRu": titolo originale in russo (es. "Слушайте и повторяйте", "Читайте", "Диалог", "Словарь")
3. "titleIt": traduzione in italiano del titolo
4. "descriptionIt": istruzioni chiare per lo studente in italiano
5. "exerciseNotesIt": suggerimento didattico o fonetico
6. "audioItems": array OBBLIGATORIO con TUTTE le parole, lettere, sillabe, frasi del dialogo o battute da ascoltare.

PER CIASCUN ELEMENTO AUDIO in "audioItems":
- "textRu": (OBBLIGATORIO - NON LASCIARE MAI VUOTO!) la parola, frase, lettera o espressione in russo autentico cirillico.
- "label": titolo breve (es. "Привет", "Здравствуйте", "А - О - У")
- "ipa": trascrizione fonetica tra parentesi quadre
- "italianPhonetic": pronuncia all'italiana (es. "privièt", "zdravstvujte")
- "audioTextToSpeak": testo esatto da pronunciare in russo
- "explanationIt": traduzione chiara in italiano

REGOLA CRUCIALE ANTI-VUOTO:
- NON lasciare MAI "textRu" vuoto o indefinito! Ogni elemento DEVE contenere il testo russo da pronunciare.
- Se la pagina contiene un dialogo, ogni battuta deve essere un elemento audio separato con traduzione.
- Se la pagina contiene tabelle di sillabe o lettere (А, О, У, И, Э, Ы), ogni lettera o combinazione deve essere un elemento audio.
- Se la pagina contiene vocaboli, inseriscili sia in "exercises" che in "vocabulary".

Rispondi ESCLUSIVAMENTE in formato JSON valido:
{
  "lessonTitle": "Titolo Lezione o Argomento della Pagina",
  "pageNumber": "${pageNumber || '1'}",
  "overviewIt": "Sintesi chiara in italiano degli argomenti trattati in questa pagina",
  "exercises": [
    {
      "id": "ex_1",
      "number": "1",
      "titleRu": "Слушайте и повторяйте",
      "titleIt": "Ascoltate e ripetete",
      "type": "listening",
      "descriptionIt": "Ascolta ciascuna frase e ripeti a voce alta curando l'intonazione.",
      "exerciseNotesIt": "Attenzione all'accento tonico che rende le vocali chiare.",
      "audioItems": [
        {
          "id": "item_1_1",
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

    // Normalization helper: extract Russian text from any object/property
    const extractRussianText = (it: any): string => {
      if (!it) return '';
      if (typeof it === 'string') return it.trim();
      const candidates = [
        it.textRu, it.text_ru, it.text, it.ru, it.russian,
        it.wordRu, it.word_ru, it.word, it.phrase, it.phraseRu,
        it.sentence, it.label, it.audioTextToSpeak
      ];
      for (const c of candidates) {
        if (typeof c === 'string' && c.trim().length > 0) return c.trim();
      }
      // Search all object values for Cyrillic
      for (const val of Object.values(it)) {
        if (typeof val === 'string' && /[а-яА-ЯёЁ]/.test(val) && val.trim().length > 0) {
          return val.trim();
        }
      }
      return '';
    };

    // Normalization helper: extract Italian explanation from any object/property
    const extractItalianText = (it: any): string => {
      if (!it || typeof it === 'string') return '';
      const candidates = [
        it.explanationIt, it.explanation_it, it.explanation,
        it.translationIt, it.translation_it, it.translation,
        it.meaning, it.meaningIt, it.italian, it.it,
        it.traduzione, it.spiegazione, it.notesIt
      ];
      for (const c of candidates) {
        if (typeof c === 'string' && c.trim().length > 0) return c.trim();
      }
      for (const [k, val] of Object.entries(it)) {
        if (
          typeof val === 'string' &&
          val.trim().length > 0 &&
          !/[а-яА-ЯёЁ]/.test(val) &&
          !['id', 'ipa', 'type', 'soundType'].includes(k)
        ) {
          return val.trim();
        }
      }
      return '';
    };

    // Normalize raw exercises if returned as object or under other names
    let exercisesList: any[] = [];
    const possibleExercises = parsed.exercises || parsed.esercizi || parsed.tasks || parsed.content || parsed.items;
    if (Array.isArray(possibleExercises)) {
      exercisesList = possibleExercises;
    } else if (possibleExercises && typeof possibleExercises === 'object') {
      exercisesList = Object.values(possibleExercises);
    }

    // Process and clean each exercise
    const cleanedExercises: any[] = [];
    exercisesList.forEach((ex: any, exIdx: number) => {
      if (!ex || typeof ex !== 'object') return;

      const rawItems = Array.isArray(ex.audioItems)
        ? ex.audioItems
        : Array.isArray(ex.audio_items)
        ? ex.audio_items
        : Array.isArray(ex.items)
        ? ex.items
        : Array.isArray(ex.elements)
        ? ex.elements
        : Array.isArray(ex.words)
        ? ex.words
        : Array.isArray(ex.phrases)
        ? ex.phrases
        : Array.isArray(ex.dialogue)
        ? ex.dialogue
        : Array.isArray(ex.sentences)
        ? ex.sentences
        : Array.isArray(ex.lines)
        ? ex.lines
        : typeof ex.audioItems === 'object' && ex.audioItems !== null
        ? Object.values(ex.audioItems)
        : [];

      const audioItems: any[] = [];
      rawItems.forEach((it: any, itIdx: number) => {
        const textRu = extractRussianText(it);
        if (!textRu) return; // Skip completely empty items

        const explanationIt = extractItalianText(it);
        const ipa = (typeof it === 'object' && (it?.ipa || it?.transcription || it?.phonetic)) || '';
        const italianPhonetic = (typeof it === 'object' && (it?.italianPhonetic || it?.italian_phonetic || it?.pronunciation || it?.pronuncia)) || '';

        audioItems.push({
          id: `item-${exIdx}-${itIdx}`,
          textRu,
          label: (typeof it === 'object' && it?.label) || textRu,
          ipa,
          italianPhonetic,
          audioTextToSpeak: (typeof it === 'object' && it?.audioTextToSpeak) || textRu,
          explanationIt,
        });
      });

      // If audioItems was empty, check if exercise itself has Russian text or description
      if (audioItems.length === 0) {
        const directText = extractRussianText(ex);
        if (directText) {
          audioItems.push({
            id: `item-${exIdx}-0`,
            textRu: directText,
            label: directText,
            ipa: ex.ipa || '',
            italianPhonetic: ex.italianPhonetic || '',
            audioTextToSpeak: directText,
            explanationIt: extractItalianText(ex) || ex.descriptionIt || '',
          });
        }
      }

      cleanedExercises.push({
        id: ex.id || `ex-${exIdx}`,
        number: String(ex.number ?? exIdx + 1),
        titleRu: ex.titleRu || ex.title || (audioItems[0]?.textRu ? `Упражнение: ${audioItems[0].textRu.slice(0, 25)}` : `Упражнение ${exIdx + 1}`),
        titleIt: ex.titleIt || ex.title_it || '',
        descriptionIt: ex.descriptionIt || ex.description || '',
        exerciseNotesIt: ex.exerciseNotesIt || ex.notesIt || '',
        audioItems,
      });
    });

    // Check if total audio items across all exercises is zero
    const totalAudioCount = cleanedExercises.reduce((acc, ex) => acc + (ex.audioItems?.length || 0), 0);

    if (cleanedExercises.length === 0 || totalAudioCount === 0) {
      console.log('No valid exercises/audio found, auto-populating from vocabulary or raw text');
      const fallbackItems: any[] = [];

      const rawVocab = Array.isArray(parsed.vocabulary) ? parsed.vocabulary : [];
      if (rawVocab.length > 0) {
        rawVocab.forEach((v: any, i: number) => {
          const wRu = extractRussianText(v);
          if (wRu) {
            fallbackItems.push({
              id: `fb-${i}`,
              textRu: wRu,
              label: wRu,
              ipa: v.ipa || '',
              italianPhonetic: v.italianPhonetic || '',
              audioTextToSpeak: v.audioTextToSpeak || wRu,
              explanationIt: extractItalianText(v) || 'Parola del vocabolario',
            });
          }
        });
      }

      if (fallbackItems.length === 0 && rawText && rawText.trim().length > 0) {
        const words = rawText
          .split(/[\n,.;:!?«»"—()]+/)
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

      cleanedExercises.length = 0;
      cleanedExercises.push({
        id: 'ex-generated-fallback',
        number: '1',
        titleRu: parsed.lessonTitle || 'Материалы страницы (Contenuti della Pagina)',
        titleIt: 'Ascolto e lettura dei contenuti estratti',
        type: 'standard_audio_list',
        descriptionIt: 'Clicca su ciascuna parola o frase per ascoltare la corretta pronuncia russa.',
        audioItems: fallbackItems,
      });
    }

    parsed.exercises = cleanedExercises;
    res.json(parsed);
  } catch (error: any) {
    console.error('Error analyzing page:', error);
    const isOverloaded = error?.status === 503 || error?.message?.includes('high demand') || error?.message?.includes('UNAVAILABLE');
    res.status(isOverloaded ? 503 : 500).json({
      error: isOverloaded
        ? 'I server AI stanno riscontrando un picco temporaneo di richieste. Clicca su "Riprova Ricerca Esercizi" tra pochi istanti.'
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
