import * as THREE from 'three';
import { TerrainRow } from './TerrainRow.js';
import { createBox } from '../utils/meshFactory.js';
import { pickRandom, randomRange } from '../utils/mathHelpers.js';
import { COLORS, LOG_SPEEDS, LOG_LENGTHS, LOGS_PER_ROW } from '../constants.js';

/**
 * A river row with moving logs. Player must ride logs to survive.
 */
export class RiverRow extends TerrainRow {
  constructor(rowIndex, scene) {
    super(rowIndex, scene);
    this.isWater = true;

    // Water surface
    const water = createBox(26, 0.1, 1, COLORS.water);
    water.position.y = -0.05; // Slightly below ground level
    water.receiveShadow = true;
    this.group.add(water);

    // Logs
    const direction = Math.random() < 0.5 ? 1 : -1;
    const speed = pickRandom(LOG_SPEEDS);
    const logCount = pickRandom(LOGS_PER_ROW);
    const spacing = 26 / logCount;

    for (let i = 0; i < logCount; i++) {
      const logLength = pickRandom(LOG_LENGTHS);
      const logMesh = createBox(logLength, 0.3, 0.8, COLORS.log);

      const baseX = -12 + i * spacing + randomRange(-1.5, 1.5);
      logMesh.position.set(baseX, 0.1, 0);
      this.group.add(logMesh);

      this.movingObjects.push({
        mesh: logMesh,
        speed,
        direction,
        width: logLength,
        wrapLimit: 14,
      });
    }
  }

  /**
   * Returns true if any log covers the given x position.
   * @param {number} x - Grid x position to check.
   * @returns {boolean}
   */
  hasLogAt(x) {
    for (const obj of this.movingObjects) {
      const halfW = obj.width / 2;
      if (x >= obj.mesh.position.x - halfW && x <= obj.mesh.position.x + halfW) {
        return true;
      }
    }
    return false;
  }

  /**
   * Returns the speed * direction of the log covering position x, for carrying the player.
   * @param {number} x - Grid x position to check.
   * @returns {number} Speed times direction, or 0 if no log at x.
   */
  getLogSpeed(x) {
    for (const obj of this.movingObjects) {
      const halfW = obj.width / 2;
      if (x >= obj.mesh.position.x - halfW && x <= obj.mesh.position.x + halfW) {
        return obj.speed * obj.direction;
      }
    }
    return 0;
  }

  /**
   * Update log positions; wraps at ±14.
   */
  update(dt, speedMultiplier) {
    for (const obj of this.movingObjects) {
      obj.mesh.position.x += obj.speed * obj.direction * speedMultiplier * dt;

      if (obj.direction > 0 && obj.mesh.position.x > 14) {
        obj.mesh.position.x = -14;
      } else if (obj.direction < 0 && obj.mesh.position.x < -14) {
        obj.mesh.position.x = 14;
      }
    }
  }
}
