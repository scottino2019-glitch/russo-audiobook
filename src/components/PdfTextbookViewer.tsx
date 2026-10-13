import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Upload,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Loader2,
  CheckCircle,
  Bookmark,
  Trash2,
  BookOpen,
  Volume2,
  Columns,
  Library,
  Plus,
  ChevronDown,
  X
} from 'lucide-react';
import { pdfService } from '../services/pdfService';
import { dbService, StoredPdfMeta } from '../services/dbService';
import { LessonPage } from '../types/lesson';

interface PdfTextbookViewerProps {
  onPageGenerated: (lessonPage: LessonPage) => void;
  generatedPages: LessonPage[];
  onSelectGeneratedPage: (lessonPage: LessonPage) => void;
  splitViewActive: boolean;
  onToggleSplitView: () => void;
}

const STORAGE_ACTIVE_BOOK_KEY = 'startup_active_book_id';

export const PdfTextbookViewer: React.FC<PdfTextbookViewerProps> = ({
  onPageGenerated,
  generatedPages,
  onSelectGeneratedPage,
  splitViewActive,
  onToggleSplitView,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [allBooks, setAllBooks] = useState<StoredPdfMeta[]>([]);
  const [activeBook, setActiveBook] = useState<StoredPdfMeta | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(10);
  const [pageInputVal, setPageInputVal] = useState<string>('10');
  const [totalPages, setTotalPages] = useState<number>(0);
  const [zoomScale, setZoomScale] = useState<number>(1.25);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [isProcessingPage, setIsProcessingPage] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isBookshelfOpen, setIsBookshelfOpen] = useState<boolean>(false);

  // Check if current page is already processed
  const currentGenerated = generatedPages.find(
    (p) => String(p.pageNumber).trim() === String(currentPage)
  );

  // Load all stored books on mount
  useEffect(() => {
    loadAllBooks();
  }, []);

  const loadAllBooks = async () => {
    try {
      const books = await dbService.getAllPdfs();
      setAllBooks(books);

      if (books.length > 0) {
        const savedActiveId = localStorage.getItem(STORAGE_ACTIVE_BOOK_KEY);
        const toLoad = books.find((b) => b.id === savedActiveId) || books[0];
        await activateBook(toLoad);
      } else {
        setActiveBook(null);
        setTotalPages(0);
      }
    } catch (err) {
      console.warn('Errore nel caricamento della libreria libri:', err);
    }
  };

  const activateBook = async (book: StoredPdfMeta) => {
    setActiveBook(book);
    localStorage.setItem(STORAGE_ACTIVE_BOOK_KEY, book.id);

    try {
      let numPages = book.totalPages;
      if (book.pdfBlob) {
        const res = await pdfService.loadPdfFromBlob(book.pdfBlob);
        numPages = res.numPages;
      } else if (book.pdfData) {
        const res = await pdfService.loadPdfFromArrayBuffer(book.pdfData);
        numPages = res.numPages;
      }

      setTotalPages(numPages);
      const initPage = Math.min(book.lastPage || 1, numPages);
      setCurrentPage(initPage);
      setPageInputVal(String(initPage));
    } catch (err) {
      console.error('Errore attivazione libro:', err);
    }
  };

  // Render canvas whenever currentPage or zoomScale changes
  useEffect(() => {
    if (pdfService.isLoaded() && canvasRef.current && activeBook) {
      renderCurrentPage();
    }
  }, [currentPage, zoomScale, activeBook]);

  const renderCurrentPage = async () => {
    if (!canvasRef.current || !pdfService.isLoaded() || !activeBook) return;
    setIsRendering(true);
    try {
      await pdfService.renderPageToCanvas(currentPage, canvasRef.current, zoomScale);
      await dbService.updateLastPage(activeBook.id, currentPage);
    } catch (err) {
      console.error('Errore rendering pagina PDF:', err);
    } finally {
      setIsRendering(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      alert('Si prega di selezionare un file PDF (.pdf)');
      return;
    }

    setStatusMessage(`Caricamento di "${file.name}" in corso...`);
    try {
      const { numPages } = await pdfService.loadPdfFromBlob(file);

      // Clean book title from filename
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
      const newBookId = `book-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      const meta: StoredPdfMeta = {
        id: newBookId,
        name: cleanName,
        size: file.size,
        totalPages: numPages,
        lastPage: numPages >= 10 ? 10 : 1,
        uploadedAt: Date.now(),
        pdfBlob: file,
      };

      await dbService.savePdf(meta);

      setAllBooks((prev) => [meta, ...prev.filter((b) => b.id !== meta.id)]);
      await activateBook(meta);
      setIsBookshelfOpen(false);
      setStatusMessage(`Libro "${cleanName}" aggiunto alla tua libreria!`);
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err: any) {
      console.error('Errore caricamento PDF:', err);
      alert('Impossibile caricare il PDF: ' + err.message);
      setStatusMessage(null);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    setPageInputVal(String(page));
  };

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(pageInputVal, 10);
    if (!isNaN(p)) {
      goToPage(p);
    }
  };

  const handleProcessCurrentPage = async () => {
    if (!pdfService.isLoaded() || !activeBook) return;
    setIsProcessingPage(true);
    setStatusMessage(`Elaborazione con IA di Pagina ${currentPage}...`);

    try {
      const { base64Image, textContent } = await pdfService.renderPageToBase64(currentPage, 1.6);

      const response = await fetch('/api/analyze-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Image,
          rawText: textContent,
          pageNumber: String(currentPage),
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || 'Errore durante l\'elaborazione della pagina');
      }

      const parsed: LessonPage = await response.json();
      const finalLesson: LessonPage = {
        ...parsed,
        id: `${activeBook.id}-p${currentPage}-${Date.now()}`,
        pageNumber: String(currentPage),
        bookTitle: activeBook.name,
        imageUrl: base64Image,
        isCustomUploaded: true,
      };

      await dbService.saveGeneratedPage(finalLesson);
      onPageGenerated(finalLesson);
      setStatusMessage(`Pagina ${currentPage} di "${activeBook.name}" elaborata con successo!`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      console.error(err);
      alert('Errore elaborazione pagina: ' + (err.message || 'Riprova'));
      setStatusMessage(null);
    } finally {
      setIsProcessingPage(false);
    }
  };

  const handleDeleteBook = async (bookId: string, bookName: string) => {
    if (confirm(`Sei sicuro di voler rimuovere "${bookName}" dalla tua libreria?`)) {
      await dbService.deletePdf(bookId);
      const remaining = allBooks.filter((b) => b.id !== bookId);
      setAllBooks(remaining);

      if (activeBook?.id === bookId) {
        if (remaining.length > 0) {
          await activateBook(remaining[0]);
        } else {
          setActiveBook(null);
          setTotalPages(0);
        }
      }
    }
  };

  // If no books uploaded yet
  if (!activeBook || totalPages === 0) {
    return (
      <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm p-8 max-w-4xl mx-auto my-6">
        <div className="text-center max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
            <Library className="w-8 h-8" />
          </div>

          <h3 className="text-xl font-bold text-slate-900 mb-2">
            La Tua Libreria Multi-Libro (Carica Qualsiasi PDF)
          </h3>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            Puoi aggiungere <strong>tutti i libri che vuoi</strong>: il manuale (Учебник), l'eserciziario (Рабочая тетрадь), o altri corsi di lingua russa (Поехали, Дорога в Россию, ecc.). Tutti i libri rimangono salvati nel browser e puoi passare dall'uno all'altro in qualunque momento!
          </p>

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-8 transition-all ${
              dragActive
                ? 'border-amber-500 bg-amber-50'
                : 'border-slate-300 hover:border-amber-400 bg-slate-50'
            }`}
          >
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700 mb-1">
              Trascina qui il file PDF del tuo primo libro
            </p>
            <p className="text-xs text-slate-500 mb-4">
              Supporta libri completi di 300+ pagine
            </p>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              Seleziona file PDF dal dispositivo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Libreria illimitata salvata in IndexedDB
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Sfoglia e genera gli esercizi per ogni libro
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
      {/* Top Multi-Book Toolbar */}
      <div className="bg-slate-900 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
        {/* Left: Book Selector Dropdown & Shelf */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setIsBookshelfOpen(!isBookshelfOpen)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold flex items-center gap-2 text-white transition-colors cursor-pointer"
              title="Apri libreria dei tuoi libri"
            >
              <Library className="w-4 h-4 text-amber-400" />
              <span className="truncate max-w-[170px] sm:max-w-xs">{activeBook.name}</span>
              <span className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-amber-300">
                {allBooks.length} {allBooks.length === 1 ? 'libro' : 'libri'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Bookshelf Dropdown Modal */}
            {isBookshelfOpen && (
              <div className="absolute top-full left-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 p-4 text-xs">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Library className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-white">I Tuoi Libri di Lingua ({allBooks.length})</span>
                  </div>
                  <button
                    onClick={() => setIsBookshelfOpen(false)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto mb-3">
                  {allBooks.map((b) => {
                    const isCurrent = b.id === activeBook.id;
                    return (
                      <div
                        key={b.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                          isCurrent
                            ? 'bg-amber-500/10 border-amber-500/60 text-white'
                            : 'bg-slate-800/80 border-slate-700 hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => {
                            activateBook(b);
                            setIsBookshelfOpen(false);
                          }}
                        >
                          <div className="font-bold truncate text-white flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="truncate">{b.name}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {b.totalPages} pagine • Ultima pag: {b.lastPage || 1}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {isCurrent ? (
                            <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded">
                              Attivo
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                activateBook(b);
                                setIsBookshelfOpen(false);
                              }}
                              className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-[11px] text-white"
                            >
                              Apri
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteBook(b.id, b.name)}
                            className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                            title="Rimuovi libro"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add Another Book Button */}
                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Aggiungi un Altro Libro (PDF)</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Add Book Direct Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer hidden sm:flex items-center gap-1 text-xs"
            title="Aggiungi un altro libro PDF"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Nuovo Libro</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
          />
        </div>

        {/* Center: Page Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1 || isRendering}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white transition-colors cursor-pointer"
            title="Pagina precedente"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <form onSubmit={handlePageInputSubmit} className="flex items-center gap-1.5 text-xs">
            <span>Pag.</span>
            <input
              type="text"
              value={pageInputVal}
              onChange={(e) => setPageInputVal(e.target.value)}
              className="w-12 text-center bg-slate-800 border border-slate-700 rounded-md py-1 text-white font-mono font-bold focus:outline-hidden focus:ring-1 focus:ring-amber-400"
            />
            <span className="text-slate-400">/ {totalPages}</span>
          </form>

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages || isRendering}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white transition-colors cursor-pointer"
            title="Pagina successiva"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Zoom & Split View */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              onClick={() => setZoomScale((s) => Math.max(0.7, s - 0.2))}
              className="p-1 text-slate-300 hover:text-white"
              title="Riduci zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] px-1 font-mono text-slate-300">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              onClick={() => setZoomScale((s) => Math.min(2.2, s + 0.2))}
              className="p-1 text-slate-300 hover:text-white"
              title="Aumenta zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={onToggleSplitView}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-all cursor-pointer ${
              splitViewActive
                ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Visualizzazione affiancata con esercizi"
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{splitViewActive ? 'Schermo Unico' : 'Schermo Affiancato'}</span>
          </button>
        </div>
      </div>

      {/* Action Banner: Generate audio & exercises for current page */}
      <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 px-4 py-3 border-b border-amber-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-xs text-slate-800">
          <BookOpen className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Libro: <strong>{activeBook.name}</strong> • Pagina <strong>{currentPage}</strong> di {totalPages}.
          </span>
          {currentGenerated ? (
            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-semibold flex items-center gap-1 text-[11px]">
              <CheckCircle className="w-3.5 h-3.5" />
              Esercizi & Audio Pronti
            </span>
          ) : (
            <span className="text-slate-500 text-[11px]">
              (Non ancora elaborata per l'audio)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {currentGenerated ? (
            <button
              onClick={() => onSelectGeneratedPage(currentGenerated)}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Apri Esercizi Audio di Pag. {currentPage}</span>
            </button>
          ) : (
            <button
              onClick={handleProcessCurrentPage}
              disabled={isProcessingPage}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {isProcessingPage ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Elaborazione Pagina in corso...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                  <span>Crea Esercizi Audio per Questa Pagina ⚡</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {statusMessage && (
        <div className="bg-amber-100 text-amber-900 text-xs px-4 py-2 text-center font-medium animate-fadeIn">
          {statusMessage}
        </div>
      )}

      {/* Main PDF Page Render Area */}
      <div className="relative bg-slate-200/80 p-4 md:p-6 overflow-auto max-h-[750px] flex justify-center items-start">
        {isRendering && (
          <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-2xs flex items-center justify-center">
            <div className="flex items-center gap-2 bg-slate-900 text-white text-xs px-4 py-2 rounded-full shadow-lg">
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              <span>Rendering pagina {currentPage}...</span>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-slate-300">
          <canvas ref={canvasRef} className="block max-w-full h-auto" />
        </div>
      </div>

      {/* Page Scrubber / Quick Jumper across pages */}
      <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-slate-500 font-medium whitespace-nowrap">Scorri {activeBook.name}:</span>
          <input
            type="range"
            min={1}
            max={totalPages}
            value={currentPage}
            onChange={(e) => goToPage(Number(e.target.value))}
            className="w-full sm:w-64 accent-amber-500 cursor-pointer"
          />
        </div>

        {/* Chapter Quick Jumps */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="text-slate-400">Scorciatoie:</span>
          <button
            onClick={() => goToPage(10)}
            className={`px-2 py-1 rounded-md border ${
              currentPage === 10
                ? 'bg-amber-500 text-slate-950 font-bold border-amber-500'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            pag. 10
          </button>
          <button
            onClick={() => goToPage(20)}
            className="px-2 py-1 rounded-md bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
          >
            pag. 20
          </button>
          <button
            onClick={() => goToPage(35)}
            className="px-2 py-1 rounded-md bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
          >
            pag. 35
          </button>
          <button
            onClick={() => goToPage(50)}
            className="px-2 py-1 rounded-md bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
          >
            pag. 50
          </button>
        </div>
      </div>

      {/* Library of Generated Pages for this Book */}
      {generatedPages.length > 0 && (
        <div className="bg-white p-4 border-t border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5 text-amber-500" />
              <span>Pagine elaborate e salvate ({generatedPages.length}):</span>
            </h5>
            <span className="text-[11px] text-slate-400">Audio sempre accessibile anche offline</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {generatedPages.map((genPage) => (
              <button
                key={genPage.id}
                onClick={() => {
                  onSelectGeneratedPage(genPage);
                  const pNum = parseInt(genPage.pageNumber || '10', 10);
                  if (!isNaN(pNum)) goToPage(pNum);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-xs font-medium text-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span className="font-bold text-amber-700 font-mono">
                  Pag. {genPage.pageNumber || '?'}
                </span>
                <span className="truncate max-w-[140px] text-slate-600">
                  {genPage.lessonTitle}
                </span>
                <Volume2 className="w-3 h-3 text-slate-400" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
