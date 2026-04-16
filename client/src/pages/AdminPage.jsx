import { useEffect, useReducer, useCallback, useState } from 'react';
import { socket } from '../socket';
import Logo from '../components/Logo';

const OPTION_COLORS = { A: '#C0392B', B: '#1A56C4', C: '#B7770D', D: '#1A7A1A' };

const initialState = {
  status: 'lobby', // lobby | starting | question-active | question-closed | all-done | leaderboard-shown | answers-revealed
  players: [],
  questionsCount: 0,
  currentQuestion: null,
  answered: 0,
  total: 0,
  isLast: false,
  toast: null,
  loading: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'AUTHENTICATED':
      return { ...state, players: action.players, status: action.status === 'lobby' ? 'lobby' : state.status, questionsCount: action.questionsCount };
    case 'PLAYER_UPDATE':
      return { ...state, players: action.players };
    case 'QUESTIONS_LOADED':
      return { ...state, questionsCount: action.count, toast: `${action.count} questions loaded from Notion` };
    case 'GAME_STARTED':
      return { ...state, status: 'starting' };
    case 'QUESTION_STARTED':
      return { ...state, status: 'question-active', currentQuestion: action.question, answered: 0, total: action.total, isLast: action.isLast };
    case 'ANSWER_PROGRESS':
      return { ...state, answered: action.answered, total: action.total };
    case 'QUESTION_CLOSED':
      return { ...state, status: 'question-closed', answered: action.answered, total: action.total, isLast: action.isLast };
    case 'GAME_ENDED':
      return { ...state, status: 'all-done' };
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

export default function AdminPage({ initData }) {
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    // Seed with the payload from admin:authenticated so we don't start empty
    players: initData?.players ?? [],
    questionsCount: initData?.questionsCount ?? 0,
  });
  const [duration, setDuration] = useState(30);

  const showToast = useCallback((message) => {
    dispatch({ type: 'TOAST', message });
    setTimeout(() => dispatch({ type: 'CLEAR_TOAST' }), 3500);
  }, []);

  useEffect(() => {
    socket.on('admin:authenticated', ({ players, status, questionsCount }) => {
      dispatch({ type: 'AUTHENTICATED', players, status, questionsCount });
    });
    socket.on('admin:player-update', ({ players }) => {
      dispatch({ type: 'PLAYER_UPDATE', players });
    });
    socket.on('admin:questions-loaded', ({ count }) => {
      dispatch({ type: 'QUESTIONS_LOADED', count });
      dispatch({ type: 'SET_LOADING', value: false });
    });
    socket.on('admin:question-started', ({ index, total, question, options, duration, isLast }) => {
      dispatch({ type: 'QUESTION_STARTED', question: { index, total, question, options, duration }, total, isLast: isLast || false });
    });
    socket.on('admin:answer-progress', ({ answered, total }) => {
      dispatch({ type: 'ANSWER_PROGRESS', answered, total });
    });
    socket.on('admin:question-closed', ({ answered, total, isLast }) => {
      dispatch({ type: 'QUESTION_CLOSED', answered, total, isLast });
    });
    socket.on('admin:game-ended', () => {
      dispatch({ type: 'GAME_ENDED' });
    });
    socket.on('game:leaderboard', () => {
      dispatch({ type: 'LEADERBOARD_SHOWN' });
    });
    socket.on('game:answers-revealed', () => {
      dispatch({ type: 'ANSWERS_REVEALED' });
    });
    socket.on('game:reset', () => {
      dispatch({ type: 'RESET' });
    });
    socket.on('error', ({ message }) => {
      showToast(`Error: ${message}`);
      dispatch({ type: 'SET_LOADING', value: false });
    });

    return () => {
      socket.off('admin:authenticated');
      socket.off('admin:player-update');
      socket.off('admin:questions-loaded');
      socket.off('admin:question-started');
      socket.off('admin:answer-progress');
      socket.off('admin:question-closed');
      socket.off('admin:game-ended');
      socket.off('game:leaderboard');
      socket.off('game:answers-revealed');
      socket.off('game:reset');
      socket.off('error');
    };
  }, [showToast]);

  const emit = (event, data) => socket.emit(event, data);

  const handleRefreshQuestions = () => {
    dispatch({ type: 'SET_LOADING', value: true });
    emit('admin:refresh-questions');
  };

  const handleStartGame = () => {
    dispatch({ type: 'SET_LOADING', value: true });
    emit('admin:start-game', { duration });
    setTimeout(() => dispatch({ type: 'SET_LOADING', value: false }), 3000);
  };

  const handleCloseQuestion = () => emit('admin:close-question');
  const handleNextQuestion = () => emit('admin:next-question');
  const handleShowLeaderboard = () => emit('admin:show-leaderboard');
  const handleRevealAnswers = () => emit('admin:reveal-answers');
  const handleReset = () => {
    if (window.confirm('Reset the game? All scores and answers will be cleared.')) {
      emit('admin:reset-game');
    }
  };

  const { status, players, questionsCount, currentQuestion, answered, total, isLast, toast, loading } = state;

  return (
    <div className="min-h-screen bg-upstox-dark text-white">
      {/* Toast */}
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
            <button
              onClick={handleReset}
              className="text-xs text-upstox-muted hover:text-red-400 transition-colors px-3 py-1.5 rounded-xl hover:bg-red-400/10"
            >
              Reset
            </button>
          </div>
        </div>

        {/* ── LOBBY ──────────────────────────────────────────────────── */}
        {(status === 'lobby' || status === 'starting') && (
          <div className="space-y-5">
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

            <div className="bg-upstox-card rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Questions</h2>
                {questionsCount > 0 && (
                  <span className="text-green-400 text-sm font-semibold">{questionsCount} loaded</span>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleRefreshQuestions}
                  disabled={loading}
                  className="flex-1 py-3 rounded-2xl bg-upstox-navy text-white font-semibold text-sm transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? 'Loading…' : '↻ Load from Notion'}
                </button>
              </div>
            </div>

            {/* Duration control */}
            <div className="bg-upstox-card rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Time per Question</h2>
                <span className="text-3xl font-black text-upstox-purple">{duration}s</span>
              </div>
              <input
                type="range"
                min={10}
                max={120}
                step={5}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: '#6C3EFF' }}
              />
              <div className="flex justify-between text-xs text-upstox-muted mt-2">
                <span>10s</span>
                <div className="flex gap-2">
                  {[15, 20, 30, 45, 60].map((s) => (
                    <button
                      key={s}
                      onClick={() => setDuration(s)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        duration === s
                          ? 'bg-upstox-purple text-white'
                          : 'bg-upstox-navy text-upstox-muted hover:text-white'
                      }`}
                    >
                      {s}s
                    </button>
                  ))}
                </div>
                <span>120s</span>
              </div>
            </div>

            <button
              onClick={handleStartGame}
              disabled={loading || status === 'starting'}
              className="w-full py-5 rounded-3xl font-black text-xl text-white transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-upstox-purple/30"
              style={{ background: 'linear-gradient(135deg, #6C3EFF 0%, #4B1FCC 100%)' }}
            >
              {status === 'starting' ? 'Starting…' : '▶  Start Game'}
            </button>
          </div>
        )}

        {/* ── ACTIVE QUESTION ─────────────────────────────────────────── */}
        {(status === 'question-active' || status === 'question-closed') && currentQuestion && (
          <div className="space-y-5">
            <QuestionPreview question={currentQuestion} answered={answered} total={total} />

            {status === 'question-active' && (
              <button
                onClick={handleCloseQuestion}
                className="w-full py-4 rounded-2xl bg-upstox-card border border-upstox-muted/30 text-upstox-muted hover:text-white hover:border-white/30 font-semibold transition-all active:scale-95"
              >
                ⏹  End Question Early
              </button>
            )}

            {status === 'question-closed' && (
              <button
                onClick={isLast ? handleShowLeaderboard : handleNextQuestion}
                className="w-full py-5 rounded-3xl font-black text-xl text-white transition-all active:scale-[0.98] shadow-lg shadow-upstox-purple/30"
                style={{ background: 'linear-gradient(135deg, #6C3EFF 0%, #4B1FCC 100%)' }}
              >
                {isLast ? '🏆  Show Leaderboard' : '→  Next Question'}
              </button>
            )}
          </div>
        )}

        {/* ── ALL DONE (before leaderboard) ────────────────────────────── */}
        {status === 'all-done' && (
          <div className="text-center space-y-6">
            <div className="bg-upstox-card rounded-3xl p-10">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-black mb-2">All Questions Done!</h2>
              <p className="text-upstox-muted">Ready to reveal the final standings?</p>
            </div>
            <button
              onClick={handleShowLeaderboard}
              className="w-full py-5 rounded-3xl font-black text-xl text-white transition-all active:scale-[0.98] shadow-lg shadow-upstox-purple/30"
              style={{ background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' }}
            >
              🏆  Present Leaderboard
            </button>
          </div>
        )}

        {/* ── LEADERBOARD SHOWN ──────────────────────────────────────── */}
        {status === 'leaderboard-shown' && (
          <div className="text-center space-y-6">
            <div className="bg-upstox-card rounded-3xl p-10">
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="text-2xl font-black mb-2">Leaderboard is live!</h2>
              <p className="text-upstox-muted">All players can see the final results.</p>
            </div>
            <button
              onClick={handleRevealAnswers}
              className="w-full py-5 rounded-3xl font-black text-xl text-white transition-all active:scale-[0.98] shadow-lg"
              style={{ background: 'linear-gradient(135deg, #22C55E 0%, #15803D 100%)' }}
            >
              💡  Reveal Correct Answers
            </button>
          </div>
        )}

        {/* ── ANSWERS REVEALED ────────────────────────────────────────── */}
        {status === 'answers-revealed' && (
          <div className="text-center space-y-6">
            <div className="bg-upstox-card rounded-3xl p-10">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-black mb-2">Answers Revealed!</h2>
              <p className="text-upstox-muted">Everyone can now browse the correct answers.</p>
            </div>
            <button
              onClick={handleReset}
              className="w-full py-5 rounded-3xl font-black text-xl text-white transition-all active:scale-[0.98] shadow-lg bg-upstox-card border-2 border-upstox-purple/40 hover:border-upstox-purple"
            >
              🔄  Reset Game (Play Again)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    lobby: { label: 'Lobby', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    starting: { label: 'Starting', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    'question-active': { label: 'Live', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    'question-closed': { label: 'Closed', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    'all-done': { label: 'Finished', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    'leaderboard-shown': { label: 'Leaderboard', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    'answers-revealed': { label: 'Revealed', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  };
  const { label, color } = map[status] ?? { label: status, color: 'bg-upstox-card text-upstox-muted border-upstox-muted/20' };
  return (
    <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${color}`}>{label}</span>
  );
}

function QuestionPreview({ question, answered, total }) {
  const pct = total > 0 ? (answered / total) * 100 : 0;
  return (
    <div className="bg-upstox-card rounded-3xl p-6 space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-upstox-muted font-semibold">
          Question {question.index + 1} / {question.total}
        </span>
        <span className="text-upstox-muted font-semibold">{question.duration}s</span>
      </div>

      <p className="text-lg font-bold text-white leading-snug">{question.question}</p>

      <div className="grid grid-cols-2 gap-2">
        {['A', 'B', 'C', 'D'].map((key) => (
          <div
            key={key}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
            style={{ background: `${OPTION_COLORS[key]}33` }}
          >
            <span
              className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black"
              style={{ background: OPTION_COLORS[key] }}
            >
              {key}
            </span>
            <span className="text-white/80 truncate">{question.options[key]}</span>
          </div>
        ))}
      </div>

      {/* Answer progress */}
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-upstox-muted">Responses</span>
          <span className="font-bold text-white">
            {answered} / {total}
          </span>
        </div>
        <div className="h-2.5 bg-upstox-navy rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${pct}%`,
              background: pct === 100 ? '#22C55E' : '#6C3EFF',
            }}
          />
        </div>
      </div>
    </div>
  );
}
