type WeddingPortalProps = {
  showPhotoCard?: boolean;
  onOpenInvitation?: () => void;
};

export function WeddingPortal({ showPhotoCard = true, onOpenInvitation }: WeddingPortalProps) {
  const handleOpen = () => {
    if (onOpenInvitation) {
      onOpenInvitation();
      return;
    }

    document.getElementById('invitation-main')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="finale-screen" className="game-screen wedding-portal finale-screen" aria-labelledby="portal-title">
      <div className="finale-fireworks" aria-hidden="true">
        {['heart', 'gold', 'pink'].map((type) => (
          <span key={type} className={`firework-shell firework-${type}`}>
            {Array.from({ length: type === 'heart' ? 16 : 12 }, (_, index) => (
              <i key={index} />
            ))}
          </span>
        ))}
      </div>

      <div className="finale-stage" aria-hidden="true">
        <span className="speech-bubble bubble-left">I do</span>
        <span className="speech-bubble bubble-right">I do</span>
      </div>

      {showPhotoCard && <div className="finale-photo-card">
        <img src="/ref/finale-wedding-photo.jpg" alt="Việt Huy và Ngân Hà" />
        <div className="finale-copy">
          <p className="kicker">Save the date</p>
          <h2 id="portal-title">Hẹn gặp mọi người</h2>
          <p>Vào ngày 08.08.2026 tại KIGI Beach Resort.</p>
          <button className="pixel-button primary" type="button" onClick={handleOpen} aria-label="Xem lịch trình">
            Xem lịch trình
          </button>
        </div>
      </div>}
    </section>
  );
}
