// src/components/TreeScene.tsx

import React, { useEffect, useRef, useState, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Html, Sky, Stars } from '@react-three/drei';
import { EffectComposer, SSAO, Bloom, DepthOfField } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Message, Memory } from '@/types/memory';

// 定义 Props 接口
interface TreeSceneProps {
  messages: Memory[];
  selectedMemory?: Memory | null;
  onSelectMemory?: (memory: Memory | null) => void;
}

interface MemoryFruitProps {
  memory: Memory;
  position: [number, number, number];
  onClick: () => void;
}

// 创建默认纹理函数
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
  const groupRef = useRef<THREE.Group>(null!);
  const fruitMeshRef = useRef<THREE.Mesh>(null!);
  const lightRef = useRef<THREE.PointLight>(null!);

  // 为每个记忆生成唯一的颜色和外观，基于记忆内容的哈希
  const fruitSeed = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < memory.content.length; i++) {
      hash = ((hash << 5) - hash) + memory.content.charCodeAt(i);
      hash |= 0; // 转换为32位整数
    }
    return Math.abs(hash) / 2147483647; // 归一化到0-1范围
  }, [memory.content]);
  
  // 基于哈希生成水果特性
  const fruitType = useMemo(() => {
    const types = [
      { 
        color: "#FF8C00", emissive: "#FF4500", // 橙色/金橙色
        shape: "apple", size: 0.42,
        name: "金苹果"
      },
      { 
        color: "#FF1493", emissive: "#C71585", // 粉红色
        shape: "peach", size: 0.38,
        name: "蜜桃"
      },
      { 
        color: "#9370DB", emissive: "#8A2BE2", // 紫色
        shape: "plum", size: 0.35, 
        name: "紫梅"
      },
      { 
        color: "#FFD700", emissive: "#FFA500", // 金色
        shape: "star", size: 0.32, 
        name: "星果"
      },
      { 
        color: "#00BFFF", emissive: "#1E90FF", // 蓝色
        shape: "berry", size: 0.28, 
        name: "蓝莓"
      }
    ];
    return types[Math.floor(fruitSeed * types.length)];
  }, [fruitSeed]);

  useFrame((state) => {
    const elapsed = state.clock.elapsedTime;
    if (groupRef.current) {
      // 给每个水果不同的旋转速度和浮动高度
      const rotationSpeed = 0.01 + fruitSeed * 0.02;
      const floatAmplitude = 0.1 + fruitSeed * 0.1;
      const floatFrequency = 1.5 + fruitSeed * 1.5;
      
      groupRef.current.rotation.y += rotationSpeed;
      groupRef.current.position.y = position[1] + Math.sin(elapsed * floatFrequency) * floatAmplitude;
    }
    if (fruitMeshRef.current) {
      // 基础缩放：悬停时更大，不悬停时正常大小
      const baseScale = hovered ? 1.5 : 1;
      // 脉动效果，每个水果有稍微不同的脉动频率
      const pulsateFreq = 2.5 + fruitSeed * 1.5;
      const pulsate = 0.08 * Math.sin(elapsed * pulsateFreq);
      fruitMeshRef.current.scale.set(baseScale + pulsate, baseScale + pulsate, baseScale + pulsate);
    }
    if (lightRef.current) {
      // 根据悬停状态动态调整光源强度，并添加轻微脉动
      const baseIntensity = hovered ? 3 : 1.2;
      const pulsateIntensity = 0.4 * Math.sin(elapsed * 3);
      lightRef.current.intensity = baseIntensity + pulsateIntensity;
      
      // 悬停时改变颜色
      if (hovered) {
        lightRef.current.color.set("#FFF5D4");
      } else {
        const hue = (fruitSeed * 60) + 30; // 30-90度色相，黄到橙色范围
        lightRef.current.color.set(`hsl(${hue}, 100%, 75%)`);
      }
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* 发光效果 */}
      <pointLight
        ref={lightRef}
        position={[0, 0, 0]}
        distance={3}
        decay={1.5}
      />

      {/* 主水果形状 */}
      <mesh
        ref={fruitMeshRef}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        castShadow
      >
        <sphereGeometry args={[fruitType.size, 64, 64]} />
        <meshPhysicalMaterial
          color={fruitType.color}
          emissive={fruitType.emissive}
          emissiveIntensity={hovered ? 0.8 : 0.4}
          metalness={0.5}
          roughness={0.3}
          clearcoat={1}
          clearcoatRoughness={0.2}
          envMapIntensity={1.2}
        />
      </mesh>

      {/* 水果茎和叶子 */}
      <group position={[0, fruitType.size * 1.1, 0]} scale={hovered ? 1.2 : 1}>
        {/* 茎 */}
        <mesh>
          <cylinderGeometry args={[0.05, 0.03, 0.25, 8]} />
          <meshStandardMaterial color="#5D4037" roughness={0.9} />
        </mesh>
        
        {/* 叶子1 */}
        <mesh position={[0.1, 0.05, 0]} rotation={[0, 0, Math.PI / 6]}>
          <tetrahedronGeometry args={[0.15, 0]} />
          <meshStandardMaterial 
            color="#4CAF50" 
            roughness={0.7}
            metalness={0.1}
            flatShading
          />
        </mesh>
        
        {/* 叶子2 */}
        <mesh position={[-0.1, 0.05, 0]} rotation={[0, 0, -Math.PI / 6]}>
          <tetrahedronGeometry args={[0.12, 0]} />
          <meshStandardMaterial 
            color="#388E3C" 
            roughness={0.7}
            metalness={0.1}
            flatShading
          />
        </mesh>
      </group>

      {/* 悬停时的粒子效果 */}
      {hovered && (
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={70}
              array={new Float32Array(
                Array.from({ length: 70 * 3 }, () => (Math.random() - 0.5) * 2.5)
              )}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.08}
            color="#FFF9C4"
            transparent
            opacity={0.8}
            sizeAttenuation
          />
        </points>
      )}

      {/* 悬停时显示记忆预览 */}
      {hovered && (
        <Html distanceFactor={5}>
          <div className="bg-gradient-to-r from-amber-100/90 to-amber-50/90 backdrop-blur-sm px-4 py-2 rounded-xl shadow-xl text-sm font-medium border border-amber-300/30 animate-pulse text-amber-800">
            <span className="text-amber-600 font-bold">{fruitType.name}:</span> {memory.content.slice(0, 20)}...
          </div>
        </Html>
      )}
    </group>
  );
}

