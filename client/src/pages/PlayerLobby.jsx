import Logo from '../components/Logo';

export default function PlayerLobby({ playerName, players }) {
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
          <div className="text-5xl mb-3">👋</div>
          <h2 className="text-2xl font-bold text-white">Welcome, {playerName}!</h2>
          <p className="text-upstox-muted mt-2">Waiting for the host to start the game…</p>
        </div>

        {/* Waiting animation */}
        <div className="flex gap-1.5 my-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-upstox-purple animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>

        {/* Player list */}
        <div className="w-full bg-upstox-card rounded-3xl p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-upstox-muted uppercase tracking-wider">
              Players Joined
            </span>
            <span className="bg-upstox-purple text-white text-xs font-bold px-3 py-1 rounded-full">
              {players.length}
            </span>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {players.map((p) => (
              <div
                key={p.name}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all animate-pop-in ${
                  p.name === playerName
                    ? 'bg-upstox-purple/20 border border-upstox-purple/40'
                    : 'bg-upstox-navy'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-upstox-purple-dim flex items-center justify-center text-sm font-bold">
                  {p.name[0].toUpperCase()}
                </div>
                <span className="font-medium">{p.name}</span>
                {p.name === playerName && (
                  <span className="ml-auto text-xs text-upstox-purple font-semibold">You</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
