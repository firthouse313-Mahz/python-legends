interface Props {
  lines: string[];
  onClose: () => void;
}

export function DialogBubble({ lines, onClose }: Props) {
  return (
    <div className="dialog-bubble" data-ui>
      <div className="dialog-bubble-inner">
        <div className="dialog-avatar">🤖</div>
        <div className="dialog-text">
          {lines.map((l, i) => (
            <p key={i}>{l}</p>
          ))}
        </div>
        <button className="dialog-close" onClick={onClose}>OK</button>
      </div>
    </div>
  );
}
