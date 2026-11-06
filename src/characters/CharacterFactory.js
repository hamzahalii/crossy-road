import * as THREE from 'three';
import { createBox } from '../utils/meshFactory.js';

/**
 * CharacterFactory — builds voxel-style character meshes from character data.
 * Every character is a THREE.Group assembled from boxes (and occasionally spheres).
 */

// Shared eye material
const EYE_MAT = new THREE.MeshLambertMaterial({ color: 0x111111 });

/**
 * Helper: create a small box mesh (when createBox isn't available or for inline use).
 */
function _box(w, h, d, color, opts = {}) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const matOpts = { color: new THREE.Color(color) };
  if (opts.opacity !== undefined) {
    matOpts.transparent = true;
    matOpts.opacity = opts.opacity;
  }
  const mat = new THREE.MeshLambertMaterial(matOpts);
  return new THREE.Mesh(geo, mat);
}

function _sphere(radius, color, opts = {}) {
  const geo = new THREE.SphereGeometry(radius, 8, 8);
  const matOpts = { color: new THREE.Color(color) };
  if (opts.opacity !== undefined) {
    matOpts.transparent = true;
    matOpts.opacity = opts.opacity;
  }
  const mat = new THREE.MeshLambertMaterial(matOpts);
  return new THREE.Mesh(geo, mat);
}

// ─── Special builders ──────────────────────────────────────────────

function buildGhost(c) {
  const group = new THREE.Group();

  // Translucent body
  const body = _box(0.5, 0.55, 0.5, c.body, { opacity: 0.7 });
  body.position.y = 0.275;
  group.add(body);

  // Wavy bottom — three small boxes
  for (let i = -1; i <= 1; i++) {
    const wave = _box(0.16, 0.1, 0.5, c.body, { opacity: 0.7 });
    wave.position.set(i * 0.17, 0.05 + (i === 0 ? 0.04 : 0), 0);
    group.add(wave);
  }

  // Eyes
  const eyeL = _box(0.08, 0.08, 0.05, '#111111');
  eyeL.position.set(-0.1, 0.38, 0.23);
  group.add(eyeL);

  const eyeR = _box(0.08, 0.08, 0.05, '#111111');
  eyeR.position.set(0.1, 0.38, 0.23);
  group.add(eyeR);

  // Mouth
  const mouth = _box(0.12, 0.06, 0.05, '#111111');
  mouth.position.set(0, 0.26, 0.23);
  group.add(mouth);

  return group;
}

function buildRobot(c) {
  const group = new THREE.Group();

  // Body
  const body = _box(0.5, 0.5, 0.5, c.body);
  body.position.y = 0.25;
  group.add(body);

  // Square head
  const head = _box(0.38, 0.38, 0.38, c.head);
  head.position.y = 0.72;
  group.add(head);

  // Antenna pole
  const pole = _box(0.04, 0.16, 0.04, c.accent);
  pole.position.y = 1.0;
  group.add(pole);

  // Antenna ball
  const ball = _sphere(0.05, c.detail);
  ball.position.y = 1.1;
  group.add(ball);

  // Eyes (LED style)
  const eyeL = _box(0.09, 0.05, 0.05, c.detail);
  eyeL.position.set(-0.09, 0.76, 0.17);
  group.add(eyeL);

  const eyeR = _box(0.09, 0.05, 0.05, c.detail);
  eyeR.position.set(0.09, 0.76, 0.17);
  group.add(eyeR);

  // Feet
  const footL = _box(0.14, 0.06, 0.18, c.accent);
  footL.position.set(-0.12, 0.03, 0.04);
  group.add(footL);

  const footR = _box(0.14, 0.06, 0.18, c.accent);
  footR.position.set(0.12, 0.03, 0.04);
  group.add(footR);

  return group;
}

