import { useState } from 'react';

export type LeaderId = 'ngan-ha' | 'viet-huy';

type CharacterSelectProps = {
  onStart: (leader: LeaderId) => void;
};

const players: Array<{
  id: LeaderId;
  label: string;
  role: string;
  description: string;
  avatarClass: string;
  previewClass: string;
}> = [
  {
    id: 'viet-huy',
    label: 'Việt Huy',
    role: 'Groom',
    description: 'Chú rể dẫn đường, nắm tay cô dâu đi qua từng map.',
    avatarClass: 'avatar-groom',
    previewClass: 'preview-groom-lead',
  },
  {
    id: 'ngan-ha',
    label: 'Ngân Hà',
    role: 'Bride',
    description: 'Cô dâu dẫn đường, kéo chú rể tới cổng cưới.',
    avatarClass: 'avatar-bride',
    previewClass: 'preview-bride-lead',
  },
];

export function CharacterSelect({ onStart }: CharacterSelectProps) {
  const [leader, setLeader] = useState<LeaderId>('viet-huy');

  return (
    <section className="game-screen character-select" aria-labelledby="select-title">
      <div className="screen-header select-header">
        <p className="kicker">Select your player</p>
        <h2 id="select-title">Ai sẽ dẫn đường?</h2>
      </div>

      <div className="versus-select" aria-label="Chọn người dẫn đường">
        {players.map((player) => {
          const isSelected = leader === player.id;

          return (
            <button
              key={player.id}
              className={`player-card select-fighter ${isSelected ? 'is-selected' : ''}`}
              type="button"
              onClick={() => setLeader(player.id)}
              aria-pressed={isSelected}
            >
              <span className={`route-sprite-preview ${player.previewClass}`} aria-hidden="true" />
              <span className="player-meta">
                <span className="player-role">{player.role}</span>
                <span className="player-name">{player.label}</span>
                <span className="player-description">{player.description}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="route-preview" aria-live="polite">
        <strong>{leader === 'viet-huy' ? 'Việt Huy dắt Ngân Hà' : 'Ngân Hà dắt Việt Huy'}</strong>
      </div>

      <button className="pixel-button primary start-quest" type="button" onClick={() => onStart(leader)}>
        START LOVE QUEST
      </button>
    </section>
  );
}
