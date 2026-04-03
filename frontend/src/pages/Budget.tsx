import { useEffect, useMemo, useState } from "react";

import { getBudgetStatus, getPersonalizedPromos } from "../api";
import BudgetRing from "../components/BudgetRing";
import PromoCard from "../components/PromoCard";

const USER_ID = 1;
const CATEGORY_BUDGETS_STORAGE_KEY = `cardsmart.categoryBudgets.user.${USER_ID}`;

const CATEGORY_OPTIONS = [
  { value: "dining", label: "Dining" },
  { value: "groceries", label: "Groceries" },
  { value: "travel", label: "Travel" },
  { value: "gas", label: "Gas" },
] as const;

type CategoryKey = (typeof CATEGORY_OPTIONS)[number]["value"];
type CategoryBudgets = Record<CategoryKey, number>;

const CATEGORY_SPLIT: Record<CategoryKey, number> = {
  dining: 0.35,
  groceries: 0.25,
  travel: 0.22,
  gas: 0.18,
};

function createDefaultCategoryBudgets(weeklyBudget: number): CategoryBudgets {
  return {
    dining: weeklyBudget * CATEGORY_SPLIT.dining,
    groceries: weeklyBudget * CATEGORY_SPLIT.groceries,
    travel: weeklyBudget * CATEGORY_SPLIT.travel,
    gas: weeklyBudget * CATEGORY_SPLIT.gas,
  };
}

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
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryKey>("dining");
  const [budgetInput, setBudgetInput] = useState("0");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudgets>(
    createDefaultCategoryBudgets(200),
  );

  useEffect(() => {
    async function load() {
      try {
        const [budget, promoResponse] = await Promise.all([
          getBudgetStatus(USER_ID),
          getPersonalizedPromos(USER_ID),
        ]);
        setStatus(budget);
        setPromos(promoResponse.promos ?? []);

        const defaults = createDefaultCategoryBudgets(budget.budget_weekly);
        const raw = localStorage.getItem(CATEGORY_BUDGETS_STORAGE_KEY);
        if (!raw) {
          setCategoryBudgets(defaults);
          return;
        }

        try {
          const parsed = JSON.parse(raw) as Partial<
            Record<CategoryKey, number>
          >;
          const merged: CategoryBudgets = {
            dining:
              typeof parsed.dining === "number"
                ? parsed.dining
                : defaults.dining,
            groceries:
              typeof parsed.groceries === "number"
                ? parsed.groceries
                : defaults.groceries,
            travel:
              typeof parsed.travel === "number"
                ? parsed.travel
                : defaults.travel,
            gas: typeof parsed.gas === "number" ? parsed.gas : defaults.gas,
          };
          setCategoryBudgets(merged);
        } catch {
          setCategoryBudgets(defaults);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load budget");
      }
    }
    load();
  }, []);

  useEffect(() => {
    setBudgetInput((categoryBudgets[selectedCategory] ?? 0).toFixed(2));
  }, [selectedCategory, categoryBudgets]);

  const categoryBreakdown = useMemo(() => {
    if (!status) return [];

    const totalCategoryBudget = Object.values(categoryBudgets).reduce(
      (sum, budget) => sum + budget,
      0,
    );

    return CATEGORY_OPTIONS.map((category) => {
      const budget = categoryBudgets[category.value] ?? 0;
      const used =
        totalCategoryBudget > 0
          ? status.budget_used * (budget / totalCategoryBudget)
          : 0;
      const pct =
        status.budget_weekly > 0 ? (budget / status.budget_weekly) * 100 : 0;

      return {
        name: category.label,
        pct,
        budget,
        used,
      };
    });
  }, [categoryBudgets, status]);

  function handleSetCategoryBudget() {
    const value = Number(budgetInput);
    if (!Number.isFinite(value) || value < 0) {
      setSaveMessage("Please enter a valid budget amount.");
      return;
    }

    setCategoryBudgets((prev) => {
      const next = {
        ...prev,
        [selectedCategory]: value,
      };
      localStorage.setItem(CATEGORY_BUDGETS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    setSaveMessage(`Saved ${selectedCategory} budget at $${value.toFixed(2)}.`);
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
        {error}
      </div>
    );
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
              ${status.budget_used.toFixed(2)} / $
              {status.budget_weekly.toFixed(2)}
            </p>
            <p className="text-sm text-slate-600">
              Remaining: ${status.budget_remaining.toFixed(2)}
            </p>
            {status.alert ? (
              <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
                {status.alert_message}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">
          Set Category Budget
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          Select a category and set the budget you want.
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="sm:w-56">
            <span className="text-sm font-medium text-slate-700">Category</span>
            <select
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
              onChange={(e) =>
                setSelectedCategory(e.target.value as CategoryKey)
              }
              value={selectedCategory}
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="sm:w-56">
            <span className="text-sm font-medium text-slate-700">Budget</span>
            <input
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
              min="0"
              onChange={(e) => setBudgetInput(e.target.value)}
              step="0.01"
              type="number"
              value={budgetInput}
            />
          </label>

          <button
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            onClick={handleSetCategoryBudget}
            type="button"
          >
            Save Budget
          </button>
        </div>

        {saveMessage ? (
          <p className="mt-3 text-sm text-slate-700">{saveMessage}</p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Spend by Category</h3>
        <div className="mt-4 space-y-3">
          {categoryBreakdown.map((item) => (
            <div key={item.name}>
              <div className="mb-1 flex justify-between text-sm text-slate-700">
                <span>{item.name}</span>
                <span>
                  ${item.used.toFixed(2)} / ${item.budget.toFixed(2)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-brand-500"
                  style={{ width: `${item.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">
          Personalized Promos
        </h3>
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
