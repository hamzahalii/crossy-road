import * as THREE from 'three';
import { TerrainRow } from './TerrainRow.js';
import { createBox } from '../utils/meshFactory.js';
import { randomInt, pickRandom } from '../utils/mathHelpers.js';
import { COLORS } from '../constants.js';

/** Small flower colors */
const FLOWER_COLORS = [
  0xE91E63, // pink
  0xFFEB3B, // yellow
  0x9C27B0, // purple
  0xFF5722, // orange
  0x03A9F4, // light blue
  0xF44336, // red
];

/**
 * A guaranteed safe row — no obstacles, no moving objects.
 * Optionally has a few decorative flowers.
 */
export class SafeRow extends TerrainRow {
  constructor(rowIndex, scene) {
    super(rowIndex, scene);

    // Grass ground plane
    const ground = createBox(26, 0.1, 1, COLORS.grass);
    ground.position.y = 0;
    ground.receiveShadow = true;
    this.group.add(ground);

    // Decorative flowers (1-2, non-blocking)
    const flowerCount = randomInt(1, 2);
    for (let i = 0; i < flowerCount; i++) {
      const x = randomInt(-8, 8);
      const color = pickRandom(FLOWER_COLORS);

      // Tiny stem
      const stem = createBox(0.05, 0.15, 0.05, 0x4CAF50);
      stem.position.set(x + Math.random() * 0.3, 0.08, Math.random() * 0.3 - 0.15);
      this.group.add(stem);

      // Tiny flower head
      const flower = createBox(0.12, 0.12, 0.12, color);
      flower.position.set(
        stem.position.x,
        0.2,
        stem.position.z
      );
      this.group.add(flower);
    }
  }
}
