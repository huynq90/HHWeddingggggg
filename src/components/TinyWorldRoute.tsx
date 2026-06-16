import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Edges, Html } from '@react-three/drei';
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { scenes, type Scene } from '../data/scenes';
import { StoryCard } from './StoryCard';
import { WeddingPortal } from './WeddingPortal';

type InputState = {
  x: number;
  z: number;
};

type Checkpoint = {
  scene: Scene;
  position: [number, number, number];
};

const checkpoints: Checkpoint[] = [
  { scene: scenes[0], position: [-5.2, 0.2, -2.2] },
  { scene: scenes[1], position: [-2.5, 0.2, 1.45] },
  { scene: scenes[2], position: [1.25, 0.2, -2.15] },
  { scene: scenes[3], position: [4.4, 0.2, -0.2] },
  { scene: scenes[4], position: [-4.3, 0.2, 3.85] },
  { scene: scenes[5], position: [0.2, 0.2, 4.25] },
  { scene: scenes[6], position: [4.65, 0.2, 4.1] },
];

const worldBounds = {
  minX: -6.2,
  maxX: 5.7,
  minZ: -3.4,
  maxZ: 5.2,
};

function SketchEdges({ color = '#26313a' }: { color?: string }) {
  return <Edges color={color} threshold={45} />;
}

export function TinyWorldRoute() {
  const inputRef = useRef<InputState>({ x: 0, z: 0 });
  const [activeScene, setActiveScene] = useState<Scene | null>(null);
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [ending, setEnding] = useState(false);

  const setInput = (partial: Partial<InputState>) => {
    inputRef.current = { ...inputRef.current, ...partial };
  };

  const stopInputAxis = (axis: keyof InputState) => {
    inputRef.current = { ...inputRef.current, [axis]: 0 };
  };

  useEffect(() => {
    const pressed = new Set<string>();
    const sync = () => {
      inputRef.current = {
        x: Number(pressed.has('arrowright') || pressed.has('d')) - Number(pressed.has('arrowleft') || pressed.has('a')),
        z: Number(pressed.has('arrowdown') || pressed.has('s')) - Number(pressed.has('arrowup') || pressed.has('w')),
      };
    };

    const onDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (['arrowright', 'd', 'arrowleft', 'a', 'arrowdown', 's', 'arrowup', 'w'].includes(key)) {
        event.preventDefault();
        pressed.add(key);
        sync();
      }
    };

    const onUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (pressed.delete(key)) {
        event.preventDefault();
        sync();
      }
    };

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);

  const handleCheckpoint = (scene: Scene) => {
    if (scene.id === 'wedding') {
      setEnding(true);
      return;
    }

    setVisited((current) => {
      if (current.has(scene.id)) {
        return current;
      }

      setActiveScene(scene);
      return new Set(current).add(scene.id);
    });
  };

  if (ending) {
    return <WeddingPortal showPhotoCard onOpenInvitation={() => (window.location.href = '/')} />;
  }

  return (
    <section className="game-screen tiny-world" aria-label="Tiny wedding island">
      <Canvas
        gl={{ antialias: false, powerPreference: 'default', alpha: false }}
        dpr={[1, 1.5]}
        camera={{ position: [0, 6.4, 7.8], fov: 44 }}
      >
        <color attach="background" args={['#77cdd2']} />
        <ambientLight intensity={1.75} />
        <directionalLight position={[4, 8, 4]} intensity={2.1} />
        <TinyWorldScene inputRef={inputRef} visited={visited} onCheckpoint={handleCheckpoint} />
      </Canvas>

      <div className="tiny-world-topbar">
        <a className="tiny-world-link" href="/" aria-label="Back to 2D invite">
          2D invite
        </a>
        <span>Tiny Island</span>
      </div>

      <div className="tiny-world-controls" aria-hidden="true">
        <button
          type="button"
          className="pad-button pad-up"
          onPointerDown={() => setInput({ z: -1 })}
          onPointerUp={() => stopInputAxis('z')}
          onPointerCancel={() => stopInputAxis('z')}
        >
          ↑
        </button>
        <button
          type="button"
          className="pad-button pad-left"
          onPointerDown={() => setInput({ x: -1 })}
          onPointerUp={() => stopInputAxis('x')}
          onPointerCancel={() => stopInputAxis('x')}
        >
          ←
        </button>
        <button
          type="button"
          className="pad-button pad-right"
          onPointerDown={() => setInput({ x: 1 })}
          onPointerUp={() => stopInputAxis('x')}
          onPointerCancel={() => stopInputAxis('x')}
        >
          →
        </button>
        <button
          type="button"
          className="pad-button pad-down"
          onPointerDown={() => setInput({ z: 1 })}
          onPointerUp={() => stopInputAxis('z')}
          onPointerCancel={() => stopInputAxis('z')}
        >
          ↓
        </button>
      </div>

      <div className="tiny-world-hint" aria-hidden="true">
        WASD / D-pad để đi, tới cột sáng để mở kỷ niệm
      </div>

      {activeScene && <StoryCard scene={activeScene} onContinue={() => setActiveScene(null)} />}
    </section>
  );
}

