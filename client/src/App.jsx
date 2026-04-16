import { useEffect, useReducer, useCallback } from 'react';
import { socket } from './socket';
import JoinPage from './pages/JoinPage';
import PlayerLobby from './pages/PlayerLobby';
import QuestionPage from './pages/QuestionPage';
import WaitingPage from './pages/WaitingPage';
import LeaderboardPage from './pages/LeaderboardPage';
import AnswerRevealPage from './pages/AnswerRevealPage';
import AdminPage from './pages/AdminPage';

const initialState = {
  screen: 'join',    // join | lobby | question | waiting | leaderboard | reveal | admin
  playerName: '',
  players: [],
  questionCount: 0,  // broadcast by server when admin loads questions
  currentQuestion: null,
  myAnswer: null,
  questionClosed: false,
  isGameStarting: false,
  leaderboard: [],
  answerReveal: [],
  adminInitData: null,
  error: '',
};

function reducer(state, action) {
  switch (action.type) {
    case 'JOINED':
      return { ...state, screen: 'lobby', playerName: action.name, error: '' };
    case 'ADMIN_AUTH':
      return { ...state, screen: 'admin', adminInitData: action.data, error: '' };
    case 'PLAYERS_UPDATE':
      return { ...state, players: action.players };
    case 'QUESTION_COUNT':
      return { ...state, questionCount: action.count };
    case 'GAME_STARTED':
      if (state.screen === 'admin') return state;
      return { ...state, screen: 'waiting', isGameStarting: true, questionCount: action.questionCount ?? state.questionCount };
    case 'QUESTION':
      if (state.screen === 'admin') return state;
      return { ...state, screen: 'question', currentQuestion: action.data, myAnswer: null, questionClosed: false, isGameStarting: false };
    case 'QUESTION_CLOSED':
      if (state.screen === 'admin') return state;
      return { ...state, questionClosed: true, screen: 'waiting', isGameStarting: false };
    case 'ANSWER_CONFIRMED':
      if (state.screen === 'admin') return state;
      return { ...state, myAnswer: action.answer, screen: 'waiting' };
    case 'LEADERBOARD':
      if (state.screen === 'admin') return state;
      return { ...state, screen: 'leaderboard', leaderboard: action.leaderboard };
    case 'GAME_OVER':
      if (state.screen === 'admin') return state;
      return { ...state, screen: 'game_over' };
    case 'ANSWERS_REVEALED':
      if (state.screen === 'admin') return state;
      return { ...state, screen: 'reveal', answerReveal: action.questions };
    case 'RESET':
      return { ...initialState };
    case 'ERROR':
      return { ...state, error: action.message };
    case 'CLEAR_ERROR':
      return { ...state, error: '' };
    default:
      return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const clearError = useCallback(() => dispatch({ type: 'CLEAR_ERROR' }), []);

  useEffect(() => {
    socket.connect();

    socket.on('player:joined', ({ name }) => dispatch({ type: 'JOINED', name }));
    socket.on('game:player-joined', ({ players }) => dispatch({ type: 'PLAYERS_UPDATE', players }));
    socket.on('game:questions-count', ({ count }) => dispatch({ type: 'QUESTION_COUNT', count }));
    socket.on('game:started', ({ questionCount } = {}) => dispatch({ type: 'GAME_STARTED', questionCount }));
    socket.on('game:question', (data) => dispatch({ type: 'QUESTION', data }));
    socket.on('game:question-closed', () => dispatch({ type: 'QUESTION_CLOSED' }));
    socket.on('player:answer-confirmed', ({ answer }) => dispatch({ type: 'ANSWER_CONFIRMED', answer }));
    socket.on('game:leaderboard', ({ leaderboard }) => dispatch({ type: 'LEADERBOARD', leaderboard }));
    socket.on('game:ended', () => dispatch({ type: 'GAME_OVER' }));
    socket.on('game:answers-revealed', ({ questions }) => dispatch({ type: 'ANSWERS_REVEALED', questions }));
    socket.on('game:reset', () => dispatch({ type: 'RESET' }));
    socket.on('error', ({ message }) => {
      dispatch({ type: 'ERROR', message });
      setTimeout(clearError, 3500);
    });

    return () => {
      socket.off('player:joined');
      socket.off('game:player-joined');
      socket.off('game:questions-count');
      socket.off('game:started');
      socket.off('game:question');
      socket.off('game:question-closed');
      socket.off('player:answer-confirmed');
      socket.off('game:leaderboard');
      socket.off('game:ended');
      socket.off('game:answers-revealed');
      socket.off('game:reset');
      socket.off('error');
      socket.disconnect();
    };
  }, [clearError]);

  const handleJoin = useCallback((name, code, mode) => {
    if (mode === 'host') {
      // Admin path — wait for server to confirm, then pass initial state to AdminPage
      socket.once('admin:authenticated', (data) => {
        dispatch({ type: 'ADMIN_AUTH', data });
      });
      socket.emit('admin:join', { adminCode: code });
    } else {
      // Player path — straightforward, no admin guessing
      socket.emit('player:join', { gameCode: code, name });
    }
  }, []);

  const handleAnswer = useCallback(
    (answer) => {
      if (state.myAnswer || state.questionClosed) return;
      socket.emit('player:answer', { answer });
    },
    [state.myAnswer, state.questionClosed]
  );

  const { screen, playerName, players, questionCount, currentQuestion, myAnswer, questionClosed, isGameStarting, leaderboard, answerReveal, error } = state;

  if (screen === 'admin') return <AdminPage initData={state.adminInitData} />;

  return (
    <div className="min-h-screen bg-upstox-dark text-white">
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-5 py-3 rounded-full shadow-xl animate-pop-in whitespace-nowrap">
          {error}
        </div>
      )}

      {screen === 'join' && <JoinPage onJoin={handleJoin} error={error} />}
      {screen === 'lobby' && <PlayerLobby playerName={playerName} players={players} questionCount={questionCount} />}
      {screen === 'question' && currentQuestion && (
        <QuestionPage
          question={currentQuestion}
          onAnswer={handleAnswer}
          myAnswer={myAnswer}
          questionClosed={questionClosed}
        />
      )}
      {screen === 'waiting' && (
        <WaitingPage myAnswer={myAnswer} isGameStarting={isGameStarting} />
      )}
      {screen === 'game_over' && <WaitingPage isGameOver />}
      {screen === 'leaderboard' && (
        <LeaderboardPage leaderboard={leaderboard} playerName={playerName} />
      )}
      {screen === 'reveal' && <AnswerRevealPage questions={answerReveal} />}
    </div>
  );
}
