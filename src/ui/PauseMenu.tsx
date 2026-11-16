interface Props {
  onResume: () => void;
}

export function PauseMenu({ onResume }: Props) {
  return (
    <div className="lab-overlay" data-ui>
      <div className="lab-panel" style={{ maxWidth: 360, textAlign: 'center' }}>
        <h2 style={{ marginTop: 0 }}>⏸ Paused</h2>
        <p style={{ color: '#bcd2cd' }}>DIGI CLASS · PYTHON LEGENDS<br />Prototype milestone 1</p>
        <button className="lab-btn lab-btn-primary" style={{ width: '100%' }} onClick={onResume}>
          ▶ Resume
        </button>
      </div>
    </div>
  );
}
