import { GrassRow } from './GrassRow.js';
import { RoadRow } from './RoadRow.js';
import { RiverRow } from './RiverRow.js';
import { RailRow } from './RailRow.js';
import { SafeRow } from './SafeRow.js';
import { randomInt, randomRange } from '../utils/mathHelpers.js';
import {
  MAX_CONSECUTIVE_ROAD,
  MAX_CONSECUTIVE_RIVER,
  SAFE_ROW_INTERVAL,
} from '../constants.js';

/**
 * Procedural world manager — creates and disposes terrain rows
 * as the player moves forward.
 */
export class WorldGenerator {
  /**
   * @param {THREE.Scene} scene
   */
  constructor(scene) {
    this.scene = scene;

    /** @type {Map<number, import('./TerrainRow.js').TerrainRow>} */
    this.rows = new Map();

    /** Highest row index generated so far */
    this.lastGeneratedRow = -1;

    // Tracking state for row-type selection rules
    this._consecutiveRoad = 0;
    this._consecutiveRiver = 0;
    this._rowsSinceLastSafe = 0;
    this._nextForcedSafe = randomInt(SAFE_ROW_INTERVAL[0], SAFE_ROW_INTERVAL[1]);

    // History of generated row types by index (for look-back)
    this._rowTypeHistory = new Map();
  }

  /**
   * Ensure rows exist from (playerRowIndex - 6) to (playerRowIndex + 22).
   * Dispose rows more than 8 behind the player.
   * @param {number} playerRowIndex - Current player row index.
   */
  generate(playerRowIndex) {
    const behind = playerRowIndex - 6;
    const ahead = playerRowIndex + 22;

    // Generate new rows ahead
    for (let i = Math.max(0, this.lastGeneratedRow + 1); i <= ahead; i++) {
      if (!this.rows.has(i)) {
        const row = this._createRow(i);
        this.rows.set(i, row);
      }
    }
    if (ahead > this.lastGeneratedRow) {
      this.lastGeneratedRow = ahead;
    }

    // Dispose rows too far behind
    const disposeThreshold = playerRowIndex - 8;
    for (const [index, row] of this.rows) {
      if (index < disposeThreshold) {
        row.dispose();
        this.rows.delete(index);
        this._rowTypeHistory.delete(index);
      }
    }
  }

  /**
   * Get the TerrainRow at a given index.
   * @param {number} index
   * @returns {import('./TerrainRow.js').TerrainRow | undefined}
   */
  getRow(index) {
    return this.rows.get(index);
  }

  /**
   * Update all active rows.
   * @param {number} dt - Delta time in seconds.
   * @param {number} speedMultiplier - Difficulty speed multiplier.
   */
  update(dt, speedMultiplier) {
    for (const row of this.rows.values()) {
      row.update(dt, speedMultiplier);
    }
  }

  /**
   * Clear all rows for a new game.
   */
  reset() {
    for (const row of this.rows.values()) {
      row.dispose();
    }
    this.rows.clear();
    this._rowTypeHistory.clear();
    this.lastGeneratedRow = -1;
    this._consecutiveRoad = 0;
    this._consecutiveRiver = 0;
    this._rowsSinceLastSafe = 0;
    this._nextForcedSafe = randomInt(SAFE_ROW_INTERVAL[0], SAFE_ROW_INTERVAL[1]);
  }

  /**
   * Create a row of the appropriate type for the given index.
   * @param {number} index
   * @returns {import('./TerrainRow.js').TerrainRow}
   */
  _createRow(index) {
    const type = this._selectRowType(index);
    this._rowTypeHistory.set(index, type);

    // Update consecutive counters
    if (type === 'road') {
      this._consecutiveRoad++;
      this._consecutiveRiver = 0;
    } else if (type === 'river') {
      this._consecutiveRiver++;
      this._consecutiveRoad = 0;
    } else {
      this._consecutiveRoad = 0;
      this._consecutiveRiver = 0;
    }

    // Update safe row tracking
    if (type === 'safe') {
      this._rowsSinceLastSafe = 0;
      this._nextForcedSafe = randomInt(SAFE_ROW_INTERVAL[0], SAFE_ROW_INTERVAL[1]);
    } else {
      this._rowsSinceLastSafe++;
    }

    switch (type) {
      case 'grass': return new GrassRow(index, this.scene);
      case 'road':  return new RoadRow(index, this.scene);
      case 'river': return new RiverRow(index, this.scene);
      case 'rail':  return new RailRow(index, this.scene);
      case 'safe':  return new SafeRow(index, this.scene);
      default:      return new GrassRow(index, this.scene);
    }
  }

  /**
   * Decide which row type to generate for the given index.
   * @param {number} index
   * @returns {'grass'|'road'|'river'|'rail'|'safe'}
   */
  _selectRowType(index) {
    // Row 0 is always safe (starting position)
    if (index === 0) return 'safe';

    // Force a safe row if we've gone too long without one
    if (this._rowsSinceLastSafe >= this._nextForcedSafe) {
      return 'safe';
    }

    // Build weighted pool, respecting constraints
    const pool = [];

    // Grass — 30% weight (6 entries out of 20)
    for (let i = 0; i < 6; i++) pool.push('grass');

    // Road — 40% weight (8 entries), unless at max consecutive
    if (this._consecutiveRoad < MAX_CONSECUTIVE_ROAD) {
      for (let i = 0; i < 8; i++) pool.push('road');
    }

    // River — 20% weight (4 entries), but only after row 10
    if (index > 10 && this._consecutiveRiver < MAX_CONSECUTIVE_RIVER) {
      for (let i = 0; i < 4; i++) pool.push('river');
    }

    // Rail — 5% weight (1 entry)
    pool.push('rail');

    // Safe — 5% weight (1 entry)
    pool.push('safe');

    // Pick randomly from pool
    return pool[Math.floor(Math.random() * pool.length)];
  }
}
