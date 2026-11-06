import * as THREE from 'three';
import { lerp } from '../utils/mathHelpers.js';
import { createBox } from '../utils/meshFactory.js';
import { HOP_DURATION, TILE_SIZE, COLORS } from '../constants.js';

/**
 * Player entity — the hopping chicken (or swapped character).
 * All movement is tile-based: gridX/gridZ are integer positions.
 * Forward direction is -Z.
 */
export class Player {
  constructor(scene) {
    this.scene = scene;

    // Grid position (integers)
    this.gridX = 0;
    this.gridZ = 0;
    this.maxZ = 0;           // furthest z the player has reached (most negative)

    // Hop state
    this.isHopping = false;
    this.isDead = false;
    this.hopTimer = 0;
    this.hopDuration = HOP_DURATION;
    this.startX = 0;
    this.startZ = 0;
    this.targetX = 0;
    this.targetZ = 0;

    // Death animation state
    this._deathType = null;
    this._deathTimer = 0;

    // Build default chicken mesh
    this.mesh = this._createChickenMesh();
    this.mesh.position.set(0, 0, 0);
    this.scene.add(this.mesh);
  }

  /* ── Chicken mesh ─────────────────────────────────────── */

  _createChickenMesh() {
    const group = new THREE.Group();

    // Body
    const body = createBox(0.5, 0.5, 0.5, COLORS.chickenBody);
    body.position.y = 0.35;
    group.add(body);

    // Head
    const head = createBox(0.32, 0.32, 0.32, COLORS.chickenHead);
    head.position.y = 0.76;
    group.add(head);

    // Beak
    const beak = createBox(0.1, 0.08, 0.15, COLORS.chickenBeak);
    beak.position.set(0, 0.72, -0.2);
    group.add(beak);

    // Comb
    const comb = createBox(0.08, 0.15, 0.2, COLORS.chickenComb);
    comb.position.y = 0.96;
    group.add(comb);

    // Left eye
    const leftEye = createBox(0.06, 0.06, 0.06, COLORS.chickenEye);
    leftEye.position.set(-0.1, 0.8, -0.15);
    group.add(leftEye);

    // Right eye
    const rightEye = createBox(0.06, 0.06, 0.06, COLORS.chickenEye);
    rightEye.position.set(0.1, 0.8, -0.15);
    group.add(rightEye);

    // Feet
    const footL = createBox(0.12, 0.05, 0.18, COLORS.chickenBeak);
    footL.position.set(-0.12, 0.025, 0.02);
    group.add(footL);

    const footR = createBox(0.12, 0.05, 0.18, COLORS.chickenBeak);
    footR.position.set(0.12, 0.025, 0.02);
    group.add(footR);

    return group;
  }

  /* ── Hop ──────────────────────────────────────────────── */

  /**
   * Initiate a hop in tile-grid deltas.
   * dx: lateral (-1 left, +1 right), dz: forward (-1) or backward (+1).
   */
  hop(dx, dz) {
    if (this.isHopping || this.isDead) return;

    this.isHopping = true;
    this.hopTimer = 0;

    this.startX = this.gridX * TILE_SIZE;
    this.startZ = this.gridZ * TILE_SIZE;
    this.gridX += dx;
    this.gridZ += dz;
    this.targetX = this.gridX * TILE_SIZE;
    this.targetZ = this.gridZ * TILE_SIZE;

    // Rotate chicken to face hop direction
    if (dz !== 0 || dx !== 0) {
      this.mesh.rotation.y = Math.atan2(dx, dz);
    }

    // Initial squash at takeoff
    this.mesh.scale.set(1.1, 0.8, 1.1);
  }

  /* ── Update ───────────────────────────────────────────── */

