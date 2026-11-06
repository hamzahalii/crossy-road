/**
 * ParticleSystem — lightweight voxel-style particle effects.
 * All particles are tiny box meshes that burst, fade, and self-clean.
 */
import * as THREE from 'three';

const PARTICLE_SIZE = 0.08;
const GRAVITY = -15; // units/s²

// Shared geometries (one allocation for all particles)
const _boxGeo = new THREE.BoxGeometry(PARTICLE_SIZE, PARTICLE_SIZE, PARTICLE_SIZE);

/**
 * @typedef {Object} Particle
 * @property {THREE.Mesh} mesh
 * @property {THREE.Vector3} velocity
 * @property {number} lifetime
 * @property {number} maxLifetime
 * @property {boolean} useGravity
 */

export class ParticleSystem {
  /**
   * @param {THREE.Scene} scene
   */
  constructor(scene) {
    this.scene = scene;
    /** @type {Particle[]} */
    this.particles = [];
  }

  // ── spawn helpers ──────────────────────────────────────────────

  /**
   * Small brown dust puff when the player hops.
   */
  spawnHopDust(x, y, z) {
    const count = 5 + Math.floor(Math.random() * 4); // 5-8
    for (let i = 0; i < count; i++) {
      this._spawn(x, y, z, {
        color: 0x8B6914,
        lifetime: 0.4,
        speed: 1.5,
        upBias: 1.5,
        useGravity: false,
      });
    }
  }

  /**
   * Blue water splash.
   */
  spawnSplash(x, y, z) {
    const count = 8 + Math.floor(Math.random() * 5); // 8-12
    for (let i = 0; i < count; i++) {
      this._spawn(x, y, z, {
        color: 0x4488FF,
        lifetime: 0.6,
        speed: 3,
        upBias: 4,
        useGravity: true,
      });
    }
  }

  /**
   * Red splat when hit by a vehicle.
   */
  spawnSplat(x, y, z) {
    const count = 6 + Math.floor(Math.random() * 5); // 6-10
    for (let i = 0; i < count; i++) {
      this._spawn(x, y, z, {
        color: 0xDD2222,
        lifetime: 0.5,
        speed: 4,
        upBias: 1,
        useGravity: true,
      });
    }
  }

  /**
   * Golden sparkle when collecting a coin.
   */
  spawnCoinSparkle(x, y, z) {
    const count = 6;
    for (let i = 0; i < count; i++) {
      this._spawn(x, y, z, {
        color: 0xFFD700,
        lifetime: 0.5,
        speed: 2,
        upBias: 2,
        useGravity: false,
      });
    }
  }

  // ── update loop ────────────────────────────────────────────────

  /**
   * Advance all particles.
   * @param {number} dt — delta time in seconds
   */
  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.lifetime -= dt;

      if (p.lifetime <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.material.dispose();
        this.particles.splice(i, 1);
        continue;
      }

      // Apply gravity
      if (p.useGravity) {
        p.velocity.y += GRAVITY * dt;
      }

      // Move
      p.mesh.position.addScaledVector(p.velocity, dt);

      // Fade out via opacity
      const t = p.lifetime / p.maxLifetime; // 1→0
      p.mesh.material.opacity = t;
    }
  }

  /**
   * Remove all active particles immediately.
   */
  clear() {
    for (const p of this.particles) {
      this.scene.remove(p.mesh);
      p.mesh.material.dispose();
    }
    this.particles.length = 0;
  }

  // ── private ────────────────────────────────────────────────────

  /**
   * Create a single particle.
   */
  _spawn(x, y, z, { color, lifetime, speed, upBias, useGravity }) {
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 1,
    });

    const mesh = new THREE.Mesh(_boxGeo, mat);
    mesh.position.set(x, y, z);
    this.scene.add(mesh);

    // Random outward direction with an upward bias
    const angle = Math.random() * Math.PI * 2;
    const velocity = new THREE.Vector3(
      Math.cos(angle) * speed * (0.5 + Math.random() * 0.5),
      upBias * (0.5 + Math.random() * 0.5),
      Math.sin(angle) * speed * (0.5 + Math.random() * 0.5)
    );

    this.particles.push({
      mesh,
      velocity,
      lifetime,
      maxLifetime: lifetime,
      useGravity,
    });
  }
}
