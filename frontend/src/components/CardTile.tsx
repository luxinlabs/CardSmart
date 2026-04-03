type CardTileProps = {
  id?: number;
  issuer: string;
  name: string;
  last4: string;
  bestCategory: string;
  promo?: string;
  cashbackEarned?: number;
  selected?: boolean;
  onSelect?: (id?: number) => void;
  actionLabel?: string;
  onAction?: (id?: number) => void;
};

export default function CardTile({
  id,
  issuer,
  name,
  last4,
  bestCategory,
  promo,
  cashbackEarned,
  selected = false,
  onSelect,
  actionLabel,
  onAction,
}: CardTileProps) {
  const gradientByIssuer: Record<string, string> = {
    "American Express": "from-indigo-500 via-indigo-600 to-slate-900",
    Chase: "from-sky-500 via-cyan-500 to-blue-900",
    Citi: "from-emerald-500 via-teal-500 to-cyan-900",
    Discover: "from-orange-400 via-amber-500 to-red-500",
    "Capital One": "from-rose-500 via-red-500 to-red-900",
    "Bank of America": "from-blue-600 via-indigo-700 to-slate-950",
  };

  const gradientClass =
    gradientByIssuer[issuer] ?? "from-slate-700 via-slate-800 to-slate-950";

  return (
    <article
      className={`rounded-2xl border bg-white p-4 shadow-sm transition ${
        selected ? "border-brand-500 ring-2 ring-brand-100" : "border-slate-200"
      }`}
    >
      <button
        className={`relative h-44 w-full overflow-hidden rounded-2xl bg-gradient-to-br p-4 text-left text-white shadow-lg transition hover:scale-[1.01] ${gradientClass}`}
        onClick={() => onSelect?.(id)}
        type="button"
      >
        <div className="absolute right-3 top-3 flex gap-1 opacity-90">
          <span className="h-5 w-5 rounded-full bg-white/70" />
          <span className="h-5 w-5 rounded-full bg-white/40" />
        </div>
        <div className="flex h-full flex-col justify-between">
          <div className="space-y-2">
            <div className="h-7 w-10 rounded bg-gradient-to-b from-yellow-100 to-yellow-300" />
            <p className="text-xs uppercase tracking-[0.2em] text-white/80">
              {issuer}
            </p>
          </div>
          <div>
            <p className="text-lg font-semibold">{name}</p>
            <p className="mt-1 text-sm tracking-[0.3em]">
              •••• •••• •••• {last4}
            </p>
          </div>
        </div>
      </button>

      <div className="mt-3 space-y-1 text-sm text-slate-700">
        <p>
          Best category:{" "}
          <span className="font-semibold capitalize">{bestCategory}</span>
        </p>
        {promo ? <p className="text-brand-700">Promo: {promo}</p> : null}
        {cashbackEarned !== undefined ? (
          <p className="font-semibold text-slate-900">
            Cashback this month: ${cashbackEarned.toFixed(2)}
          </p>
        ) : null}
      </div>

      {actionLabel && onAction ? (
        <button
          className="mt-3 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          onClick={() => onAction(id)}
          type="button"
        >
          {actionLabel}
        </button>
      ) : null}

      {onSelect ? (
        <p className="mt-2 text-xs text-slate-500">
          {selected ? "Selected card" : "Tap card to select"}
        </p>
      ) : null}
    </article>
  );
}