function TinyWorldScene({
  inputRef,
  visited,
  onCheckpoint,
}: {
  inputRef: MutableRefObject<InputState>;
  visited: Set<string>;
  onCheckpoint: (scene: Scene) => void;
}) {
  return (
    <>
      <Island />
      <MemorySpots visited={visited} />
      <PlayerController inputRef={inputRef} onCheckpoint={onCheckpoint} />
    </>
  );
}

function PlayerController({
  inputRef,
  onCheckpoint,
}: {
  inputRef: MutableRefObject<InputState>;
  onCheckpoint: (scene: Scene) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const lastCheckpointRef = useRef<string | null>(null);
  const { camera } = useThree();
  const velocity = useMemo(() => new THREE.Vector3(), []);
  const nextCamera = useMemo(() => new THREE.Vector3(), []);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    const player = groupRef.current;
    if (!player) {
      return;
    }

    const input = inputRef.current;
    velocity.set(input.x, 0, input.z);
    if (velocity.lengthSq() > 1) {
      velocity.normalize();
    }

    if (velocity.lengthSq() > 0.01) {
      const speed = 3.4;
      player.position.x += velocity.x * speed * delta;
      player.position.z += velocity.z * speed * delta;
      player.rotation.y = Math.atan2(velocity.x, velocity.z);
    }

    player.position.x = THREE.MathUtils.clamp(player.position.x, worldBounds.minX, worldBounds.maxX);
    player.position.z = THREE.MathUtils.clamp(player.position.z, worldBounds.minZ, worldBounds.maxZ);

    nextCamera.set(player.position.x, 6.2, player.position.z + 7.2);
    camera.position.lerp(nextCamera, 1 - Math.pow(0.001, delta));
    lookTarget.set(player.position.x, 0.8, player.position.z);
    camera.lookAt(lookTarget);

    const hit = checkpoints.find((checkpoint) => {
      const dx = checkpoint.position[0] - player.position.x;
      const dz = checkpoint.position[2] - player.position.z;
      return Math.hypot(dx, dz) < 0.68;
    });

    if (hit && lastCheckpointRef.current !== hit.scene.id) {
      lastCheckpointRef.current = hit.scene.id;
      onCheckpoint(hit.scene);
    }

    if (!hit) {
      lastCheckpointRef.current = null;
    }
  });

  return (
    <group ref={groupRef} position={[-4.25, 0.18, 0.15]}>
      <mesh position={[0, 0.72, 0]}>
        <capsuleGeometry args={[0.26, 0.62, 6, 12]} />
        <meshToonMaterial color="#fff8ed" />
        <SketchEdges />
      </mesh>
      <mesh position={[0, 1.25, 0]}>
        <sphereGeometry args={[0.28, 16, 12]} />
        <meshToonMaterial color="#f1b68d" />
        <SketchEdges />
      </mesh>
      <mesh position={[0, 1.42, -0.02]}>
        <boxGeometry args={[0.48, 0.16, 0.34]} />
        <meshToonMaterial color="#352430" />
        <SketchEdges />
      </mesh>
      <mesh position={[-0.22, 1.36, -0.02]}>
        <sphereGeometry args={[0.16, 10, 8]} />
        <meshToonMaterial color="#352430" />
        <SketchEdges />
      </mesh>
      <mesh position={[0.22, 1.36, -0.02]}>
        <sphereGeometry args={[0.16, 10, 8]} />
        <meshToonMaterial color="#352430" />
        <SketchEdges />
      </mesh>
      <mesh position={[0, 0.92, -0.18]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[0.5, 0.5, 0.14]} />
        <meshToonMaterial color="#d7555f" />
        <SketchEdges />
      </mesh>
      <mesh position={[0.26, 0.25, 0.05]}>
        <boxGeometry args={[0.12, 0.5, 0.16]} />
        <meshToonMaterial color="#24324a" />
        <SketchEdges />
      </mesh>
      <mesh position={[-0.26, 0.25, 0.05]}>
        <boxGeometry args={[0.12, 0.5, 0.16]} />
        <meshToonMaterial color="#24324a" />
        <SketchEdges />
      </mesh>
      <Html center position={[0, 1.85, 0]} distanceFactor={11}>
        <span className="tiny-player-label">Love Quest</span>
      </Html>
    </group>
  );
}

