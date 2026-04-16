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

// Module-level overall game timer (fires when total game time expires)
let overallTimer = null;
// Auto-advance timer (fires 2s after all players answer a question)
let autoAdvanceTimer = null;

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

function clearAllTimers() {
  if (overallTimer) { clearTimeout(overallTimer); overallTimer = null; }
  if (autoAdvanceTimer) { clearTimeout(autoAdvanceTimer); autoAdvanceTimer = null; }
  if (game.timer) { clearTimeout(game.timer); game.timer = null; }
}

function endGame() {
  clearAllTimers();
  game.status = 'ended';
  io.emit('game:ended', {});
  notifyAdmin('admin:game-ended', { leaderboard: game.getLeaderboard() });
}

function startNextQuestion() {
  // Cancel any pending auto-advance
  if (autoAdvanceTimer) { clearTimeout(autoAdvanceTimer); autoAdvanceTimer = null; }

  const hasNext = game.advanceQuestion();
  if (!hasNext) {
    endGame();
    return;
  }

  const payload = game.getCurrentQuestionPayload();
  io.emit('game:question', payload);

  // Tell admin which question we're on
  notifyAdmin('admin:question-tick', {
    questionIndex: payload.index,
    total: payload.total,
  });

  // Reset answer progress for this question
  notifyAdmin('admin:answer-progress', {
    answered: 0,
    total: game.players.size,
  });
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

    // All players answered → close question, update leaderboard, auto-advance in 2s
    if (result.answered >= result.total) {
      game.closeQuestion();
      io.emit('game:question-closed', {});

      notifyAdmin('admin:live-leaderboard', {
        leaderboard: game.getLeaderboard(),
      });

      autoAdvanceTimer = setTimeout(() => {
        autoAdvanceTimer = null;
        if (game.isLastQuestion()) {
          endGame();
        } else {
          startNextQuestion();
        }
      }, 2000);
    }
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
      io.emit('game:questions-count', { count: questions.length });
    } catch (err) {
      console.error('Notion fetch error:', err);
      socket.emit('error', { message: 'Failed to load questions from Notion' });
    }
  });

  socket.on('admin:start-game', async ({ totalGameDuration } = {}) => {
    if (socket.id !== game.adminSocketId) return;
    // totalGameDuration is in seconds; clamp between 30s and 2 hours
    const safeTotalSeconds = Math.min(Math.max(Number(totalGameDuration) || 300, 30), 7200);

    if (game.questions.length === 0) {
      try {
        const questions = await fetchQuestions();
        game.loadQuestions(questions);
        io.emit('game:questions-count', { count: questions.length });
      } catch (err) {
        console.error('Notion fetch error:', err);
        socket.emit('error', { message: 'Failed to load questions from Notion' });
        return;
      }
    }

    const result = game.startGame();
    if (!result.success) {
      socket.emit('error', { message: result.error });
      return;
    }

    io.emit('game:started', { questionCount: game.questions.length });

    notifyAdmin('admin:game-info', {
      totalDuration: safeTotalSeconds,
      questionsCount: game.questions.length,
      totalPlayers: game.players.size,
    });

    // Start overall game timer — when it fires, end the game regardless of progress
    overallTimer = setTimeout(() => {
      overallTimer = null;
      endGame();
    }, safeTotalSeconds * 1000);

    // Brief countdown before first question
    setTimeout(() => startNextQuestion(), 2000);
  });

  // Admin can manually advance to the next question (e.g., if a slow player hasn't answered)
  socket.on('admin:next-question', () => {
    if (socket.id !== game.adminSocketId) return;
    if (game.status !== 'question-active' && game.status !== 'question-closed') return;

    // Cancel any pending auto-advance
    if (autoAdvanceTimer) { clearTimeout(autoAdvanceTimer); autoAdvanceTimer = null; }

    // Close current question if still active
    if (game.status === 'question-active') {
      game.closeQuestion();
      io.emit('game:question-closed', {});
      notifyAdmin('admin:live-leaderboard', { leaderboard: game.getLeaderboard() });
    }

    if (game.isLastQuestion()) {
      endGame();
    } else {
      startNextQuestion();
    }
  });

  // Admin can force-end the game at any time
  socket.on('admin:end-game', () => {
    if (socket.id !== game.adminSocketId) return;
    if (game.status === 'question-active') {
      game.closeQuestion();
      io.emit('game:question-closed', {});
    }
    endGame();
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
    clearAllTimers();
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
