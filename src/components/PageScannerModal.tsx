import React, { useState } from 'react';
import { X, Upload, Camera, Loader2, Sparkles, Check, AlertCircle, FileText } from 'lucide-react';
import { LessonPage } from '../types/lesson';

interface PageScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPageLoaded: (page: LessonPage) => void;
}

export const PageScannerModal: React.FC<PageScannerModalProps> = ({
  isOpen,
  onClose,
  onPageLoaded,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState('image/jpeg');
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [customText, setCustomText] = useState('');

  if (!isOpen) return null;

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Si prega di caricare un\'immagine valida (PNG, JPG, WEBP)');
      return;
    }
    setErrorMessage(null);
    setFileName(file.name);
    setImageMimeType(file.type);

    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImageBase64(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImageBase64) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/analyze-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImageBase64,
          mimeType: imageMimeType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Errore durante l\'analisi dell\'immagine con IA');
      }

      const data: LessonPage = await response.json();
      const completeLesson: LessonPage = {
        ...data,
        id: `scanned-${Date.now()}`,
        isCustomUploaded: true,
        bookTitle: data.bookTitle || 'Стартап А1 — Pagina Caricata',
        imageUrl: selectedImageBase64,
      };

      onPageLoaded(completeLesson);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Impossibile analizzare la pagina. Riprova con un\'altra immagine.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFromText = () => {
    if (!customText.trim()) return;
    // Build a quick custom exercise from pasted Russian text
    const lines = customText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const audioItems = lines.map((line, idx) => ({
      id: `custom-item-${idx}`,
      textRu: line,
      label: line,
      audioTextToSpeak: line,
      explanationIt: 'Esercizio personalizzato inserito manualmente',
      soundType: 'word' as const,
    }));

    const customLesson: LessonPage = {
      id: `custom-text-${Date.now()}`,
      lessonTitle: 'Esercizio di Lettura & Ascolto Personalizzato',
      bookTitle: 'I Miei Esercizi di Russo',
      overviewIt: 'Testo inserito per la riproduzione vocale e l\'ascolto.',
      isCustomUploaded: true,
      exercises: [
        {
          id: 'custom-ex-1',
          number: '1',
          titleRu: 'Слушайте и повторяйте',
          titleIt: 'Ascoltate e ripetete',
          type: 'word_list',
          interactiveType: 'standard_audio_list',
          descriptionIt: 'Clicca su ogni riga per ascoltarla pronunciata in russo.',
          audioItems,
        },
      ],
    };

    onPageLoaded(customLesson);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 my-8">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-base">Carica Altre Pagine del Tuo Libro</h3>
              <p className="text-xs text-slate-400">
                Estrae automaticamente gli esercizi di ascolto da qualsiasi foto di "Стартап А1"
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* File Upload Dropzone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
              dragActive
                ? 'border-amber-500 bg-amber-50/50'
                : selectedImageBase64
                ? 'border-emerald-500 bg-emerald-50/30'
                : 'border-slate-300 hover:border-slate-400 bg-slate-50'
            }`}
          >
            {selectedImageBase64 ? (
              <div className="space-y-3">
                <div className="max-h-48 overflow-hidden rounded-lg mx-auto max-w-xs border border-slate-200 shadow-xs">
                  <img src={selectedImageBase64} alt="Anteprima pagina" className="w-full h-auto object-cover" />
                </div>
                <div className="text-xs text-slate-600 font-medium flex items-center justify-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Immagine caricata: {fileName || 'Foto libro'}</span>
                </div>
                <label className="text-xs text-amber-700 underline cursor-pointer hover:text-amber-800 font-medium">
                  Cambia immagine
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  />
                </label>
              </div>
            ) : (
              <div>
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-800 mb-1">
                  Trascina qui la foto della pagina del tuo libro
                </h4>
                <p className="text-xs text-slate-500 mb-4">
                  oppure seleziona un'immagine dal tuo dispositivo (PNG, JPG, WEBP)
                </p>
                <label className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer inline-flex items-center gap-2 transition-colors">
                  <Camera className="w-4 h-4" />
                  <span>Scegli Foto o Scatta</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  />
                </label>
              </div>
            )}
          </div>

          {errorMessage && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Analyze Button */}
          {selectedImageBase64 && (
            <div className="mt-4">
              <button
                onClick={analyzeImage}
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analisi con IA in corso (estrazione audio ed esercizi)...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Estrai ed Elabora Esercizi Audio della Pagina</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Alternative: Paste Russian Text Directly */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-500" />
              <span>Oppure incolla direttamente parole o frasi in russo:</span>
            </h5>
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Es:
мама
папа
дом
кот
Это моя семья."
              rows={3}
              className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-sans"
            />
            {customText.trim() && (
              <button
                onClick={handleCreateFromText}
                className="mt-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
              >
                Genera Esercizio Audio da Testo ➔
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
