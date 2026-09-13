// Shared registry of live 3D world positions for each body. Planet groups
// write into it every frame; the camera rig and HUD read from it.
export const bodyPositions = new Map();

export function setBodyPosition(name, obj) {
  bodyPositions.set(name, obj);
}

export function getBodyPosition(name) {
  return bodyPositions.get(name) || null;
}
