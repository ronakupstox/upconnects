class GameManager {
  constructor() {
    this.adminSocketId = null;
    this._reset();
  }

  _reset() {
    if (this.timer) clearTimeout(this.timer);
    this.status = 'lobby'; // lobby | question-active | question-closed | ended
    this.questions = [];
    this.currentQuestionIndex = -1;
    this.players = new Map(); // socketId -> { name, score, answers: { [qIndex]: answer } }
    this.answeredPlayers = new Set();
    this.timer = null;
    this.duration = 30; // game-level duration in seconds, set by admin before start
  }

  reset() {
    const adminId = this.adminSocketId;
    this._reset();
    this.adminSocketId = adminId;
  }

  setAdmin(socketId) {
    this.adminSocketId = socketId;
  }

  loadQuestions(questions) {
    this.questions = questions;
  }

  addPlayer(socketId, name) {
    if (this.status !== 'lobby') {
      return { success: false, error: 'Game already in progress' };
    }
    const trimmedName = name.trim();
    if (!trimmedName) {
      return { success: false, error: 'Name cannot be empty' };
    }
    for (const [, player] of this.players) {
      if (player.name.toLowerCase() === trimmedName.toLowerCase()) {
        return { success: false, error: 'Name already taken, please choose another' };
      }
    }
    this.players.set(socketId, { name: trimmedName, score: 0, answers: {} });
    return { success: true };
  }

  removePlayer(socketId) {
    this.players.delete(socketId);
  }

  getPlayerList() {
    return Array.from(this.players.values()).map((p) => ({ name: p.name }));
  }

  startGame(duration) {
    if (this.questions.length === 0) {
      return { success: false, error: 'No questions loaded from Notion' };
    }
    if (this.players.size === 0) {
      return { success: false, error: 'No players have joined yet' };
    }
    this.duration = duration;
    this.status = 'starting';
    this.currentQuestionIndex = -1;
    for (const [, player] of this.players) {
      player.score = 0;
      player.answers = {};
    }
    return { success: true };
  }

  advanceQuestion() {
    this.currentQuestionIndex++;
    this.answeredPlayers = new Set();
    if (this.currentQuestionIndex >= this.questions.length) {
      this.status = 'ended';
      return false;
    }
    this.status = 'question-active';
    return true;
  }

  getCurrentQuestionPayload() {
    const q = this.questions[this.currentQuestionIndex];
    if (!q) return null;
    return {
      index: this.currentQuestionIndex,
      total: this.questions.length,
      question: q.question,
      options: q.options,
      duration: this.duration,
    };
  }

  closeQuestion() {
    this.status = 'question-closed';
  }

  submitAnswer(socketId, answer) {
    if (this.status !== 'question-active') {
      return { success: false };
    }
    const player = this.players.get(socketId);
    if (!player) return { success: false };

    const qi = this.currentQuestionIndex;
    if (player.answers[qi] !== undefined) {
      return { success: false }; // already answered
    }

    player.answers[qi] = answer;
    this.answeredPlayers.add(socketId);

    if (this.questions[qi]?.correctAnswer === answer) {
      player.score += 10;
    }

    return {
      success: true,
      answered: this.answeredPlayers.size,
      total: this.players.size,
    };
  }

  getAnswerProgress() {
    return { answered: this.answeredPlayers.size, total: this.players.size };
  }

  isLastQuestion() {
    return this.currentQuestionIndex >= this.questions.length - 1;
  }

  getLeaderboard() {
    return Array.from(this.players.values())
      .map((p) => ({ name: p.name, score: p.score }))
      .sort((a, b) => b.score - a.score)
      .map((p, i) => ({ ...p, rank: i + 1 }));
  }

  getAnswerReveal() {
    return this.questions.map((q, i) => ({
      index: i,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      correctOptionText: q.options[q.correctAnswer],
    }));
  }
}

module.exports = GameManager;
