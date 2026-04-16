export default function QuestionPage({ question, onAnswer, myAnswer, questionClosed }) {
  const { index, total, question: text, options } = question;
  const answered = !!myAnswer || questionClosed;

  return (
    <div className="min-h-screen bg-upstox-dark flex flex-col">

      {/* ── Thin top progress bar ─────────────────────────────────────── */}
      <div className="h-0.5 bg-upstox-navy">
        <div
          className="h-full bg-upstox-purple transition-all duration-500"
          style={{ width: `${((index + 1) / total) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col px-5 py-6 max-w-lg mx-auto w-full">

        {/* ── Header: question label + timer ───────────────────────────── */}
        <div className="flex items-center justify-between mb-5">
          <span className="text-sm font-semibold text-white">
            Question {index + 1}
            <span className="text-upstox-muted font-normal"> / {total}</span>
          </span>
        </div>

        {/* ── Dot progress row ─────────────────────────────────────────── */}
        <div className="flex gap-1.5 mb-6">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className="h-1 rounded-full flex-1 transition-all duration-300"
              style={{
                background:
                  i < index
                    ? '#6C3EFF'
                    : i === index
                    ? '#8A66FF'
                    : '#1A1A3E',
              }}
            />
          ))}
        </div>

        {/* ── Question text ────────────────────────────────────────────── */}
        <div className="bg-upstox-card rounded-2xl px-6 py-6 mb-6 flex items-center justify-center flex-1">
          <p className="text-xl font-bold text-white leading-relaxed text-center">
            {text}
          </p>
        </div>

        {/* ── Options ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-2.5">
          {['A', 'B', 'C', 'D'].map((key, i) => {
            const isSelected = myAnswer === key;
            const isDisabled = answered;

            return (
              <button
                key={key}
                onClick={() => !isDisabled && onAnswer(key)}
                disabled={isDisabled}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition-all duration-150 animate-pop-in"
                style={{
                  animationDelay: `${i * 0.05}s`,
                  background: isSelected ? 'rgba(108, 62, 255, 0.15)' : '#1A1A3E',
                  border: isSelected ? '1.5px solid #6C3EFF' : '1.5px solid transparent',
                  cursor: isDisabled ? 'default' : 'pointer',
                  opacity: isDisabled && !isSelected ? 0.45 : 1,
                }}
              >
                <span
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 transition-all"
                  style={{
                    background: isSelected ? '#6C3EFF' : '#12122A',
                    color: isSelected ? '#fff' : '#6B6B9A',
                  }}
                >
                  {key}
                </span>
                <span className="font-medium text-white flex-1 leading-snug">
                  {options[key]}
                </span>
                {isSelected && (
                  <span className="text-upstox-purple font-bold text-lg shrink-0">✓</span>
                )}
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}
