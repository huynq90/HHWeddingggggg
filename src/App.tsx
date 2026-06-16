import { useState } from 'react';
import { CharacterSelect, type LeaderId } from './components/CharacterSelect';
import { IntroGate } from './components/IntroGate';
import { LoveQuestRunner } from './components/LoveQuestRunner';
import { LoveQuestAudio } from './components/LoveQuestAudio';

type GamePhase = 'intro' | 'character-select' | 'running';

function App() {
  const [phase, setPhase] = useState<GamePhase>('intro');
  const [leader, setLeader] = useState<LeaderId>('viet-huy');
  const [showInvitation, setShowInvitation] = useState(false);
  const [showFinaleCard, setShowFinaleCard] = useState(true);

  const openInvitation = () => {
    setShowFinaleCard(true);
    setShowInvitation(true);
    window.setTimeout(() => {
      document.getElementById('invitation-main')?.scrollIntoView({ behavior: 'smooth' });
    }, 0);
  };

  const backToFinale = () => {
    setShowInvitation(false);
    setShowFinaleCard(false);
    window.setTimeout(() => {
      document.getElementById('finale-screen')?.scrollIntoView({ behavior: 'smooth' });
    }, 0);
  };

  return (
    <main>
      {phase !== 'intro' && <LoveQuestAudio />}
      {phase === 'intro' && <IntroGate onStart={() => setPhase('character-select')} />}
      {phase === 'character-select' && (
        <CharacterSelect
          onStart={(nextLeader) => {
            setLeader(nextLeader);
            setShowInvitation(false);
            setShowFinaleCard(true);
            setPhase('running');
          }}
        />
      )}
      {phase === 'running' && (
        <LoveQuestRunner leader={leader} showFinaleCard={showFinaleCard} onOpenInvitation={openInvitation} />
      )}

      <section id="invitation-main" className={`invitation-main ${showInvitation ? 'is-visible' : ''}`}>
        <p className="kicker">Save the date</p>
        <h2>Việt Huy & Ngân Hà</h2>
        <p className="core-line">Chẳng phải phép màu, mà sao chúng ta lại gặp nhau?</p>
        <div className="invitation-details">
          <p>
            <strong>08.08.2026</strong> lúc <strong>17:00</strong>
          </p>
          <p>KIGI Beach Resort</p>
        </div>
        <div className="timeline">
          <span>07:00 Khởi hành</span>
          <span>17:00 Hôn lễ</span>
          <span>18:00 Khai tiệc</span>
          <span>20:00 Pool party</span>
          <span>09.08 - 07:00 Buffet sáng</span>
          <span>09.08 - 10:00 Về Sài Gòn</span>
        </div>
        <button className="pixel-button compact" type="button" onClick={backToFinale}>
          Back
        </button>
      </section>
    </main>
  );
}

export default App;
