import { GoogleGenAI } from '@google/genai';

function pcmToWav(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcmBuffer.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcmBuffer.length, 40);

  return Buffer.concat([header, pcmBuffer]);
}

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Metodo non consentito' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { text, voice = 'Puck' } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Usa voce locale', useLocalSpeech: true }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const promptText = `Speak in clear authentic Russian: "${text}"`;

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [{ role: 'user', parts: [{ text: promptText }] }],
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
      return new Response(
        JSON.stringify({ error: 'Nessun audio generato', useLocalSpeech: true }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const pcm = Buffer.concat(pcmChunks);
    const wav = pcmToWav(pcm, 24000, 1, 16);
    const base64Wav = wav.toString('base64');

    return new Response(
      JSON.stringify({
        audioUrl: `data:audio/wav;base64,${base64Wav}`,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Errore TTS', useLocalSpeech: true }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
