import { useEffect, useMemo, useState } from "react";

import { getBudgetStatus, getPersonalizedPromos } from "../api";
import BudgetRing from "../components/BudgetRing";
import PromoCard from "../components/PromoCard";

const USER_ID = 1;

type BudgetStatus = {
  budget_weekly: number;
  budget_used: number;
  budget_remaining: number;
  utilization_pct: number;
  alert: boolean;
  alert_message: string;
};

type Promo = {
  id: number;
  card_id: number;
  card_name: string;
  title: string;
  category: string;
  discount_pct: number;
  expires_at: string;
  url: string;
};

export default function Budget() {
  const [status, setStatus] = useState<BudgetStatus | null>(null);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [budget, promoResponse] = await Promise.all([
          getBudgetStatus(USER_ID),
          getPersonalizedPromos(USER_ID),
        ]);
        setStatus(budget);
        setPromos(promoResponse.promos ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load budget");
      }
    }
    load();
  }, []);

  const categoryBreakdown = useMemo(
    () => [
      { name: "Dining", pct: 35 },
      { name: "Groceries", pct: 25 },
      { name: "Travel", pct: 22 },
      { name: "Other", pct: 18 },
    ],
    []
  );

  if (error) {
    return <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>;
  }

  if (!status) {
    return <div className="text-sm text-slate-600">Loading budget...</div>;
  }

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Weekly Budget</h2>
        <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-center">
          <BudgetRing utilizationPct={status.utilization_pct} />
          <div>
            <p className="text-lg font-semibold text-slate-900">
              ${status.budget_used.toFixed(2)} / ${status.budget_weekly.toFixed(2)}
            </p>
            <p className="text-sm text-slate-600">Remaining: ${status.budget_remaining.toFixed(2)}</p>
            {status.alert ? (
              <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
                {status.alert_message}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Spend by Category</h3>
        <div className="mt-4 space-y-3">
          {categoryBreakdown.map((item) => (
            <div key={item.name}>
              <div className="mb-1 flex justify-between text-sm text-slate-700">
                <span>{item.name}</span>
                <span>{item.pct}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-brand-500" style={{ width: `${item.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Personalized Promos</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {promos.map((promo) => (
            <PromoCard
              cardName={promo.card_name}
              category={promo.category}
              discountPct={promo.discount_pct}
              key={promo.id}
              title={promo.title}
              url={promo.url}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
