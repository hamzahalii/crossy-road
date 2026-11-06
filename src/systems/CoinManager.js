/**
 * CoinManager — coin economy with localStorage persistence.
 * Tracks total coins across all runs and coins collected in the current run.
 */
const LS_COINS_KEY = 'crossy_coins';
const LS_UNLOCKED_KEY = 'crossy_unlocked';

export class CoinManager {
  constructor() {
    this.totalCoins = this._loadNumber(LS_COINS_KEY);
    this.runCoins = 0;
    this.unlockedCharacters = this._loadArray(LS_UNLOCKED_KEY);
  }

  /**
   * Collect one coin during the current run.
   */
  addCoin() {
    this.runCoins++;
    this.totalCoins++;
    this.save();
  }

  /**
   * End the current run — reset run coins.
   */
  endRun() {
    this.runCoins = 0;
  }

  /**
   * Spend coins (e.g. to unlock a character).
   * @param {number} amount
   * @returns {boolean} true if purchase succeeded
   */
  spend(amount) {
    if (!this.canAfford(amount)) return false;
    this.totalCoins -= amount;
    this.save();
    return true;
  }

  /**
   * @param {number} amount
   * @returns {boolean}
   */
  canAfford(amount) {
    return this.totalCoins >= amount;
  }

  get coins() {
    return this.totalCoins;
  }

  set coins(val) {
    this.totalCoins = val;
  }

  getTotalCoins() {
    return this.totalCoins;
  }

  getRunCoins() {
    return this.runCoins;
  }

  /**
   * Persist coins and unlocked characters to localStorage.
   */
  save() {
    try {
      localStorage.setItem(LS_COINS_KEY, String(this.totalCoins));
      localStorage.setItem(LS_UNLOCKED_KEY, JSON.stringify(this.unlockedCharacters));
    } catch (_) {
      // localStorage may be unavailable
    }
  }

  // ── private helpers ────────────────────────────────────────────

  _loadNumber(key) {
    try {
      const v = localStorage.getItem(key);
      const n = parseInt(v, 10);
      return Number.isFinite(n) ? n : 0;
    } catch (_) {
      return 0;
    }
  }

  _loadArray(key) {
    try {
      const v = localStorage.getItem(key);
      if (!v) return [];
      const arr = JSON.parse(v);
      return Array.isArray(arr) ? arr : [];
    } catch (_) {
      return [];
    }
  }
}
