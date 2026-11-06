import * as THREE from 'three';

/**
 * Base class for all terrain row types.
 * Each row occupies one tile of depth along the z-axis.
 */
export class TerrainRow {
  /**
   * @param {number} rowIndex - The row's index (0 = start, positive = forward).
   * @param {THREE.Scene} scene - The scene to add the row group to.
   */
  constructor(rowIndex, scene) {
    this.rowIndex = rowIndex;
    this.scene = scene;

    this.group = new THREE.Group();
    this.group.position.z = -rowIndex; // negative z is forward
    scene.add(this.group);

    /** @type {number[]} Grid x positions that block movement */
    this.obstacles = [];

    /** @type {{ mesh: THREE.Mesh, speed: number, direction: number, width: number }[]} */
    this.movingObjects = [];

    /** Whether this row is water (player drowns without a log) */
    this.isWater = false;
  }

  /**
   * Update all moving objects (vehicles, logs, trains).
   * @param {number} dt - Delta time in seconds.
   * @param {number} speedMultiplier - Difficulty speed multiplier.
   */
  update(dt, speedMultiplier) {
    for (const obj of this.movingObjects) {
      obj.mesh.position.x += obj.speed * obj.direction * speedMultiplier * dt;

      // Wrap at edges (±12 tiles by default, subclasses may override)
      const wrapLimit = obj.wrapLimit || 14;
      if (obj.direction > 0 && obj.mesh.position.x > wrapLimit) {
        obj.mesh.position.x = -wrapLimit;
      } else if (obj.direction < 0 && obj.mesh.position.x < -wrapLimit) {
        obj.mesh.position.x = wrapLimit;
      }
    }
  }

  /**
   * Returns the moving object whose mesh overlaps the given x position.
   * @param {number} x - Grid x position to test.
   * @returns {{ mesh: THREE.Mesh, speed: number, direction: number, width: number } | null}
   */
  getMovingObjectAt(x) {
    for (const obj of this.movingObjects) {
      const halfW = obj.width / 2;
      if (x >= obj.mesh.position.x - halfW && x <= obj.mesh.position.x + halfW) {
        return obj;
      }
    }
    return null;
  }

  /**
   * Returns true if a log covers the given x position.
   * Override in RiverRow.
   * @param {number} x
   * @returns {boolean}
   */
  hasLogAt(x) {
    return false;
  }

  /**
   * Remove this row from the scene and clean up resources.
   */
  dispose() {
    this.scene.remove(this.group);

    this.group.traverse((child) => {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();
        // Materials are cached in meshFactory, don't dispose them
      }
    });

    this.movingObjects.length = 0;
    this.obstacles.length = 0;
  }
}
