import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, FastForward, Repeat, Sparkles, Sliders, Mic } from 'lucide-react';
import { audioService } from '../services/audioService';
import { AudioPlaybackSettings } from '../types/lesson';

interface AudioControlsBarProps {
  onOpenRecorder?: () => void;
  onOpenTutor?: () => void;
}

export const AudioControlsBar: React.FC<AudioControlsBarProps> = ({
  onOpenRecorder,
  onOpenTutor,
}) => {
  const [audioState, setAudioState] = useState<{
    isPlaying: boolean;
    activeId: string | null;
    currentRepeat: number;
    totalRepeats: number;
    source: 'browser' | 'gemini' | 'idle';
    error?: string | null;
  }>({
    isPlaying: false,
    activeId: null,
    currentRepeat: 0,
    totalRepeats: 1,
    source: 'idle',
    error: null,
  });

  const [settings, setSettings] = useState<AudioPlaybackSettings>(audioService.settings);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);

  useEffect(() => {
    const unsubscribe = audioService.subscribe((state) => {
      setAudioState({ ...state });
    });
    return unsubscribe;
  }, []);

  const handleRateChange = (newRate: number) => {
    const updated = { ...settings, rate: newRate };
    setSettings(updated);
    audioService.settings.rate = newRate;
  };

  const handleRepeatToggle = () => {
    // Toggle between 1x and 3x (listen & repeat mode)
    const newCount = settings.repeatCount === 1 ? 3 : 1;
    const updated = { ...settings, repeatCount: newCount };
    setSettings(updated);
    audioService.settings.repeatCount = newCount;
  };

  const handleEngineToggle = () => {
    const newEngine = !settings.useServerTTS;
    const updated = { ...settings, useServerTTS: newEngine };
    setSettings(updated);
    audioService.settings.useServerTTS = newEngine;
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md text-white border-b border-slate-800 shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: App Branding & Status */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center font-bold text-white shadow-sm shadow-red-500/20">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide text-amber-300">СТАРТАП А1</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Audio Companion
              </span>
            </div>
            <div className="text-xs text-slate-400">
              {audioState.isPlaying ? (
                <span className="text-emerald-400 font-medium flex items-center gap-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Riproduzione in corso {audioState.totalRepeats > 1 ? `(${audioState.currentRepeat}/${audioState.totalRepeats})` : ''}
                </span>
              ) : (
                'Pronto all\'ascolto degli esercizi'
              )}
            </div>
          </div>
        </div>

        {/* Center: Audio Quick Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Stop / Play Status button */}
          {audioState.isPlaying && (
            <button
              onClick={() => audioService.stop()}
              className="px-3 py-1.5 rounded-lg bg-red-600/90 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              title="Ferma riproduzione"
            >
              <VolumeX className="w-4 h-4" />
              <span>Ferma</span>
            </button>
          )}

          {/* Speed Presets */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              onClick={() => handleRateChange(0.6)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                settings.rate === 0.6
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Velocità super lenta (0.6x per principianti)"
            >
              0.6x
            </button>
            <button
              onClick={() => handleRateChange(0.85)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                settings.rate === 0.85 || settings.rate === 0.9
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Velocità didattica (0.85x ideale per ripetere)"
            >
              0.85x
            </button>
            <button
              onClick={() => handleRateChange(1.0)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                settings.rate === 1.0
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Velocità naturale (1.0x)"
            >
              1.0x
            </button>
          </div>

          {/* Repeat Mode: 1x vs 3x (Ascolta e Ripeti) */}
          <button
            onClick={handleRepeatToggle}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-all ${
              settings.repeatCount > 1
                ? 'bg-indigo-600/80 border-indigo-400 text-white shadow-xs'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
            title="Modalità Ascolta e Ripeti: ripete 3 volte con intervallo"
          >
            <Repeat className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ripeti:</span>
            <span className="font-bold">{settings.repeatCount}x</span>
          </button>

          {/* Voice Engine Toggle */}
          <button
            onClick={handleEngineToggle}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-all ${
              settings.useServerTTS
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-400 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
            title="Alterna tra voce di sistema browser e voce Neurale AI"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden md:inline">{settings.useServerTTS ? 'Voce AI Neurale' : 'Voce Browser ru-RU'}</span>
            <span className="md:hidden">{settings.useServerTTS ? 'AI' : 'Browser'}</span>
          </button>
        </div>

        {/* Right: Practice tools */}
        <div className="flex items-center gap-2">
          {onOpenRecorder && (
            <button
              onClick={onOpenRecorder}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-600/50 hover:bg-emerald-900/60 text-emerald-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Registra e confronta la tua pronuncia"
            >
              <Mic className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Registra e Confronta</span>
            </button>
          )}

          {onOpenTutor && (
            <button
              onClick={onOpenTutor}
              className="px-2.5 py-1.5 rounded-lg bg-blue-950/60 border border-blue-600/50 hover:bg-blue-900/60 text-blue-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Chiedi spiegazioni al tutor italiano sul russo"
            >
              <span>Tutor Italiano 💡</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
