import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Html } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { metricColors } from '../lib/colors';

const BRAIN_REGIONS = [
  { name: 'Prefrontal Cortex', metric: 'attentionFocus', phi: 0.3, theta: 0 },
  { name: 'Amygdala', metric: 'emotionalResonance', phi: 1.2, theta: 2.5 },
  { name: 'Hippocampus', metric: 'memorability', phi: 1.4, theta: 1.5 },
  { name: 'Temporal Lobe', metric: 'narrativeComprehension', phi: 1.5, theta: 3.5 },
  { name: 'Fusiform Area', metric: 'faceImpact', phi: 2.0, theta: 0.8 },
  { name: 'Visual Cortex', metric: 'sceneImpact', phi: 2.6, theta: Math.PI },
  { name: 'Motor Cortex', metric: 'motionEnergy', phi: 0.6, theta: Math.PI },
];

function sphericalToCartesian(radius, phi, theta) {
  return [
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  ];
}

function BrainMesh({ metrics }) {
  const meshRef = useRef();

  const geometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(1.3, 64, 48);
    const positions = geo.attributes.position;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);

      const fissureDepth = Math.exp(-Math.pow(x, 2) * 8) * 0.2;
      const yOffset = y > 0 ? fissureDepth : fissureDepth * 0.5;

      const bumpX = Math.sin(x * 6) * Math.cos(z * 5) * 0.03;
      const bumpZ = Math.cos(x * 4) * Math.sin(z * 7) * 0.02;

      positions.setXYZ(
        i,
        x + bumpX,
        y * 0.85 - yOffset,
        z * 1.1 + bumpZ
      );
    }

    geo.computeVertexNormals();
    return geo;
  }, []);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial
        color="#1a2744"
        roughness={0.7}
        metalness={0.3}
        transparent
        opacity={0.85}
      />
    </mesh>
  );
}

function RegionGlow({ region, value }) {
  const meshRef = useRef();
  const color = metricColors[region.metric] || '#00D4FF';
  const position = sphericalToCartesian(1.25, region.phi, region.theta);
  const intensity = 0.3 + value * 0.7;
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 2 + region.phi) * 0.1;
      meshRef.current.scale.setScalar(intensity * (1 + pulse));
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={intensity * 2}
          transparent
          opacity={0.6 + value * 0.4}
        />
      </mesh>

      <mesh scale={[1.8, 1.8, 1.8]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.08 + value * 0.12}
        />
      </mesh>

      {hovered && (
        <Html center distanceFactor={5}>
          <div className="bg-surface/90 backdrop-blur-md border border-card-border rounded-lg px-3 py-2 whitespace-nowrap pointer-events-none shadow-xl">
            <p className="text-xs font-medium text-text-primary">{region.name}</p>
            <p className="text-xs mt-0.5" style={{ color }}>
              {Math.round(value * 100)}% activation
            </p>
          </div>
        </Html>
      )}
    </group>
  );
}

function BrainScene({ metrics }) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={0.8} color="#4488ff" />
      <pointLight position={[-5, -3, -5]} intensity={0.4} color="#8844ff" />

      <Float speed={0.8} rotationIntensity={0.1} floatIntensity={0.3}>
        <BrainMesh metrics={metrics} />
        {BRAIN_REGIONS.map((region) => (
          <RegionGlow
            key={region.name}
            region={region}
            value={metrics?.[region.metric] || 0}
          />
        ))}
      </Float>

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.5}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI * 3 / 4}
      />

      <StarField />
    </>
  );
}

function StarField() {
  const points = useMemo(() => {
    const positions = new Float32Array(300 * 3);
    for (let i = 0; i < 300; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return positions;
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={300}
          array={points}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.02} color="#334155" transparent opacity={0.6} />
    </points>
  );
}

export default function BrainViewer({ metrics }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.8 }}
      className="rounded-xl border border-card-border bg-card/20 overflow-hidden h-full min-h-[320px]"
    >
      <Canvas
        camera={{ position: [0, 0, 4], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <BrainScene metrics={metrics} />
      </Canvas>
    </motion.div>
  );
}
