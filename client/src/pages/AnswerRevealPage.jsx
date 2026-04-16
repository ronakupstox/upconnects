import { useState } from 'react';
import Logo from '../components/Logo';

const OPTION_STYLES = {
  A: { bg: 'bg-red-900/40', border: 'border-red-700', correct: 'bg-red-500' },
  B: { bg: 'bg-blue-900/40', border: 'border-blue-700', correct: 'bg-blue-500' },
  C: { bg: 'bg-yellow-900/40', border: 'border-yellow-700', correct: 'bg-yellow-500' },
  D: { bg: 'bg-green-900/40', border: 'border-green-700', correct: 'bg-green-500' },
};

export default function AnswerRevealPage({ questions }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const q = questions[activeIndex];

  return (
    <div className="min-h-screen bg-upstox-dark flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <Logo size="sm" />
        </div>

        <h1 className="text-2xl font-black text-white text-center mb-6">Answer Reveal</h1>

        {/* Question navigator */}
        <div className="flex gap-2 flex-wrap justify-center mb-6">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${
                i === activeIndex
                  ? 'bg-upstox-purple text-white scale-110'
                  : 'bg-upstox-card text-upstox-muted hover:text-white'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Question card */}
        {q && (
          <div className="animate-fade-up" key={activeIndex}>
            <div className="bg-upstox-card rounded-3xl p-6 mb-4">
              <div className="text-xs font-semibold text-upstox-muted uppercase tracking-wider mb-3">
                Question {activeIndex + 1}
              </div>
              <p className="text-lg font-bold text-white leading-snug">{q.question}</p>
            </div>

            <div className="space-y-3">
              {['A', 'B', 'C', 'D'].map((key) => {
                const isCorrect = key === q.correctAnswer;
                const style = OPTION_STYLES[key];
                return (
                  <div
                    key={key}
                    className={`flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all ${
                      isCorrect
                        ? `${style.correct} border-transparent scale-[1.02]`
                        : `${style.bg} ${style.border}`
                    }`}
                  >
                    <span
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black ${
                        isCorrect ? 'bg-white/30' : 'bg-black/20'
                      }`}
                    >
                      {key}
                    </span>
                    <span className={`flex-1 font-semibold ${isCorrect ? 'text-white' : 'text-white/70'}`}>
                      {q.options[key]}
                    </span>
                    {isCorrect && <span className="text-xl">✅</span>}
                  </div>
                );
              })}
            </div>

            {/* Nav arrows */}
            <div className="flex justify-between mt-6 gap-3">
              <button
                onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
                disabled={activeIndex === 0}
                className="flex-1 py-3 rounded-2xl bg-upstox-card text-white font-semibold disabled:opacity-30 transition-all active:scale-95"
              >
                ← Prev
              </button>
              <button
                onClick={() => setActiveIndex((i) => Math.min(questions.length - 1, i + 1))}
                disabled={activeIndex === questions.length - 1}
                className="flex-1 py-3 rounded-2xl bg-upstox-card text-white font-semibold disabled:opacity-30 transition-all active:scale-95"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
