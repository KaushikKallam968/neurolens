import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { metricColors } from '../lib/colors';

const METRIC_REGION_COLORS = {
  attentionFocus: new THREE.Color(metricColors.attentionFocus),
  narrativeComprehension: new THREE.Color(metricColors.narrativeComprehension),
  emotionalResonance: new THREE.Color(metricColors.emotionalResonance),
  memorability: new THREE.Color(metricColors.memorability),
  faceImpact: new THREE.Color(metricColors.faceImpact),
  sceneImpact: new THREE.Color(metricColors.sceneImpact),
  motionEnergy: new THREE.Color(metricColors.motionEnergy),
};

const BASE_COLOR = new THREE.Color('#1a2a44');

function useBrainData() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [meshRes, mapRes] = await Promise.all([
          fetch('/brain/fsaverage5.bin'),
          fetch('/brain/region-map.json'),
        ]);

        const buffer = await meshRes.arrayBuffer();
        const regionMap = await mapRes.json();
        const view = new DataView(buffer);

        const nVerts = view.getUint32(0, true);
        const nFaces = view.getUint32(4, true);

        const coordsOffset = 8;
        const facesOffset = coordsOffset + nVerts * 3 * 4;
        const labelsOffset = facesOffset + nFaces * 3 * 4;

        const coords = new Float32Array(buffer, coordsOffset, nVerts * 3);
        const faces = new Uint32Array(buffer, facesOffset, nFaces * 3);
        const labels = new Int16Array(buffer, labelsOffset, nVerts);

        if (!cancelled) {
          setData({ coords, faces, labels, nVerts, nFaces, regionMap });
        }
      } catch (err) {
        console.error('Failed to load brain mesh:', err);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return data;
}

function buildLabelToMetric(regionMap) {
  const map = {};
  for (const [metric, labelIds] of Object.entries(regionMap)) {
    for (const id of labelIds) {
      map[id] = metric;
    }
  }
  return map;
}

function getMetricsAtTime(metrics, timeline, currentTime) {
  if (!timeline || currentTime <= 0) return metrics;

  const idx = Math.floor(currentTime);
  const firstKey = Object.keys(timeline)[0];
  if (!firstKey || !timeline[firstKey] || idx >= timeline[firstKey].length) return metrics;

  const timeMetrics = {};
  for (const key of Object.keys(metrics)) {
    if (timeline[key] && idx < timeline[key].length) {
      timeMetrics[key] = timeline[key][idx];
    } else {
      timeMetrics[key] = metrics[key];
    }
  }
  return timeMetrics;
}

function RealBrain({ metrics, brainData, timeline, currentTime }) {
  const meshRef = useRef();
  const colorsRef = useRef(null);

  const { geometry, labelToMetric } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(brainData.coords, 3));
    geo.setIndex(new THREE.BufferAttribute(brainData.faces, 1));
    geo.computeVertexNormals();

    const colors = new Float32Array(brainData.nVerts * 3);
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    colorsRef.current = colors;

    return {
      geometry: geo,
      labelToMetric: buildLabelToMetric(brainData.regionMap),
    };
  }, [brainData]);

  useFrame((state) => {
    if (!colorsRef.current || !metrics) return;

    const activeMetrics = getMetricsAtTime(metrics, timeline, currentTime);
    const colors = colorsRef.current;
    const time = state.clock.elapsedTime;

    for (let i = 0; i < brainData.nVerts; i++) {
      const label = brainData.labels[i];
      const metric = labelToMetric[label];

      if (metric && activeMetrics[metric] !== undefined) {
        const value = activeMetrics[metric];
        const pulse = 0.85 + Math.sin(time * 1.5 + i * 0.001) * 0.15;
        const intensity = value * pulse;

        const regionColor = METRIC_REGION_COLORS[metric];
        colors[i * 3] = BASE_COLOR.r + (regionColor.r - BASE_COLOR.r) * intensity;
        colors[i * 3 + 1] = BASE_COLOR.g + (regionColor.g - BASE_COLOR.g) * intensity;
        colors[i * 3 + 2] = BASE_COLOR.b + (regionColor.b - BASE_COLOR.b) * intensity;
      } else {
        colors[i * 3] = BASE_COLOR.r;
        colors[i * 3 + 1] = BASE_COLOR.g;
        colors[i * 3 + 2] = BASE_COLOR.b;
      }
    }

    geometry.attributes.color.needsUpdate = true;

    if (meshRef.current) {
      meshRef.current.rotation.y += 0.002;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshPhongMaterial
        vertexColors
        specular="#446688"
        shininess={20}
        transparent
        opacity={0.92}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function BrainScene({ metrics, brainData, timeline, currentTime }) {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 4, 5]} intensity={0.7} color="#88aaff" />
      <directionalLight position={[-3, -1, -4]} intensity={0.35} color="#aa88ff" />
      <pointLight position={[0, 0, 4]} intensity={0.3} color="#00D4FF" distance={10} />
      <pointLight position={[0, 3, -2]} intensity={0.3} color="#6644cc" distance={8} />

      <Float speed={0.5} rotationIntensity={0.05} floatIntensity={0.15}>
        <group scale={[1.2, 1.2, 1.2]} rotation={[-Math.PI / 2, 0, 0]}>
          <RealBrain metrics={metrics} brainData={brainData} timeline={timeline} currentTime={currentTime} />
        </group>
      </Float>

      <OrbitControls
        enableZoom={true}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.3}
        minPolarAngle={Math.PI / 5}
        maxPolarAngle={Math.PI * 4 / 5}
        minDistance={2}
        maxDistance={6}
      />
    </>
  );
}

function FallbackBrain() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-nl-cyan/10 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-nl-cyan animate-pulse" />
        </div>
        <p className="text-xs text-text-muted">Loading brain mesh...</p>
      </div>
    </div>
  );
}

export default function BrainViewer({ metrics, timeline, currentTime = 0 }) {
  const brainData = useBrainData();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.8 }}
      className="rounded-xl border border-card-border bg-card/20 overflow-hidden h-full min-h-[320px]"
    >
      {brainData ? (
        <Canvas
          camera={{ position: [0, 0.3, 3.2], fov: 50 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: 'transparent' }}
        >
          <BrainScene metrics={metrics} brainData={brainData} timeline={timeline} currentTime={currentTime} />
        </Canvas>
      ) : (
        <FallbackBrain />
      )}
    </motion.div>
  );
}
