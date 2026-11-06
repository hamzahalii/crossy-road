/**
 * CameraController — isometric-style follow camera for Crossy Road clone.
 * Camera hovers above and behind the player, smoothly following movement.
 */
import * as THREE from 'three';
import { lerp } from '../utils/mathHelpers.js';

// Offset from the focus target to give a classic isometric Crossy Road feel.
// Elevated ~55 degrees, slightly rotated so negative-Z ("forward") is "up" on screen.
const OFFSET = new THREE.Vector3(5, 14, 10);

// How far ahead of the player the camera looks (negative Z = forward).
const LOOK_AHEAD_Z = -3;

export class CameraController {
  /**
   * @param {THREE.PerspectiveCamera} camera
   */
  constructor(camera) {
    this.camera = camera;

    // Set a good FOV for the isometric feel
    this.camera.fov = 60;
    this.camera.updateProjectionMatrix();

    // Current smoothed focus point
    this.targetX = 0;
    this.targetZ = 0;

    // Snap to starting position immediately
    this.reset();
  }

  /**
   * Smoothly follow the player each frame.
   * @param {number} dt  — delta time in seconds
   * @param {number} playerX — player world X
   * @param {number} playerZ — player world Z
   */
  update(dt, playerX, playerZ) {
    const speed = 5 * dt; // lerp factor per frame

    this.targetX = lerp(this.targetX, playerX, speed);
    this.targetZ = lerp(this.targetZ, playerZ, speed);

    // Position camera at offset from the smoothed target
    this.camera.position.set(
      this.targetX + OFFSET.x,
      OFFSET.y,
      this.targetZ + OFFSET.z
    );

    // Look slightly ahead of the player (negative Z is forward)
    this.camera.lookAt(
      this.targetX,
      0,
      this.targetZ + LOOK_AHEAD_Z
    );
  }

  /**
   * Instantly snap camera to default starting position (no lerp).
   */
  reset() {
    this.targetX = 0;
    this.targetZ = 0;

    this.camera.position.set(
      OFFSET.x,
      OFFSET.y,
      OFFSET.z
    );

    this.camera.lookAt(0, 0, LOOK_AHEAD_Z);
  }
}
