import * as THREE from 'three';
import { createBox, createCone } from '../utils/meshFactory.js';
import { lerp } from '../utils/mathHelpers.js';

/**
 * Eagle — anti-idle punishment.
 * Descends from above when the player stays still too long, grabs them, and flies away.
 */
export class Eagle {
  constructor(scene) {
    this.scene = scene;

    this.active = false;
    this.phase = 'idle';       // 'idle' | 'descending' | 'grabbing' | 'ascending'
    this.timer = 0;

    this.targetPos = new THREE.Vector3();
    this.startY = 15;

    // Wing flap state
    this._wingAngle = 0;
    this._wingSpeed = 12; // rad/s

    // Build mesh
    this.mesh = this._createEagleMesh();
    this.mesh.visible = false;
    this.scene.add(this.mesh);

    // Shadow on ground
    this.shadow = this._createShadow();
    this.shadow.visible = false;
    this.scene.add(this.shadow);
  }

  /* ── Eagle mesh ────────────────────────────────────────── */

  _createEagleMesh() {
    const group = new THREE.Group();

    // Body
    const body = createBox(0.8, 0.4, 0.6, 0x5D4037);
    body.position.y = 0;
    group.add(body);

    // Left wing
    this._leftWing = createBox(1.2, 0.1, 0.4, 0x3E2723);
    this._leftWing.position.set(-0.85, 0.05, 0);
    // Set pivot to inner edge
    this._leftWing.geometry = new THREE.BoxGeometry(1.2, 0.1, 0.4);
    this._leftWing.geometry.translate(-0.6, 0, 0);
    this._leftWing.position.set(-0.4, 0.05, 0);
    group.add(this._leftWing);

    // Right wing
    this._rightWing = createBox(1.2, 0.1, 0.4, 0x3E2723);
    this._rightWing.geometry = new THREE.BoxGeometry(1.2, 0.1, 0.4);
    this._rightWing.geometry.translate(0.6, 0, 0);
    this._rightWing.position.set(0.4, 0.05, 0);
    group.add(this._rightWing);

    // Beak (cone pointing forward, -Z)
    const beak = createCone(0.08, 0.25, 0xFFD600, 6);
    beak.rotation.x = -Math.PI / 2;
    beak.position.set(0, 0.05, -0.42);
    group.add(beak);

    // Eyes
    const eyeL = createBox(0.08, 0.08, 0.08, 0xFFFFFF);
    eyeL.position.set(-0.15, 0.12, -0.25);
    group.add(eyeL);

    const eyeR = createBox(0.08, 0.08, 0.08, 0xFFFFFF);
    eyeR.position.set(0.15, 0.12, -0.25);
    group.add(eyeR);

    // Pupils
    const pupilL = createBox(0.04, 0.04, 0.04, 0x212121);
    pupilL.position.set(-0.15, 0.12, -0.3);
    group.add(pupilL);

    const pupilR = createBox(0.04, 0.04, 0.04, 0x212121);
    pupilR.position.set(0.15, 0.12, -0.3);
    group.add(pupilR);

    return group;
  }

  _createShadow() {
    const geo = new THREE.CircleGeometry(0.3, 16);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
    });
    const shadow = new THREE.Mesh(geo, mat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02; // just above ground
    return shadow;
  }

  /* ── Activation ────────────────────────────────────────── */

  activate(targetPosition) {
    this.active = true;
    this.phase = 'descending';
    this.timer = 0;

    this.targetPos.copy(targetPosition);

    // Start high above target
    this.mesh.position.set(targetPosition.x, this.startY, targetPosition.z);
    this.mesh.visible = true;
    this.mesh.scale.set(1, 1, 1);

    // Shadow at ground level under target
    this.shadow.position.set(targetPosition.x, 0.02, targetPosition.z);
    this.shadow.scale.set(0.3, 0.3, 0.3);
    this.shadow.visible = true;
  }

  /* ── Update ────────────────────────────────────────────── */

  /**
   * @returns {'grabbed'|'ascending'|null}
   */
  update(dt) {
    if (!this.active) return null;

    this.timer += dt;

    // Wing flap
    this._wingAngle = Math.sin(this.timer * this._wingSpeed) * (20 * Math.PI / 180);
    this._leftWing.rotation.z = this._wingAngle;
    this._rightWing.rotation.z = -this._wingAngle;

    switch (this.phase) {
      case 'descending': {
        // Descend over ~1.5 seconds
        const descentDuration = 1.5;
        const t = Math.min(this.timer / descentDuration, 1);

        // Ease in (accelerate downward)
        const eased = t * t;
        const y = lerp(this.startY, 1, eased);
        this.mesh.position.y = y;

        // Follow target horizontally (in case player is on a log etc.)
        this.mesh.position.x = this.targetPos.x;
        this.mesh.position.z = this.targetPos.z;

        // Shadow grows as eagle gets closer
        const shadowScale = lerp(0.3, 1.5, eased);
        this.shadow.scale.set(shadowScale, shadowScale, shadowScale);
        this.shadow.material.opacity = lerp(0.1, 0.5, eased);
        this.shadow.position.set(this.targetPos.x, 0.02, this.targetPos.z);

        if (t >= 1) {
          this.phase = 'grabbing';
          this.timer = 0;
        }
        return null;
      }

      case 'grabbing': {
        // Hover at grab position for 0.3s
        this.mesh.position.y = 1;
        if (this.timer >= 0.3) {
          this.phase = 'ascending';
          this.timer = 0;
          return 'grabbed';
        }
        return null;
      }

      case 'ascending': {
        // Fly upward and offscreen over 1.5s
        const ascentDuration = 1.5;
        const t = Math.min(this.timer / ascentDuration, 1);
        const y = lerp(1, this.startY + 5, t * t);
        this.mesh.position.y = y;

        // Shrink shadow
        const shadowScale = lerp(1.5, 0, t);
        this.shadow.scale.set(shadowScale, shadowScale, shadowScale);
        this.shadow.material.opacity = lerp(0.5, 0, t);

        if (t >= 1) {
          this.active = false;
          this.mesh.visible = false;
          this.shadow.visible = false;
          this.phase = 'idle';
        }
        return 'ascending';
      }

      default:
        return null;
    }
  }

  /* ── Reset / Cleanup ───────────────────────────────────── */

  reset() {
    this.active = false;
    this.phase = 'idle';
    this.timer = 0;
    this.mesh.visible = false;
    this.shadow.visible = false;
  }

  dispose() {
    this.scene.remove(this.mesh);
    this.scene.remove(this.shadow);
    // Dispose geometries & materials
    this.mesh.traverse((child) => {
      if (child.isMesh) {
        child.geometry.dispose();
      }
    });
    this.shadow.geometry.dispose();
    this.shadow.material.dispose();
  }
}
