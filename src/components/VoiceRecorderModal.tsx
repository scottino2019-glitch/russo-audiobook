import React, { useState, useRef, useEffect } from 'react';
import { X, Mic, Square, Play, Volume2, RefreshCw, CheckCircle } from 'lucide-react';
import { audioService } from '../services/audioService';

interface VoiceRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  presetText?: string;
}

const SAMPLE_TEXTS = [
  { text: 'А а', label: 'Lettera А а', hint: 'Vocale aperta [a]' },
  { text: 'О о', label: 'Lettera О о', hint: 'Labbra arrotondate a cerchio [o]' },
  { text: 'У у', label: 'Lettera У у', hint: 'Labbra tese in avanti [u]' },
  { text: 'оа', label: 'оа', hint: 'Passaggio continuo da o ad a' },
  { text: 'ау', label: 'ау', hint: 'Richiamo nei boschi: a-ù' },
  { text: 'мир', label: 'мир', hint: 'Pace / mondo (la r vibra leggermente)' },
  { text: 'ы', label: 'Ы', hint: 'Lingua tirata indietro verso la gola [ɨ]' },
];

export const VoiceRecorderModal: React.FC<VoiceRecorderModalProps> = ({
  isOpen,
  onClose,
  presetText,
}) => {
  const [selectedItem, setSelectedItem] = useState(SAMPLE_TEXTS[0]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const userAudioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (presetText) {
      const match = SAMPLE_TEXTS.find((s) => s.text === presetText);
      if (match) setSelectedItem(match);
      else setSelectedItem({ text: presetText, label: presetText, hint: 'Esercizio personalizzato' });
    }
  }, [presetText]);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
    };
  }, [recordedAudioUrl]);

  if (!isOpen) return null;

  const playNativeGuide = () => {
    audioService.playText(selectedItem.text, 'native-recorder-guide', {
      rate: 0.85,
      repeatCount: 1,
    });
  };

  const startRecording = async () => {
    try {
      setRecordedAudioUrl(null);
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone error:', err);
      alert('Impossibile accedere al microfono. Assicurati di aver concesso i permessi nel browser.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  };

  const playUserRecording = () => {
    if (!recordedAudioUrl) return;
    const audio = new Audio(recordedAudioUrl);
    userAudioPlayerRef.current = audio;
    setIsPlayingRecording(true);
    audio.onended = () => setIsPlayingRecording(false);
    audio.onerror = () => setIsPlayingRecording(false);
    audio.play();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Mic className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base">Registra & Confronta la Tua Pronuncia</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Item selector */}
          <div className="mb-5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
              Scegli cosa pronunciare:
            </label>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_TEXTS.map((item) => (
                <button
                  key={item.text}
                  onClick={() => {
                    setSelectedItem(item);
                    setRecordedAudioUrl(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    selectedItem.text === item.text
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Practice card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center mb-6">
            <span className="text-xs text-slate-400 uppercase tracking-widest block mb-1">Testo russo</span>
            <div className="text-4xl font-black text-slate-900 font-sans mb-1">{selectedItem.text}</div>
            <p className="text-xs text-emerald-700 font-medium mb-4">{selectedItem.hint}</p>

            {/* Step 1: Listen to native guide */}
            <div className="mb-4">
              <button
                onClick={playNativeGuide}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-xs transition-colors"
              >
                <Volume2 className="w-4 h-4 text-amber-400" />
                <span>1. Ascolta la voce russa guida</span>
              </button>
            </div>

            {/* Step 2: Record button */}
            <div className="pt-2 border-t border-slate-200">
              <span className="text-xs text-slate-500 block mb-3">
                2. Premi per registrare la tua voce mentre ripeti:
              </span>

              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="px-6 py-3 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs inline-flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
                >
                  <Mic className="w-4 h-4" />
                  <span>Inizia a registrare</span>
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="px-6 py-3 rounded-full bg-red-800 text-white font-bold text-xs inline-flex items-center gap-2 animate-pulse shadow-md"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>Ferma registrazione ({recordingSeconds}s)</span>
                </button>
              )}
            </div>

            {/* Step 3: Play user recording */}
            {recordedAudioUrl && (
              <div className="mt-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 animate-fadeIn">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Registrazione pronta ({recordingSeconds}s)</span>
                </div>

                <button
                  onClick={playUserRecording}
                  disabled={isPlayingRecording}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isPlayingRecording ? 'Ascolto...' : 'Riascolta la tua voce'}</span>
                </button>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-500 leading-normal bg-amber-50/60 p-3 rounded-lg border border-amber-200/60">
            💡 <strong>Consiglio didattico:</strong> Ascolta la guida madrelingua, poi registra la tua voce e riascoltati subito. Presta attenzione alla morbidezza della bocca e alla tensione delle labbra.
          </div>
        </div>
      </div>
    </div>
  );
};
