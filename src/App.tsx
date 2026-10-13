import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Headphones,
  PenTool,
  Award,
  Upload,
  Sparkles,
  Volume2,
  FileText,
  Columns,
  Layers,
  Mic,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { LESSON_1_DATA } from './data/lesson1Data';
import { LessonPage } from './types/lesson';
import { audioService } from './services/audioService';
import { dbService } from './services/dbService';
import { AudioControlsBar } from './components/AudioControlsBar';
import { VowelsTableCard } from './components/VowelsTableCard';
import { CursiveCanvas } from './components/CursiveCanvas';
import { DiagramReader } from './components/DiagramReader';
import { ListeningQuiz } from './components/ListeningQuiz';
import { PageScannerModal } from './components/PageScannerModal';
import { VoiceRecorderModal } from './components/VoiceRecorderModal';
import { TutorDrawer } from './components/TutorDrawer';
import { PdfTextbookViewer } from './components/PdfTextbookViewer';

function sanitizeLessonPage(page: any): LessonPage {
  if (!page || typeof page !== 'object') return LESSON_1_DATA;
  const rawExercises = Array.isArray(page.exercises) ? page.exercises : [];
  const rawVocab = Array.isArray(page.vocabulary)
    ? page.vocabulary
    : Array.isArray(page.vocabularies)
    ? page.vocabularies
    : [];

  return {
    ...page,
    id: page.id || `lesson-${Date.now()}`,
    lessonTitle: page.lessonTitle || 'Lezione di Russo',
    pageNumber: page.pageNumber || '10',
    bookTitle: page.bookTitle || 'Стартап А1',
    overviewIt: page.overviewIt || '',
    exercises: rawExercises.map((ex: any, idx: number) => {
      if (!ex || typeof ex !== 'object') {
        return {
          id: `ex-${idx}`,
          number: String(idx + 1),
          titleRu: '',
          titleIt: '',
          type: 'text',
          audioItems: [],
        };
      }
      const rawAudio = Array.isArray(ex.audioItems)
        ? ex.audioItems
        : Array.isArray(ex.items)
        ? ex.items
        : [];
      return {
        ...ex,
        id: ex.id || `ex-${idx}`,
        number: String(ex.number ?? idx + 1),
        titleRu: ex.titleRu || '',
        titleIt: ex.titleIt || '',
        descriptionIt: ex.descriptionIt || '',
        exerciseNotesIt: ex.exerciseNotesIt || '',
        audioItems: rawAudio.map((it: any, itIdx: number) => {
          if (!it || typeof it !== 'object') {
            const strVal = String(it || '');
            return {
              id: `item-${idx}-${itIdx}`,
              textRu: strVal,
              label: strVal,
              ipa: '',
              italianPhonetic: '',
              audioTextToSpeak: strVal,
              explanationIt: '',
            };
          }
          return {
            ...it,
            id: it.id || `item-${idx}-${itIdx}`,
            textRu: it.textRu || it.text || '',
            label: it.label || it.textRu || it.text || '',
            ipa: it.ipa || '',
            italianPhonetic: it.italianPhonetic || '',
            audioTextToSpeak: it.audioTextToSpeak || it.textRu || it.text || '',
            explanationIt: it.explanationIt || '',
          };
        }),
      };
    }),
    vocabulary: rawVocab.map((v: any, vIdx: number) => {
      if (!v || typeof v !== 'object') {
        const strVal = String(v || '');
        return {
          wordRu: strVal,
          ipa: '',
          translationIt: '',
          audioTextToSpeak: strVal,
          notesIt: '',
        };
      }
      return {
        ...v,
        wordRu: v.wordRu || v.word || '',
        ipa: v.ipa || '',
        translationIt: v.translationIt || v.translation || '',
        audioTextToSpeak: v.audioTextToSpeak || v.wordRu || v.word || '',
        notesIt: v.notesIt || '',
      };
    }),
  };
}

