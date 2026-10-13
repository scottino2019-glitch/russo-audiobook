import React, { useEffect, useState } from 'react';
import { Volume2, Play, Square, Info, Sparkles, BookOpen } from 'lucide-react';
import { AudioItem } from '../types/lesson';
import { audioService } from '../services/audioService';

interface VowelsTableCardProps {
  items: AudioItem[];
  title?: string;
  notes?: string;
}

export const VowelsTableCard: React.FC<VowelsTableCardProps> = ({ items, title, notes }) => {
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<AudioItem | null>(items[0] || null);

  useEffect(() => {
    const unsub = audioService.subscribe((state) => {
      setActiveAudioId(state.isPlaying ? state.activeId : null);
    });
    return unsub;
  }, []);

  const handlePlay = (item: AudioItem, textToPlay?: string) => {
    setSelectedItem(item);
    audioService.playText(textToPlay || item.audioTextToSpeak, item.id);
  };

  const handlePlaySlow = (item: AudioItem) => {
    setSelectedItem(item);
    audioService.playText(item.audioSlowTextToSpeak || item.audioTextToSpeak, item.id, {
      rate: 0.5,
      repeatCount: 1,
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden mb-8">
      {/* Exercise Header */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-amber-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-700">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">{title || 'Гласные / Vocali'}</h3>
            <p className="text-xs text-amber-800">
              Таблица: Буква (stampatello e corsivo) ➔ Название буквы ➔ Звук
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-500 bg-white/80 px-3 py-1.5 rounded-full border border-amber-200 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Clicca su qualsiasi lettera per ascoltare la pronuncia autentica</span>
        </div>
      </div>

      {/* Grid of Vowels Cards (matching the book's table) */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {items.map((item) => {
            const isPlayingThis = activeAudioId === item.id;
            const isSelected = selectedItem?.id === item.id;

            return (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`relative rounded-xl p-5 border-2 transition-all cursor-pointer text-left flex flex-col justify-between ${
                  isSelected
                    ? 'border-amber-500 bg-amber-50/40 shadow-md ring-2 ring-amber-400/20'
                    : 'border-slate-200 bg-white hover:border-amber-300 hover:shadow-xs'
                }`}
              >
                {/* Top Badge: Cursive vs Printed */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Буква / Lettera
                  </span>
                  {item.cursiveText && (
                    <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-800 font-serif text-sm italic" title="Corsivo russo">
                      Corsivo: {item.cursiveText}
                    </span>
                  )}
                </div>

                {/* Big Cyrillic letter representation */}
                <div className="text-center my-2">
                  <div className="text-5xl font-black text-slate-900 tracking-wide font-sans">
                    {item.textRu}
                  </div>
                  <div className="text-3xl font-serif italic text-amber-700 mt-1 select-none">
                    {item.cursiveText}
                  </div>
                </div>

                {/* Table meta info: Name and Sound */}
                <div className="bg-slate-50 rounded-lg p-2.5 my-3 text-xs border border-slate-100 space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span>Название буквы (Nome):</span>
                    <span className="font-mono font-bold text-slate-800">{item.ipa}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Звук (Suono):</span>
                    <span className="font-mono font-bold text-emerald-700">{item.ipa}</span>
                  </div>
                </div>

                {/* Audio Play Buttons */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlay(item);
                    }}
                    className={`flex-1 py-2.5 px-3 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all shadow-xs ${
                      isPlayingThis
                        ? 'bg-amber-600 text-white animate-pulse'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {isPlayingThis ? (
                      <>
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span>Riproduzione...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Ascolta</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlaySlow(item);
                    }}
                    className="p-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 transition-colors text-xs font-semibold"
                    title="Ascolta molto lentamente (0.5x)"
                  >
                    🐢 Lento
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Item Detail Panel with Italian Phonetics & Articulation Tips */}
        {selectedItem && (
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/80">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-700 shrink-0 mt-0.5">
                <Info className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    Guida Fonetica per Italiani: Lettera <span className="text-amber-600 text-base">{selectedItem.textRu}</span>
                  </h4>
                  <span className="text-xs font-mono bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
                    IPA {selectedItem.ipa}
                  </span>
                </div>

                <p className="text-sm text-slate-700 mb-2 leading-relaxed">
                  {selectedItem.explanationIt}
                </p>

                {selectedItem.italianPhonetic && (
                  <div className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                    <strong className="text-slate-800">Come pronunciarla: </strong>
                    {selectedItem.italianPhonetic}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Notes from the textbook */}
        {notes && (
          <div className="mt-4 p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5">
            <BookOpen className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{notes}</div>
          </div>
        )}
      </div>
    </div>
  );
};
