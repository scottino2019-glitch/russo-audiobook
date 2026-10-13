import React, { useState, useEffect } from 'react';
import { Volume2, Play, CheckCircle, XCircle, RotateCcw, Award, Sparkles, HelpCircle } from 'lucide-react';
import { audioService } from '../services/audioService';

interface Question {
  id: string;
  audioText: string;
  correctAnswer: string;
  options: string[];
  ipa: string;
  explanationIt: string;
}

const QUIZ_QUESTIONS: Question[] = [
  {
    id: 'q1',
    audioText: 'оа',
    correctAnswer: 'оа',
    options: ['оа', 'ао', 'уа', 'ау'],
    ipa: '[oa]',
    explanationIt: 'Il suono inizia con le labbra chiuse a cerchio [o] e si apre in [a].',
  },
  {
    id: 'q2',
    audioText: 'у',
    correctAnswer: 'У',
    options: ['А', 'О', 'У', 'И'],
    ipa: '[u]',
    explanationIt: 'La vocale russa "У" si pronuncia come la "u" italiana, spingendo le labbra in avanti.',
  },
  {
    id: 'q3',
    audioText: 'ау',
    correctAnswer: 'ау',
    options: ['ау', 'уа', 'оу', 'ао'],
    ipa: '[au]',
    explanationIt: '"Ау!" è il celebre richiamo usato dai russi nei boschi quando ci si perde.',
  },
  {
    id: 'q4',
    audioText: 'о',
    correctAnswer: 'О',
    options: ['А', 'О', 'У', 'Э'],
    ipa: '[o]',
    explanationIt: 'La vocale "О" ha un suono pieno e rotondo quando è isolata o accentata.',
  },
  {
    id: 'q5',
    audioText: 'уа',
    correctAnswer: 'уа',
    options: ['уа', 'ау', 'оа', 'уо'],
    ipa: '[ua]',
    explanationIt: '"Уа" è il suono onomatopeico del pianto del bebè in russo.',
  },
  {
    id: 'q6',
    audioText: 'мир',
    correctAnswer: 'мир',
    options: ['мир', 'май', 'мама', 'дом'],
    ipa: '[mʲir]',
    explanationIt: '"Мир" significa sia "pace" che "mondo", dal manifesto iniziale.',
  },
  {
    id: 'q7',
    audioText: 'ы',
    correctAnswer: 'Ы',
    options: ['И', 'Ы', 'Э', 'У'],
    ipa: '[ɨ]',
    explanationIt: '"Ы" è la vocale gutturale posteriore tipica del russo, prodotta tirando la lingua indietro.',
  },
];

export const ListeningQuiz: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const currentQuestion = QUIZ_QUESTIONS[currentIndex];

  const playQuestionAudio = () => {
    audioService.playText(currentQuestion.audioText, `quiz-${currentQuestion.id}`, {
      repeatCount: 1,
      rate: 0.85,
    });
  };

  useEffect(() => {
    if (!quizFinished) {
      playQuestionAudio();
    }
  }, [currentIndex, quizFinished]);

  const handleSelect = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
    setIsAnswered(true);
    if (option === currentQuestion.correctAnswer) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < QUIZ_QUESTIONS.length) {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setQuizFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setQuizFinished(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-purple-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-600/10 text-purple-700">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Palestra d'Ascolto A1 (Dettato Sonoro)</h3>
            <p className="text-xs text-purple-800">
              Ascolta il suono e seleziona la lettera o la combinazione corretta
            </p>
          </div>
        </div>

        <div className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-100 text-purple-800">
          Punteggio: {score}/{QUIZ_QUESTIONS.length}
        </div>
      </div>

      <div className="p-6">
        {!quizFinished ? (
          <div>
            {/* Question Progress bar */}
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span>Domanda {currentIndex + 1} di {QUIZ_QUESTIONS.length}</span>
              <span>Precisione: {Math.round((score / Math.max(1, currentIndex + (isAnswered ? 1 : 0))) * 100)}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-6">
              <div
                className="bg-purple-600 h-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
              />
            </div>

            {/* Audio prompt button */}
            <div className="text-center py-6 bg-slate-50 rounded-2xl border border-slate-200/80 mb-6">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Cosa senti pronunciare?
              </p>

              <button
                onClick={playQuestionAudio}
                className="px-6 py-3.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm flex items-center justify-center gap-2 mx-auto shadow-md hover:shadow-lg transition-all transform active:scale-95"
              >
                <Volume2 className="w-5 h-5" />
                <span>Riascolta il suono 🎧</span>
              </button>
            </div>

            {/* Multiple Choice Options */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {currentQuestion.options.map((option) => {
                const isSelected = selectedOption === option;
                const isCorrect = option === currentQuestion.correctAnswer;

                let btnStyle = 'border-slate-200 bg-white hover:border-purple-300 text-slate-900';
                if (isAnswered) {
                  if (isCorrect) {
                    btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-500/20';
                  } else if (isSelected) {
                    btnStyle = 'border-red-400 bg-red-50 text-red-900 line-through';
                  } else {
                    btnStyle = 'border-slate-200 bg-slate-50 text-slate-400 opacity-60';
                  }
                }

                return (
                  <button
                    key={option}
                    disabled={isAnswered}
                    onClick={() => handleSelect(option)}
                    className={`py-4 px-6 rounded-xl border-2 text-2xl font-bold font-sans transition-all flex items-center justify-center gap-2 ${btnStyle}`}
                  >
                    <span>{option}</span>
                    {isAnswered && isCorrect && <CheckCircle className="w-5 h-5 text-emerald-600" />}
                    {isAnswered && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500" />}
                  </button>
                );
              })}
            </div>

            {/* Explanation card after answer */}
            {isAnswered && (
              <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 mb-6 animate-fadeIn">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-purple-950">
                    <p className="font-semibold text-purple-900 mb-1">
                      Risposta corretta: <span className="font-bold text-sm font-sans">{currentQuestion.correctAnswer}</span> ({currentQuestion.ipa})
                    </p>
                    <p className="leading-relaxed">{currentQuestion.explanationIt}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Next button */}
            {isAnswered && (
              <div className="flex justify-end">
                <button
                  onClick={handleNext}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors shadow-xs"
                >
                  {currentIndex + 1 < QUIZ_QUESTIONS.length ? 'Prossima Domanda ➔' : 'Vedi Risultati Finali 🏆'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-bold text-slate-900 mb-1">Esercizio d'Ascolto Completato!</h4>
            <p className="text-sm text-slate-600 mb-4">
              Hai totalizzato <strong className="text-purple-600 font-bold">{score} su {QUIZ_QUESTIONS.length}</strong> risposte corrette.
            </p>
            <div className="max-w-md mx-auto text-xs text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
              {score >= 6
                ? 'Ottimo orecchio per i fonemi russi! Riesci a distinguere con sicurezza le vocali e le transizioni vocaliche.'
                : 'Continua ad ascoltare gli esercizi 1 e 2 per familiarizzare con la posizione delle labbra nei suoni cirillici.'}
            </div>

            <button
              onClick={handleRestart}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center gap-2 mx-auto transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Riprova la Palestra d'Ascolto</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
