import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
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
    <group ref={groupRef} position={[-5.6, 0.18, -3]}>
      <mesh position={[0, 0.72, 0]}>
        <capsuleGeometry args={[0.26, 0.62, 6, 12]} />
        <meshToonMaterial color="#fff8ed" />
      </mesh>
      <mesh position={[0, 1.25, 0]}>
        <sphereGeometry args={[0.28, 16, 12]} />
        <meshToonMaterial color="#f1b68d" />
      </mesh>
      <mesh position={[0, 1.42, -0.02]}>
        <boxGeometry args={[0.48, 0.16, 0.34]} />
        <meshToonMaterial color="#352430" />
      </mesh>
      <mesh position={[0.26, 0.25, 0.05]}>
        <boxGeometry args={[0.12, 0.5, 0.16]} />
        <meshToonMaterial color="#24324a" />
      </mesh>
      <mesh position={[-0.26, 0.25, 0.05]}>
        <boxGeometry args={[0.12, 0.5, 0.16]} />
        <meshToonMaterial color="#24324a" />
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
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[6.8, 9]} />
        <meshToonMaterial color="#5fa66d" />
      </mesh>
      <mesh position={[0, 0.04, 0.55]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.2, 8.6]} />
        <meshToonMaterial color="#f4eadb" />
      </mesh>
      <mesh position={[-1.7, 0.05, -0.2]} rotation={[-Math.PI / 2, 0, 0.72]}>
        <planeGeometry args={[0.95, 7.6]} />
        <meshToonMaterial color="#d7ccb8" />
      </mesh>
      <mesh position={[2.3, 0.055, 1.5]} rotation={[-Math.PI / 2, 0, -0.7]}>
        <planeGeometry args={[0.86, 5.2]} />
        <meshToonMaterial color="#d7ccb8" />
      </mesh>

      <Water />
      <Buildings />
      <Trees />
      <WeddingArch />
    </group>
  );
}

function Water() {
  return (
    <mesh position={[0, -0.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[18, 48]} />
      <meshBasicMaterial color="#77cdd2" />
    </mesh>
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
          </mesh>
          <mesh position={[0, sy / 2 + 0.18, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[Math.max(sx, sz) * 0.68, 0.42, 4]} />
            <meshToonMaterial color="#7f5f56" />
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
          </mesh>
          <mesh position={[0, 0.86, 0]}>
            <sphereGeometry args={[0.45, 10, 8]} />
            <meshToonMaterial color="#367747" />
          </mesh>
        </group>
      ))}
    </>
  );
}

function WeddingArch() {
  return (
    <group position={[4.65, 0.1, 4.35]}>
      <mesh position={[-0.45, 0.65, 0]}>
        <boxGeometry args={[0.12, 1.2, 0.12]} />
        <meshToonMaterial color="#fff8ed" />
      </mesh>
      <mesh position={[0.45, 0.65, 0]}>
        <boxGeometry args={[0.12, 1.2, 0.12]} />
        <meshToonMaterial color="#fff8ed" />
      </mesh>
      <mesh position={[0, 1.25, 0]}>
        <torusGeometry args={[0.46, 0.06, 8, 18, Math.PI]} />
        <meshToonMaterial color="#fff8ed" />
      </mesh>
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
          <mesh position={[0, 0.34, 0]}>
            <cylinderGeometry args={[0.25, 0.3, 0.42, 8]} />
            <meshToonMaterial color={visited.has(scene.id) ? '#9bd8b4' : '#f3b950'} />
          </mesh>
          <mesh position={[0, 0.72, 0]}>
            <sphereGeometry args={[0.18, 12, 8]} />
            <meshBasicMaterial color={scene.id === 'wedding' ? '#e85f72' : '#fff8ed'} />
          </mesh>
          <Html center position={[0, 1.15, 0]} distanceFactor={9}>
            <span className="tiny-player-label">{scene.title}</span>
          </Html>
        </group>
      ))}
    </>
  );
}
