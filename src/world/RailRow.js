import * as THREE from 'three';
import { TerrainRow } from './TerrainRow.js';
import { createBox } from '../utils/meshFactory.js';
import { COLORS, TRAIN_SPEED, TRAIN_WARNING_TIME } from '../constants.js';

/**
 * A rail row with warning lights and a fast-moving train.
 */
export class RailRow extends TerrainRow {
  constructor(rowIndex, scene) {
    super(rowIndex, scene);

    // Ground / rail bed
    const ground = createBox(26, 0.1, 1, COLORS.road);
    ground.position.y = 0;
    ground.receiveShadow = true;
    this.group.add(ground);

    // Rail ties (brown wooden sleepers)
    for (let x = -12; x <= 12; x += 1) {
      const tie = createBox(0.3, 0.06, 0.9, COLORS.railTie);
      tie.position.set(x, 0.06, 0);
      this.group.add(tie);
    }

    // Two rail lines
    const rail1 = createBox(26, 0.06, 0.1, COLORS.rock);
    rail1.position.set(0, 0.1, -0.3);
    this.group.add(rail1);

    const rail2 = createBox(26, 0.06, 0.1, COLORS.rock);
    rail2.position.set(0, 0.1, 0.3);
    this.group.add(rail2);

    // Warning lights (two small red boxes on each side of the track)
    this.warningLight1 = createBox(0.15, 0.15, 0.15, 0xE53935);
    this.warningLight1.position.set(-10, 0.6, 0);
    this.warningLight1.visible = false;
    this.group.add(this.warningLight1);

    // Warning light pole 1
    const pole1 = createBox(0.08, 0.5, 0.08, COLORS.rock);
    pole1.position.set(-10, 0.3, 0);
    this.group.add(pole1);

    this.warningLight2 = createBox(0.15, 0.15, 0.15, 0xE53935);
    this.warningLight2.position.set(10, 0.6, 0);
    this.warningLight2.visible = false;
    this.group.add(this.warningLight2);

    // Warning light pole 2
    const pole2 = createBox(0.08, 0.5, 0.08, COLORS.rock);
    pole2.position.set(10, 0.3, 0);
    this.group.add(pole2);

    // Train state
    this.trainActive = false;
    this.trainWarning = false;
    this.warningTimer = 0;
    this.blinkTimer = 0;
    this.trainMesh = null;
    this.trainDirection = 0;
    this.canTrigger = true;
  }

  /**
   * Start the warning sequence. After TRAIN_WARNING_TIME ms, a train will spawn.
   */
  triggerWarning() {
    if (this.trainWarning || this.trainActive || !this.canTrigger) return;

    this.trainWarning = true;
    this.warningTimer = TRAIN_WARNING_TIME / 1000; // convert ms to seconds
    this.blinkTimer = 0;
    this.warningLight1.visible = true;
    this.warningLight2.visible = true;
    this.canTrigger = false;
  }

  /**
   * Spawn the train off-screen.
   */
  _spawnTrain() {
    this.trainDirection = Math.random() < 0.5 ? 1 : -1;
    this.trainMesh = createBox(12, 1.2, 0.9, 0x42A5F5);
    this.trainMesh.position.set(
      this.trainDirection > 0 ? -20 : 20,
      0.65,
      0
    );
    this.group.add(this.trainMesh);

    // Add a darker cabin section on top
    const cabin = createBox(3, 0.5, 0.85, 0x78909C);
    cabin.position.set(
      this.trainDirection > 0 ? -3 : 3,
      0.85, // on top of main body
      0
    );
    this.trainMesh.add(cabin);

    this.trainActive = true;
    this.trainWarning = false;
    this.warningLight1.visible = false;
    this.warningLight2.visible = false;

    this.movingObjects.push({
      mesh: this.trainMesh,
      speed: TRAIN_SPEED,
      direction: this.trainDirection,
      width: 12,
      wrapLimit: 30, // Train goes far off before we remove it
    });
  }

  /**
   * Returns true if the train currently covers position x.
   * @param {number} x - Grid x position to check.
   * @returns {boolean}
   */
  isTrainAt(x) {
    if (!this.trainActive || !this.trainMesh) return false;
    const halfW = 6; // half of 12
    return x >= this.trainMesh.position.x - halfW &&
           x <= this.trainMesh.position.x + halfW;
  }

  /**
   * Update warning timer, blinking lights, and train movement.
   */
  update(dt, speedMultiplier) {
    // Blink warning lights
    if (this.trainWarning) {
      this.warningTimer -= dt;
      this.blinkTimer += dt;

      // Toggle lights every 0.3 seconds
      if (this.blinkTimer >= 0.3) {
        this.blinkTimer -= 0.3;
        this.warningLight1.visible = !this.warningLight1.visible;
        this.warningLight2.visible = !this.warningLight2.visible;
      }

      // Warning period over — spawn train
      if (this.warningTimer <= 0) {
        this._spawnTrain();
      }
    }

    // Move train
    if (this.trainActive && this.trainMesh) {
      this.trainMesh.position.x += TRAIN_SPEED * this.trainDirection * dt;

      // Check if train has fully passed
      const trainX = this.trainMesh.position.x;
      if ((this.trainDirection > 0 && trainX > 24) ||
          (this.trainDirection < 0 && trainX < -24)) {
        // Train has passed — clean up
        this.group.remove(this.trainMesh);
        if (this.trainMesh.geometry) this.trainMesh.geometry.dispose();
        this.movingObjects.length = 0;
        this.trainMesh = null;
        this.trainActive = false;
        this.canTrigger = true;
      }
    }
  }
}