function Island() {
  return (
    <group>
      <mesh position={[0, -0.03, 0]}>
        <cylinderGeometry args={[7.2, 7.9, 0.24, 9]} />
        <meshToonMaterial color="#e6d6a8" />
        <SketchEdges color="#4c4b45" />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[6.8, 9]} />
        <meshToonMaterial color="#5fa66d" />
        <SketchEdges color="#2e5c3d" />
      </mesh>
      <mesh position={[0, 0.04, 0.55]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.2, 8.6]} />
        <meshToonMaterial color="#f4eadb" />
        <SketchEdges color="#b99d82" />
      </mesh>
      <mesh position={[-1.7, 0.05, -0.2]} rotation={[-Math.PI / 2, 0, 0.72]}>
        <planeGeometry args={[0.95, 7.6]} />
        <meshToonMaterial color="#d7ccb8" />
        <SketchEdges color="#9f927e" />
      </mesh>
      <mesh position={[2.3, 0.055, 1.5]} rotation={[-Math.PI / 2, 0, -0.7]}>
        <planeGeometry args={[0.86, 5.2]} />
        <meshToonMaterial color="#d7ccb8" />
        <SketchEdges color="#9f927e" />
      </mesh>

      <Water />
      <Buildings />
      <Trees />
      <WeddingArch />
      <ScenicProps />
    </group>
  );
}

