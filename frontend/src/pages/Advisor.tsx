import { useEffect, useMemo, useState } from "react";

import {
  getBudgetStatus,
  logTransaction,
  recommendCard,
  type RecommendResponse,
} from "../api";
import CardTile from "../components/CardTile";
import CategoryPicker from "../components/CategoryPicker";

const USER_ID = 1;
const CATEGORY_BUDGETS_STORAGE_KEY = `cardsmart.categoryBudgets.user.${USER_ID}`;

type CategoryKey = "dining" | "groceries" | "travel" | "gas";
type CategoryBudgets = Record<CategoryKey, number>;

export default function Advisor() {
  const [category, setCategory] = useState("dining");
  const [amount, setAmount] = useState("45");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendation, setRecommendation] =
    useState<RecommendResponse | null>(null);
  const [txMessage, setTxMessage] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [decisionLogs, setDecisionLogs] = useState<string[]>([]);
  const [weeklyBudget, setWeeklyBudget] = useState(200);
  const [weeklyUsed, setWeeklyUsed] = useState(0);
  const [categoryBudgets, setCategoryBudgets] =
    useState<CategoryBudgets | null>(null);

  const parsedAmount = useMemo(() => Number(amount) || 0, [amount]);

  useEffect(() => {
    async function loadBudget() {
      try {
        const budget = await getBudgetStatus(USER_ID);
        setWeeklyBudget(budget.budget_weekly ?? 200);
        setWeeklyUsed(budget.budget_used ?? 0);
      } catch {
        setWeeklyBudget(200);
        setWeeklyUsed(0);
      }
    }

    loadBudget();
  }, []);

  useEffect(() => {
    const fallback: CategoryBudgets = {
      dining: weeklyBudget * 0.35,
      groceries: weeklyBudget * 0.25,
      travel: weeklyBudget * 0.22,
      gas: weeklyBudget * 0.18,
    };

    const raw = localStorage.getItem(CATEGORY_BUDGETS_STORAGE_KEY);
    if (!raw) {
      setCategoryBudgets(fallback);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<CategoryBudgets>;
      setCategoryBudgets({
        dining:
          typeof parsed.dining === "number" ? parsed.dining : fallback.dining,
        groceries:
          typeof parsed.groceries === "number"
            ? parsed.groceries
            : fallback.groceries,
        travel:
          typeof parsed.travel === "number" ? parsed.travel : fallback.travel,
        gas: typeof parsed.gas === "number" ? parsed.gas : fallback.gas,
      });
    } catch {
      setCategoryBudgets(fallback);
    }
  }, [weeklyBudget]);

  const categoryStats = useMemo(() => {
    const budgets =
      categoryBudgets ??
      ({
        dining: weeklyBudget * 0.35,
        groceries: weeklyBudget * 0.25,
        travel: weeklyBudget * 0.22,
        gas: weeklyBudget * 0.18,
      } satisfies CategoryBudgets);

    const totalBudget = Object.values(budgets).reduce(
      (sum, value) => sum + value,
      0,
    );

    return Object.fromEntries(
      Object.entries(budgets).map(([key, budget]) => [
        key,
        {
          budget,
          used: totalBudget > 0 ? weeklyUsed * (budget / totalBudget) : 0,
        },
      ]),
    );
  }, [categoryBudgets, weeklyBudget, weeklyUsed]);

  function handleSelectCard(id?: number) {
    const nextId = id ?? null;
    setSelectedCardId(nextId);

    if (!recommendation || nextId === null) return;

    const selected = [
      recommendation.recommended_card,
      ...recommendation.alternatives,
    ].find((card) => card.card_id === nextId);
    if (!selected) return;

    setDecisionLogs((prev) => [
      ...prev,
      `User selected ${selected.name} (•••• ${selected.last4}) with expected cashback $${selected.cashback_earned.toFixed(2)}.`,
    ]);
  }

  async function handleRecommend() {
    setError(null);
    setTxMessage(null);
    setLoading(true);
    try {
      const result = await recommendCard({
        user_id: USER_ID,
        category,
        amount: parsedAmount,
      });
      setRecommendation(result);
      setSelectedCardId(result.recommended_card.card_id);

      const comparedCards = [
        result.recommended_card,
        ...result.alternatives,
      ].slice(0, 2);
      const compareLine = comparedCards
        .map(
          (card) =>
            `${card.name} (rate ${card.cashback_rate.toFixed(1)}%, earn $${card.cashback_earned.toFixed(2)})`,
        )
        .join(" vs ");

      setDecisionLogs([
        `Checked category: ${category}.`,
        `Checked amount: $${parsedAmount.toFixed(2)}.`,
        `Checked budget context: used $${weeklyUsed.toFixed(2)} of $${weeklyBudget.toFixed(2)} this week.`,
        `Compared cards: ${compareLine}.`,
        `Decision: picked ${result.recommended_card.name} because ${result.recommended_card.reason}`,
      ]);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to fetch recommendation",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleUseCard() {
    if (!recommendation || selectedCardId === null) return;
    try {
      const recommended = recommendation.recommended_card;
      const alternatives = recommendation.alternatives;
      const selected =
        selectedCardId === recommended.card_id
          ? recommended
          : (alternatives.find((card) => card.card_id === selectedCardId) ??
            recommended);

      const tx = await logTransaction({
        user_id: USER_ID,
        card_id: selected.card_id,
        amount: parsedAmount,
        category,
      });
      setTxMessage(
        `Logged on ${selected.name}. Cashback earned: $${tx.cashback_earned.toFixed(2)}`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to log transaction");
    }
  }

  const recommendationCards = recommendation
    ? [recommendation.recommended_card, ...recommendation.alternatives].slice(
        0,
        2,
      )
    : [];

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">
          Which card should I use?
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Pick a category and amount, then get the best card instantly.
        </p>

        <div className="mt-4">
          <CategoryPicker
            categoryStats={categoryStats}
            onSelect={setCategory}
            selected={category}
          />
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1">
            <span className="text-sm font-medium text-slate-700">Amount</span>
            <input
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
              min="0"
              onChange={(e) => setAmount(e.target.value)}
              step="0.01"
              type="number"
              value={amount}
            />
          </label>
          <button
            className="rounded-xl bg-brand-500 px-5 py-2 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            disabled={loading || parsedAmount <= 0}
            onClick={handleRecommend}
            type="button"
          >
            {loading ? "Analyzing..." : "Analyze"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {recommendation ? (
        <article className="animate-[fadeIn_0.3s_ease] rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-slate-900">
              Recommendation Results
            </h3>
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
              Tap a card to choose
            </span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {recommendationCards.map((card, index) => (
              <CardTile
                id={card.card_id}
                bestCategory={category}
                cashbackEarned={card.cashback_earned}
                issuer={card.issuer}
                key={card.card_id}
                last4={card.last4}
                name={card.name}
                onSelect={handleSelectCard}
                promo={
                  index === 0 ? "Top recommendation" : "Alternative option"
                }
                selected={selectedCardId === card.card_id}
              />
            ))}
          </div>

          <p className="mt-4 text-sm text-slate-700">
            {recommendation.recommended_card.reason}
          </p>

          <button
            className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            disabled={selectedCardId === null}
            onClick={handleUseCard}
            type="button"
          >
            Use selected card
          </button>

          {txMessage ? (
            <p className="mt-3 text-sm font-medium text-brand-700">
              {txMessage}
            </p>
          ) : null}

          {decisionLogs.length > 0 ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                Decision log
              </h4>
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                {decisionLogs.map((log, index) => (
                  <li key={`${log}-${index}`}>• {log}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </article>
      ) : null}
    </section>
  );
}
