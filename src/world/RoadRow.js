import * as THREE from 'three';
import { TerrainRow } from './TerrainRow.js';
import { createBox } from '../utils/meshFactory.js';
import { randomInt, pickRandom, randomRange } from '../utils/mathHelpers.js';
import { COLORS, CAR_SPEEDS, TRUCK_CHANCE, VEHICLES_PER_LANE } from '../constants.js';

/** Bright vehicle color palette */
const VEHICLE_COLORS = [
  0xE53935, // red
  0x1E88E5, // blue
  0xFDD835, // yellow
  0x43A047, // green
  0xF4511E, // deep orange
  0x8E24AA, // purple
  0x00ACC1, // cyan
  0xFFB300, // amber
  0x6D4C41, // brown
  0xD81B60, // pink
];

/**
 * A road row with moving vehicles.
 */
export class RoadRow extends TerrainRow {
  constructor(rowIndex, scene) {
    super(rowIndex, scene);

    // Ground plane — dark gray road
    const ground = createBox(26, 0.1, 1, COLORS.road);
    ground.position.y = 0;
    ground.receiveShadow = true;
    this.group.add(ground);

    // Dashed lane markings
    for (let x = -12; x <= 12; x += 2) {
      const dash = createBox(0.6, 0.02, 0.08, COLORS.roadLine);
      dash.position.set(x, 0.06, -0.45);
      this.group.add(dash);

      const dash2 = createBox(0.6, 0.02, 0.08, COLORS.roadLine);
      dash2.position.set(x, 0.06, 0.45);
      this.group.add(dash2);
    }

    // Vehicles
    const direction = Math.random() < 0.5 ? 1 : -1;
    const speed = pickRandom(CAR_SPEEDS);
    const vehicleCount = pickRandom(VEHICLES_PER_LANE);
    const spacing = 26 / vehicleCount;

    for (let i = 0; i < vehicleCount; i++) {
      const isTruck = Math.random() < TRUCK_CHANCE;
      const color = pickRandom(VEHICLE_COLORS);

      let vehicleMesh;
      let width;
      if (isTruck) {
        vehicleMesh = createBox(1.6, 0.7, 0.7, color);
        width = 1.6;
      } else {
        vehicleMesh = createBox(0.8, 0.5, 0.65, color);
        width = 0.8;
      }

      // Position vehicles evenly with some jitter
      const baseX = -12 + i * spacing + randomRange(-1, 1);
      vehicleMesh.position.set(baseX, isTruck ? 0.4 : 0.3, 0);
      this.group.add(vehicleMesh);

      this.movingObjects.push({
        mesh: vehicleMesh,
        speed,
        direction,
        width,
        wrapLimit: 14,
      });
    }
  }

  /**
   * Update vehicle positions; wraps at ±14.
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
