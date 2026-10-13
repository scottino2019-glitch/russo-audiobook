import { GoogleGenAI } from '@google/genai';

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Metodo non consentito' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { question, currentContext } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'GEMINI_API_KEY non configurata su Netlify' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Sei un tutor esperto di lingua russa dedicato a studenti italiani principianti (Livello A1).
Rispondi in modo chiaro, incoraggiante e pratico in italiano, con esempi fonetici russi (con accenti indicati e lettere tra parentesi quadre).
Contesto corrente della lezione: ${JSON.stringify(currentContext || {})}
Domanda dello studente: "${question}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    return new Response(JSON.stringify({ answer: response.text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Errore tutor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