  /**
   * Advances hop animation.
   * @returns {boolean} true when a hop just completed this frame.
   */
  update(dt) {
    // Death animations
    if (this.isDead) {
      this._updateDeathAnimation(dt);
      return false;
    }

    if (!this.isHopping) return false;

    this.hopTimer += dt;
    const t = Math.min(this.hopTimer / this.hopDuration, 1);

    // Interpolate XZ position
    this.mesh.position.x = lerp(this.startX, this.targetX, t);
    this.mesh.position.z = lerp(this.startZ, this.targetZ, t);

    // Parabolic arc for Y (peaks at +0.5 at t=0.5)
    const arc = 4 * 0.5 * t * (1 - t);  // 0 → 0.5 → 0
    this.mesh.position.y = arc;

    // Squash & stretch
    if (t < 0.3) {
      // Takeoff: compressed
      const s = lerp(0.8, 1.2, t / 0.3);
      this.mesh.scale.set(lerp(1.1, 0.9, t / 0.3), s, lerp(1.1, 0.9, t / 0.3));
    } else if (t < 0.7) {
      // Airborne: stretched tall
      const s = lerp(1.2, 1.15, (t - 0.3) / 0.4);
      this.mesh.scale.set(0.9, s, 0.9);
    } else {
      // Landing: compress again
      const s = lerp(1.15, 0.85, (t - 0.7) / 0.3);
      this.mesh.scale.set(lerp(0.9, 1.1, (t - 0.7) / 0.3), s, lerp(0.9, 1.1, (t - 0.7) / 0.3));
    }

    // Hop complete
    if (t >= 1) {
      this.mesh.position.x = this.targetX;
      this.mesh.position.z = this.targetZ;
      this.mesh.position.y = 0;
      this.mesh.scale.set(1, 1, 1);
      this.isHopping = false;

      // Track max forward progress (negative z = forward)
      if (this.gridZ < this.maxZ) {
        this.maxZ = this.gridZ;
      }

      return true; // hop just finished
    }

    return false;
  }

  /* ── Death ────────────────────────────────────────────── */

  die(type) {
    if (this.isDead) return;
    this.isDead = true;
    this.isHopping = false;
    this._deathType = type;
    this._deathTimer = 0;
  }

  _updateDeathAnimation(dt) {
    this._deathTimer += dt;
    const t = this._deathTimer;

    switch (this._deathType) {
      case 'squish': {
        // Flatten Y quickly over 0.15s
        const s = Math.max(0.1, 1 - t / 0.15);
        this.mesh.scale.set(1 + (1 - s) * 0.5, s, 1 + (1 - s) * 0.5);
        break;
      }
      case 'water': {
        // Sink over 0.5s
        const sink = Math.min(t / 0.5, 1);
        this.mesh.position.y = lerp(0, -1, sink);
        break;
      }
      case 'train': {
        // Flatten and stretch sideways over 0.2s
        const p = Math.min(t / 0.2, 1);
        this.mesh.scale.set(1 + p * 2, Math.max(0.05, 1 - p * 0.95), 1);
        break;
      }
      case 'eagle':
        // Handled by Eagle entity — do nothing here
        break;
      default:
        break;
    }
  }

  /* ── Reset ────────────────────────────────────────────── */

  reset() {
    this.gridX = 0;
    this.gridZ = 0;
    this.maxZ = 0;
    this.isHopping = false;
    this.isDead = false;
    this._deathType = null;
    this._deathTimer = 0;
    this.mesh.position.set(0, 0, 0);
    this.mesh.rotation.set(0, 0, 0);
    this.mesh.scale.set(1, 1, 1);
  }

  /* ── Character swap ───────────────────────────────────── */

  setMesh(newMesh) {
    // Remove old mesh
    this.scene.remove(this.mesh);

    // Replace
    this.mesh = newMesh;
    this.mesh.position.set(
      this.gridX * TILE_SIZE,
      0,
      this.gridZ * TILE_SIZE
    );
    this.mesh.scale.set(1, 1, 1);
    this.scene.add(this.mesh);
  }

  /* ── Helpers ──────────────────────────────────────────── */

  getWorldPosition() {
    return new THREE.Vector3(
      this.mesh.position.x,
      this.mesh.position.y,
      this.mesh.position.z
    );
  }
}
