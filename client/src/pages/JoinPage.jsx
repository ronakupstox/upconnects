import { useState } from 'react';
import Logo from '../components/Logo';

export default function JoinPage({ onJoin, error }) {
  const [mode, setMode] = useState('player'); // 'player' | 'host'
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loading) return;
    if (mode === 'player' && !name.trim()) return;
    if (!code.trim()) return;
    setLoading(true);
    onJoin(name.trim(), code.trim().toUpperCase());
    // Reset loading after a moment (server will respond with error or redirect)
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="min-h-screen bg-upstox-dark flex flex-col items-center justify-center px-5">
      {/* Background gradient orb */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(108,62,255,0.18) 0%, transparent 70%)',
        }}
      />

      <div className="relative w-full max-w-sm animate-fade-up">
        <div className="flex justify-center mb-10">
          <Logo size="lg" />
        </div>

        {/* Mode toggle */}
        <div className="flex bg-upstox-card rounded-2xl p-1 mb-6">
          <button
            type="button"
            onClick={() => setMode('player')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              mode === 'player'
                ? 'bg-upstox-purple text-white shadow'
                : 'text-upstox-muted hover:text-white'
            }`}
          >
            Join as Player
          </button>
          <button
            type="button"
            onClick={() => setMode('host')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              mode === 'host'
                ? 'bg-upstox-purple text-white shadow'
                : 'text-upstox-muted hover:text-white'
            }`}
          >
            I&apos;m the Host
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'player' && (
            <div>
              <label className="block text-xs font-semibold text-upstox-muted uppercase tracking-wider mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                maxLength={24}
                autoFocus
                className="w-full bg-upstox-card border border-upstox-card hover:border-upstox-purple focus:border-upstox-purple
                           rounded-2xl px-5 py-4 text-white placeholder-upstox-muted text-lg
                           outline-none transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-upstox-muted uppercase tracking-wider mb-2">
              {mode === 'player' ? 'Game Code' : 'Host Code'}
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder={mode === 'player' ? 'e.g. UPCON25' : 'Enter host code'}
              maxLength={20}
              autoFocus={mode === 'host'}
              className="w-full bg-upstox-card border border-upstox-card hover:border-upstox-purple focus:border-upstox-purple
                         rounded-2xl px-5 py-4 text-white placeholder-upstox-muted text-lg font-mono tracking-widest
                         outline-none transition-colors"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !code.trim() || (mode === 'player' && !name.trim())}
            className="w-full py-4 rounded-2xl font-bold text-lg text-white transition-all
                       disabled:opacity-40 disabled:cursor-not-allowed
                       active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #6C3EFF 0%, #4B1FCC 100%)' }}
          >
            {loading ? 'Joining...' : mode === 'player' ? 'Join Game' : 'Enter Control Panel'}
          </button>
        </form>

        <p className="text-center text-upstox-muted text-xs mt-8">
          Powered by Upstox &bull; UpConnects 2025
        </p>
      </div>
    </div>
  );
}
