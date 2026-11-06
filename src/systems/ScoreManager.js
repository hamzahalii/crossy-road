/**
 * ScoreManager — tracks current score and persisted high score.
 * Score = the farthest row the player has reached (max forward Z).
 */
const LS_KEY = 'crossy_highscore';

export class ScoreManager {
  constructor() {
    this.score = 0;
    this.highScore = this._loadHighScore();
  }

  /**
   * Update score based on the player's maximum forward row.
   * In our convention negative Z = forward, so we use the absolute value.
   * @param {number} playerMaxZ — highest row index reached (positive integer)
   * @returns {boolean} true if the score changed
   */
  updateScore(playerMaxZ) {
    if (playerMaxZ > this.score) {
      this.score = playerMaxZ;
      return true;
    }
    return false;
  }

  /**
   * @returns {boolean} true if current score exceeds the stored high score
   */
  isNewHighScore() {
    return this.score > this.highScore;
  }

  /**
   * Persist the high score to localStorage if current score beats it.
   */
  saveHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      try {
        localStorage.setItem(LS_KEY, String(this.highScore));
      } catch (_) {
        // localStorage may be unavailable (private browsing, etc.)
      }
    }
  }

  /**
   * Reset score for a new run (keeps highScore).
   */
  reset() {
    this.score = 0;
  }

  getScore() {
    return this.score;
  }

  getHighScore() {
    return this.highScore;
  }

  // ── private ────────────────────────────────────────────────────

  _loadHighScore() {
    try {
      const stored = localStorage.getItem(LS_KEY);
      const parsed = parseInt(stored, 10);
      return Number.isFinite(parsed) ? parsed : 0;
    } catch (_) {
      return 0;
    }
  }
}
