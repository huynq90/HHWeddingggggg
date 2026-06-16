import { LoveQuestAudio } from './LoveQuestAudio';

type IntroGateProps = {
  onStart: () => void;
};

export function IntroGate({ onStart }: IntroGateProps) {
  return (
    <section className="game-screen intro-gate" aria-labelledby="intro-title">
      <div className="pixel-sky" aria-hidden="true" />
      <div className="intro-content">
        <p className="kicker">Wedding mini game</p>
        <h1 id="intro-title" className="pixel-title">
          LOVE QUEST
        </h1>
        <p className="couple-name">Việt Huy & Ngân Hà</p>
        <p className="core-line">Chẳng phải phép màu, mà sao chúng ta lại gặp nhau?</p>
        <button className="pixel-button primary" type="button" onClick={onStart} aria-label="Chạm để bắt đầu">
          Chạm để bắt đầu
        </button>
        <LoveQuestAudio introCta />
      </div>
      <div className="loading-heart" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </section>
  );
}
