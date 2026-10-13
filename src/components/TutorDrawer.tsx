import React, { useState } from 'react';
import { X, HelpCircle, Send, Loader2, Sparkles, ChevronRight, BookOpen } from 'lucide-react';

interface TutorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const FREQUENT_QUESTIONS = [
  {
    q: 'Perché la lettera О a volte si legge А?',
    a: 'Questo fenomeno si chiama Аканье (akan\'e). In russo, la vocale О si pronuncia piena e rotonda [o] SOLAMENTE quando porta l\'accento (tonica). Quando la sillaba non è accentata (atona), la О si indebolisce e si riduce a un suono molto vicino alla [a] o a un suono neutro indistinto. Ad esempio: "молоко" (latte) si pronuncia [mə-la-kó]!',
  },
  {
    q: 'Come faccio a pronunciare la lettera Ы?',
    a: 'La lettera Ы [ɨ] è spesso lo scoglio iniziale per gli italiani perché non esiste nella nostra lingua. Il trucco pratico: metti una penna o i denti stretti in un sorriso (come per dire la "I"), ma ritira la lingua indietro verso il fondo della gola, premendo la radice della lingua. Sentirai un suono più cupo, gutturale e profondo.',
  },
  {
    q: 'Cosa significano i simboli 🎧 e ✍️ nel libro?',
    a: 'Nel manuale "Стартап А1":\n- 🎧 con "Слушайте, повторяйте, читайте" indica gli esercizi d\'ascolto in cui dovevi usare il CD audio (che questa applicazione riproduce integralmente!).\n- ✍️ con "Пишите" indica gli esercizi di calligrafia corsiva (прописи).\n- 💼 o 📖 con "Читайте" indica la lettura e i diagrammi fonetici.',
  },
  {
    q: 'Perché nel corsivo russo la "т" sembra una "m" e la "д" una "g"?',
    a: 'Il corsivo russo (рукописный шрифт) si è sviluppato dalla scrittura cancelleresca del \'700 e \'800. Molte lettere cambiano forma per essere tracciate velocemente senza staccare la penna dal foglio: "т" diventa una tripletta di tratti verticali simile a una "m", "д" si traccia con il cerchio e la gamba discendente identica a una "g" latina.',
  },
];

export const TutorDrawer: React.FC<TutorDrawerProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'tutor'; text: string }>>([
    {
      sender: 'tutor',
      text: 'Ciao! Sono il tuo tutor di supporto per il libro "Стартап А1". Puoi chiedermi qualsiasi spiegazione sulla pronuncia russa, sulle vocali dure/dolci, sull\'accento o sul corsivo. Clicca su una delle domande frequenti qui sotto oppure scrivi la tua domanda!',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSendQuestion = async (questionText: string) => {
    if (!questionText.trim()) return;

    const userMsg = questionText.trim();
    setInputValue('');
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/ask-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMsg }),
      });

      if (!res.ok) throw new Error('Errore di comunicazione con il tutor');
      const data = await res.json();
      setMessages((prev) => [...prev, { sender: 'tutor', text: data.answer }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'tutor',
          text: 'Non è stato possibile contattare il server. Puoi comunque consultare le schede delle domande frequenti qui sopra per le regole fonetiche fondamentali!',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl border-l border-slate-200">
        {/* Drawer Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Tutor di Fonetica & Libro A1</h3>
              <p className="text-[11px] text-slate-400">Spiegazioni chiare in italiano</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick FAQ buttons */}
        <div className="bg-slate-50 p-3 border-b border-slate-200 overflow-x-auto">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Domande frequenti per italiani:
          </span>
          <div className="space-y-1.5">
            {FREQUENT_QUESTIONS.map((faq, i) => (
              <button
                key={i}
                onClick={() => {
                  setMessages((prev) => [
                    ...prev,
                    { sender: 'user', text: faq.q },
                    { sender: 'tutor', text: faq.a },
                  ]);
                }}
                className="w-full text-left p-2 rounded-lg bg-white border border-slate-200 hover:border-blue-300 text-xs text-slate-800 hover:text-blue-900 font-medium flex items-center justify-between gap-2 transition-colors shadow-2xs"
              >
                <span className="truncate">{faq.q}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-xs'
                    : 'bg-slate-100 text-slate-800 rounded-tl-xs border border-slate-200 whitespace-pre-line'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 text-slate-500 rounded-2xl px-4 py-2.5 text-xs flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>Il tutor sta rispondendo...</span>
              </div>
            </div>
          )}
        </div>

        {/* Question Input */}
        <div className="p-3 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendQuestion(inputValue);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Fai una domanda in italiano sul russo..."
              className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-sans"
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