function Water() {
  return (
    <group>
      <mesh position={[0, -0.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[18, 48]} />
        <meshBasicMaterial color="#77cdd2" />
      </mesh>
      {[
        [-5.2, -4.6, 2.2],
        [3.8, -4.9, 1.6],
        [6.4, 1.8, 1.9],
        [-6.7, 2.4, 1.4],
      ].map(([x, z, scale], index) => (
        <mesh key={index} position={[x, -0.12, z]} rotation={[-Math.PI / 2, 0, 0.2 * index]}>
          <torusGeometry args={[scale, 0.018, 5, 36]} />
          <meshBasicMaterial color="#a7ebe2" transparent opacity={0.42} />
        </mesh>
      ))}
      {[
        [-4.5, -5.8, 0.3],
        [4.9, -5.5, -0.2],
        [6.3, 3.7, 0.4],
      ].map(([x, z, rotate], index) => (
        <group key={`boat-${index}`} position={[x, 0.02, z]} rotation={[0, rotate, 0]}>
          <mesh>
            <boxGeometry args={[0.72, 0.12, 0.24]} />
            <meshToonMaterial color="#fff8ed" />
            <SketchEdges />
          </mesh>
          <mesh position={[0, 0.22, 0]}>
            <coneGeometry args={[0.24, 0.48, 3]} />
            <meshToonMaterial color="#e85f72" />
            <SketchEdges />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Buildings() {
  const buildings = [
    [-2.7, 0.32, 1.75, '#e6c45c', 1.35, 0.78, 1.0],
    [-4.3, 0.34, 3.9, '#f0c97c', 1.5, 0.85, 1.1],
    [-2.4, 0.3, -2.2, '#d75b66', 1.05, 0.7, 0.9],
    [0.2, 0.32, 4.45, '#8c7c61', 1.25, 0.76, 1.05],
  ] as const;

  return (
    <>
      {buildings.map(([x, y, z, color, sx, sy, sz], index) => (
        <group key={index} position={[x, y, z]}>
          <mesh>
            <boxGeometry args={[sx, sy, sz]} />
            <meshToonMaterial color={color} />
            <SketchEdges />
          </mesh>
          <mesh position={[0, sy / 2 + 0.18, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[Math.max(sx, sz) * 0.68, 0.42, 4]} />
            <meshToonMaterial color="#7f5f56" />
            <SketchEdges />
          </mesh>
          <mesh position={[0, -0.06, sz / 2 + 0.012]}>
            <boxGeometry args={[sx * 0.28, sy * 0.48, 0.04]} />
            <meshToonMaterial color="#2f5665" />
            <SketchEdges />
          </mesh>
          <mesh position={[-sx * 0.25, sy * 0.12, sz / 2 + 0.014]}>
            <boxGeometry args={[sx * 0.18, sy * 0.18, 0.035]} />
            <meshToonMaterial color="#fff8ed" />
            <SketchEdges />
          </mesh>
          <mesh position={[sx * 0.25, sy * 0.12, sz / 2 + 0.014]}>
            <boxGeometry args={[sx * 0.18, sy * 0.18, 0.035]} />
            <meshToonMaterial color="#fff8ed" />
            <SketchEdges />
          </mesh>
          <mesh position={[0, sy * 0.33, sz / 2 + 0.018]}>
            <boxGeometry args={[sx * 0.62, 0.12, 0.035]} />
            <meshToonMaterial color={index === 1 ? '#e85f72' : '#3c956f'} />
            <SketchEdges />
          </mesh>
        </group>
      ))}
    </>
  );
}

function Trees() {
  const trees = [
    [-5.4, -0.2],
    [-4.5, 0.9],
    [-1.2, -3.0],
    [2.6, -2.7],
    [5.1, 0.7],
    [3.1, 3.4],
    [-5.2, 4.9],
  ];

  return (
    <>
      {trees.map(([x, z], index) => (
        <group key={index} position={[x, 0.2, z]}>
          <mesh position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.08, 0.12, 0.7, 6]} />
            <meshToonMaterial color="#8b6040" />
            <SketchEdges />
          </mesh>
          <mesh position={[0, 0.86, 0]}>
            <sphereGeometry args={[0.45, 10, 8]} />
            <meshToonMaterial color="#367747" />
            <SketchEdges color="#235337" />
          </mesh>
          <mesh position={[0.18, 1.02, 0.08]}>
            <sphereGeometry args={[0.32, 9, 7]} />
            <meshToonMaterial color="#4d9460" />
            <SketchEdges color="#235337" />
          </mesh>
        </group>
      ))}
    </>
  );
}

function ScenicProps() {
  const flowers = [
    [4.1, 3.35],
    [5.05, 3.35],
    [3.95, 4.72],
    [5.2, 4.75],
    [-2.6, 1.0],
    [-2.0, 1.9],
    [-5.2, -2.85],
    [1.55, -2.45],
  ];

  return (
    <group>
      <CloudCluster position={[-4.8, 3.8, -7.5]} scale={1.2} />
      <CloudCluster position={[3.8, 4.2, -7.2]} scale={0.92} />
      <CloudCluster position={[6.8, 3.6, -3.5]} scale={0.72} />

      {[-3.6, -2.9, -2.2, 2.15, 2.85, 3.55].map((x, index) => (
        <group key={`rail-${index}`} position={[x, 0.26, -3.42]}>
          <mesh>
            <boxGeometry args={[0.12, 0.52, 0.12]} />
            <meshToonMaterial color="#fff8ed" />
            <SketchEdges />
          </mesh>
          <mesh position={[0.35, 0.26, 0]}>
            <boxGeometry args={[0.7, 0.08, 0.09]} />
            <meshToonMaterial color="#fff8ed" />
            <SketchEdges />
          </mesh>
        </group>
      ))}

      {flowers.map(([x, z], index) => (
        <group key={`flower-${index}`} position={[x, 0.11, z]}>
          <mesh>
            <sphereGeometry args={[0.08, 8, 6]} />
            <meshToonMaterial color={index % 2 ? '#fff8ed' : '#e85f72'} />
            <SketchEdges color="#7b6a63" />
          </mesh>
          <mesh position={[0.08, 0, 0.05]}>
            <sphereGeometry args={[0.06, 8, 6]} />
            <meshToonMaterial color="#f5e9c8" />
            <SketchEdges color="#7b6a63" />
          </mesh>
        </group>
      ))}

      <MarketStall position={[-2.5, 0.1, 1.0]} />
      <RingSpot position={[1.25, 0.08, -2.55]} />
      <Lamp position={[-5.5, 0.08, -0.65]} />
      <Lamp position={[3.65, 0.08, 2.5]} />
      <SignPost position={[-4.25, 0.1, 3.15]} label="UBND" />
    </group>
  );
}

function CloudCluster({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      {[
        [-0.38, 0, 0, 0.34],
        [0, 0.08, 0, 0.46],
        [0.44, 0, 0, 0.32],
        [0.14, -0.08, 0, 0.38],
      ].map(([x, y, z, radius], index) => (
        <mesh key={index} position={[x, y, z]}>
          <sphereGeometry args={[radius, 12, 8]} />
          <meshBasicMaterial color="#d9fff7" transparent opacity={0.82} />
        </mesh>
      ))}
    </group>
  );
}

function MarketStall({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.34, 0]}>
        <boxGeometry args={[1.12, 0.18, 0.62]} />
        <meshToonMaterial color="#8c6b4a" />
        <SketchEdges />
      </mesh>
      <mesh position={[0, 0.72, -0.05]} rotation={[0, 0, 0]}>
        <boxGeometry args={[1.26, 0.14, 0.72]} />
        <meshToonMaterial color="#e85f72" />
        <SketchEdges />
      </mesh>
      {[-0.35, -0.1, 0.18, 0.42].map((x, index) => (
        <mesh key={index} position={[x, 0.5, 0.2]}>
          <sphereGeometry args={[0.1, 8, 6]} />
          <meshToonMaterial color={index % 2 ? '#f3b950' : '#3c956f'} />
          <SketchEdges />
        </mesh>
      ))}
    </group>
  );
}

function RingSpot({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.25, 0.32, 0.32, 8]} />
        <meshToonMaterial color="#d7ccb8" />
        <SketchEdges />
      </mesh>
      <mesh position={[0, 0.52, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.18, 0.035, 8, 18]} />
        <meshToonMaterial color="#f3b950" />
        <SketchEdges color="#8f692b" />
      </mesh>
    </group>
  );
}

function Lamp({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.035, 0.045, 0.9, 6]} />
        <meshToonMaterial color="#40545a" />
        <SketchEdges />
      </mesh>
      <mesh position={[0, 0.96, 0]}>
        <sphereGeometry args={[0.16, 10, 8]} />
        <meshBasicMaterial color="#fff3a3" />
        <SketchEdges color="#8f692b" />
      </mesh>
    </group>
  );
}

