import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  PenTool,
  Volume2,
  RotateCcw,
  Eye,
  EyeOff,
  Play,
  CheckCircle2,
  Sparkles,
  Undo2
} from 'lucide-react';
import { AudioItem } from '../types/lesson';
import { audioService } from '../services/audioService';

interface CursiveCanvasProps {
  items: AudioItem[];
  title?: string;
  notes?: string;
}

const PRACTICE_PRESETS = [
  { label: 'А а', text: 'А а', cursive: '𝒜 𝒶', type: 'single', desc: 'Lettera A corsiva' },
  { label: 'О о', text: 'О о', cursive: '𝒪 ℴ', type: 'single', desc: 'Lettera O corsiva' },
  { label: 'У у', text: 'У у', cursive: '𝒴 𝓎', type: 'single', desc: 'Lettera U corsiva' },
  { label: 'оа, ао', text: 'оа, ао', cursive: 'ℴ𝒶, 𝒶ℴ', type: 'pairs', desc: 'Coppie di vocali O-A e A-O' },
  { label: 'ау, уа', text: 'ау, уа', cursive: '𝒶𝓎, 𝓎𝒶', type: 'pairs', desc: 'Coppie di vocali A-U e U-A' },
  { label: 'оу, уо', text: 'оу, уо', cursive: 'ℴ𝓎, 𝓎ℴ', type: 'pairs', desc: 'Coppie di vocali O-U e U-O' },
];

const COLORS = [
  { label: 'Blu Inchiostro Scuola', value: '#1d4ed8' },
  { label: 'Nero Penna', value: '#0f172a' },
  { label: 'Matita Grigia', value: '#334155' },
  { label: 'Rosso Maestro', value: '#dc2626' },
];

const STROKE_WIDTHS = [
  { label: 'Fine', value: 3 },
  { label: 'Medio', value: 5 },
  { label: 'Spesso', value: 8 },
];

interface StrokePoint {
  x: number;
  y: number;
}

interface Stroke {
  points: StrokePoint[];
  color: string;
  width: number;
}

