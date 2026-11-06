import * as THREE from 'three';
import { TerrainRow } from './TerrainRow.js';
import { createTree, createRock, createBox } from '../utils/meshFactory.js';
import { randomInt, pickRandom } from '../utils/mathHelpers.js';
import { COLORS } from '../constants.js';

/**
 * A grass row with randomly placed trees and rocks as obstacles.
 */
export class GrassRow extends TerrainRow {
  constructor(rowIndex, scene) {
    super(rowIndex, scene);

    // Ground plane
    const ground = createBox(26, 0.1, 1, COLORS.grass);
    ground.position.y = 0;
    ground.receiveShadow = true;
    this.group.add(ground);

    // Track used x positions to avoid overlaps
    const usedPositions = new Set();
    usedPositions.add(0); // Keep starting lane clear

    // Place 2-5 trees
    const treeCount = randomInt(2, 5);
    for (let i = 0; i < treeCount; i++) {
      const x = this._findFreePosition(usedPositions);
      if (x === null) break;

      const tree = createTree(COLORS.treeTrunk, COLORS.tree);
      tree.position.set(x, 0, 0);
      this.group.add(tree);

      usedPositions.add(x);
      this.obstacles.push(x);
    }

    // Place 0-2 rocks
    const rockCount = randomInt(0, 2);
    for (let i = 0; i < rockCount; i++) {
      const x = this._findFreePosition(usedPositions);
      if (x === null) break;

      const rock = createRock(COLORS.rock);
      rock.position.set(x, 0, 0);
      this.group.add(rock);

      usedPositions.add(x);
      this.obstacles.push(x);
    }
  }

  /**
   * Find a random free integer x position in [-8, 8].
   * @param {Set<number>} used - Already-occupied positions.
   * @returns {number|null}
   */
  _findFreePosition(used) {
    const candidates = [];
    for (let x = -8; x <= 8; x++) {
      if (!used.has(x)) candidates.push(x);
    }
    if (candidates.length === 0) return null;
    return pickRandom(candidates);
  }
}
