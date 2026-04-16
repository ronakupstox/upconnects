const OPTION_COLORS = { A: '#C0392B', B: '#1A56C4', C: '#B7770D', D: '#1A7A1A' };

export default function WaitingPage({ myAnswer, isGameStarting, isGameOver }) {
  if (isGameOver) {
    return (
      <div className="min-h-screen bg-upstox-dark flex flex-col items-center justify-center px-5 text-center">
        <div className="text-7xl mb-6">🎉</div>
        <h1 className="text-3xl font-black text-white mb-3">Game Over!</h1>
        <p className="text-upstox-muted">The host is about to reveal the results…</p>
        <div className="flex gap-1.5 justify-center mt-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-upstox-purple animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (isGameStarting) {
    return (
      <div className="min-h-screen bg-upstox-dark flex flex-col items-center justify-center px-5 text-center">
        <div className="text-7xl mb-6 animate-bounce">🚀</div>
        <h1 className="text-3xl font-black text-white mb-3">Game is starting!</h1>
        <p className="text-upstox-muted">Get ready…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-upstox-dark flex flex-col items-center justify-center px-5 text-center">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 50% 40% at 50% 60%, rgba(108,62,255,0.12) 0%, transparent 70%)',
        }}
      />

      <div className="relative animate-fade-up">
        {myAnswer ? (
          <>
            <div className="text-7xl mb-6">✅</div>
            <h1 className="text-3xl font-black text-white mb-3">Answer locked in!</h1>
            <div
              className="inline-block px-6 py-2 rounded-2xl text-white font-bold text-lg mb-4"
              style={{ background: OPTION_COLORS[myAnswer] }}
            >
              You chose: {myAnswer}
            </div>
            <p className="text-upstox-muted">Waiting for other players…</p>
          </>
        ) : (
          <>
            <div className="text-7xl mb-6">⏱️</div>
            <h1 className="text-3xl font-black text-white mb-3">Time&apos;s up!</h1>
            <p className="text-upstox-muted">Waiting for the next question…</p>
          </>
        )}

        <div className="flex gap-1.5 justify-center mt-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-upstox-purple animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