function SignPost({ position, label }: { position: [number, number, number]; label: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.035, 0.045, 0.78, 6]} />
        <meshToonMaterial color="#40545a" />
        <SketchEdges />
      </mesh>
      <mesh position={[0, 0.86, 0]}>
        <boxGeometry args={[0.72, 0.26, 0.08]} />
        <meshToonMaterial color="#fff8ed" />
        <SketchEdges />
      </mesh>
      <Html center position={[0, 0.88, 0.06]} distanceFactor={10}>
        <span className="tiny-sign-label">{label}</span>
      </Html>
    </group>
  );
}

function WeddingArch() {
  return (
    <group position={[4.65, 0.1, 4.35]}>
      <mesh position={[-0.45, 0.65, 0]}>
        <boxGeometry args={[0.12, 1.2, 0.12]} />
        <meshToonMaterial color="#fff8ed" />
        <SketchEdges />
      </mesh>
      <mesh position={[0.45, 0.65, 0]}>
        <boxGeometry args={[0.12, 1.2, 0.12]} />
        <meshToonMaterial color="#fff8ed" />
        <SketchEdges />
      </mesh>
      <mesh position={[0, 1.25, 0]}>
        <torusGeometry args={[0.46, 0.06, 8, 18, Math.PI]} />
        <meshToonMaterial color="#fff8ed" />
        <SketchEdges />
      </mesh>
      {[-0.42, -0.24, 0, 0.24, 0.42].map((x, index) => (
        <mesh key={index} position={[x, 1.45 + Math.abs(x) * -0.2, 0.02]}>
          <sphereGeometry args={[0.09, 8, 6]} />
          <meshToonMaterial color={index % 2 ? '#f5e9c8' : '#ffffff'} />
          <SketchEdges color="#93856f" />
        </mesh>
      ))}
      <Html center position={[0, 1.72, 0]} distanceFactor={9}>
        <span className="tiny-player-label">08.08.2026</span>
      </Html>
    </group>
  );
}

function MemorySpots({ visited }: { visited: Set<string> }) {
  return (
    <>
      {checkpoints.map(({ scene, position }) => (
        <group key={scene.id} position={position}>
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.34, 0.48, 18]} />
            <meshBasicMaterial color={scene.id === 'wedding' ? '#e85f72' : '#fff3a3'} transparent opacity={0.72} />
          </mesh>
          <mesh position={[0, 0.34, 0]}>
            <cylinderGeometry args={[0.25, 0.3, 0.42, 8]} />
            <meshToonMaterial color={visited.has(scene.id) ? '#9bd8b4' : '#f3b950'} />
            <SketchEdges />
          </mesh>
          <mesh position={[0, 0.72, 0]}>
            <sphereGeometry args={[0.18, 12, 8]} />
            <meshBasicMaterial color={scene.id === 'wedding' ? '#e85f72' : '#fff8ed'} />
            <SketchEdges />
          </mesh>
          <Html center position={[0, 1.15, 0]} distanceFactor={9}>
            <span className="tiny-player-label">{scene.title}</span>
          </Html>
        </group>
      ))}
    </>
  );
}
