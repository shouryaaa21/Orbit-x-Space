import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const ORIGIN = new THREE.Vector3(0, 0, 0);

/**
 * Every frame, smoothly pans the camera (keeping its current angle/zoom)
 * so the OrbitControls target tracks whichever body is selected. When
 * nothing is selected it eases back toward the Sun at the origin.
 */
export default function CameraRig({ selected, bodyRefs, controlsRef }) {
  const { camera } = useThree();
  const targetVec = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    if (selected && selected.name !== 'Sun') {
      const bodyGroup = bodyRefs.current[selected.name];
      if (!bodyGroup) return;
      bodyGroup.getWorldPosition(targetVec.current);
    } else {
      targetVec.current.copy(ORIGIN);
    }

    const offset = camera.position.clone().sub(controls.target);
    controls.target.lerp(targetVec.current, Math.min(delta * 3, 1));
    camera.position.copy(controls.target).add(offset);
    controls.update();
  });

  return null;
}
