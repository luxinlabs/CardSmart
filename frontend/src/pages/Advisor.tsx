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

export default function Advisor() {
  const [category, setCategory] = useState("dining");
  const [amount, setAmount] = useState("45");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendation, setRecommendation] =
    useState<RecommendResponse | null>(null);
  const [txMessage, setTxMessage] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [weeklyBudget, setWeeklyBudget] = useState(200);
  const [weeklyUsed, setWeeklyUsed] = useState(0);

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

  const categoryStats = useMemo(() => {
    const split: Record<string, number> = {
      dining: 0.35,
      groceries: 0.25,
      travel: 0.22,
      gas: 0.18,
    };

    return Object.fromEntries(
      Object.entries(split).map(([key, ratio]) => [
        key,
        {
          budget: weeklyBudget * ratio,
          used: weeklyUsed * ratio,
        },
      ]),
    );
  }, [weeklyBudget, weeklyUsed]);

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
    ? [recommendation.recommended_card, ...recommendation.alternatives]
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
            {loading ? "Thinking..." : "Which card?"}
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
                onSelect={(id) => setSelectedCardId(id ?? null)}
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
        </article>
      ) : null}
    </section>
  );
}
