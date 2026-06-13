import { useEffect, useRef, useState } from 'react';

const audioSource = '/audio/love-theme-game-8bit.mp3';

type LoveQuestAudioProps = {
  introCta?: boolean;
};

export function LoveQuestAudio({ introCta = false }: LoveQuestAudioProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const audio = new Audio(audioSource);
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 0.72;
    audioRef.current = audio;

    return () => {
      audio.pause();
    };
  }, []);

  const play = async () => {
    await audioRef.current?.play();
    setEnabled(true);
  };

  const pause = () => {
    audioRef.current?.pause();
    setEnabled(false);
  };

  const toggle = () => {
    if (enabled) {
      pause();
      return;
    }

    void play();
  };

  return (
    <button
      className={`audio-control ${introCta ? 'is-intro-cta' : ''} ${enabled ? 'is-playing' : ''}`}
      type="button"
      onClick={toggle}
      aria-label={enabled ? 'Tắt nhạc game' : 'Bật nhạc game'}
      title="Game mix từ nhạc thiệp gốc"
    >
      <span aria-hidden="true">{enabled ? '♪' : '♫'}</span>
    </button>
  );
}
