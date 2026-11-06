import * as THREE from 'three';
import { createBox } from '../utils/meshFactory.js';
import { COLORS } from '../constants.js';

/**
 * Collectible coin — golden spinning cube that bobs up and down.
 */
export class Coin {
  constructor(scene, x, z) {
    this.scene = scene;
    this.collected = false;

    // Collect animation state
    this._collectTimer = 0;
    this._collecting = false;

    // Golden cube with emissive glow
    const geo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    const mat = new THREE.MeshLambertMaterial({
      color: COLORS.coin,
      emissive: COLORS.coin,
      emissiveIntensity: 0.3,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.castShadow = true;
    this.mesh.position.set(x, 0.5, z);
    this.scene.add(this.mesh);

    // Store base Y for bobbing
    this._baseY = 0.5;
    this._time = Math.random() * Math.PI * 2; // random phase offset
  }

  /* ── Update ────────────────────────────────────────────── */

  update(dt) {
    if (this.collected && !this._collecting) return;

    this._time += dt;

    if (this._collecting) {
      // Shrink to zero then remove
      this._collectTimer += dt;
      const t = Math.min(this._collectTimer / 0.25, 1);
      const s = 1 - t;
      this.mesh.scale.set(s, s, s);
      this.mesh.position.y = this._baseY + t * 0.5; // float up slightly

      if (t >= 1) {
        this._collecting = false;
        this.scene.remove(this.mesh);
      }
      return;
    }

    // Spin on Y axis
    this.mesh.rotation.y += 2 * dt;

    // Bob up/down
    this.mesh.position.y = this._baseY + Math.sin(this._time * 3) * 0.08;
  }

  /* ── Collect ───────────────────────────────────────────── */

  collect() {
    if (this.collected) return;
    this.collected = true;
    this._collecting = true;
    this._collectTimer = 0;
  }

  /* ── Cleanup ───────────────────────────────────────────── */

  dispose() {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