function Tree({ memories, onMemoryClick }: { memories: Memory[]; onMemoryClick: (memory: Memory) => void }) {
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
      {/* 更美观的树干 */}
      <mesh position={[0, -1, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.5, 2.2, 5, 32, 16, true]} />
        <meshStandardMaterial
          map={trunkTexture}
          color="#5D4037"
          displacementScale={0.2}
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>

      {/* 树干纹理和细节 */}
      <group position={[0, 0, 0]}>
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh 
            key={`bark-${i}`} 
            position={[
              Math.cos(i / 8 * Math.PI * 2) * 1.55,
              -1 + Math.random() * 3,
              Math.sin(i / 8 * Math.PI * 2) * 1.55
            ]}
            rotation={[0, Math.PI / 4 * i, 0]}
          >
            <boxGeometry args={[0.3, 0.8 + Math.random(), 0.05]} />
            <meshStandardMaterial 
              color="#3E2723" 
              roughness={1}
            />
          </mesh>
        ))}
      </group>

      {/* 树洞入口 - 更加突出和可见 */}
      <group position={[0, 0.5, 1.6]} rotation={[0, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.9, 0.9, 1.6, 32, 1, true]} />
          <meshStandardMaterial
            color="#1A0F07"
            emissive="#422006"
            emissiveIntensity={0.3}
            roughness={0.9}
            metalness={0.2}
          />
        </mesh>
        <pointLight position={[0, 0, -0.5]} color="#FFE6B3" intensity={3} distance={4} decay={2} />
        <Html transform distanceFactor={2.5} position={[0, 0, 0.5]}>
          <div className="bg-yellow-500/20 backdrop-blur-sm px-3 py-1 rounded-lg text-yellow-400 text-lg font-medium drop-shadow-glow animate-pulse">
            秘密树洞✨
          </div>
        </Html>
      </group>

      {/* 树叶 - 更加丰富的色彩和结构 */}
      <group position={[0, 4, 0]}>
        {/* 主要树叶层 */}
        <mesh>
          <sphereGeometry args={[4, 32, 32]} />
          <meshStandardMaterial
            color="#2E7D32"
            roughness={0.8}
            metalness={0.1}
            transparent
            opacity={0.9}
          />
        </mesh>
        
        {/* 表面树叶细节 */}
        {Array.from({ length: 16 }).map((_, i) => (
          <mesh
            key={`leaf-cluster-${i}`}
            position={[
              Math.cos(i / 16 * Math.PI * 2) * 3.8 * Math.random(),
              Math.sin(i * 0.4) * 1.2,
              Math.sin(i / 16 * Math.PI * 2) * 3.8 * Math.random()
            ]}
            rotation={[Math.random() * 0.3, Math.random() * Math.PI * 2, Math.random() * 0.3]}
          >
            <sphereGeometry args={[1 + Math.random() * 0.8, 16, 16]} />
            <meshStandardMaterial
              color={`hsl(${100 + Math.random() * 40}, ${60 + Math.random() * 20}%, ${40 + Math.random() * 15}%)`}
              transparent
              opacity={0.9}
              roughness={0.7}
            />
          </mesh>
        ))}
      </group>

      {/* 绘制记忆果实 - 更加均匀分布在树周围 */}
      {memories.map((memory, index) => {
        // 使用黄金比例分布算法，确保果实均匀分布，避免聚集
        const goldenRatio = (1 + Math.sqrt(5)) / 2;
        const angleOffset = index * goldenRatio * Math.PI * 2;
        
        // 根据内容长度决定高度 - 让重要记忆更突出
        const contentFactor = Math.min(1, memory.content.length / 200);
        const heightFactor = 0.5 + contentFactor * 0.5;
        
        // 计算位置 - 形成螺旋状分布
        const yBase = 2 + (index % 3) * 1.5; // 基础高度
        const angle = angleOffset % (Math.PI * 2);
        const radius = 4.8 + Math.sin(index * 0.7) * 0.8; // 调大半径
        const height = yBase + Math.sin(angle * 2) * heightFactor;

        return (
          <MemoryFruit
            key={memory.id}
            memory={memory}
            position={[
              Math.cos(angle) * radius,
              height,
              Math.sin(angle) * radius
            ]}
            onClick={() => onMemoryClick(memory)}
          />
        );
      })}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]} receiveShadow>
        <circleGeometry args={[15, 64]} />
        <meshStandardMaterial color="#3A5F3E" roughness={0.8} metalness={0.2} />
      </mesh>
    </group>
  );
}

