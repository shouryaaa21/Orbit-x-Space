import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getBodyPosition } from '../utils/positions';

const _targetPos = new THREE.Vector3();
const _goalPos = new THREE.Vector3();
const _goalTarget = new THREE.Vector3();

/**
 * Camera behavior — animates OrbitControls.target to follow selected body.
 * Listens for 'orbit:viewPreset' custom events to fly to preset camera positions.
 */
export default function CameraRig({ selected }) {
  const { camera } = useThree();
  const controls = useThree((s) => s.controls);
  const transitioning = useRef(false);
  const presetTransition = useRef(false);
  const lastSelected = useRef(null);
  const goalTarget = useRef(new THREE.Vector3());
  const goalPos = useRef(new THREE.Vector3());

  useEffect(() => {
    if (selected !== lastSelected.current) {
      lastSelected.current = selected;
      if (selected) transitioning.current = true;
    }
  }, [selected]);

  // Listen for view preset events
  useEffect(() => {
    const handler = (e) => {
      const { pos, target } = e.detail;
      goalPos.current.set(...pos);
      goalTarget.current.set(...target);
      presetTransition.current = true;
    };
    window.addEventListener('orbit:viewPreset', handler);
    return () => window.removeEventListener('orbit:viewPreset', handler);
  }, []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    if (!controls) return;

    // Handle view preset transitions
    if (presetTransition.current) {
      camera.position.lerp(goalPos.current, 1 - Math.pow(0.005, dt));
      controls.target.lerp(goalTarget.current, 1 - Math.pow(0.005, dt));
      if (camera.position.distanceTo(goalPos.current) < 0.3) {
        presetTransition.current = false;
      }
      controls.update();
      return;
    }

    if (selected && getBodyPosition(selected.name)) {
      const obj = getBodyPosition(selected.name);
      obj.getWorldPosition(_targetPos);
      goalTarget.current.copy(_targetPos);
      controls.target.lerp(goalTarget.current, 1 - Math.pow(0.01, dt));

      if (transitioning.current) {
        const bodySize = selected.size || 1;
        const dist = bodySize * 4 + 2.5;
        goalPos.current.set(
          _targetPos.x + dist * 0.6,
          _targetPos.y + dist * 0.45,
          _targetPos.z + dist * 0.7
        );
        camera.position.lerp(goalPos.current, 1 - Math.pow(0.008, dt));
        if (camera.position.distanceTo(goalPos.current) < 0.5) transitioning.current = false;
      }
    } else {
      goalTarget.current.set(0, 0, 0);
      controls.target.lerp(goalTarget.current, 1 - Math.pow(0.02, dt));
    }

    controls.update();
  });

  return null;
}
