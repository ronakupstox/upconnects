import Logo from '../components/Logo';

export default function PlayerLobby({ playerName, players, questionCount }) {
  return (
    <div className="min-h-screen bg-upstox-dark flex flex-col items-center px-5 py-10">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(108,62,255,0.15) 0%, transparent 70%)',
        }}
      />

      <div className="relative w-full max-w-sm flex flex-col items-center animate-fade-up">
        <Logo size="md" />

        <div className="mt-10 text-center">
          <h2 className="text-2xl font-bold text-white">Hey, {playerName}!</h2>
          <p className="text-upstox-muted mt-1 text-sm">Waiting for the host to start…</p>
        </div>

        {/* Question count pill — appears once admin loads questions */}
        {questionCount > 0 && (
          <div className="mt-4 flex items-center gap-2 bg-upstox-card border border-upstox-purple/30 px-4 py-2 rounded-full animate-pop-in">
            <span className="w-2 h-2 rounded-full bg-upstox-purple" />
            <span className="text-sm font-semibold text-white">
              {questionCount} question{questionCount !== 1 ? 's' : ''} ready
            </span>
          </div>
        )}

        {/* Waiting dots */}
        <div className="flex gap-1.5 my-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-upstox-purple animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>

        {/* Player list */}
        <div className="w-full bg-upstox-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-upstox-muted uppercase tracking-wider">
              Players
            </span>
            <span className="bg-upstox-purple/20 text-upstox-purple-light text-xs font-bold px-2.5 py-1 rounded-full">
              {players.length} joined
            </span>
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {players.map((p) => (
              <div
                key={p.name}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl animate-pop-in ${
                  p.name === playerName
                    ? 'bg-upstox-purple/20 border border-upstox-purple/30'
                    : 'bg-upstox-navy'
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-upstox-purple-dim flex items-center justify-center text-xs font-bold shrink-0">
                  {p.name[0].toUpperCase()}
                </div>
                <span className="font-medium text-sm flex-1">{p.name}</span>
                {p.name === playerName && (
                  <span className="text-xs text-upstox-purple font-semibold">You</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