function MemoryDetail({ memory, onClose }: { memory: Memory | null; onClose: () => void }) {
  if (!memory) return null;
  
  // 获取时间相关的数据
  const date = new Date(memory.timestamp);
  const formattedDate = date.toLocaleDateString('zh-CN');
  const formattedTime = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
      <div className="bg-white/90 backdrop-blur-lg rounded-xl shadow-2xl p-6 max-w-lg w-full mx-4 border border-white/20">
        {/* 标题 */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-indigo-800">记忆果实</h3>
          <div className="text-sm text-gray-500">
            {formattedDate} {formattedTime}
          </div>
        </div>
        
        <div className="space-y-5">
          {/* 用户输入内容 */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl shadow-sm">
            {memory.audioUrl && (
              <div className="mb-3">
                <audio 
                  controls 
                  src={memory.audioUrl} 
                  className="w-full rounded-lg"
                  autoPlay
                />
              </div>
            )}
            <p className="text-gray-800 font-medium">{memory.content}</p>
          </div>

          {/* AI回应 */}
          {memory.aiResponse && (
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-5 rounded-xl shadow-sm border border-yellow-100">
              <div className="flex items-center mb-2">
                <span className="text-xl mr-2">✨</span>
                <h4 className="font-medium text-amber-800">树洞回应</h4>
              </div>
              <p className="text-gray-700">{memory.aiResponse}</p>
            </div>
          )}
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-lg font-medium hover:opacity-90 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            关闭记忆之窗
          </button>
        </div>
      </div>
    </div>
  );
}

// 新增组件：魔法尘粒效果
function MagicalDust() {
  const groupRef = useRef<THREE.Group>(null!);
  const particlesCount = 1200; // 增加粒子数量
  
  // 创建三种不同类型的粒子
  const dustTypes = useMemo(() => {
    return [
      {
        count: 600,
        color: "#FFF9C4", // 淡黄色
        size: 0.08,
        speed: 0.05,
        range: 20,
        height: 15,
        opacity: 0.7
      },
      {
        count: 400,
        color: "#E1F5FE", // 淡蓝色
        size: 0.12,
        speed: 0.03,
        range: 25,
        height: 20,
        opacity: 0.5
      },
      {
        count: 200,
        color: "#FCE4EC", // 淡粉色
        size: 0.15,
        speed: 0.07,
        range: 18,
        height: 12,
        opacity: 0.6
      }
    ];
  }, []);
  
  // 为每种粒子创建位置数组
  const particlesGroups = useMemo(() => {
    return dustTypes.map(type => {
      const positions = new Float32Array(type.count * 3);
      for (let i = 0; i < type.count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * type.range;
        positions[i * 3] = Math.cos(angle) * radius; // x
        positions[i * 3 + 1] = Math.random() * type.height; // y: 0 ~ height
        positions[i * 3 + 2] = Math.sin(angle) * radius; // z
      }
      return { positions, type };
    });
  }, [dustTypes]);

  useFrame((state, delta) => {
    const elapsed = state.clock.elapsedTime;
    
    // 创建一个缓慢旋转和上下移动的效果
    if (groupRef.current) {
      groupRef.current.rotation.y = elapsed * 0.05;
      // 添加轻微的上下波动
      groupRef.current.position.y = Math.sin(elapsed * 0.2) * 0.5;
    }
    
    // 为粒子添加自定义动画 - 可以在这里添加更高级的动画效果
  });

  return (
    <group ref={groupRef}>
      {particlesGroups.map((group, index) => (
        <points key={`dust-${index}`}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={group.positions.length / 3}
              array={group.positions}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            color={group.type.color}
            size={group.type.size}
            transparent
            opacity={group.type.opacity}
            sizeAttenuation
            depthWrite={false}
          />
        </points>
      ))}
      
      {/* 添加中心发光效果 */}
      <pointLight position={[0, 8, 0]} intensity={0.6} color="#FFF8E1" distance={15} decay={2} />
    </group>
  );
}

function Scene({ messages, selectedMemory: propSelectedMemory, onSelectMemory: propOnSelectMemory }: { 
  messages: Memory[], 
  selectedMemory?: Memory | null,
  onSelectMemory?: (memory: Memory | null) => void
}) {
  // 使用内部状态或props提供的状态
  const [internalSelectedMemory, setInternalSelectedMemory] = useState<Memory | null>(null);
  const selectedMemory = propSelectedMemory !== undefined ? propSelectedMemory : internalSelectedMemory;
  
  // 处理内部和外部的内存选择
  const handleSelectMemory = (memory: Memory | null) => {
    if (propOnSelectMemory) {
      propOnSelectMemory(memory);
    } else {
      setInternalSelectedMemory(memory);
    }
  };

  return (
    <>
      <Canvas
        shadows
        camera={{ position: [0, 6, 15], fov: 50 }} // 调整相机位置和视野
        gl={{ antialias: true, alpha: true }}
        // 将背景设置为透明，背景动画由外层容器 CSS 控制
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <EffectComposer multisampling={8}>
            <SSAO
              samples={31}
              radius={0.2}
              intensity={12}
              luminanceInfluence={0.6}
              worldDistanceThreshold={100}
              worldDistanceFalloff={1.0}
              worldProximityThreshold={1.0}
              worldProximityFalloff={1.0}
            />
            <Bloom 
              intensity={0.6} 
              luminanceThreshold={0.6} 
              luminanceSmoothing={0.9} 
              height={300} 
            />
            <DepthOfField focusDistance={0.02} focalLength={0.05} bokehScale={2} />
          </EffectComposer>

          {/* 提高环境光亮度，改进整体照明 */}
          <ambientLight intensity={0.6} color="#FFF8E1" />
          
          {/* 主光源 - 明亮温暖的阳光 */}
          <directionalLight
            position={[8, 15, 10]}
            intensity={1.5}
            color="#FFFAF0"
            shadow-mapSize={[2048, 2048]}
            shadow-bias={-0.0005}
            castShadow
          >
            <orthographicCamera attach="shadow-camera" args={[-12, 12, 12, -12]} />
          </directionalLight>
          
          {/* 补充光源 - 创造更丰富的照明效果 */}
          <pointLight position={[-8, 6, -8]} intensity={0.8} color="#FFD2B5" distance={25} />
          <pointLight position={[0, -2, 8]} intensity={0.4} color="#BBDEFB" distance={15} />

          {/* 天空和星星 */}
          <Sky 
            sunPosition={[4, 2, 8]} 
            turbidity={6} 
            rayleigh={2} 
            mieCoefficient={0.005} 
            mieDirectionalG={0.8}
          />
          <Stars radius={500} depth={150} count={7000} factor={4} fade speed={1} />

          {/* 主树和记忆果实 */}
          <Tree memories={messages} onMemoryClick={handleSelectMemory} />
          
          {/* 魔法效果增强 */}
          <MagicalDust />
          
          {/* 简化控制，设置更舒适的视角限制 */}
          <OrbitControls
            enableZoom={true}
            minDistance={10}
            maxDistance={22}
            maxPolarAngle={Math.PI * 0.45} // 限制俯角，避免看到树下
            minPolarAngle={Math.PI * 0.1}  // 限制仰角
            enablePan={false}
            enableDamping
            dampingFactor={0.12}
            rotateSpeed={0.6}
          />
        </Suspense>
      </Canvas>

      {selectedMemory && (
        <MemoryDetail 
          memory={selectedMemory} 
          onClose={() => handleSelectMemory(null)} 
        />
      )}
    </>
  );
}

export default function TreeScene({ messages, selectedMemory, onSelectMemory }: TreeSceneProps) {
  return (
    // 外层容器添加 CSS 类 animate-bg 用于背景渐变动画
    <div className="relative h-screen w-full animate-bg">
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-full">
            <div className="text-2xl text-gray-600">Loading Magical Tree...</div>
          </div>
        }
      >
        <Scene 
          messages={messages} 
          selectedMemory={selectedMemory}
          onSelectMemory={onSelectMemory}
        />
      </Suspense>

      <div className="absolute top-5 left-5 bg-white/80 backdrop-blur rounded-lg p-4 shadow-lg">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">记忆之树</h1>
        <p className="text-gray-600">点击发光的果实查看记忆</p>
      </div>
    </div>
  );
}
