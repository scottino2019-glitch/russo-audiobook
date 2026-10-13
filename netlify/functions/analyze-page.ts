import { GoogleGenAI } from '@google/genai';

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Metodo non consentito' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { imageBase64, mimeType = 'image/jpeg', rawText, pageNumber } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'GEMINI_API_KEY non configurata nelle variabili ambiente Netlify' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const cleanBase64 = imageBase64 ? imageBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '') : null;

    const prompt = `Sei un esperto insegnante di lingua russa madrelingua e glottodidatta per studenti italiani.
L'utente sta studiando sul manuale "Стартап А1" e analizza la pagina ${pageNumber || 'del libro'}.
Questa pagina contiene esercizi di ascolto 🎧, scrittura ✏️ o lettura 📖.
${rawText ? `\nTesto grezzo dal PDF:\n"""\n${rawText.slice(0, 4000)}\n"""\n` : ''}

Trascrivi fedelmente e struttura TUTTI gli esercizi in formato JSON valido:
{
  "lessonTitle": "УРОК ...",
  "pageNumber": "${pageNumber || '10'}",
  "overviewIt": "Descrizione in italiano",
  "exercises": [
    {
      "id": "ex_1",
      "number": "1",
      "titleRu": "Слушайте, повторяйте, читайте.",
      "titleIt": "Ascoltate, ripetete, leggete.",
      "type": "vowels_table",
      "descriptionIt": "Spiegazione",
      "audioItems": [
        {
          "id": "item_1",
          "textRu": "А а",
          "label": "Lettera А а",
          "ipa": "[a]",
          "italianPhonetic": "Come 'a' in casa",
          "audioTextToSpeak": "Буква А, звук А. А.",
          "explanationIt": "Vocale dura."
        }
      ]
    }
  ],
  "vocabulary": []
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
      contents: [{ role: 'user', parts }],
      config: { responseMimeType: 'application/json' },
    });

    return new Response(response.text || '{}', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Errore analisi pagina' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
