type BudgetRingProps = {
  utilizationPct: number;
};

export default function BudgetRing({ utilizationPct }: BudgetRingProps) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const safePct = Math.max(0, Math.min(100, utilizationPct));
  const offset = circumference - (safePct / 100) * circumference;

  const ringColor = safePct >= 90 ? "#dc2626" : safePct >= 75 ? "#f59e0b" : "#12a87f";

  return (
    <div className="relative grid h-40 w-40 place-items-center">
      <svg className="h-40 w-40 -rotate-90" viewBox="0 0 140 140">
        <circle cx="70" cy="70" fill="transparent" r={radius} stroke="#e2e8f0" strokeWidth="14" />
        <circle
          cx="70"
          cy="70"
          fill="transparent"
          r={radius}
          stroke={ringColor}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth="14"
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-2xl font-black text-slate-900">{Math.round(safePct)}%</p>
        <p className="text-xs text-slate-500">Used</p>
      </div>
    </div>
  );
}
