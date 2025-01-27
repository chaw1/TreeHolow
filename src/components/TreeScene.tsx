// src/components/TreeScene.tsx

import React, { useEffect, useRef, useState, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Html, Sky, Stars } from '@react-three/drei';
import { EffectComposer, SSAO, Bloom, DepthOfField } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Message, Memory } from '@/types/memory';

// 定义 Props 接口
interface TreeSceneProps {
  messages: Memory[]; // 修改为 Memory[]
}


interface MemoryFruitProps {
  memory: Memory;
  position: [number, number, number];
  onClick: () => void;
}

function createDefaultTexture(color: string = '#4a4a4a'): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  if (context) {
    context.fillStyle = color;
    context.fillRect(0, 0, 256, 256);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function MemoryFruit({ memory, position, onClick }: MemoryFruitProps) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Group>(null!);
  const defaultLeafTexture = useMemo(() => createDefaultTexture('#4CAF50'), []);
  const leafTexture = useMemo(() => {
    try {
        // eslint-disable-next-line react-hooks/rules-of-hooks
      return useLoader(THREE.TextureLoader, '/textures/leaf_alpha.png');
    } catch {
      return defaultLeafTexture;
    }
  }, [defaultLeafTexture]);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.02;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  return (
    <group ref={meshRef} position={position}>
      <pointLight
        position={[0, 0, 0]}
        color={hovered ? "#FFE08C" : "#FFFFFF"}
        intensity={hovered ? 2 : 0.8}
        distance={1.5}
      />

      <mesh
        scale={hovered ? 1.4 : 1}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        castShadow
      >
        <sphereGeometry args={[0.35, 64, 64]} />
        <meshPhysicalMaterial
          color="#FFD700"
          emissive="#FFA500"
          emissiveIntensity={0.5}
          metalness={0.7}
          roughness={0.3}
          clearcoat={1}
        />
      </mesh>

      <mesh
        position={[0.25, 0.35, 0]}
        rotation={[0, 0, Math.PI/3]}
        scale={hovered ? 1.2 : 1}
      >
        <planeGeometry args={[0.25, 0.5]} />
        <meshStandardMaterial
          color="#4CAF50"
          transparent
          alphaMap={leafTexture}
          side={THREE.DoubleSide}
        />
      </mesh>

      {hovered && (
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={50}
              array={new Float32Array(
                Array.from({ length: 50 * 3 }, () => (Math.random() - 0.5) * 2)
              )}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.05}
            color="#FFEBB7"
            transparent
            opacity={0.8}
            sizeAttenuation
          />
        </points>
      )}

      {hovered && (
        <Html distanceFactor={5}>
          <div className="bg-white/90 backdrop-blur px-3 py-1 rounded-full shadow-lg text-xs font-medium animate-pulse">
            {memory.content.slice(0, 15)}...
          </div>
        </Html>
      )}
    </group>
  );
}

function Tree({ memories, onMemoryClick }: { memories: Memory[], onMemoryClick: (memory: Memory) => void }) {
  const defaultTrunkTexture = useMemo(() => createDefaultTexture('#8B4513'), []);
  const trunkTexture = useMemo(() => {
    try {
        // eslint-disable-next-line react-hooks/rules-of-hooks
      return useLoader(THREE.TextureLoader, '/textures/tree_trunk.jpg');
    } catch {
      return defaultTrunkTexture;
    }
  }, [defaultTrunkTexture]);

  return (
    <group>
      <mesh position={[0, -1, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.2, 1.8, 5, 64, 64, true]} />
        <meshStandardMaterial
          map={trunkTexture}
          displacementScale={0.1}
          roughness={0.8}
          metalness={0.3}
        />
      </mesh>

      <group position={[0.8, 1.2, 0.5]} rotation={[0, Math.PI / 3, -0.1]}>
        <mesh>
          <cylinderGeometry args={[0.6, 0.5, 1.2, 64, 1, true]} />
          <meshStandardMaterial
            color="#1A0F07"
            displacementScale={0.05}
            roughness={0.9}
            metalness={0.1}
          />
        </mesh>
        <pointLight position={[0.3, 0, 0.3]} color="#FFE6B3" intensity={2} distance={3} decay={2} />
        <Html transform distanceFactor={3}>
          <div className="text-yellow-500 text-sm animate-pulse">秘密树洞✨</div>
        </Html>
      </group>

      <group position={[0, 3.5, 0]}>
        {Array.from({ length: 24 }).map((_, i) => (
          <mesh
            key={i}
            rotation={[Math.random() * Math.PI, Math.random() * Math.PI, 0]}
            position={[
              Math.cos((i / 24) * Math.PI * 2) * 3.5,
              Math.sin(i * 0.5) * 0.8,
              Math.sin((i / 24) * Math.PI * 2) * 3.5
            ]}
          >
            <sphereGeometry args={[1.2 + Math.random() * 0.5, 32, 32]} />
            <meshStandardMaterial
              color={`hsl(${80 + Math.random() * 20}, 60%, 50%)`}
              transparent
              opacity={0.7}
              roughness={0.8}
            />
          </mesh>
        ))}
      </group>

      {memories.map((memory, index) => {
        const angle = (index / memories.length) * Math.PI * 2;
        const radius = 3.2 + Math.sin(index) * 0.5;
        const height = 1.5 + Math.sin(angle * 3) * 0.8;

        return (
          <MemoryFruit
            key={memory.id}
            memory={memory}
            position={[
              Math.cos(angle) * radius,
              height * 2.2,
              Math.sin(angle) * radius
            ]}
            onClick={() => onMemoryClick(memory)}
          />
        );
      })}

      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -1.2, 0]} receiveShadow>
        <circleGeometry args={[15, 64]} />
        <meshStandardMaterial color="#3A5F3E" roughness={0.8} metalness={0.2} />
      </mesh>
    </group>
  );
}

