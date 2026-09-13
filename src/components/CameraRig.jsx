import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getBodyPosition } from '../utils/positions';

const _targetPos = new THREE.Vector3();
const _goalPos = new THREE.Vector3();
const _lookAhead = new THREE.Vector3();

/**
 * Cinematic camera rig.
 * - Follows the selected body by animating OrbitControls.target with
 *   critically-damped smoothing (no overshoot, no jitter, no fight with controls).
 * - 'orbit:viewPreset' events fly the camera to preset poses.
 * Framing distance is tight (hyperreal close-up) with slight elevation.
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

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    if (!controls) return;

    // Frame-rate independent damping factors (exponential smoothing)
    const kFast = 1 - Math.pow(0.0015, dt); // fly-to lerp
    const kTrack = 1 - Math.pow(0.0005, dt); // target tracking (tighter = smoother)
    const kIdle = 1 - Math.pow(0.05, dt);

    if (presetTransition.current) {
      camera.position.lerp(goalPos.current, kFast * 0.8);
      controls.target.lerp(goalTarget.current, kFast * 0.8);
      if (camera.position.distanceTo(goalPos.current) < 0.3) presetTransition.current = false;
      controls.update();
      return;
    }

    if (selected && getBodyPosition(selected.name)) {
      const obj = getBodyPosition(selected.name);
      obj.getWorldPosition(_targetPos);

      // Aim slightly ahead of the body's motion for a natural feel
      _lookAhead.copy(_targetPos);
      goalTarget.current.lerp(_lookAhead, kTrack);
      controls.target.copy(goalTarget.current);

      if (transitioning.current) {
        const bodySize = selected.size || 1;
        // Tight hyperreal framing: just outside the atmosphere/glow
        const dist = bodySize * 3.1 + 1.15;
        _goalPos.set(
          _targetPos.x + dist * 0.55,
          _targetPos.y + dist * 0.38,
          _targetPos.z + dist * 0.74
        );
        camera.position.lerp(_goalPos, kFast);
        if (camera.position.distanceTo(_goalPos) < 0.25) transitioning.current = false;
      }
    } else {
      // Idle: drift focus back to system center
      goalTarget.current.lerp(_lookAhead.set(0, 0, 0), kIdle);
      controls.target.copy(goalTarget.current);
    }

    controls.update();
  });

  return null;
}
