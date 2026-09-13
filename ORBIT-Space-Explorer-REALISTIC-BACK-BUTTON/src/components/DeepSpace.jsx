import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function points(count, radius, arms, seed = 1) {
  const p = new Float32Array(count * 3); const c = new Float32Array(count * 3);
  let s = seed;
  const rand = () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
  for (let i=0;i<count;i++) { const r=Math.pow(rand(),0.55)*radius; const arm=(i%arms)/arms*Math.PI*2; const twist=r*0.19; const a=arm+twist+(rand()-0.5)*0.42; const z=(rand()-0.5)*Math.max(0.3, (1-r/radius)*1.8); p[i*3]=Math.cos(a)*r; p[i*3+1]=z; p[i*3+2]=Math.sin(a)*r; const hot=1-r/radius; c[i*3]=1; c[i*3+1]=0.58+hot*0.38; c[i*3+2]=0.32+hot*0.5; }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(p,3)); g.setAttribute('color',new THREE.BufferAttribute(c,3)); return g;
}

export function Galaxy({ position=[-42,16,-48], scale=1 }) {
  const ref=useRef(); const geo=useMemo(()=>points(18000,18,5,91),[]);
  useFrame((_,dt)=>{if(ref.current) ref.current.rotation.y+=dt*0.012;});
  return <points ref={ref} position={position} scale={scale}><primitive object={geo} attach="geometry"/><pointsMaterial size={0.045} vertexColors transparent opacity={0.78} depthWrite={false} blending={THREE.AdditiveBlending}/></points>;
}

export function GalaxyCore({ position=[-42,16,-48] }) { return <mesh position={position} rotation={[Math.PI/2,0,0]}><planeGeometry args={[11,11]} /><meshBasicMaterial color="#fff1c7" transparent opacity={0.08} blending={THREE.AdditiveBlending} depthWrite={false}/></mesh>; }

export function Nebula({ position=[28,-8,-35], color='#6b4cff', scale=1 }) {
  const ref=useRef(); const geo=useMemo(()=>{const g=new THREE.BufferGeometry();const p=new Float32Array(6500*3); for(let i=0;i<p.length;i+=3){const r=Math.pow(Math.random(),.45)*13;p[i]=(Math.random()-.5)*r;p[i+1]=(Math.random()-.5)*r*.55;p[i+2]=(Math.random()-.5)*r*.8;}g.setAttribute('position',new THREE.BufferAttribute(p,3));return g;},[]);
  useFrame((_,dt)=>{if(ref.current)ref.current.rotation.y-=dt*.008;});
  return <points ref={ref} position={position} scale={scale}><primitive object={geo} attach="geometry"/><pointsMaterial size={0.16} color={color} transparent opacity={0.055} depthWrite={false} blending={THREE.AdditiveBlending}/></points>;
}

export function AsteroidField() {
  const geo=useMemo(()=>{const g=new THREE.BufferGeometry();const p=[];for(let i=0;i<1600;i++){const a=Math.random()*Math.PI*2;const r=10.8+Math.random()*1.8;p.push(Math.cos(a)*r,(Math.random()-.5)*.18,Math.sin(a)*r);}g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));return g;},[]);
  return <points><primitive object={geo} attach="geometry"/><pointsMaterial size={0.035} color="#aaa39a" transparent opacity={0.75}/></points>;
}

export function BlackHole({ position=[0,24,-65] }) {
  const ring=useRef(); useFrame((_,dt)=>{if(ring.current)ring.current.rotation.z+=dt*.08;});
  return <group position={position}><mesh><sphereGeometry args={[2.4,64,64]}/><meshBasicMaterial color="#000000"/></mesh><mesh ref={ring} rotation={[Math.PI/2.15,0,.25]}><torusGeometry args={[3.25,.55,32,160]}/><meshBasicMaterial color="#ff6d24" transparent opacity={.28} blending={THREE.AdditiveBlending}/></mesh><pointLight intensity={4} distance={12} color="#ff5b2a"/></group>;
}
