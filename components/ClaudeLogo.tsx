export default function ClaudeLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      {Array.from({ length: 12 }, (_, i) => (
        <rect
          key={i}
          x="11"
          y="1.5"
          width="2"
          height="6.5"
          rx="1"
          transform={`rotate(${i * 30} 12 12)`}
        />
      ))}
    </svg>
  );
}
