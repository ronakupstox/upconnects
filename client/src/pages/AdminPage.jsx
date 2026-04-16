import { useEffect, useReducer, useCallback, useState, useRef } from 'react';
import { socket } from '../socket';
import Logo from '../components/Logo';

// ── Reducer ───────────────────────────────────────────────────────────────────
const initialState = {
  status: 'lobby', // lobby | starting | game-running | all-done | leaderboard-shown | answers-revealed
  players: [],
  questionsCount: 0,
  // Game-running state
  totalDuration: 0,
  currentQIndex: 0,
  totalQuestions: 0,
  liveLeaderboard: [],
  answeredCount: 0,
  totalPlayers: 0,
  // misc
  toast: null,
  loading: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'AUTHENTICATED':
      return {
        ...state,
        players: action.players,
        status: action.status === 'lobby' ? 'lobby' : state.status,
        questionsCount: action.questionsCount,
      };
    case 'PLAYER_UPDATE':
      return { ...state, players: action.players };
    case 'QUESTIONS_LOADED':
      return { ...state, questionsCount: action.count, toast: `✅ ${action.count} questions loaded` };
    case 'GAME_STARTED':
      return { ...state, status: 'starting' };
    case 'GAME_INFO':
      return {
        ...state,
        status: 'game-running',
        totalDuration: action.totalDuration,
        totalQuestions: action.questionsCount,
        currentQIndex: 0,
        liveLeaderboard: [],
        answeredCount: 0,
        totalPlayers: action.totalPlayers ?? 0,
      };
    case 'QUESTION_TICK':
      return { ...state, currentQIndex: action.questionIndex, answeredCount: 0 };
    case 'ANSWER_PROGRESS':
      return { ...state, answeredCount: action.answered, totalPlayers: action.total };
    case 'LIVE_LEADERBOARD':
      return { ...state, liveLeaderboard: action.leaderboard };
    case 'GAME_ENDED':
      return {
        ...state,
        status: 'all-done',
        liveLeaderboard: action.leaderboard ?? state.liveLeaderboard,
      };
    case 'LEADERBOARD_SHOWN':
      return { ...state, status: 'leaderboard-shown' };
    case 'ANSWERS_REVEALED':
      return { ...state, status: 'answers-revealed' };
    case 'RESET':
      return { ...initialState };
    case 'TOAST':
      return { ...state, toast: action.message };
    case 'CLEAR_TOAST':
      return { ...state, toast: null };
    case 'SET_LOADING':
      return { ...state, loading: action.value };
    default:
      return state;
  }
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminPage({ initData }) {
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    players: initData?.players ?? [],
    questionsCount: initData?.questionsCount ?? 0,
  });
  const [totalMinutes, setTotalMinutes] = useState(5);

  const showToast = useCallback((msg) => {
    dispatch({ type: 'TOAST', message: msg });
    setTimeout(() => dispatch({ type: 'CLEAR_TOAST' }), 3500);
  }, []);

  useEffect(() => {
    socket.on('admin:authenticated', ({ players, status, questionsCount }) =>
      dispatch({ type: 'AUTHENTICATED', players, status, questionsCount })
    );
    socket.on('admin:player-update', ({ players }) =>
      dispatch({ type: 'PLAYER_UPDATE', players })
    );
    socket.on('admin:questions-loaded', ({ count }) => {
      dispatch({ type: 'QUESTIONS_LOADED', count });
      dispatch({ type: 'SET_LOADING', value: false });
    });
    socket.on('game:started', () => dispatch({ type: 'GAME_STARTED' }));
    socket.on('admin:game-info', ({ totalDuration, questionsCount, totalPlayers }) =>
      dispatch({ type: 'GAME_INFO', totalDuration, questionsCount, totalPlayers })
    );
    socket.on('admin:question-tick', ({ questionIndex }) =>
      dispatch({ type: 'QUESTION_TICK', questionIndex })
    );
    socket.on('admin:answer-progress', ({ answered, total }) =>
      dispatch({ type: 'ANSWER_PROGRESS', answered, total })
    );
    socket.on('admin:live-leaderboard', ({ leaderboard }) =>
      dispatch({ type: 'LIVE_LEADERBOARD', leaderboard })
    );
    socket.on('admin:game-ended', ({ leaderboard }) =>
      dispatch({ type: 'GAME_ENDED', leaderboard })
    );
    socket.on('game:leaderboard', () => dispatch({ type: 'LEADERBOARD_SHOWN' }));
    socket.on('game:answers-revealed', () => dispatch({ type: 'ANSWERS_REVEALED' }));
    socket.on('game:reset', () => dispatch({ type: 'RESET' }));
    socket.on('error', ({ message }) => {
      showToast(`⚠️ ${message}`);
      dispatch({ type: 'SET_LOADING', value: false });
    });

    return () => {
      [
        'admin:authenticated', 'admin:player-update', 'admin:questions-loaded',
        'game:started', 'admin:game-info', 'admin:question-tick',
        'admin:answer-progress', 'admin:live-leaderboard', 'admin:game-ended',
        'game:leaderboard', 'game:answers-revealed', 'game:reset', 'error',
      ].forEach((e) => socket.off(e));
    };
  }, [showToast]);

  const emit = (e, d) => socket.emit(e, d);

  const handleReset = () => {
    if (window.confirm('Reset the game? All scores and answers will be cleared.')) {
      emit('admin:reset-game');
    }
  };

  const {
    status, players, questionsCount, totalDuration, currentQIndex,
    totalQuestions, liveLeaderboard, answeredCount, totalPlayers, toast, loading,
  } = state;

  return (
    <div className="min-h-screen bg-upstox-dark text-white">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-upstox-card border border-upstox-purple/40 text-white text-sm px-5 py-3 rounded-full shadow-xl animate-pop-in whitespace-nowrap">
          {toast}
        </div>
      )}

      <div className="max-w-2xl mx-auto px-5 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Logo size="sm" />
          <div className="flex items-center gap-3">
            <StatusBadge status={status} />
            {status !== 'game-running' && (
              <button
                onClick={handleReset}
                className="text-xs text-upstox-muted hover:text-red-400 transition-colors px-3 py-1.5 rounded-xl hover:bg-red-400/10"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* ── LOBBY ─────────────────────────────────────────────────────── */}
        {(status === 'lobby' || status === 'starting') && (
          <div className="space-y-5">
            {/* Players */}
            <div className="bg-upstox-card rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Players in Lobby</h2>
                <span className="bg-upstox-purple text-white text-sm font-bold px-3 py-1 rounded-full">
                  {players.length}
                </span>
              </div>
              {players.length === 0 ? (
                <p className="text-upstox-muted text-sm py-4 text-center">
                  Waiting for players to join…
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                  {players.map((p) => (
                    <div key={p.name} className="flex items-center gap-2 bg-upstox-navy rounded-xl px-3 py-2">
                      <div className="w-7 h-7 rounded-lg bg-upstox-purple-dim flex items-center justify-center text-xs font-bold">
                        {p.name[0].toUpperCase()}
                      </div>
                      <span className="text-sm font-medium truncate">{p.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Questions */}
            <div className="bg-upstox-card rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Questions</h2>
                {questionsCount > 0 && (
                  <span className="text-green-400 text-sm font-semibold">{questionsCount} loaded ✓</span>
                )}
              </div>
              <button
                onClick={() => { dispatch({ type: 'SET_LOADING', value: true }); emit('admin:refresh-questions'); }}
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-upstox-navy text-white font-semibold text-sm transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Loading…' : '↻  Load from Notion'}
              </button>
            </div>

            {/* Duration */}
            <div className="bg-upstox-card rounded-3xl p-6">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-lg font-bold">Game Duration</h2>
                <span className="text-3xl font-black text-upstox-purple">{totalMinutes} min</span>
              </div>
              {/* Per-question breakdown */}
              <p className="text-xs text-upstox-muted mb-4">
                {questionsCount > 0
                  ? `${Math.max(5, Math.floor((totalMinutes * 60) / questionsCount))}s per question with ${questionsCount} questions`
                  : 'Load questions to see per-question time'}
              </p>
              <input
                type="range" min={1} max={30} step={1} value={totalMinutes}
                onChange={(e) => setTotalMinutes(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: '#6C3EFF' }}
              />
              <div className="flex justify-between items-center text-xs text-upstox-muted mt-3">
                <span>1 min</span>
                <div className="flex gap-2">
                  {[3, 5, 10, 15, 20].map((m) => (
                    <button
                      key={m}
                      onClick={() => setTotalMinutes(m)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        totalMinutes === m ? 'bg-upstox-purple text-white' : 'bg-upstox-navy text-upstox-muted hover:text-white'
                      }`}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
                <span>30 min</span>
              </div>
            </div>

            <button
              onClick={() => {
                dispatch({ type: 'SET_LOADING', value: true });
                emit('admin:start-game', { totalGameDuration: totalMinutes * 60 });
                setTimeout(() => dispatch({ type: 'SET_LOADING', value: false }), 3000);
              }}
              disabled={loading || status === 'starting'}
              className="w-full py-5 rounded-3xl font-black text-xl text-white transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-upstox-purple/30"
              style={{ background: 'linear-gradient(135deg, #6C3EFF 0%, #4B1FCC 100%)' }}
            >
              {status === 'starting' ? 'Starting…' : '▶  Start Game'}
            </button>
          </div>
        )}

        {/* ── GAME RUNNING ──────────────────────────────────────────────── */}
        {status === 'game-running' && (
          <GameRunningView
            totalDuration={totalDuration}
            currentQIndex={currentQIndex}
            totalQuestions={totalQuestions}
            liveLeaderboard={liveLeaderboard}
            answeredCount={answeredCount}
            totalPlayers={totalPlayers}
            onNextQuestion={() => emit('admin:next-question')}
            onEndGame={() => {
              if (window.confirm('End the game now? Current scores will be final.')) {
                emit('admin:end-game');
              }
            }}
          />
        )}

        {/* ── ALL DONE ──────────────────────────────────────────────────── */}
        {status === 'all-done' && (
          <div className="space-y-5">
            <div className="bg-upstox-card rounded-3xl p-8 text-center">
              <div className="text-5xl mb-3">🎉</div>
              <h2 className="text-2xl font-black mb-1">Game Over!</h2>
              <p className="text-upstox-muted text-sm">Players are waiting for the results.</p>
            </div>

            {/* Final leaderboard preview */}
            {liveLeaderboard.length > 0 && (
              <LiveLeaderboard leaderboard={liveLeaderboard} title="Final Standings" />
            )}

            <button
              onClick={() => emit('admin:show-leaderboard')}
              className="w-full py-5 rounded-3xl font-black text-xl text-white transition-all active:scale-[0.98] shadow-lg"
              style={{ background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' }}
            >
              🏆  Present Leaderboard to Players
            </button>
          </div>
        )}

        {/* ── LEADERBOARD SHOWN ─────────────────────────────────────────── */}
        {status === 'leaderboard-shown' && (
          <div className="space-y-5">
            <div className="bg-upstox-card rounded-3xl p-8 text-center">
              <div className="text-5xl mb-3">🏆</div>
              <h2 className="text-2xl font-black mb-1">Leaderboard is live!</h2>
              <p className="text-upstox-muted text-sm">All players can see the final results.</p>
            </div>
            <button
              onClick={() => emit('admin:reveal-answers')}
              className="w-full py-5 rounded-3xl font-black text-xl text-white transition-all active:scale-[0.98] shadow-lg"
              style={{ background: 'linear-gradient(135deg, #22C55E 0%, #15803D 100%)' }}
            >
              💡  Reveal Correct Answers
            </button>
          </div>
        )}

        {/* ── ANSWERS REVEALED ──────────────────────────────────────────── */}
        {status === 'answers-revealed' && (
          <div className="space-y-5">
            <div className="bg-upstox-card rounded-3xl p-8 text-center">
              <div className="text-5xl mb-3">✅</div>
              <h2 className="text-2xl font-black mb-1">Answers Revealed!</h2>
              <p className="text-upstox-muted text-sm">Players can browse the correct answers.</p>
            </div>
            <button
              onClick={handleReset}
              className="w-full py-5 rounded-3xl font-black text-xl text-white transition-all active:scale-[0.98] bg-upstox-card border-2 border-upstox-purple/40 hover:border-upstox-purple"
            >
              🔄  Reset &amp; Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Game Running View ─────────────────────────────────────────────────────────
function GameRunningView({ totalDuration, currentQIndex, totalQuestions, liveLeaderboard, answeredCount, totalPlayers, onNextQuestion, onEndGame }) {
  const [secondsLeft, setSecondsLeft] = useState(totalDuration);
  const intervalRef = useRef(null);

  useEffect(() => {
    setSecondsLeft(totalDuration);
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) { clearInterval(intervalRef.current); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [totalDuration]);

  const pct = totalDuration > 0 ? (secondsLeft / totalDuration) * 100 : 0;
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timerColor = pct > 50 ? '#22C55E' : pct > 25 ? '#EAB308' : '#EF4444';

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Timer + question progress */}
      <div className="bg-upstox-card rounded-3xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs font-semibold text-upstox-muted uppercase tracking-wider mb-1">
              Game in Progress
            </p>
            <p className="text-lg font-bold text-white">
              Question {currentQIndex + 1}
              <span className="text-upstox-muted font-normal"> / {totalQuestions}</span>
            </p>
          </div>
          {/* Time remaining */}
          <div className="text-right">
            <p className="text-xs font-semibold text-upstox-muted uppercase tracking-wider mb-1">
              Time Left
            </p>
            <p className="text-3xl font-black tabular-nums" style={{ color: timerColor }}>
              {mins > 0 ? `${mins}:${String(secs).padStart(2, '0')}` : `${secs}s`}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-upstox-navy rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${pct}%`, background: timerColor }}
          />
        </div>

        {/* Question dots */}
        <div className="flex gap-1.5 mt-4 flex-wrap">
          {Array.from({ length: totalQuestions }).map((_, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full flex-1 min-w-[8px] transition-all duration-300"
              style={{
                background:
                  i < currentQIndex
                    ? '#22C55E'
                    : i === currentQIndex
                    ? '#6C3EFF'
                    : '#1A1A3E',
              }}
            />
          ))}
        </div>
      </div>

      {/* Answer progress + Next Question */}
      <div className="bg-upstox-card rounded-3xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-semibold text-upstox-muted uppercase tracking-wider mb-0.5">Answered</p>
            <p className="text-2xl font-black tabular-nums">
              {answeredCount}
              <span className="text-upstox-muted font-normal text-base"> / {totalPlayers}</span>
            </p>
          </div>
          <button
            onClick={onNextQuestion}
            className="px-5 py-3 rounded-2xl font-bold text-sm text-white transition-all active:scale-95 shadow-md"
            style={{ background: 'linear-gradient(135deg, #6C3EFF 0%, #4B1FCC 100%)' }}
          >
            Next Question →
          </button>
        </div>
        {totalPlayers > 0 && (
          <div className="h-1.5 bg-upstox-navy rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(answeredCount / totalPlayers) * 100}%`,
                background: answeredCount === totalPlayers ? '#22C55E' : '#6C3EFF',
              }}
            />
          </div>
        )}
      </div>

      {/* Live leaderboard */}
      {liveLeaderboard.length > 0 ? (
        <LiveLeaderboard leaderboard={liveLeaderboard} title="Live Standings" />
      ) : (
        <div className="bg-upstox-card rounded-3xl p-8 text-center">
          <p className="text-upstox-muted text-sm">
            Leaderboard updates after each question…
          </p>
        </div>
      )}

      {/* End game */}
      <button
        onClick={onEndGame}
        className="w-full py-4 rounded-2xl font-bold text-base text-red-400 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 transition-all active:scale-95"
      >
        ⏹  End Game Now
      </button>
    </div>
  );
}

// ── Live Leaderboard ──────────────────────────────────────────────────────────
function LiveLeaderboard({ leaderboard, title }) {
  const MEDALS = ['🥇', '🥈', '🥉'];
  const maxScore = leaderboard[0]?.score || 1;

  return (
    <div className="bg-upstox-card rounded-3xl p-6">
      <h3 className="text-sm font-semibold text-upstox-muted uppercase tracking-wider mb-4">
        {title}
      </h3>
      <div className="space-y-2.5">
        {leaderboard.map((p, i) => (
          <div key={p.name} className="flex items-center gap-3 animate-fade-up">
            <span className="w-7 text-center text-lg shrink-0">
              {i < 3 ? MEDALS[i] : <span className="text-sm text-upstox-muted font-bold">#{i + 1}</span>}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm truncate">{p.name}</span>
                <span className="text-sm font-black text-upstox-purple-light ml-2 shrink-0">
                  {p.score.toLocaleString()}
                </span>
              </div>
              {/* Score bar */}
              <div className="h-1 bg-upstox-navy rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(p.score / maxScore) * 100}%`,
                    background: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : '#6C3EFF',
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    lobby: { label: 'Lobby', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    starting: { label: 'Starting', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    'game-running': { label: '🔴 Live', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    'all-done': { label: 'Finished', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    'leaderboard-shown': { label: 'Results', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    'answers-revealed': { label: 'Revealed', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  };
  const { label, color } = map[status] ?? { label: status, color: 'bg-upstox-card text-upstox-muted border-upstox-muted/20' };
  return <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${color}`}>{label}</span>;
}
