require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { fetchQuestions } = require('./notionService');
const GameManager = require('./gameManager');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

const game = new GameManager();

// ── Static files from React build ──────────────────────────────────────────
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ── Helpers ─────────────────────────────────────────────────────────────────
function notifyAdmin(event, data) {
  if (game.adminSocketId) {
    io.to(game.adminSocketId).emit(event, data);
  }
}

function startNextQuestion() {
  const hasNext = game.advanceQuestion();

  if (!hasNext) {
    // All questions exhausted
    notifyAdmin('admin:game-ended', {});
    return;
  }

  const payload = game.getCurrentQuestionPayload();
  io.emit('game:question', payload);
  notifyAdmin('admin:question-started', {
    ...payload,
    ...game.getAnswerProgress(),
  });

  // Auto-close after duration
  game.timer = setTimeout(() => {
    game.closeQuestion();
    io.emit('game:question-closed', {});
    notifyAdmin('admin:question-closed', {
      ...game.getAnswerProgress(),
      isLast: game.isLastQuestion(),
    });
    game.timer = null;
  }, payload.duration * 1000);
}

// ── Socket.io ────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[connect] ${socket.id}`);

  // ── PLAYER ────────────────────────────────────────────────────────────────
  socket.on('player:join', ({ gameCode, name } = {}) => {
    if (gameCode !== process.env.GAME_CODE) {
      socket.emit('error', { message: 'Invalid game code' });
      return;
    }
    const result = game.addPlayer(socket.id, name ?? '');
    if (!result.success) {
      socket.emit('error', { message: result.error });
      return;
    }
    socket.emit('player:joined', { name: name.trim() });
    const players = game.getPlayerList();
    io.emit('game:player-joined', { players });
    notifyAdmin('admin:player-update', { players, count: players.length });
  });

  socket.on('player:answer', ({ answer } = {}) => {
    const result = game.submitAnswer(socket.id, answer);
    if (!result.success) return;
    socket.emit('player:answer-confirmed', { answer });
    notifyAdmin('admin:answer-progress', {
      answered: result.answered,
      total: result.total,
    });
  });

  // ── ADMIN ─────────────────────────────────────────────────────────────────
  socket.on('admin:join', ({ adminCode } = {}) => {
    if (adminCode !== process.env.ADMIN_CODE) {
      socket.emit('error', { message: 'Invalid admin code' });
      return;
    }
    game.setAdmin(socket.id);
    socket.emit('admin:authenticated', {
      players: game.getPlayerList(),
      status: game.status,
      questionsCount: game.questions.length,
    });
  });

  socket.on('admin:refresh-questions', async () => {
    if (socket.id !== game.adminSocketId) return;
    try {
      const questions = await fetchQuestions();
      game.loadQuestions(questions);
      socket.emit('admin:questions-loaded', { count: questions.length });
    } catch (err) {
      console.error('Notion fetch error:', err);
      socket.emit('error', { message: 'Failed to load questions from Notion' });
    }
  });

  socket.on('admin:start-game', async ({ duration } = {}) => {
    if (socket.id !== game.adminSocketId) return;
    const safeDuration = Math.min(Math.max(Number(duration) || 30, 5), 120);
    // Load questions if not yet loaded
    if (game.questions.length === 0) {
      try {
        const questions = await fetchQuestions();
        game.loadQuestions(questions);
      } catch (err) {
        console.error('Notion fetch error:', err);
        socket.emit('error', { message: 'Failed to load questions from Notion' });
        return;
      }
    }
    const result = game.startGame(safeDuration);
    if (!result.success) {
      socket.emit('error', { message: result.error });
      return;
    }
    io.emit('game:started', {});
    // Brief delay so players see "game starting" screen
    setTimeout(() => startNextQuestion(), 2000);
  });

  socket.on('admin:close-question', () => {
    if (socket.id !== game.adminSocketId) return;
    if (game.status !== 'question-active') return;
    if (game.timer) {
      clearTimeout(game.timer);
      game.timer = null;
    }
    game.closeQuestion();
    io.emit('game:question-closed', {});
    notifyAdmin('admin:question-closed', {
      ...game.getAnswerProgress(),
      isLast: game.isLastQuestion(),
    });
  });

  socket.on('admin:next-question', () => {
    if (socket.id !== game.adminSocketId) return;
    if (game.timer) {
      clearTimeout(game.timer);
      game.timer = null;
    }
    startNextQuestion();
  });

  socket.on('admin:show-leaderboard', () => {
    if (socket.id !== game.adminSocketId) return;
    io.emit('game:leaderboard', { leaderboard: game.getLeaderboard() });
  });

  socket.on('admin:reveal-answers', () => {
    if (socket.id !== game.adminSocketId) return;
    io.emit('game:answers-revealed', { questions: game.getAnswerReveal() });
  });

  socket.on('admin:reset-game', () => {
    if (socket.id !== game.adminSocketId) return;
    game.reset();
    io.emit('game:reset', {});
    socket.emit('admin:authenticated', {
      players: [],
      status: 'lobby',
      questionsCount: 0,
    });
  });

  // ── DISCONNECT ────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`[disconnect] ${socket.id}`);
    if (socket.id === game.adminSocketId) {
      game.adminSocketId = null;
      return;
    }
    if (game.players.has(socket.id)) {
      game.removePlayer(socket.id);
      const players = game.getPlayerList();
      io.emit('game:player-joined', { players });
      notifyAdmin('admin:player-update', { players, count: players.length });
    }
  });
});

// ── Catch-all → React app ───────────────────────────────────────────────────
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`UpConnects server running on http://localhost:${PORT}`);
});
