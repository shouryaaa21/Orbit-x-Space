import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { sunData } from '../data/celestialBodies';
import { setBodyPosition } from '../utils/positions';

/* ----------------------------- simplex noise ----------------------------- */

const simplexGlsl = /* glsl */ `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
`;

const sunVertex = /* glsl */ `
  ${simplexGlsl}
  uniform float uTime;
  varying vec3 vPos;
  varying vec3 vNormal;
  varying float vDisplace;

  void main() {
    float n = snoise(normalize(position) * 3.2 + vec3(uTime * 0.08, uTime * 0.04, uTime * 0.06));
    float n2 = snoise(normalize(position) * 7.0 - vec3(uTime * 0.12, 0.0, uTime * 0.09));
    float n3 = snoise(normalize(position) * 14.0 + vec3(uTime * 0.05, uTime * 0.15, 0.0));
    vDisplace = n * 0.5 + n2 * 0.2 + n3 * 0.08;
    vPos = normalize(position);
    vNormal = normalize(normalMatrix * normal);
    vec3 displaced = position + normal * vDisplace * 0.055;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`;

const sunFragment = /* glsl */ `
  uniform float uTime;
  varying vec3 vPos;
  varying vec3 vNormal;
  varying float vDisplace;

  void main() {
    float plasma = vDisplace * 0.5 + 0.5;

    // Three-tone plasma coloring
    vec3 deep  = vec3(0.50, 0.10, 0.01);
    vec3 mid   = vec3(1.00, 0.42, 0.04);
    vec3 hot   = vec3(1.00, 0.82, 0.38);
    vec3 white = vec3(1.00, 0.98, 0.92);

    vec3 col = mix(deep, mid, smoothstep(0.12, 0.55, plasma));
    col = mix(col, hot, smoothstep(0.50, 0.88, plasma));
    col = mix(col, white, smoothstep(0.85, 1.0, plasma));

    // Limb darkening — physically-based
    float mu = max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0);
    float limb = pow(mu, 0.35);
    col *= 0.45 + 0.75 * limb;

    // Subtle pulsing brightness
    float pulse = 0.96 + 0.04 * sin(uTime * 0.8);
    col *= 1.55 * pulse;

    gl_FragColor = vec4(col, 1.0);
  }
`;

const coronaVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const coronaFragment = /* glsl */ `
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    float fresnel = pow(1.0 - abs(dot(normalize(vNormal), normalize(vViewDir))), 2.2);
    float flicker = 0.88 + 0.12 * sin(uTime * 1.5) + 0.05 * sin(uTime * 3.8);
    vec3 col = mix(vec3(1.0, 0.45, 0.08), vec3(1.0, 0.82, 0.45), fresnel);
    gl_FragColor = vec4(col, fresnel * 0.9 * flicker);
  }
`;

export default function Sun({ onSelect }) {
  const meshRef = useRef();
  const coronaRef = useRef();
  const groupRef = useRef();

  const sunMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: sunVertex,
        fragmentShader: sunFragment,
        uniforms: { uTime: { value: 0 } },
      }),
    []
  );

  const coronaMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: coronaVertex,
        fragmentShader: coronaFragment,
        uniforms: { uTime: { value: 0 } },
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    []
  );

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    sunMaterial.uniforms.uTime.value = t;
    coronaMaterial.uniforms.uTime.value = t;
    meshRef.current.rotation.y += delta * 0.025;
    setBodyPosition('Sun', groupRef.current);
  });

  const handleClick = (event) => {
    event.stopPropagation();
    onSelect(sunData);
  };

  return (
    <group ref={groupRef} onClick={handleClick}>
      {/* Core surface */}
      <mesh ref={meshRef} material={sunMaterial}>
        <sphereGeometry args={[sunData.size, 128, 128]} />
      </mesh>

      {/* Inner corona shell */}
      <mesh material={coronaMaterial} scale={1.18}>
        <sphereGeometry args={[sunData.size, 64, 64]} />
      </mesh>

      {/* Outer corona shell — softer, wider */}
      <mesh material={coronaMaterial} scale={1.45}>
        <sphereGeometry args={[sunData.size, 48, 48]} />
      </mesh>

      {/* Wide warm halo */}
      <mesh scale={1.85}>
        <sphereGeometry args={[sunData.size, 32, 32]} />
        <meshBasicMaterial
          color="#ffaa30"
          transparent
          opacity={0.07}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Very wide diffuse glow */}
      <mesh scale={2.6}>
        <sphereGeometry args={[sunData.size, 16, 16]} />
        <meshBasicMaterial
          color="#ff8820"
          transparent
          opacity={0.025}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Primary sunlight */}
      <pointLight intensity={800} distance={140} decay={1.5} color="#ffe8b0" />
      {/* Warm fill */}
      <pointLight intensity={200} distance={70} decay={1.8} color="#ff9040" />
    </group>
  );
}
