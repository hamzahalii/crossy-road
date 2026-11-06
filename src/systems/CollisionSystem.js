/**
 * CollisionSystem — grid-based hit detection for Crossy Road clone.
 *
 * Collision types returned:
 *   'blocked'  — obstacle prevents movement (trees, rocks)
 *   'vehicle'  — hit by a car / truck
 *   'water'    — fell in water (no log underneath)
 *   'train'    — hit by a train
 *   null       — safe
 */
export class CollisionSystem {
  constructor() {
    // Stateless — all data comes from player & worldGenerator
  }

  _getRowIndex(gridZ) {
    return Math.abs(gridZ);
  }

  /**
   * Full collision check at the player's current grid position.
   * Called when a hop lands.
   * @param {{ gridX: number, gridZ: number }} player
   * @param {object} worldGenerator — must expose getRow(rowIndex)
   * @returns {'blocked'|'vehicle'|'water'|'train'|null}
   */
  checkCollision(player, worldGenerator) {
    const rowIndex = this._getRowIndex(player.gridZ);
    const row = worldGenerator.getRow(rowIndex);
    if (!row) return null;

    // 1. Obstacle check (trees, rocks, etc.)
    if (row.obstacles && row.obstacles.includes(player.gridX)) {
      return 'blocked';
    }

    // 2. Train check
    if (typeof row.isTrainAt === 'function' && row.isTrainAt(player.gridX)) {
      return 'train';
    }

    // 3. Vehicle check (on road rows)
    if (!row.isWater && typeof row.getMovingObjectAt === 'function') {
      const hitObj = row.getMovingObjectAt(player.gridX);
      if (hitObj && !row.isTrainAt) {
        return 'vehicle';
      }
    }

    // 4. Water check
    if (row.isWater) {
      if (typeof row.hasLogAt === 'function' && !row.hasLogAt(player.gridX)) {
        return 'water';
      }
    }

    return null;
  }

  /**
   * Continuous per-frame check for things that can hit a stationary player
   * (vehicles and trains only — obstacles & water are hop-time checks).
   * @param {{ gridX: number, gridZ: number }} player
   * @param {object} worldGenerator
   * @returns {'vehicle'|'train'|null}
   */
  checkContinuous(player, worldGenerator) {
    const rowIndex = this._getRowIndex(player.gridZ);
    const row = worldGenerator.getRow(rowIndex);
    if (!row) return null;

    // Train check
    if (typeof row.isTrainAt === 'function' && row.isTrainAt(player.gridX)) {
      return 'train';
    }

    // Vehicle check
    if (!row.isWater && typeof row.getMovingObjectAt === 'function') {
      const hitObj = row.getMovingObjectAt(player.gridX);
      if (hitObj && !row.isTrainAt) {
        return 'vehicle';
      }
    }

    return null;
  }

  /**
   * Quick check whether a grid cell is blocked by an obstacle.
   * Used to prevent the player from hopping into an obstacle.
   * @param {number} gridX
   * @param {number} gridZ
   * @param {object} worldGenerator
   * @returns {boolean}
   */
  isBlocked(gridX, gridZ, worldGenerator) {
    const rowIndex = this._getRowIndex(gridZ);
    const row = worldGenerator.getRow(rowIndex);
    if (!row) return false;
    if (row.obstacles && row.obstacles.includes(gridX)) {
      return true;
    }
    return false;
  }
}
