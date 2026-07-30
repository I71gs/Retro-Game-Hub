import { AVATARS } from '../store/playerStore';

interface AvatarGridProps {
  selected: string;
  onChange: (avatar: string) => void;
}

export function AvatarGrid({ selected, onChange }: AvatarGridProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: '6px',
        maxHeight: '140px',
        overflowY: 'auto',
        padding: '4px',
      }}
    >
      {AVATARS.map((a) => (
        <button
          key={a}
          onClick={() => onChange(a)}
          className="text-xl flex items-center justify-center rounded transition-all"
          style={{
            width: '40px',
            height: '40px',
            border: selected === a ? '2px solid var(--accent1)' : '2px solid var(--border)',
            background: selected === a ? 'rgba(108,99,255,0.2)' : 'var(--bg-secondary)',
            transform: selected === a ? 'scale(1.15)' : 'scale(1)',
            cursor: 'pointer',
          }}
          title={a}
        >
          {a}
        </button>
      ))}
    </div>
  );
}
