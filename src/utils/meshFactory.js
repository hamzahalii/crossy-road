import * as THREE from 'three';

/**
 * Factory functions for common voxel primitives.
 * All meshes use MeshLambertMaterial for performance with simple shading.
 */

const _materialCache = new Map();

function getMaterial(color) {
  if (!_materialCache.has(color)) {
    _materialCache.set(color, new THREE.MeshLambertMaterial({ color }));
  }
  return _materialCache.get(color);
}

const _boxGeo = new THREE.BoxGeometry(1, 1, 1);

export function createBox(w, h, d, color) {
  const geo = (w === 1 && h === 1 && d === 1)
    ? _boxGeo
    : new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geo, getMaterial(color));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function createCylinder(radiusTop, radiusBottom, height, color, segments = 8) {
  const geo = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments);
  const mesh = new THREE.Mesh(geo, getMaterial(color));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function createCone(radius, height, color, segments = 8) {
  const geo = new THREE.ConeGeometry(radius, height, segments);
  const mesh = new THREE.Mesh(geo, getMaterial(color));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * Create a voxel-style tree: trunk + foliage
 */
export function createTree(trunkColor = 0x5D4037, foliageColor = 0x2E7D32) {
  const group = new THREE.Group();

  const trunk = createCylinder(0.12, 0.15, 0.6, trunkColor);
  trunk.position.y = 0.3;
  group.add(trunk);

  const foliage = createBox(0.7, 0.8, 0.7, foliageColor);
  foliage.position.y = 0.9;
  group.add(foliage);

  // Add a slight random top piece for variety
  const top = createBox(0.45, 0.4, 0.45, foliageColor);
  top.position.y = 1.35;
  group.add(top);

  return group;
}

/**
 * Create a voxel rock
 */
export function createRock(color = 0x757575) {
  const group = new THREE.Group();
  const base = createBox(0.6, 0.35, 0.5, color);
  base.position.y = 0.175;
  group.add(base);
  const top = createBox(0.35, 0.2, 0.3, color);
  top.position.y = 0.45;
  top.position.x = 0.05;
  group.add(top);
  return group;
}

