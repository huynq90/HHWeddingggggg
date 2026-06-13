import { useEffect, useRef, useState } from 'react';

type UseGameLoopOptions = {
  active: boolean;
  paused: boolean;
  maxProgress: number;
  speedPerSecond?: number;
  direction?: 1 | -1;
  reducedMotion?: boolean;
  onProgress?: (progress: number) => void;
};

export function useGameLoop({
  active,
  paused,
  maxProgress,
  speedPerSecond = 10,
  direction = 1,
  reducedMotion = false,
  onProgress,
}: UseGameLoopOptions) {
  const [progress, setProgress] = useState(0);
  const frameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const progressRef = useRef(0);
  const directionRef = useRef(direction);
  const speedRef = useRef(speedPerSecond);
  const maxProgressRef = useRef(maxProgress);
  const onProgressRef = useRef(onProgress);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    directionRef.current = direction;
    speedRef.current = speedPerSecond;
    maxProgressRef.current = maxProgress;
    onProgressRef.current = onProgress;
  }, [direction, maxProgress, onProgress, speedPerSecond]);

  useEffect(() => {
    if (!active || paused) {
      lastTimeRef.current = null;
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      return;
    }

    const tick = (time: number) => {
      const lastTime = lastTimeRef.current ?? time;
      const delta = Math.min((time - lastTime) / 1000, 0.05);
      lastTimeRef.current = time;

      const currentDirection = directionRef.current;
      const motionMultiplier = reducedMotion ? 0.75 : 1;
      const next = Math.max(
        0,
        Math.min(
          progressRef.current + currentDirection * speedRef.current * motionMultiplier * delta,
          maxProgressRef.current,
        ),
      );
      progressRef.current = next;
      setProgress(next);
      onProgressRef.current?.(next);

      if ((currentDirection === 1 && next < maxProgressRef.current) || (currentDirection === -1 && next > 0)) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [active, paused, reducedMotion]);

  const advanceBy = (amount: number) => {
    const next = Math.max(0, Math.min(progressRef.current + amount, maxProgress));
    progressRef.current = next;
    setProgress(next);
    onProgress?.(next);
  };

  return { progress, setProgress, advanceBy };
}
