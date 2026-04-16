import { useEffect, useState } from 'react';
import Logo from '../components/Logo';

const MEDALS = ['🥇', '🥈', '🥉'];
const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const PODIUM_HEIGHTS = [96, 72, 56]; // px heights for 1st, 2nd, 3rd

export default function LeaderboardPage({ leaderboard, playerName }) {
  const [visible, setVisible] = useState([]);

  // Stagger reveal
  useEffect(() => {
    leaderboard.forEach((_, i) => {
      setTimeout(() => setVisible((v) => [...v, i]), i * 120 + 300);
    });
  }, [leaderboard]);

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);
  const myEntry = leaderboard.find((p) => p.name === playerName);

  // Podium order: 2nd | 1st | 3rd
  const podiumOrder = [top3[1], top3[0], top3[2]];
  const podiumRanks = [2, 1, 3];

  return (
    <div className="min-h-screen bg-upstox-dark flex flex-col items-center px-4 pb-10">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(108,62,255,0.2) 0%, transparent 60%)',
        }}
      />

      <div className="relative w-full max-w-sm pt-8">
        <div className="flex justify-center mb-2">
          <Logo size="sm" />
        </div>
        <div className="text-center mb-6">
          <div className="text-5xl mt-4">🏆</div>
          <h1 className="text-3xl font-black text-white mt-2">Final Leaderboard</h1>
        </div>

        {/* Podium */}
        {top3.length > 0 && (
          <div className="flex items-end justify-center gap-3 mb-8">
            {podiumOrder.map((player, i) => {
              if (!player) return <div key={i} className="w-24" />;
              const rank = podiumRanks[i];
              const color = MEDAL_COLORS[rank - 1];
              return (
                <div key={player.name} className="flex flex-col items-center w-24">
                  <div className="text-3xl mb-1">{MEDALS[rank - 1]}</div>
                  <div className="font-bold text-sm text-center leading-tight mb-1 truncate w-full text-center">
                    {player.name}
                  </div>
                  <div className="text-xs font-semibold mb-2" style={{ color }}>
                    {player.score.toLocaleString()} pts
                  </div>
                  <div
                    className="w-full rounded-t-xl flex items-center justify-center text-2xl font-black"
                    style={{
                      height: PODIUM_HEIGHTS[rank - 1],
                      background: `${color}22`,
                      border: `2px solid ${color}`,
                    }}
                  >
                    {rank}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Rest of leaderboard */}
        <div className="space-y-2">
          {rest.map((player, i) => {
            const idx = i + 3;
            const isMe = player.name === playerName;
            const isVisible = visible.includes(idx);
            return (
              <div
                key={player.name}
                className={`flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                } ${isMe ? 'border border-upstox-purple bg-upstox-purple/20' : 'bg-upstox-card'}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-upstox-muted w-7 text-sm font-bold">#{player.rank}</span>
                  <div className="w-8 h-8 rounded-full bg-upstox-purple-dim flex items-center justify-center text-sm font-bold">
                    {player.name[0].toUpperCase()}
                  </div>
                  <span className="font-semibold">{player.name}</span>
                  {isMe && (
                    <span className="text-xs bg-upstox-purple text-white px-2 py-0.5 rounded-full font-semibold">
                      You
                    </span>
                  )}
                </div>
                <span className="font-bold text-upstox-purple-light">
                  {player.score.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>

        {/* My rank callout if outside top display */}
        {myEntry && myEntry.rank > Math.min(leaderboard.length, 3 + rest.length) && (
          <div className="mt-4 border-t border-upstox-card pt-4">
            <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-upstox-purple/20 border border-upstox-purple">
              <div className="flex items-center gap-3">
                <span className="text-upstox-muted w-7 text-sm font-bold">#{myEntry.rank}</span>
                <span className="font-bold">{myEntry.name}</span>
                <span className="text-xs bg-upstox-purple text-white px-2 py-0.5 rounded-full">
                  You
                </span>
              </div>
              <span className="font-bold text-upstox-purple-light">
                {myEntry.score.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