export default function App() {
  const [currentLesson, setCurrentLesson] = useState<LessonPage>(LESSON_1_DATA);
  const [activeTab, setActiveTab] = useState<'pdf' | 'exercises' | 'cursive' | 'quiz' | 'vocabulary'>('pdf');
  const [splitViewActive, setSplitViewActive] = useState<boolean>(false);
  const [generatedPages, setGeneratedPages] = useState<LessonPage[]>([LESSON_1_DATA]);

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isRecorderOpen, setIsRecorderOpen] = useState(false);
  const [isTutorOpen, setIsTutorOpen] = useState(false);
  const [selectedWordAudio, setSelectedWordAudio] = useState<string | null>(null);

  // Load saved generated pages from IndexedDB
  useEffect(() => {
    loadSavedGeneratedPages();
  }, []);

  const loadSavedGeneratedPages = async () => {
    try {
      const stored = await dbService.getAllGeneratedPages();
      if (stored && stored.length > 0) {
        const cleaned = stored.map(sanitizeLessonPage);
        const merged = [
          LESSON_1_DATA,
          ...cleaned.filter((p) => p.id !== LESSON_1_DATA.id && p.pageNumber !== '10 - 11'),
        ];
        setGeneratedPages(merged);
      }
    } catch (e) {
      console.warn('Errore lettura pagine generate salvate:', e);
    }
  };

  const handlePageGenerated = (newPage: LessonPage) => {
    const sanitized = sanitizeLessonPage(newPage);
    setGeneratedPages((prev) => {
      const filtered = prev.filter((p) => p.id !== sanitized.id);
      return [sanitized, ...filtered];
    });
    setCurrentLesson(sanitized);
    if (!splitViewActive) {
      setActiveTab('exercises');
    }
  };

  const handleSelectGeneratedPage = (page: LessonPage) => {
    const sanitized = sanitizeLessonPage(page);
    setCurrentLesson(sanitized);
    if (!splitViewActive) {
      setActiveTab('exercises');
    }
  };

  const playWord = (word: string, id: string) => {
    setSelectedWordAudio(id);
    audioService.playText(word, id, { rate: 0.85 });
  };

  // Safe exercise selectors
  const lessonExercises = Array.isArray(currentLesson?.exercises) ? currentLesson.exercises : [];
  const ex1 = lessonExercises.find((e) => e && String(e.number) === '1');
  const ex2 = lessonExercises.find((e) => e && String(e.number) === '2');
  const ex3 = lessonExercises.find((e) => e && String(e.number) === '3');
  const ex4 = lessonExercises.find((e) => e && String(e.number) === '4');
  const poster = lessonExercises.find((e) => e && String(e.number) === 'Poster');
  const otherExercises = lessonExercises.filter(
    (e) => e && !['1', '2', '3', '4', 'Poster'].includes(String(e.number))
  );

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Top sticky audio toolbar */}
      <AudioControlsBar
        onOpenRecorder={() => setIsRecorderOpen(true)}
        onOpenTutor={() => setIsTutorOpen(true)}
      />

      {/* Hero Banner explaining the solution directly to the user */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-800 text-white pt-7 pb-8 px-4 border-b border-slate-700">
        <div className="max-w-6xl mx-auto">
          {/* Solution highlight badge */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Supporto PDF Completo (300 pagine) & Creazione Audio Progressiva</span>
            </span>

            <span className="text-xs text-slate-400">
              Libro: <strong>Стартап А1</strong> • Pagine salvate: {generatedPages.length}
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2 font-sans">
                {currentLesson.bookTitle || 'Стартап А1'} — {currentLesson.lessonTitle}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                {currentLesson.overviewIt}
              </p>
            </div>

            {/* Quick action buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setSplitViewActive(!splitViewActive)}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                  splitViewActive
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                    : 'bg-slate-800 text-white border-slate-700 hover:bg-slate-700'
                }`}
              >
                <Columns className="w-4 h-4" />
                <span>{splitViewActive ? 'Disattiva Schermo Affiancato' : 'Visuale Affiancata (PDF + Audio)'}</span>
              </button>

              <button
                onClick={() => setIsRecorderOpen(true)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs flex items-center gap-2 border border-slate-700 transition-colors cursor-pointer"
              >
                <Mic className="w-4 h-4 text-emerald-400" />
                <span>Microfono & Riascolto</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-slate-200 sticky top-[57px] z-20 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-2 overflow-x-auto py-2">
          <button
            onClick={() => setActiveTab('pdf')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'pdf'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>PDF del Libro (Sfoglia & Genera)</span>
          </button>

          <button
            onClick={() => setActiveTab('exercises')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'exercises'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Headphones className="w-4 h-4 text-amber-400" />
            <span>Esercizi & Audio (Pag. {currentLesson.pageNumber || '10'})</span>
          </button>

          <button
            onClick={() => setActiveTab('cursive')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'cursive'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span>Lavagna Corsivo (Прописи)</span>
          </button>

          <button
            onClick={() => setActiveTab('quiz')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'quiz'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Palestra d'Ascolto (Quiz)</span>
          </button>

          {Array.isArray(currentLesson?.vocabulary) && currentLesson.vocabulary.length > 0 && (
            <button
              onClick={() => setActiveTab('vocabulary')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'vocabulary'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Vocabolario A1 ({currentLesson.vocabulary.length})</span>
            </button>
          )}

          <button
            onClick={() => setIsScannerOpen(true)}
            className="ml-auto text-xs text-slate-500 hover:text-slate-800 font-medium px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center gap-1.5 shrink-0"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Carica singola foto</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 py-6 flex-1 w-full">
        {/* Split View: PDF on left, exercises on right */}
        {splitViewActive ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-600" />
                <span>Libro PDF originale (300 pagine):</span>
              </div>
              <PdfTextbookViewer
                onPageGenerated={handlePageGenerated}
                generatedPages={generatedPages}
                onSelectGeneratedPage={handleSelectGeneratedPage}
                splitViewActive={splitViewActive}
                onToggleSplitView={() => setSplitViewActive(!splitViewActive)}
              />
            </div>

            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-emerald-600" />
                <span>Esercizi & Audio estratti per questa pagina:</span>
              </div>

              {/* Exercises Column in split mode */}
              <div className="space-y-6">
                {poster && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <h4 className="font-bold text-slate-900 text-sm mb-1">{poster.titleRu}</h4>
                    <p className="text-xs text-slate-500 mb-3">{poster.descriptionIt}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {(Array.isArray(poster?.audioItems) ? poster.audioItems : []).map((item) => (
                        <button
                          key={item.id}
                          onClick={() => audioService.playText(item.audioTextToSpeak, item.id)}
                          className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors cursor-pointer"
                        >
                          <div className="font-bold text-base text-slate-900">{item.textRu}</div>
                          <div className="text-xs text-slate-500 font-mono">{item.ipa}</div>
                          <div className="text-[11px] text-amber-700 mt-1 font-semibold flex items-center gap-1">
                            <Volume2 className="w-3 h-3" />
                            <span>Ascolta</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {ex1 && (
                  <VowelsTableCard
                    items={ex1.audioItems || []}
                    title={ex1.titleRu}
                    notes={ex1.exerciseNotesIt}
                  />
                )}

                {ex2 && (
                  <CursiveCanvas
                    items={ex2.audioItems || []}
                    title={ex2.titleRu}
                    notes={ex2.exerciseNotesIt}
                  />
                )}

                {ex3 && (
                  <DiagramReader
                    items={ex3.audioItems || []}
                    title={ex3.titleRu}
                    notes={ex3.exerciseNotesIt}
                  />
                )}

                {ex4 && (
                  <VowelsTableCard
                    items={ex4.audioItems || []}
                    title={ex4.titleRu}
                    notes={ex4.exerciseNotesIt}
                  />
                )}

                {otherExercises.map((ex) => (
                  <div key={ex.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <h4 className="font-bold text-slate-900 text-sm mb-1">{ex.titleRu}</h4>
                    <p className="text-xs text-slate-500 mb-3">{ex.descriptionIt}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(Array.isArray(ex?.audioItems) ? ex.audioItems : []).map((item) => (
                        <div key={item.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-sm text-slate-900">{item.textRu}</div>
                            {item.ipa && <div className="text-xs font-mono text-slate-500">{item.ipa}</div>}
                          </div>
                          <button
                            onClick={() => audioService.playText(item.audioTextToSpeak, item.id)}
                            className="p-2 rounded-lg bg-slate-900 text-white cursor-pointer"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Single Tab View */
          <>
            {activeTab === 'pdf' && (
              <PdfTextbookViewer
                onPageGenerated={handlePageGenerated}
                generatedPages={generatedPages}
                onSelectGeneratedPage={handleSelectGeneratedPage}
                splitViewActive={splitViewActive}
                onToggleSplitView={() => setSplitViewActive(true)}
              />
            )}

            {activeTab === 'exercises' && (
              <div>
                {/* Active page header notice */}
                <div className="mb-6 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
                      {currentLesson.pageNumber || '10'}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">
                        {currentLesson.lessonTitle} — Pagina {currentLesson.pageNumber || '10'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {currentLesson.exercises.length} esercizi estratti e pronti per l'ascolto
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('pdf')}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Torna al lettore PDF</span>
                  </button>
                </div>

                {/* Poster "МИР МАЙ" section from the photo */}
                {poster && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
                    <div className="bg-gradient-to-r from-red-50 to-amber-50 px-6 py-4 border-b border-red-100 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">🕊️</span>
                        <div>
                          <h3 className="font-bold text-slate-900 text-base">{poster.titleRu}</h3>
                          <p className="text-xs text-red-800">{poster.titleIt}</p>
                        </div>
                      </div>

                      <span className="text-xs bg-red-100 text-red-800 px-3 py-1 rounded-full font-medium">
                        Testata Pagina 10
                      </span>
                    </div>

                    <div className="p-6">
                      <p className="text-xs text-slate-600 mb-4">{poster.descriptionIt}</p>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {(Array.isArray(poster?.audioItems) ? poster.audioItems : []).map((item) => (
                          <div
                            key={item.id}
                            className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between"
                          >
                            <div>
                              <div className="text-xl font-black text-slate-900 font-sans">{item.textRu}</div>
                              <div className="text-xs text-slate-500 font-mono mt-0.5">{item.ipa}</div>
                              <p className="text-[11px] text-slate-600 mt-2">{item.explanationIt}</p>
                            </div>

                            <button
                              onClick={() => audioService.playText(item.audioTextToSpeak, item.id)}
                              className="mt-3 py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>Ascolta pronuncia</span>
                            </button>
                          </div>
                        ))}
                      </div>

                      {poster.exerciseNotesIt && (
                        <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                          💡 {poster.exerciseNotesIt}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Exercise 1: 🎧 1. Слушайте, повторяйте, читайте (А, О, У) */}
                {ex1 && (
                  <VowelsTableCard
                    items={ex1.audioItems || []}
                    title={ex1.titleRu}
                    notes={ex1.exerciseNotesIt}
                  />
                )}

                {/* Exercise 2: ✍️ 2. Пишите (Preview & Quick Audio for letter pairs) */}
                {ex2 && (
                  <CursiveCanvas
                    items={ex2.audioItems || []}
                    title={ex2.titleRu}
                    notes={ex2.exerciseNotesIt}
                  />
                )}

                {/* Exercise 3: 💼 3. Читайте (Interactive diagram from the book) */}
                {ex3 && (
                  <DiagramReader
                    items={ex3.audioItems || []}
                    title={ex3.titleRu}
                    notes={ex3.exerciseNotesIt}
                  />
                )}

                {/* Exercise 4: 🎧 4. Слушайте, повторяйте, читайте (И, Э, Ы) */}
                {ex4 && (
                  <VowelsTableCard
                    items={ex4.audioItems || []}
                    title={ex4.titleRu}
                    notes={ex4.exerciseNotesIt}
                  />
                )}

                {/* Other custom extracted exercises if page was uploaded/generated */}
                {otherExercises.map((ex) => (
                  <div key={ex.id} className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-sm">
                    <h4 className="font-bold text-slate-900 text-base mb-1">{ex.titleRu}</h4>
                    <p className="text-xs text-slate-500 mb-4">{ex.descriptionIt}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {(Array.isArray(ex?.audioItems) ? ex.audioItems : []).map((item) => (
                        <div key={item.id} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-slate-900 text-base">{item.textRu}</div>
                            {item.ipa && <div className="text-xs font-mono text-slate-500">{item.ipa}</div>}
                            {item.explanationIt && <div className="text-[11px] text-slate-600">{item.explanationIt}</div>}
                          </div>
                          <button
                            onClick={() => audioService.playText(item.audioTextToSpeak, item.id)}
                            className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab: Full Screen Cursive Practice */}
            {activeTab === 'cursive' && (
              <div>
                <CursiveCanvas
                  items={ex2?.audioItems || []}
                  title={ex2?.titleRu || '2. Пишите (Corsivo russo)'}
                  notes="Suggerimento didattico: la scrittura corsiva russa è essenziale fin dal livello A1 perché la maggior parte degli appunti, dei compiti e della corrispondenza in Russia viene redatta a mano in corsivo!"
                />
              </div>
            )}

            {/* Tab: Listening Drill & Ear Training Quiz */}
            {activeTab === 'quiz' && (
              <div>
                <ListeningQuiz />
              </div>
            )}

            {/* Tab: Vocabulary of Lesson 1 */}
            {activeTab === 'vocabulary' && Array.isArray(currentLesson?.vocabulary) && currentLesson.vocabulary.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">Vocabolario Fondamentale di Lezione 1</h3>
                    <p className="text-xs text-slate-500">
                      Parole introdotte in "Стартап А1" con pronuncia autentica e accenti
                    </p>
                  </div>

                  <span className="text-xs bg-blue-50 text-blue-800 px-3 py-1.5 rounded-full font-medium border border-blue-200">
                    Livello A1 Principiante
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {(currentLesson.vocabulary || []).map((vocab, idx) => {
                    const isSelected = selectedWordAudio === `vocab-${idx}`;
                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between">
                            <span className="text-2xl font-black text-slate-900 font-sans tracking-wide">
                              {vocab.wordRu}
                            </span>
                            <span className="text-xs font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                              {vocab.ipa}
                            </span>
                          </div>
                          <div className="text-sm font-semibold text-slate-700 mt-1">
                            {vocab.translationIt}
                          </div>
                          {vocab.notesIt && (
                            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                              {vocab.notesIt}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => playWord(vocab.audioTextToSpeak, `vocab-${idx}`)}
                          className={`mt-3 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600 text-white animate-pulse'
                              : 'bg-white border border-slate-300 text-slate-800 hover:bg-slate-100'
                          }`}
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Ascolta "{vocab.wordRu}"</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">Стартап А1 — Audio Lab</span>
            <span>•</span>
            <span>Supporto PDF 300 pagine con salvataggio IndexedDB</span>
          </div>

          <div className="flex items-center gap-4 text-slate-600">
            <button onClick={() => setIsTutorOpen(true)} className="hover:text-blue-600 cursor-pointer">
              Tutor Fonetico 💡
            </button>
            <button onClick={() => setActiveTab('pdf')} className="hover:text-amber-600 cursor-pointer">
              Sfoglia PDF 📕
            </button>
            <button onClick={() => setIsRecorderOpen(true)} className="hover:text-emerald-600 cursor-pointer">
              Microfono 🎙️
            </button>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <PageScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onPageLoaded={handlePageGenerated}
      />

      <VoiceRecorderModal
        isOpen={isRecorderOpen}
        onClose={() => setIsRecorderOpen(false)}
      />

      <TutorDrawer
        isOpen={isTutorOpen}
        onClose={() => setIsTutorOpen(false)}
      />
    </div>
  );
}
