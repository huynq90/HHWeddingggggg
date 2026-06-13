import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { getSceneCheckpointProgress, sceneProgressStep, scenes } from '../data/scenes';
import { useGameLoop } from '../hooks/useGameLoop';
import { StoryCard } from './StoryCard';
import { WeddingPortal } from './WeddingPortal';
import type { LeaderId } from './CharacterSelect';

type LoveQuestRunnerProps = {
  leader: LeaderId;
  showFinaleCard?: boolean;
  onOpenInvitation?: () => void;
};

const maxProgress = 100;
const sceneCheckpointProgress = scenes.map((_, index) => getSceneCheckpointProgress(index));
const weddingSceneIndex = scenes.findIndex((scene) => scene.id === 'wedding');
const weddingFinaleProgress = getSceneCheckpointProgress(weddingSceneIndex);

export function LoveQuestRunner({ leader, showFinaleCard = true, onOpenInvitation }: LoveQuestRunnerProps) {
  const [walking, setWalking] = useState(false);
  const [checkpointIndex, setCheckpointIndex] = useState<number | null>(null);
  const [checkpointLocks, setCheckpointLocks] = useState<Set<number>>(new Set());
  const [ending, setEnding] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [jumping, setJumping] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);
  const jumpTimeoutRef = useRef<number | null>(null);
  const previousProgressRef = useRef(0);
  const pressedDirectionsRef = useRef<Set<'left' | 'right'>>(new Set());
  const pointerDirectionRef = useRef<1 | -1 | null>(null);
  const runnerRef = useRef<HTMLElement | null>(null);
  const currentBgRef = useRef<HTMLImageElement | null>(null);
  const nextBgRef = useRef<HTMLImageElement | null>(null);
  const [currentBgTravel, setCurrentBgTravel] = useState(0);
  const [nextBgTravel, setNextBgTravel] = useState(0);

  const measureTravel = useCallback((image: HTMLImageElement | null) => {
    const runner = runnerRef.current;
    if (!runner || !image || !image.naturalWidth || !image.naturalHeight) {
      return 0;
    }

    const bounds = runner.getBoundingClientRect();
    const scale = Math.max(bounds.width / image.naturalWidth, bounds.height / image.naturalHeight);
    return Math.max(0, image.naturalWidth * scale - bounds.width);
  }, []);

  const updateBgTravel = useCallback(() => {
    setCurrentBgTravel(measureTravel(currentBgRef.current));
    setNextBgTravel(measureTravel(nextBgRef.current));
  }, [measureTravel]);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  const handleProgress = useCallback(
    (nextProgress: number) => {
      if (nextProgress >= weddingFinaleProgress || nextProgress >= maxProgress) {
        setWalking(false);
        setEnding(true);
        return;
      }

      const previousProgress = previousProgressRef.current;
      previousProgressRef.current = nextProgress;
      const isMovingForward = nextProgress >= previousProgress;

      setCheckpointLocks((current) => {
        const next = new Set(current);
        sceneCheckpointProgress.forEach((checkpointProgress, index) => {
          if (scenes[index].id === 'wedding') {
            return;
          }
          if (Math.abs(nextProgress - checkpointProgress) > 1.5) {
            next.delete(index);
          }
        });
        return next.size === current.size ? current : next;
      });

      const nextCheckpoint = sceneCheckpointProgress.findIndex(
        (checkpointProgress, index) =>
          scenes[index].id !== 'wedding' &&
          isMovingForward &&
          previousProgress < checkpointProgress &&
          nextProgress >= checkpointProgress &&
          !checkpointLocks.has(index),
      );

      if (nextCheckpoint !== -1) {
        setCheckpointIndex(nextCheckpoint);
        setCheckpointLocks((current) => new Set(current).add(nextCheckpoint));
        setWalking(false);
      }
    },
    [checkpointLocks],
  );

  const { progress } = useGameLoop({
    active: walking,
    paused: checkpointIndex !== null || ending,
    maxProgress,
    speedPerSecond: 4.2,
    direction,
    reducedMotion,
    onProgress: handleProgress,
  });

  const currentSceneIndex = Math.min(Math.floor(progress / sceneProgressStep), scenes.length - 1);
  const currentScene = scenes[currentSceneIndex];
  const nextScene = scenes[Math.min(currentSceneIndex + 1, scenes.length - 1)];

  useEffect(() => {
    updateBgTravel();
    window.addEventListener('resize', updateBgTravel);
    return () => window.removeEventListener('resize', updateBgTravel);
  }, [currentSceneIndex, updateBgTravel]);

  const scenePhase = useMemo(() => {
    const sceneStart = currentSceneIndex * sceneProgressStep;
    return Math.max(0, Math.min(1, (progress - sceneStart) / sceneProgressStep));
  }, [currentSceneIndex, progress]);
  const bgOffset = useMemo(() => -currentBgTravel * scenePhase, [currentBgTravel, scenePhase]);
  const nextSceneOpacity = useMemo(() => {
    if (currentSceneIndex >= scenes.length - 1) {
      return 0;
    }
    return Math.max(0, Math.min(1, (scenePhase - 0.96) / 0.04));
  }, [currentSceneIndex, scenePhase]);

  const startWalking = (nextDirection: 1 | -1 = 1) => {
    if (checkpointIndex === null && !ending) {
      setDirection((current) => (current === nextDirection ? current : nextDirection));
      setWalking(true);
    }
  };

  const stopWalking = () => {
    pointerDirectionRef.current = null;
    setWalking(false);
  };

  const jump = () => {
    if (checkpointIndex !== null || ending || reducedMotion) {
      return;
    }

    setJumping(true);
    if (jumpTimeoutRef.current) {
      window.clearTimeout(jumpTimeoutRef.current);
    }
    jumpTimeoutRef.current = window.setTimeout(() => setJumping(false), 520);
  };

  const continueStory = () => {
    setCheckpointIndex(null);
  };

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const bounds = event.currentTarget.getBoundingClientRect();
    const nextDirection = event.clientX < bounds.left + bounds.width * 0.42 ? -1 : 1;
    pointerDirectionRef.current = nextDirection;
    startWalking(nextDirection);
  };

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    event.preventDefault();
    if (pointerDirectionRef.current === null || checkpointIndex !== null || ending) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const nextDirection = event.clientX < bounds.left + bounds.width * 0.42 ? -1 : 1;
    if (nextDirection !== pointerDirectionRef.current) {
      pointerDirectionRef.current = nextDirection;
      startWalking(nextDirection);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      if (checkpointIndex !== null && (key === 'enter' || key === ' ')) {
        event.preventDefault();
        continueStory();
        return;
      }

      if (key === 'arrowright' || key === 'd') {
        event.preventDefault();
        pressedDirectionsRef.current.add('right');
        startWalking(1);
      }

      if (key === 'arrowleft' || key === 'a') {
        event.preventDefault();
        pressedDirectionsRef.current.add('left');
        startWalking(-1);
      }

      if (!event.repeat && (key === 'arrowup' || key === 'w' || key === ' ')) {
        event.preventDefault();
        jump();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      if (key === 'arrowright' || key === 'd') {
        event.preventDefault();
        pressedDirectionsRef.current.delete('right');
      }

      if (key === 'arrowleft' || key === 'a') {
        event.preventDefault();
        pressedDirectionsRef.current.delete('left');
      }

      const pressed = pressedDirectionsRef.current;
      if (pressed.has('right')) {
        startWalking(1);
      } else if (pressed.has('left')) {
        startWalking(-1);
      } else if (key === 'arrowright' || key === 'd' || key === 'arrowleft' || key === 'a') {
        stopWalking();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (jumpTimeoutRef.current) {
        window.clearTimeout(jumpTimeoutRef.current);
      }
      pressedDirectionsRef.current.clear();
    };
  });

  if (ending) {
    return <WeddingPortal showPhotoCard={showFinaleCard} onOpenInvitation={onOpenInvitation} />;
  }

  return (
    <section
      className={`game-screen runner has-layered-bg ${walking ? 'is-walking' : ''} ${
        checkpointIndex !== null ? 'is-posing' : ''
      } ${jumping ? 'is-jumping' : ''} ${direction === -1 ? 'is-reversing' : ''} ${
        leader === 'ngan-ha' ? 'leader-bride' : 'leader-groom'
      }`}
      aria-label="Love Quest Runner"
      ref={runnerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopWalking}
      onPointerCancel={stopWalking}
      onPointerLeave={stopWalking}
      onContextMenu={(event) => event.preventDefault()}
    >
      {currentScene.assetPath && (
        <img
          ref={currentBgRef}
          className="runner-bg scene-bg"
          src={currentScene.assetPath}
          style={{ transform: `translate3d(${bgOffset}px, 0, 0)` }}
          onLoad={updateBgTravel}
          alt=""
          aria-hidden="true"
          draggable={false}
        />
      )}

      {scenes.map((scene, index) => {
        const markerSceneIndex = Math.floor(progress / sceneProgressStep);
        if (scene.id === 'wedding' || markerSceneIndex !== index || checkpointIndex !== null) {
          return null;
        }

        const sceneStart = index * sceneProgressStep;
        const markerPhase = (getSceneCheckpointProgress(index) - sceneStart) / sceneProgressStep;
        const distance = Math.abs(scenePhase - markerPhase);
        if (distance > 0.16) {
          return null;
        }

        return (
          <span
            key={scene.id}
            className={`photo-marker ${distance < 0.1 ? 'is-near' : ''}`}
            style={{ '--marker-x': `${18 + markerPhase * 64}%` } as React.CSSProperties}
            aria-hidden="true"
          />
        );
      })}

      {checkpointIndex !== null && (
        <div className="photographer-pop" aria-hidden="true">
          <span className="camera-flash" />
        </div>
      )}

      {currentSceneIndex === 0 && checkpointIndex === null && (
        <div className="direction-hint" aria-hidden="true">
          <span className="direction-hint-left">&lt;&lt;</span>
          <span className="direction-hint-right">&gt;&gt;</span>
        </div>
      )}

      {nextScene.assetPath && (
        <img
          ref={nextBgRef}
          className="runner-bg scene-bg next-scene-bg"
          src={nextScene.assetPath}
          style={{ opacity: nextSceneOpacity, transform: 'translate3d(0, 0, 0)' }}
          onLoad={updateBgTravel}
          alt=""
          aria-hidden="true"
          draggable={false}
        />
      )}

      <div
        className="couple-sprite"
        aria-label={
          leader === 'viet-huy'
            ? 'Việt Huy đang dắt Ngân Hà đi qua các cảnh'
            : 'Ngân Hà đang dắt Việt Huy đi qua các cảnh'
        }
      />

      {currentSceneIndex === 0 && (
        <div className="runner-prompt" aria-hidden="true">
          <span className="prompt-mobile">Giữ nửa phải để đi tới, giữ nửa trái để lùi</span>
          <span className="prompt-desktop">Giữ →/D để đi, ←/A để lùi, ↑/W/Space để nhảy</span>
        </div>
      )}
      {currentSceneIndex > 0 && (
        <div className="runner-prompt runner-prompt-desktop-only" aria-hidden="true">
        <span className="prompt-desktop">Giữ →/D để đi, ←/A để lùi, ↑/W/Space để nhảy</span>
        </div>
      )}

      {checkpointIndex !== null && <StoryCard scene={scenes[checkpointIndex]} onContinue={continueStory} />}
    </section>
  );
}
