import React, { useState, useEffect } from 'react';
import { BookOpen, Volume2, Play, Sparkles, ArrowRight, CornerDownRight } from 'lucide-react';
import { AudioItem } from '../types/lesson';
import { audioService } from '../services/audioService';

interface DiagramReaderProps {
  items?: AudioItem[];
  title?: string;
  notes?: string;
}

export const DiagramReader: React.FC<DiagramReaderProps> = ({ items = [], title, notes }) => {
  const [activePathId, setActivePathId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = audioService.subscribe((state) => {
      setActivePathId(state.isPlaying ? state.activeId : null);
    });
    return unsub;
  }, []);

  const handlePlayPath = (item: AudioItem) => {
    audioService.playText(item.audioTextToSpeak, item.id);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-4 border-b border-indigo-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600/10 text-indigo-700">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">{title || '3. Читайте (Diagramma di lettura)'}</h3>
            <p className="text-xs text-indigo-800">
              Segui le frecce per collegare i suoni vocalici in sequenze fluide
            </p>
          </div>
        </div>

        <div className="text-xs text-indigo-700 bg-white/80 px-3 py-1.5 rounded-full border border-indigo-200 flex items-center gap-1.5 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Clicca sulle combinazioni per ascoltarle</span>
        </div>
      </div>

      <div className="p-6">
        {/* Visual Box Diagram mirroring the book's diagram exactly */}
        <div className="max-w-md mx-auto mb-8 p-6 bg-slate-50/80 rounded-2xl border-2 border-slate-300 relative">
          <div className="text-center text-xs font-semibold uppercase text-slate-500 mb-4 tracking-wider">
            Riproduzione del diagramma di pagina 11
          </div>

          <div className="relative w-64 h-64 mx-auto border-2 border-slate-800 bg-white rounded-xl shadow-xs p-4 flex flex-col justify-between">
            {/* Top row: 'o' and 'o' */}
            <div className="flex justify-between items-center px-4">
              <span className="text-3xl font-bold font-serif text-slate-900">o</span>
              <span className="text-3xl font-bold font-serif text-slate-900">o</span>
            </div>

            {/* Middle row: 'a' in the center with cross lines */}
            <div className="relative flex justify-center items-center my-4">
              {/* Crossed lines representing the arrows in the textbook */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
                <line x1="20" y1="15" x2="45" y2="45" stroke="#94a3b8" strokeWidth="2" strokeDasharray="3,3" />
                <polygon points="45,45 38,40 43,36" fill="#64748b" />

                <line x1="20" y1="85" x2="45" y2="55" stroke="#94a3b8" strokeWidth="2" strokeDasharray="3,3" />
                <polygon points="45,55 43,64 38,60" fill="#64748b" />

                <line x1="55" y1="45" x2="80" y2="15" stroke="#94a3b8" strokeWidth="2" strokeDasharray="3,3" />
                <polygon points="80,15 72,18 76,23" fill="#64748b" />

                <line x1="55" y1="55" x2="80" y2="85" stroke="#94a3b8" strokeWidth="2" strokeDasharray="3,3" />
                <polygon points="80,85 76,77 72,82" fill="#64748b" />
              </svg>

              <div className="w-14 h-14 rounded-full bg-amber-100 border-2 border-amber-500 flex items-center justify-center text-3xl font-black text-amber-900 shadow-sm z-10 animate-bounce">
                a
              </div>
            </div>

            {/* Bottom row: 'y' and 'y' */}
            <div className="flex justify-between items-center px-4">
              <span className="text-3xl font-bold font-serif text-slate-900">у</span>
              <span className="text-3xl font-bold font-serif text-slate-900">у</span>
            </div>
          </div>

          <p className="text-center text-xs text-slate-600 mt-4">
            Le frecce mostrano come legare le vocali in un unico respiro senza spezzare la voce.
          </p>
        </div>

        {/* Combinations List with Audio Buttons */}
        <div>
          <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-indigo-600" />
            <span>Tutti i percorsi sonori del diagramma (2 e 3 vocali):</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {(Array.isArray(items) ? items : []).map((item) => {
              const isPlaying = activePathId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handlePlayPath(item)}
                  className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    isPlaying
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-400/30'
                      : 'bg-slate-50 hover:bg-white border-slate-200 hover:border-indigo-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-base font-bold font-sans ${isPlaying ? 'text-white' : 'text-slate-900'}`}>
                      {item.label}
                    </span>
                    <span className={`text-xs font-mono ${isPlaying ? 'text-indigo-200' : 'text-indigo-600 font-semibold'}`}>
                      {item.ipa}
                    </span>
                  </div>

                  <p className={`text-[11px] mb-2 leading-tight ${isPlaying ? 'text-indigo-100' : 'text-slate-500'}`}>
                    {item.italianPhonetic}
                  </p>

                  <div className={`text-xs font-semibold flex items-center gap-1 mt-auto pt-2 border-t ${
                    isPlaying ? 'border-indigo-500 text-white' : 'border-slate-200 text-indigo-700'
                  }`}>
                    {isPlaying ? <Volume2 className="w-3.5 h-3.5 animate-pulse" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isPlaying ? 'In ascolto...' : 'Ascolta percorso'}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {notes && (
          <div className="mt-5 p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200/80 text-xs text-indigo-950 flex items-start gap-2">
            <CornerDownRight className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{notes}</div>
          </div>
        )}
      </div>
    </div>
  );
};
