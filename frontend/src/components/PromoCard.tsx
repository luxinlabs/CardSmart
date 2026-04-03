type PromoCardProps = {
  cardName: string;
  title: string;
  category: string;
  discountPct: number;
  url: string;
};

export default function PromoCard({ cardName, title, category, discountPct, url }: PromoCardProps) {
  return (
    <article className="rounded-xl border border-brand-100 bg-brand-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{cardName}</p>
      <h4 className="mt-1 text-base font-bold text-slate-900">{title}</h4>
      <p className="mt-1 text-sm text-slate-700">
        {Math.round(discountPct * 100)}% bonus in <span className="capitalize">{category}</span>
      </p>
      <a className="mt-2 inline-block text-sm font-semibold text-brand-700 hover:text-brand-900" href={url} rel="noreferrer" target="_blank">
        View Offer
      </a>
    </article>
  );
}