function MemoryDetail({ memory, onClose }: { memory: Memory | null, onClose: () => void }) {
  if (!memory) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
      <div className="bg-white/90 backdrop-blur-lg rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 border border-white/20">
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg">
            {memory.audioUrl && (
              <audio controls src={memory.audioUrl} className="w-full mb-3 rounded-lg" />
            )}
            <p className="text-gray-800 font-medium">{memory.content}</p>
          </div>

          {memory.aiResponse && (
            <div className="bg-gray-50/90 p-4 rounded-lg border border-gray-100">
              <p className="text-gray-700 italic">✨ {memory.aiResponse}</p>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-6 px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity w-full"
        >
          关闭记忆之窗
        </button>
      </div>
    </div>
  );
}

function Scene({ messages }: { messages: Memory[] }) {
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);

  // @ts-ignore
    // @ts-ignore
    return (
    <>
        <Canvas
          shadows
          camera={{ position: [0, 5, 12], fov: 55 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: 'linear-gradient(180deg, #87CEEB 0%, #E0F7FA 100%)' }}
        >
          <Suspense fallback={null}>
            <EffectComposer multisampling={8}>
              <SSAO
                samples={31}
                radius={0.1}
                intensity={20}
                luminanceInfluence={0.6}
                worldDistanceThreshold={100}       // 新增属性
                worldDistanceFalloff={1.0}         // 新增属性
                worldProximityThreshold={1.0}      // 新增属性
                worldProximityFalloff={1.0}        // 新增属性
              />
              <Bloom intensity={0.5} luminanceThreshold={0.8} luminanceSmoothing={0.9} height={300} />
              <DepthOfField focusDistance={0.02} focalLength={0.05} bokehScale={3} />
            </EffectComposer>

          <ambientLight intensity={0.4} color="#FFEEDD" />
          <directionalLight
            position={[10, 12, 8]}
            intensity={1.2}
            shadow-mapSize={[2048, 2048]}
            shadow-bias={-0.001}
          >
            <orthographicCamera attach="shadow-camera" args={[-10, 10, 10, -10]} />
          </directionalLight>

          <Sky sunPosition={[0, 1, 0]} turbidity={8} rayleigh={4} />
          <Stars radius={500} depth={100} count={5000} factor={4} />

          <Tree memories={messages} onMemoryClick={setSelectedMemory} />
          <OrbitControls
            enableZoom={true}
            minDistance={8}
            maxDistance={20}
            enablePan={false}
          />
        </Suspense>
      </Canvas>

      {selectedMemory && (
        <MemoryDetail memory={selectedMemory} onClose={() => setSelectedMemory(null)} />
      )}
    </>
  );
}

export default function TreeScene({ messages }: TreeSceneProps) {
  return (
    <div className="relative h-screen w-full">
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-full">
            <div className="text-2xl text-gray-600">Loading Magical Tree...</div>
          </div>
        }
      >
        <Scene messages={messages} />
      </Suspense>

      <div className="absolute top-5 left-5 bg-white/80 backdrop-blur rounded-lg p-4 shadow-lg">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">记忆之树</h1>
        <p className="text-gray-600">点击发光的果实查看记忆</p>
      </div>
    </div>
  );
}