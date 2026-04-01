import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { metricColors, metricLabels, hexToRgba } from '../lib/colors';

const METRIC_REGION_COLORS = {
  attentionFocus: new THREE.Color(metricColors.attentionFocus),
  narrativeComprehension: new THREE.Color(metricColors.narrativeComprehension),
  emotionalResonance: new THREE.Color(metricColors.emotionalResonance),
  memorability: new THREE.Color(metricColors.memorability),
  faceImpact: new THREE.Color(metricColors.faceImpact),
  sceneImpact: new THREE.Color(metricColors.sceneImpact),
  motionEnergy: new THREE.Color(metricColors.motionEnergy),
};

const BASE_COLOR = new THREE.Color('#0e1a2e');
const DIM_COLOR = new THREE.Color('#0a1220');

// Approximate 3D positions for each metric's label on the brain surface
// These are in the brain's local space (after rotation)
const REGION_LABELS = [
  { metric: 'attentionFocus', label: 'Attention', pos: [0, 0.6, 0.9] },
  { metric: 'emotionalResonance', label: 'Emotion', pos: [-0.7, 0.1, 0.5] },
  { metric: 'memorability', label: 'Memory', pos: [0.7, 0.0, 0.3] },
  { metric: 'narrativeComprehension', label: 'Language', pos: [-0.9, 0.2, -0.3] },
  { metric: 'faceImpact', label: 'Faces', pos: [0.5, -0.5, -0.2] },
  { metric: 'sceneImpact', label: 'Vision', pos: [0, 0.3, -1.0] },
  { metric: 'motionEnergy', label: 'Motion', pos: [0, 0.9, 0.1] },
];

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
        // Unassigned regions — very dim so metric regions stand out
        colors[i * 3] = DIM_COLOR.r;
        colors[i * 3 + 1] = DIM_COLOR.g;
        colors[i * 3 + 2] = DIM_COLOR.b;
      }
    }

    geometry.attributes.color.needsUpdate = true;

    // No auto-rotation — user controls the brain position
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

function RegionLabel({ region, value }) {
  const color = metricColors[region.metric];
  const pct = Math.round((value || 0) * 100);

  return (
    <group position={region.pos}>
      <Html
        center
        distanceFactor={4}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        <div
          className="flex items-center gap-1.5 px-2 py-1 rounded whitespace-nowrap"
          style={{
            background: 'rgba(6, 11, 20, 0.85)',
            border: `1px solid ${hexToRgba(color, 0.3)}`,
            boxShadow: `0 0 8px ${hexToRgba(color, 0.15)}`,
          }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: color, boxShadow: `0 0 4px ${color}` }}
          />
          <span
            className="font-mono text-[9px] font-medium tracking-wide uppercase"
            style={{ color }}
          >
            {region.label}
          </span>
          <span className="font-mono text-[9px] text-text-dim">
            {pct}
          </span>
        </div>
      </Html>
    </group>
  );
}

function BrainScene({ metrics, brainData, timeline, currentTime }) {
  const activeMetrics = getMetricsAtTime(metrics, timeline, currentTime);

  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 4, 5]} intensity={0.7} color="#88aaff" />
      <directionalLight position={[-3, -1, -4]} intensity={0.35} color="#aa88ff" />
      <pointLight position={[0, 0, 4]} intensity={0.3} color="#6C9FFF" distance={10} />
      <pointLight position={[0, 3, -2]} intensity={0.3} color="#6644cc" distance={8} />

      <group scale={[1.2, 1.2, 1.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <RealBrain metrics={metrics} brainData={brainData} timeline={timeline} currentTime={currentTime} />

        {/* Floating labels on brain regions */}
        {REGION_LABELS.map((region) => (
          <RegionLabel
            key={region.metric}
            region={region}
            value={activeMetrics?.[region.metric]}
          />
        ))}
      </group>

      <OrbitControls
        enableZoom={true}
        enablePan={false}
        autoRotate={false}
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
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary-dim flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
        </div>
        <p className="text-xs text-text-dim">Loading brain mesh...</p>
      </div>
    </div>
  );
}

function BrainLegend({ metrics }) {
  if (!metrics) return null;

  return (
    <div className="absolute bottom-3 left-3 flex flex-col gap-1">
      {Object.entries(metricLabels).map(([key, label]) => {
        const color = metricColors[key];
        const value = Math.round((metrics[key] || 0) * 100);
        return (
          <div key={key} className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: color, boxShadow: `0 0 4px ${hexToRgba(color, 0.5)}` }}
            />
            <span className="font-mono text-[10px] text-text-dim leading-none">
              {label}
            </span>
            <span className="font-mono text-[10px] font-medium leading-none" style={{ color }}>
              {value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function BrainViewer({ metrics, timeline, currentTime = 0 }) {
  const brainData = useBrainData();
  const activeMetrics = getMetricsAtTime(metrics, timeline, currentTime);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.8 }}
      className="relative rounded-lg border border-border bg-depth-1 overflow-hidden h-full min-h-[320px]"
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

      {/* HTML overlay legend — always visible, not inside Three.js */}
      <BrainLegend metrics={activeMetrics} />
    </motion.div>
  );
}
