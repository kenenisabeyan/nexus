interface ConfidenceRingProps {
  value: number;
  size?: number;
}

export default function ConfidenceRing({ value, size = 48 }: ConfidenceRingProps) {
  const r = 18;
  const circumference = 2 * Math.PI * r;
  const filled = circumference * value;
  const tier = value >= 0.85 ? "high" : value < 0.55 ? "low" : "";
  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 48 48">
        <circle className="ring-track" cx="24" cy="24" r={r} />
        <circle
          className={`ring-value ${tier}`}
          cx="24"
          cy="24"
          r={r}
          strokeDasharray={`${filled} ${circumference}`}
        />
      </svg>
      <span className="ring-label">{Math.round(value * 100)}</span>
    </div>
  );
}