export const CursiveCanvas: React.FC<CursiveCanvasProps> = ({ items, title, notes }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [selectedPreset, setSelectedPreset] = useState(PRACTICE_PRESETS[3]);
  const [guideVisibility, setGuideVisibility] = useState<'strong' | 'medium' | 'hidden'>('strong');
  const [strokeColor, setStrokeColor] = useState('#1d4ed8');
  const [strokeWidth, setStrokeWidth] = useState(5);
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);

  // Store completed strokes for reliable redraw, resize, and Undo
  const strokesRef = useRef<Stroke[]>([]);
  const currentStrokeRef = useRef<Stroke | null>(null);
  const isDrawingRef = useRef(false);

  useEffect(() => {
    const unsub = audioService.subscribe((state) => {
      setActiveAudioId(state.isPlaying ? state.activeId : null);
    });
    return unsub;
  }, []);

  // Draw propisi notebook lines
  const drawNotebookLines = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.save();
    // Clean background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Russian propisi line spacing
    const topMargin = 30;
    const lineSpacing = 48;

    // Upper line
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, topMargin);
    ctx.lineTo(width, topMargin);
    ctx.stroke();

    // Intermediate ascender line
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, topMargin + lineSpacing);
    ctx.lineTo(width, topMargin + lineSpacing);
    ctx.stroke();

    // Base line (thick line where letters sit)
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, topMargin + lineSpacing * 2);
    ctx.lineTo(width, topMargin + lineSpacing * 2);
    ctx.stroke();

    // Descender bottom line
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, topMargin + lineSpacing * 3);
    ctx.lineTo(width, topMargin + lineSpacing * 3);
    ctx.stroke();

    // Slanted guidelines (~65 degrees typical Russian propisi slant)
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    const angleOffset = Math.tan((25 * Math.PI) / 180) * height;
    for (let x = -angleOffset; x < width + angleOffset; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x + angleOffset, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    ctx.restore();
  };

  // Redraw whole canvas: background + all user strokes
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawNotebookLines(ctx, canvas.width, canvas.height);

    // Draw user strokes
    for (const stroke of strokesRef.current) {
      if (stroke.points.length === 0) continue;
      ctx.save();
      ctx.strokeStyle = stroke.color;
      ctx.fillStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.points.length === 1) {
        ctx.beginPath();
        ctx.arc(stroke.points[0].x, stroke.points[0].y, stroke.width / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    // Draw current active stroke
    if (currentStrokeRef.current && currentStrokeRef.current.points.length > 0) {
      const stroke = currentStrokeRef.current;
      ctx.save();
      ctx.strokeStyle = stroke.color;
      ctx.fillStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.points.length === 1) {
        ctx.beginPath();
        ctx.arc(stroke.points[0].x, stroke.points[0].y, stroke.width / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
      }
      ctx.restore();
    }
  }, []);

  // Resize canvas according to container
  const updateSize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const w = Math.floor(rect.width) || 750;
    const h = 210; // comfortable height for Russian copybook lines

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      redraw();
    }
  }, [redraw]);

  useEffect(() => {
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [updateSize]);

  // When changing preset, clear user strokes so they can practice the new one
  useEffect(() => {
    strokesRef.current = [];
    currentStrokeRef.current = null;
    redraw();
  }, [selectedPreset, redraw]);

  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    // 1:1 mapping between DOM coordinates and canvas pixels
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {}

    isDrawingRef.current = true;
    const coords = getCanvasCoords(e);

    const newStroke: Stroke = {
      points: [coords],
      color: strokeColor,
      width: strokeWidth,
    };

    currentStrokeRef.current = newStroke;
    redraw();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !currentStrokeRef.current) return;
    e.preventDefault();

    const coords = getCanvasCoords(e);
    currentStrokeRef.current.points.push(coords);

    // Fast incremental draw
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pts = currentStrokeRef.current.points;
    if (pts.length >= 2) {
      const prev = pts[pts.length - 2];
      const curr = pts[pts.length - 1];
      ctx.save();
      ctx.strokeStyle = currentStrokeRef.current.color;
      ctx.lineWidth = currentStrokeRef.current.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(curr.x, curr.y);
      ctx.stroke();
      ctx.restore();
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    if (currentStrokeRef.current && currentStrokeRef.current.points.length > 0) {
      strokesRef.current.push(currentStrokeRef.current);
      currentStrokeRef.current = null;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {}

    redraw();
  };

  const clearCanvas = () => {
    strokesRef.current = [];
    currentStrokeRef.current = null;
    redraw();
  };

  const undoLastStroke = () => {
    if (strokesRef.current.length > 0) {
      strokesRef.current.pop();
      redraw();
    }
  };

  const handlePlayPair = (pairItem: AudioItem) => {
    audioService.playText(pairItem.audioTextToSpeak, pairItem.id);
  };

  const handlePlayPresetSound = () => {
    audioService.playText(selectedPreset.text, `preset-${selectedPreset.label}`);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
      {/* Exercise Header */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 border-b border-emerald-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-600/10 text-emerald-700">
            <PenTool className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">{title || '2. Пишите (Scrivete & Ricalcate)'}</h3>
            <p className="text-xs text-emerald-800">
              Ricalca la traccia corsiva sul rigo e ascolta la pronuncia autentica delle combinazioni
            </p>
          </div>
        </div>

        <button
          onClick={handlePlayPresetSound}
          className="px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Ascolta "{selectedPreset.label}"</span>
        </button>
      </div>

      <div className="p-6">
        {/* Presets Row matching the lines in the book */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
            Seleziona la riga del libro da praticare:
          </label>
          <div className="flex flex-wrap gap-2">
            {PRACTICE_PRESETS.map((preset) => {
              const isSelected = selectedPreset.label === preset.label;
              return (
                <button
                  key={preset.label}
                  onClick={() => setSelectedPreset(preset)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center gap-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-500/20'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <span className="font-bold font-sans">{preset.label}</span>
                  <span className="font-serif italic text-base opacity-95">{preset.cursive}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Toolbar: Colors, Stroke, and Guide Visibility */}
        <div className="mb-3 p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Colors */}
          <div className="flex items-center gap-2">
            <span className="text-slate-600 font-semibold">Penna:</span>
            <div className="flex items-center gap-1.5">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setStrokeColor(c.value)}
                  className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer ${
                    strokeColor === c.value ? 'scale-125 border-slate-900 ring-2 ring-blue-400 shadow-xs' : 'border-white'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* Stroke Width */}
          <div className="flex items-center gap-2">
            <span className="text-slate-600 font-semibold">Tratto:</span>
            <div className="flex items-center bg-white rounded-lg p-0.5 border border-slate-200">
              {STROKE_WIDTHS.map((sw) => (
                <button
                  key={sw.value}
                  onClick={() => setStrokeWidth(sw.value)}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                    strokeWidth === sw.value
                      ? 'bg-slate-900 text-white font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {sw.label}
                </button>
              ))}
            </div>
          </div>

          {/* TRACCIA GUIDA SELECTOR - Clearly visible */}
          <div className="flex items-center gap-2">
            <span className="text-slate-600 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Traccia Guida:</span>
            </span>
            <div className="flex items-center bg-white rounded-lg p-0.5 border border-slate-200">
              <button
                onClick={() => setGuideVisibility('strong')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  guideVisibility === 'strong'
                    ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Traccia ben visibile per ricalcare"
              >
                Evidente (Consigliata)
              </button>
              <button
                onClick={() => setGuideVisibility('medium')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  guideVisibility === 'medium'
                    ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Traccia leggera di sfondo"
              >
                Leggera
              </button>
              <button
                onClick={() => setGuideVisibility('hidden')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  guideVisibility === 'hidden'
                    ? 'bg-slate-700 text-white font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Nessuna traccia, scrittura libera"
              >
                Nascosta
              </button>
            </div>
          </div>

          {/* Undo & Clear */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={undoLastStroke}
              disabled={strokesRef.current.length === 0}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 text-slate-700 font-medium flex items-center gap-1 transition-colors cursor-pointer"
              title="Annulla ultimo tratto"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Annulla</span>
            </button>

            <button
              onClick={clearCanvas}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-red-50 text-slate-700 hover:text-red-700 font-medium flex items-center gap-1 transition-colors cursor-pointer"
              title="Cancella tutto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Pulisci</span>
            </button>
          </div>
        </div>

        {/* Interactive Handwriting Board Container */}
        <div
          ref={containerRef}
          className="relative border-2 border-slate-300 rounded-2xl bg-white overflow-hidden shadow-inner mb-6 select-none"
        >
          {/* TRACCIA GUIDA IN ALTA DEFINIZIONE (ON TOP OF THE CANVAS WITH pointer-events-none) */}
          {guideVisibility !== 'hidden' && (
            <div
              className={`absolute inset-0 pointer-events-none flex items-center justify-center select-none z-20 transition-opacity ${
                guideVisibility === 'strong' ? 'opacity-85' : 'opacity-35'
              }`}
            >
              {/* Dotted / dashed calligraphy text aligned with the baseline */}
              <div className="text-center font-serif italic tracking-widest flex items-center justify-center select-none">
                <span
                  className="text-8xl sm:text-9xl md:text-[115px] font-serif italic select-none"
                  style={{
                    color: '#64748b',
                    textShadow: '0 0 1px #475569',
                    letterSpacing: '0.18em',
                    lineHeight: 1,
                  }}
                >
                  {selectedPreset.cursive}
                </span>
              </div>
            </div>
          )}

          {/* HTML Canvas drawing layer */}
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="w-full h-[210px] block cursor-crosshair touch-none relative z-10"
            style={{ touchAction: 'none' }}
          />

          {/* Instructional helper badge */}
          <div className="absolute top-2 left-3 pointer-events-none text-[11px] text-slate-600 font-semibold z-30 bg-white/90 backdrop-blur-2xs px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Ricalca direttamente con il mouse o dito sopra le lettere grigie</span>
          </div>
        </div>

        {/* Audio buttons for all letter pairs from the book */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-emerald-600" />
              <span>Ascolto delle singole combinazioni vocaliche (оа, ао, ау, уа, оу, уо)</span>
            </h4>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {items.map((item) => {
              const isPlaying = activeAudioId === item.id;
              return (
                <div
                  key={item.id}
                  className="bg-slate-50 rounded-xl p-3 border border-slate-200 hover:border-emerald-300 transition-all text-center flex flex-col justify-between"
                >
                  <div>
                    <div className="text-2xl font-black text-slate-900 font-sans">{item.textRu}</div>
                    <div className="text-lg font-serif italic text-emerald-700">{item.cursiveText}</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">{item.ipa}</div>
                  </div>

                  <button
                    onClick={() => handlePlayPair(item)}
                    className={`mt-2 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isPlaying
                        ? 'bg-emerald-600 text-white animate-pulse'
                        : 'bg-white border border-slate-300 hover:bg-emerald-50 text-slate-800'
                    }`}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{isPlaying ? 'Ascolto...' : 'Riproduci'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Didactic notes for writing and pronunciation */}
        {notes && (
          <div className="mt-5 p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-950 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{notes}</div>
          </div>
        )}
      </div>
    </div>
  );
};
