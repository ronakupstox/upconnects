import Timer from '../components/Timer';

const OPTION_STYLES = {
  A: { bg: '#C0392B', hover: '#E74C3C', label: 'bg-red-800' },
  B: { bg: '#1A56C4', hover: '#2563EB', label: 'bg-blue-800' },
  C: { bg: '#B7770D', hover: '#D97706', label: 'bg-yellow-800' },
  D: { bg: '#1A7A1A', hover: '#16A34A', label: 'bg-green-800' },
};

export default function QuestionPage({ question, onAnswer, myAnswer, questionClosed }) {
  const { index, total, question: text, options, duration } = question;

  return (
    <div className="min-h-screen bg-upstox-dark flex flex-col">
      {/* Progress bar */}
      <div className="h-1 bg-upstox-card">
        <div
          className="h-full bg-upstox-purple transition-all duration-500"
          style={{ width: `${((index + 1) / total) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col px-5 py-6 max-w-lg mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs font-semibold text-upstox-muted uppercase tracking-wider">
            Question {index + 1} / {total}
          </span>
          <Timer key={`${index}-${duration}`} duration={duration} />
        </div>

        {/* Question */}
        <div className="bg-upstox-card rounded-3xl px-6 py-6 mb-6 flex-1 flex items-center">
          <p className="text-xl font-bold text-white leading-relaxed text-center w-full">
            {text}
          </p>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 gap-3">
          {['A', 'B', 'C', 'D'].map((key) => {
            const style = OPTION_STYLES[key];
            const isSelected = myAnswer === key;
            const isDisabled = !!myAnswer || questionClosed;

            return (
              <button
                key={key}
                onClick={() => !isDisabled && onAnswer(key)}
                disabled={isDisabled}
                className="option-btn animate-pop-in"
                style={{
                  background: isSelected ? style.hover : style.bg,
                  opacity: isDisabled && !isSelected ? 0.5 : 1,
                  transform: isSelected ? 'scale(1.02)' : undefined,
                  border: isSelected ? '2px solid rgba(255,255,255,0.5)' : '2px solid transparent',
                  animationDelay: `${['A','B','C','D'].indexOf(key) * 0.06}s`,
                  cursor: isDisabled ? 'default' : 'pointer',
                }}
              >
                <span
                  className="option-label"
                  style={{ background: isSelected ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)' }}
                >
                  {key}
                </span>
                <span className="flex-1">{options[key]}</span>
                {isSelected && <span className="text-xl ml-2">✓</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
