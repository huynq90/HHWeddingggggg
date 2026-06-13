import type { Scene } from '../data/scenes';

type StoryCardProps = {
  scene: Scene;
  onContinue: () => void;
};

export function StoryCard({ scene, onContinue }: StoryCardProps) {
  return (
    <aside
      className="story-card"
      aria-live="polite"
      aria-labelledby="story-title"
      onPointerDown={(event) => event.stopPropagation()}
      onPointerUp={(event) => event.stopPropagation()}
      onPointerCancel={(event) => event.stopPropagation()}
    >
      <div className="story-item" aria-hidden="true" data-item={scene.item} />
      {scene.photoPath && <img className="story-photo" src={scene.photoPath} alt="" aria-hidden="true" />}
      <div className="story-copy">
        <p className="kicker">Checkpoint</p>
        <h3 id="story-title">{scene.title}</h3>
        <p>{scene.text}</p>
      </div>
      <button
        className="pixel-button compact"
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onContinue();
        }}
        aria-label="Đi tiếp"
      >
        Đi tiếp
      </button>
    </aside>
  );
}