function buildSnowman(c) {
  const group = new THREE.Group();

  // Bottom sphere
  const bottom = _sphere(0.25, c.body);
  bottom.position.y = 0.25;
  group.add(bottom);

  // Middle sphere
  const middle = _sphere(0.2, c.body);
  middle.position.y = 0.58;
  group.add(middle);

  // Top sphere (head)
  const top = _sphere(0.15, c.head);
  top.position.y = 0.86;
  group.add(top);

  // Carrot nose
  const nose = _box(0.04, 0.04, 0.14, c.accent);
  nose.position.set(0, 0.86, 0.2);
  group.add(nose);

  // Eyes
  const eyeL = _sphere(0.03, '#111111');
  eyeL.position.set(-0.06, 0.92, 0.12);
  group.add(eyeL);

  const eyeR = _sphere(0.03, '#111111');
  eyeR.position.set(0.06, 0.92, 0.12);
  group.add(eyeR);

  // Hat (detail color)
  const hatBrim = _box(0.3, 0.03, 0.3, c.detail);
  hatBrim.position.y = 1.0;
  group.add(hatBrim);

  const hatTop = _box(0.18, 0.14, 0.18, c.detail);
  hatTop.position.y = 1.08;
  group.add(hatTop);

  return group;
}

function buildCactus(c) {
  const group = new THREE.Group();

  // Main body (tall, no separate head)
  const body = _box(0.3, 0.7, 0.3, c.body);
  body.position.y = 0.35;
  group.add(body);

  // Left arm
  const armL = _box(0.14, 0.3, 0.14, c.body);
  armL.position.set(-0.22, 0.45, 0);
  group.add(armL);

  const armLUp = _box(0.14, 0.14, 0.14, c.body);
  armLUp.position.set(-0.22, 0.62, 0);
  group.add(armLUp);

  // Right arm
  const armR = _box(0.14, 0.22, 0.14, c.body);
  armR.position.set(0.22, 0.35, 0);
  group.add(armR);

  const armRUp = _box(0.14, 0.14, 0.14, c.body);
  armRUp.position.set(0.22, 0.48, 0);
  group.add(armRUp);

  // Eyes
  const eyeL = _box(0.05, 0.05, 0.05, '#111111');
  eyeL.position.set(-0.07, 0.58, 0.14);
  group.add(eyeL);

  const eyeR = _box(0.05, 0.05, 0.05, '#111111');
  eyeR.position.set(0.07, 0.58, 0.14);
  group.add(eyeR);

  // Flower on top (detail color)
  const flower = _sphere(0.06, c.detail);
  flower.position.set(0.05, 0.72, 0.05);
  group.add(flower);

  return group;
}

// ─── Default character builder ─────────────────────────────────────

function buildDefault(c) {
  const group = new THREE.Group();

  // Body
  const body = _box(0.5, 0.5, 0.5, c.body);
  body.position.y = 0.25;
  group.add(body);

  // Head
  const head = _box(0.32, 0.32, 0.32, c.head);
  head.position.y = 0.68;
  group.add(head);

  // Accent piece (beak / horn / snout) — small box protruding forward
  const accent = _box(0.1, 0.08, 0.1, c.accent);
  accent.position.set(0, 0.64, 0.2);
  group.add(accent);

  // Detail piece (comb / hat / crest) — on top of head
  const detail = _box(0.14, 0.1, 0.08, c.detail);
  detail.position.set(0, 0.88, 0);
  group.add(detail);

  // Eyes
  const eyeL = _box(0.05, 0.05, 0.04, '#111111');
  eyeL.position.set(-0.08, 0.72, 0.15);
  group.add(eyeL);

  const eyeR = _box(0.05, 0.05, 0.04, '#111111');
  eyeR.position.set(0.08, 0.72, 0.15);
  group.add(eyeR);

  // Feet
  const footL = _box(0.1, 0.06, 0.16, c.accent);
  footL.position.set(-0.12, 0.03, 0.04);
  group.add(footL);

  const footR = _box(0.1, 0.06, 0.16, c.accent);
  footR.position.set(0.12, 0.03, 0.04);
  group.add(footR);

  return group;
}

// ─── Public API ────────────────────────────────────────────────────

/**
 * Build a Three.js Group mesh for the given character data.
 * @param {Object} characterData — one entry from CHARACTER_DATA
 * @returns {THREE.Group}
 */
export function createCharacterMesh(characterData) {
  const c = characterData.colors;
  let group;

  switch (characterData.id) {
    case 'ghost':
      group = buildGhost(c);
      break;
    case 'robot':
      group = buildRobot(c);
      break;
    case 'snowman':
      group = buildSnowman(c);
      break;
    case 'cactus':
      group = buildCactus(c);
      break;
    default:
      group = buildDefault(c);
      break;
  }

  group.name = `character_${characterData.id}`;

  // Cast shadows from every mesh in the group
  group.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return group;
}

export const CharacterFactory = { createCharacterMesh };
