import { type ReactNode, useEffect, useMemo, useState } from "react";

import {
  getBudgetStatus,
  logTransaction,
  recommendCard,
  type RecommendResponse,
} from "../api";

const USER_ID = 1;
const CATEGORY_BUDGETS_STORAGE_KEY = `cardsmart.categoryBudgets.user.${USER_ID}`;

type CategoryKey = "dining" | "groceries" | "travel" | "gas";
type CategoryBudgets = Record<CategoryKey, number>;

type QuickPayReceipt = {
  cardName: string;
  last4: string;
  category: CategoryKey;
  amount: number;
  cashback: number;
};

type SmartRoutingTransaction = {
  id: string;
  category: CategoryKey;
  amount: number;
  cardName: string;
  last4: string;
  reason: string;
  timestamp: Date;
};

type FlipTileProps = {
  id: string;
  flipped: boolean;
  onToggle: (id: string) => void;
  front: ReactNode;
  back: ReactNode;
  heightClass?: string;
};

function FlipTile({
  id,
  flipped,
  onToggle,
  front,
  back,
  heightClass = "h-40",
}: FlipTileProps) {
  return (
    <button
      className={`w-full text-left [perspective:1400px] ${heightClass}`}
      onClick={() => onToggle(id)}
      type="button"
    >
      <div
        className={`relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] ${
          flipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        <div className="absolute inset-0 [backface-visibility:hidden]">
          {front}
        </div>
        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          {back}
        </div>
      </div>
    </button>
  );
}

export default function Dashboard() {
  const [category, setCategory] = useState<CategoryKey>("dining");
  const [amount, setAmount] = useState("45");
  const [transactionName, setTransactionName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendation, setRecommendation] =
    useState<RecommendResponse | null>(null);
  const [decisionLogs, setDecisionLogs] = useState<string[]>([]);
  const [weeklyBudget, setWeeklyBudget] = useState(200);
  const [weeklyUsed, setWeeklyUsed] = useState(0);
  const [categoryBudgets, setCategoryBudgets] =
    useState<CategoryBudgets | null>(null);
  const [quickPayOpen, setQuickPayOpen] = useState(false);
  const [quickPayReceipt, setQuickPayReceipt] =
    useState<QuickPayReceipt | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [selectedCardCategory, setSelectedCardCategory] =
    useState<CategoryKey | null>(null);
  const [expandedCard, setExpandedCard] = useState<CategoryKey | null>(null);
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const [smartRoutingTransactions, setSmartRoutingTransactions] = useState<
    SmartRoutingTransaction[]
  >([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [settingsCategory, setSettingsCategory] = useState<CategoryKey | null>(
    null,
  );
  const [categorySettings, setCategorySettings] = useState<
    Record<CategoryKey, { paused: boolean; aiRouting: boolean }>
  >({
    dining: { paused: false, aiRouting: true },
    groceries: { paused: false, aiRouting: true },
    travel: { paused: false, aiRouting: true },
    gas: { paused: false, aiRouting: true },
  });
  const [tempLimit, setTempLimit] = useState("");

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

    const categories: Array<{
      key: CategoryKey;
      title: string;
      emoji: string;
      gradient: string;
    }> = [
      {
        key: "dining",
        title: "Dining",
        emoji: "🍔",
        gradient: "from-orange-500 to-amber-400",
      },
      {
        key: "groceries",
        title: "Groceries",
        emoji: "🛍️",
        gradient: "from-violet-600 to-fuchsia-500",
      },
      {
        key: "travel",
        title: "Travel",
        emoji: "🚗",
        gradient: "from-sky-500 to-cyan-400",
      },
      {
        key: "gas",
        title: "Gas",
        emoji: "⛽",
        gradient: "from-pink-600 to-rose-500",
      },
    ];

    return categories.map((item) => {
      const budget = budgets[item.key];
      const rawUsed = totalBudget > 0 ? weeklyUsed * (budget / totalBudget) : 0;
      const used = Math.min(rawUsed, budget);
      const usedPct = budget > 0 ? Math.min((used / budget) * 100, 100) : 0;
      return { ...item, budget, used, usedPct };
    });
  }, [categoryBudgets, weeklyBudget, weeklyUsed]);

  const rewardAmount =
    quickPayReceipt?.cashback ??
    recommendation?.recommended_card.cashback_earned ??
    0;
  const savingsRate = weeklyUsed > 0 ? (rewardAmount / weeklyUsed) * 100 : 0;

  function toggleFlip(id: string) {
    setFlipped((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function openCategorySettings(cat: CategoryKey, event: React.MouseEvent) {
    event.stopPropagation();
    setSettingsCategory(cat);
    const budgets = categoryBudgets ?? {
      dining: weeklyBudget * 0.35,
      groceries: weeklyBudget * 0.25,
      travel: weeklyBudget * 0.22,
      gas: weeklyBudget * 0.18,
    };
    setTempLimit(budgets[cat].toFixed(0));
  }

  function closeCategorySettings() {
    setSettingsCategory(null);
    setTempLimit("");
  }

  function saveCategorySettings() {
    if (!settingsCategory) return;
    const newLimit = Number(tempLimit);
    if (newLimit > 0) {
      const newBudgets = {
        ...(categoryBudgets ?? {
          dining: weeklyBudget * 0.35,
          groceries: weeklyBudget * 0.25,
          travel: weeklyBudget * 0.22,
          gas: weeklyBudget * 0.18,
        }),
        [settingsCategory]: newLimit,
      };
      setCategoryBudgets(newBudgets);
      localStorage.setItem(
        CATEGORY_BUDGETS_STORAGE_KEY,
        JSON.stringify(newBudgets),
      );
    }
    closeCategorySettings();
  }

  function toggleCategorySetting(
    cat: CategoryKey,
    setting: "paused" | "aiRouting",
  ) {
    setCategorySettings((prev) => ({
      ...prev,
      [cat]: {
        ...prev[cat],
        [setting]: !prev[cat][setting],
      },
    }));
  }

  function openCategoryPicker() {
    setShowCategoryPicker(true);
  }

  async function handleCategorySelect(selectedCategory: CategoryKey) {
    setShowCategoryPicker(false);
    setCategory(selectedCategory);
    setError(null);
    setLoading(true);
    const targetCategory = selectedCategory;
    try {
      const result = await recommendCard({
        user_id: USER_ID,
        category: targetCategory,
        amount: parsedAmount,
      });
      setRecommendation(result);

      const comparedCards = [
        result.recommended_card,
        ...result.alternatives,
      ].slice(0, 2);
      const compareLine = comparedCards
        .map(
          (card) =>
            `${card.name} (${card.cashback_rate.toFixed(1)}%, $${card.cashback_earned.toFixed(2)})`,
        )
        .join(" vs ");

      setDecisionLogs([
        "Analyze called Minimax reason engine.",
        `Checked category: ${targetCategory}.`,
        `Checked amount: $${parsedAmount.toFixed(2)}.`,
        `Compared cards: ${compareLine}.`,
        `Decision: ${result.recommended_card.name} because ${result.recommended_card.reason}`,
      ]);

      setSmartRoutingTransactions((prev) => [
        ...prev,
        {
          id: `tx-${Date.now()}`,
          category: targetCategory,
          amount: parsedAmount,
          cardName: result.recommended_card.name,
          last4: result.recommended_card.last4,
          reason: result.recommended_card.reason,
          timestamp: new Date(),
        },
      ]);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to fetch recommendation",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRecommend(nextCategory?: CategoryKey) {
    if (nextCategory) {
      await handleCategorySelect(nextCategory);
    } else {
      openCategoryPicker();
    }
  }

  async function handleQuickPayTransactionInfo() {
    if (!recommendation) return;
    try {
      const tx = await logTransaction({
        user_id: USER_ID,
        card_id: recommendation.recommended_card.card_id,
        amount: parsedAmount,
        category,
      });

      setQuickPayReceipt({
        cardName: recommendation.recommended_card.name,
        last4: recommendation.recommended_card.last4,
        category,
        amount: parsedAmount,
        cashback: tx.cashback_earned,
      });

      setDecisionLogs((prev) => [
        ...prev,
        `Quick Pay direct pay used ${recommendation.recommended_card.name} for ${category} ($${parsedAmount.toFixed(2)}).`,
      ]);

      setSmartRoutingTransactions((prev) => [
        ...prev,
        {
          id: `tx-qp-${Date.now()}`,
          category,
          amount: parsedAmount,
          cardName: recommendation.recommended_card.name,
          last4: recommendation.recommended_card.last4,
          reason: recommendation.recommended_card.reason,
          timestamp: new Date(),
        },
      ]);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to log Quick Pay transaction",
      );
    }
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            onClick={openCategoryPicker}
            type="button"
          >
            {loading ? "Analyzing..." : "Simulate Payment"}
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <FlipTile
            back={
              <div className="h-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs uppercase text-slate-500">Total Spent</p>
                <p className="mt-2 text-lg font-bold text-slate-900">
                  Budget context
                </p>
                <p className="text-sm text-slate-600">
                  ${weeklyUsed.toFixed(2)} used this week
                </p>
              </div>
            }
            flipped={Boolean(flipped.summarySpent)}
            front={
              <div className="h-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-500">💳 Total Spent</p>
                <p className="mt-2 text-4xl font-bold text-slate-900">
                  ${weeklyUsed.toFixed(0)}
                </p>
              </div>
            }
            id="summarySpent"
            onToggle={toggleFlip}
          />

          <FlipTile
            back={
              <div className="h-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs uppercase text-slate-500">Rewards</p>
                <p className="mt-2 text-lg font-bold text-slate-900">
                  Current winner
                </p>
                <p className="text-sm text-slate-600">
                  {recommendation
                    ? recommendation.recommended_card.name
                    : "Run Analyze"}
                </p>
              </div>
            }
            flipped={Boolean(flipped.summaryRewards)}
            front={
              <div className="h-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-500">📈 Rewards</p>
                <p className="mt-2 text-4xl font-bold text-slate-900">
                  ${rewardAmount.toFixed(2)}
                </p>
                <p className="text-sm text-slate-500">
                  {quickPayReceipt ? "1 transaction" : "0 transactions"}
                </p>
              </div>
            }
            id="summaryRewards"
            onToggle={toggleFlip}
          />

          <FlipTile
            back={
              <div className="h-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs uppercase text-slate-500">Savings Rate</p>
                <p className="mt-2 text-lg font-bold text-slate-900">
                  AI reason
                </p>
                <p className="text-sm text-slate-600">
                  {recommendation?.recommended_card.reason ??
                    "Analyze to compute"}
                </p>
              </div>
            }
            flipped={Boolean(flipped.summarySavings)}
            front={
              <div className="h-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-500">✨ Savings Rate</p>
                <p className="mt-2 text-4xl font-bold text-slate-900">
                  {savingsRate.toFixed(0)}%
                </p>
                <p className="text-sm text-slate-500">AI optimized</p>
              </div>
            }
            id="summarySavings"
            onToggle={toggleFlip}
          />
        </div>
      </div>

      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
              Quick Pay Ribbon
            </span>
            <h3 className="mt-2 text-lg font-bold text-slate-900">
              iOS Quick Pay
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Analyze first, then double-click side button to open direct pay
              with the best virtual card.
            </p>
          </div>
          <button
            className="rounded-full border border-slate-300 bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            onDoubleClick={() => {
              if (!recommendation) {
                setError(
                  "Run Analyze first so Quick Pay can load your best card.",
                );
                return;
              }
              setQuickPayOpen(true);
              setQuickPayReceipt(null);
            }}
            type="button"
          >
            Double-click Side Button
          </button>
        </div>
      </article>

      {/* Apple Wallet-style Slide-in Panel */}
      {quickPayOpen && recommendation && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity"
            onClick={() => {
              setQuickPayOpen(false);
              setPaymentComplete(false);
              setPaymentProcessing(false);
              setSelectedCardCategory(null);
            }}
          />
          <div className="fixed right-0 top-0 z-50 h-full w-96 bg-gradient-to-b from-slate-50 to-white shadow-2xl">
            <div className="flex h-full flex-col">
              {/* Apple Pay Header */}
              <div className="bg-white p-6 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="text-2xl">🍎</div>
                    <h3 className="text-xl font-bold text-slate-900">Pay</h3>
                  </div>
                  <button
                    className="rounded-full p-2 hover:bg-slate-100"
                    onClick={() => {
                      setQuickPayOpen(false);
                      setPaymentComplete(false);
                      setPaymentProcessing(false);
                      setSelectedCardCategory(null);
                    }}
                    type="button"
                  >
                    <svg
                      className="h-6 w-6 text-slate-500"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M6 18L18 6M6 6l12 12"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Cards Stack */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                {!paymentComplete ? (
                  <>
                    {!expandedCard ? (
                      <div className="relative">
                        <div className="mb-2 text-center text-xs font-medium text-slate-500">
                          ${parsedAmount.toFixed(2)}
                        </div>
                        <div className="relative" style={{ height: "420px" }}>
                          {categoryStats.map((item, index) => {
                            const isSelected =
                              selectedCardCategory === item.key;
                            const offset = index * 70;
                            return (
                              <button
                                className={`absolute left-0 right-0 overflow-hidden rounded-2xl shadow-xl transition-all ${
                                  isSelected ? "z-10" : ""
                                }`}
                                key={item.key}
                                onClick={() => setExpandedCard(item.key)}
                                style={{
                                  top: `${offset}px`,
                                  height: "180px",
                                }}
                                type="button"
                              >
                                <div
                                  className={`relative h-full bg-gradient-to-br p-4 ${item.gradient}`}
                                >
                                  <div className="absolute right-3 top-3 h-8 w-12 rounded-lg bg-white/20 backdrop-blur-sm" />
                                  <div className="absolute right-4 top-4 h-6 w-9 rounded-md bg-white/30" />

                                  <div className="relative flex h-full flex-col justify-between text-white">
                                    <div>
                                      <p className="text-xs font-semibold uppercase tracking-wider opacity-90">
                                        Virtual Card
                                      </p>
                                      <p className="mt-1 text-lg font-bold">
                                        {item.emoji} {item.title}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="font-mono text-sm tracking-widest">
                                        •••• •••• ••••{" "}
                                        {item.key === "dining"
                                          ? "4821"
                                          : item.key === "groceries"
                                            ? "5932"
                                            : item.key === "travel"
                                              ? "7043"
                                              : "8154"}
                                      </p>
                                      <div className="mt-1 flex items-center justify-between text-xs">
                                        <span className="opacity-75">
                                          $
                                          {(item.budget - item.used).toFixed(0)}{" "}
                                          available
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <button
                          className="text-sm font-medium text-blue-600 hover:text-blue-700"
                          onClick={() => setExpandedCard(null)}
                          type="button"
                        >
                          ← Back to cards
                        </button>
                        {(() => {
                          const item = categoryStats.find(
                            (c) => c.key === expandedCard,
                          );
                          if (!item) return null;
                          return (
                            <div>
                              <div className="overflow-hidden rounded-3xl shadow-2xl">
                                <div
                                  className={`relative h-64 bg-gradient-to-br p-6 ${item.gradient}`}
                                >
                                  <div className="absolute right-4 top-4 h-12 w-16 rounded-lg bg-white/20 backdrop-blur-sm" />
                                  <div className="absolute right-6 top-6 h-8 w-12 rounded-md bg-white/30" />

                                  <div className="relative flex h-full flex-col justify-between text-white">
                                    <div>
                                      <p className="text-sm font-semibold uppercase tracking-wider opacity-90">
                                        Virtual Card
                                      </p>
                                      <p className="mt-2 text-3xl font-bold">
                                        {item.emoji} {item.title}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="font-mono text-2xl tracking-widest">
                                        •••• •••• ••••{" "}
                                        {item.key === "dining"
                                          ? "4821"
                                          : item.key === "groceries"
                                            ? "5932"
                                            : item.key === "travel"
                                              ? "7043"
                                              : "8154"}
                                      </p>
                                      <div className="mt-3 flex items-end justify-between">
                                        <div>
                                          <p className="text-xs uppercase opacity-75">
                                            Available
                                          </p>
                                          <p className="text-xl font-bold">
                                            $
                                            {(item.budget - item.used).toFixed(
                                              0,
                                            )}
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-xs uppercase opacity-75">
                                            Limit
                                          </p>
                                          <p className="text-lg font-semibold">
                                            ${item.budget.toFixed(0)}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="mt-6 rounded-xl bg-slate-100 p-4">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-slate-700">
                                    Balance
                                  </span>
                                  <span className="text-2xl font-bold text-slate-900">
                                    ${(item.budget - item.used).toFixed(2)}
                                  </span>
                                </div>
                              </div>

                              <button
                                className="mt-4 w-full rounded-xl bg-black py-3 text-sm font-semibold text-white hover:bg-slate-800"
                                onClick={() => {
                                  setSelectedCardCategory(item.key);
                                  setExpandedCard(null);
                                }}
                                type="button"
                              >
                                Use this card
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center">
                    <div className="rounded-full bg-green-100 p-6">
                      <svg
                        className="h-16 w-16 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <h3 className="mt-6 text-2xl font-bold text-slate-900">
                      Payment Complete
                    </h3>
                    <p className="mt-2 text-center text-slate-600">
                      ${parsedAmount.toFixed(2)} paid with{" "}
                      {recommendation.recommended_card.name}
                    </p>
                    <p className="mt-1 text-sm text-green-600">
                      +$
                      {recommendation.recommended_card.cashback_earned.toFixed(
                        2,
                      )}{" "}
                      cashback earned
                    </p>
                  </div>
                )}
              </div>

              {/* Footer Action */}
              {!paymentComplete && (
                <div className="border-t border-slate-200 bg-white p-6">
                  <button
                    className="w-full rounded-xl bg-black py-4 text-lg font-semibold text-white transition-all hover:bg-slate-800 disabled:opacity-50"
                    disabled={paymentProcessing || !selectedCardCategory}
                    onClick={async () => {
                      if (!selectedCardCategory) return;
                      setPaymentProcessing(true);
                      await new Promise((resolve) => setTimeout(resolve, 1500));
                      await handleQuickPayTransactionInfo();
                      setPaymentComplete(true);
                      setPaymentProcessing(false);
                      setTimeout(() => {
                        setQuickPayOpen(false);
                        setPaymentComplete(false);
                        setSelectedCardCategory(null);
                      }, 2000);
                    }}
                    type="button"
                  >
                    {paymentProcessing ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg
                          className="h-5 w-5 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            fill="currentColor"
                          />
                        </svg>
                        Processing...
                      </span>
                    ) : selectedCardCategory ? (
                      <span className="flex items-center justify-center gap-2">
                        <span>Pay with</span>
                        <span className="font-bold">
                          {
                            categoryStats.find(
                              (c) => c.key === selectedCardCategory,
                            )?.title
                          }
                        </span>
                      </span>
                    ) : (
                      "Select a Card"
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-3xl font-bold text-slate-900">Smart Routing</h3>
        <p className="mt-1 text-sm text-slate-600">
          AI-powered card selection history showing which real-life card was
          used for each transaction.
        </p>

        {smartRoutingTransactions.length === 0 ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
            <p className="text-sm text-slate-500">
              No transactions yet. Run Analyze or use Quick Pay to see smart
              routing in action.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {smartRoutingTransactions
              .slice()
              .reverse()
              .map((tx) => (
                <div
                  className="rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-4 shadow-sm"
                  key={tx.id}
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <div className="relative h-14 w-20 overflow-hidden rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 shadow-md">
                          <div className="absolute right-1.5 top-1.5 h-4 w-5 rounded bg-white/20 backdrop-blur-sm" />
                          <div className="absolute right-2 top-2 h-3 w-4 rounded-sm bg-white/30" />
                          <div className="flex h-full flex-col justify-between p-2 text-white">
                            <p className="text-[8px] font-semibold uppercase opacity-90">
                              Credit Card
                            </p>
                            <div>
                              <p className="font-mono text-[9px] tracking-wide">
                                •••• {tx.last4}
                              </p>
                              <p className="mt-0.5 text-[8px] font-semibold leading-tight">
                                {tx.cardName}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <span className="text-lg font-semibold text-slate-900">
                          {tx.category === "dining"
                            ? "Restaurant"
                            : tx.category === "groceries"
                              ? "Whole Foods Market"
                              : tx.category === "travel"
                                ? "Delta Airlines"
                                : "Shell Gas Station"}
                        </span>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Paid with {tx.cardName}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-900">
                        ${tx.amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {(() => {
                          const now = new Date();
                          const diff = Math.floor(
                            (now.getTime() -
                              new Date(
                                now.getTime() - Math.random() * 3600000,
                              ).getTime()) /
                              60000,
                          );
                          return diff < 60
                            ? `${diff} min ago`
                            : `${Math.floor(diff / 60)} hr ago`;
                        })()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 rounded-lg bg-slate-100 p-3">
                    <svg
                      className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-600"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <p className="text-sm text-slate-700">
                      {(() => {
                        const currentMonth = new Date().toLocaleString(
                          "default",
                          { month: "long" },
                        );
                        const currentDate = new Date().toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric", year: "numeric" },
                        );
                        if (tx.category === "groceries") {
                          return `5% rotating category bonus on groceries this quarter (${currentMonth}). Saved vs. 1.5% flat rate on Citi Double Cash. Valid through Mar 31, 2026.`;
                        } else if (tx.category === "dining") {
                          return `${tx.cardName} offers 4% cashback on dining as of ${currentDate}. Best rate compared to 2% on other cards.`;
                        } else if (tx.category === "travel") {
                          return `Chase Sapphire earns 5x points on travel (effective ${currentDate}). Current quarter promotion through Mar 31.`;
                        } else {
                          return `${tx.cardName} provides 3% cashback at gas stations (${currentMonth} 2026). Optimal for fuel purchases.`;
                        }
                      })()}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                      {tx.category.charAt(0).toUpperCase() +
                        tx.category.slice(1)}
                    </span>
                    <span className="text-xs text-green-600">
                      +${(tx.amount * 0.03).toFixed(2)} saved
                    </span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>

      <div>
        <h3 className="text-4xl font-bold text-slate-900">Virtual Cards</h3>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          {categoryStats.map((item) => {
            const tileId = `category-${item.key}`;
            return (
              <div
                className="group relative overflow-hidden rounded-2xl shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
                key={item.key}
                onClick={() => toggleFlip(tileId)}
              >
                <div
                  className={`relative h-56 bg-gradient-to-br p-6 ${item.gradient}`}
                >
                  <div className="absolute right-4 top-4 h-12 w-16 rounded-lg bg-white/20 backdrop-blur-sm" />
                  <div className="absolute right-6 top-6 h-8 w-12 rounded-md bg-white/30" />

                  <button
                    className="absolute left-6 top-6 rounded-full bg-white/20 p-2 backdrop-blur-sm transition-all hover:bg-white/30"
                    onClick={(e) => openCategorySettings(item.key, e)}
                    type="button"
                  >
                    <svg
                      className="h-5 w-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  <div className="relative flex h-full flex-col justify-between text-white">
                    <div className="mt-8">
                      <p className="text-sm font-semibold uppercase tracking-wider opacity-90">
                        Virtual Card
                      </p>
                      <p className="mt-1 text-3xl font-bold">
                        {item.emoji} {item.title}
                      </p>
                    </div>

                    <div>
                      <p className="font-mono text-xl tracking-widest">
                        •••• •••• ••••{" "}
                        {item.key === "dining"
                          ? "4821"
                          : item.key === "groceries"
                            ? "5932"
                            : item.key === "travel"
                              ? "7043"
                              : "8154"}
                      </p>
                      <div className="mt-3 flex items-end justify-between">
                        <div>
                          <p className="text-xs uppercase opacity-75">
                            Available
                          </p>
                          <p className="text-2xl font-bold">
                            ${(item.budget - item.used).toFixed(0)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs uppercase opacity-75">Limit</p>
                          <p className="text-lg font-semibold">
                            ${item.budget.toFixed(0)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                        <div
                          className="h-full rounded-full bg-white/80 transition-all"
                          style={{ width: `${item.usedPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-3xl font-bold text-slate-900">
          Recent Transactions
        </h3>
        {error ? (
          <div className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          {decisionLogs.length === 0 ? (
            <li>No activity yet.</li>
          ) : (
            decisionLogs
              .slice()
              .reverse()
              .map((log, index) => <li key={`${log}-${index}`}>• {log}</li>)
          )}
        </ul>
      </section>

      {showCategoryPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl rounded-3xl bg-white p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-3xl font-bold text-slate-900">
                Simulate Payment
              </h3>
              <button
                className="rounded-full p-2 hover:bg-slate-100"
                onClick={() => setShowCategoryPicker(false)}
                type="button"
              >
                <svg
                  className="h-6 w-6 text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M6 18L18 6M6 6l12 12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            <div className="mb-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Transaction Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">
                    $
                  </span>
                  <input
                    className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-2xl font-bold text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    type="number"
                    value={amount}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Transaction Name (Optional)
                </label>
                <input
                  className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-lg text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  onChange={(e) => setTransactionName(e.target.value)}
                  placeholder="e.g., Starbucks, Whole Foods, Gas Station"
                  type="text"
                  value={transactionName}
                />
              </div>
            </div>

            <p className="mb-6 text-sm text-slate-600">
              Select a virtual card category. The AI will automatically analyze
              and choose the best real card from your personal cards.
            </p>

            <div className="grid gap-6 md:grid-cols-2">
              {categoryStats.map((item) => (
                <button
                  className="group relative overflow-hidden rounded-2xl shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
                  key={item.key}
                  onClick={() => handleCategorySelect(item.key)}
                  type="button"
                >
                  <div
                    className={`relative h-56 bg-gradient-to-br p-6 ${item.gradient}`}
                  >
                    <div className="absolute right-4 top-4 h-12 w-16 rounded-lg bg-white/20 backdrop-blur-sm" />
                    <div className="absolute right-6 top-6 h-8 w-12 rounded-md bg-white/30" />

                    <div className="relative flex h-full flex-col justify-between text-white">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-wider opacity-90">
                          Virtual Card
                        </p>
                        <p className="mt-1 text-3xl font-bold">
                          {item.emoji} {item.title}
                        </p>
                      </div>

                      <div>
                        <p className="font-mono text-xl tracking-widest">
                          •••• •••• ••••{" "}
                          {item.key === "dining"
                            ? "4821"
                            : item.key === "groceries"
                              ? "5932"
                              : item.key === "travel"
                                ? "7043"
                                : "8154"}
                        </p>
                        <div className="mt-3 flex items-end justify-between">
                          <div>
                            <p className="text-xs uppercase opacity-75">
                              Available
                            </p>
                            <p className="text-2xl font-bold">
                              ${(item.budget - item.used).toFixed(0)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs uppercase opacity-75">
                              Limit
                            </p>
                            <p className="text-lg font-semibold">
                              ${item.budget.toFixed(0)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                          <div
                            className="h-full rounded-full bg-white/80 transition-all"
                            style={{
                              width: `${(item.used / item.budget) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {settingsCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-slate-900">
                {categoryStats.find((c) => c.key === settingsCategory)?.emoji}{" "}
                {categoryStats.find((c) => c.key === settingsCategory)?.title}{" "}
                Settings
              </h3>
              <button
                className="rounded-full p-2 hover:bg-slate-100"
                onClick={closeCategorySettings}
                type="button"
              >
                <svg
                  className="h-6 w-6 text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M6 18L18 6M6 6l12 12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Category Limit
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400">
                    $
                  </span>
                  <input
                    className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-xl font-bold text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    onChange={(e) => setTempLimit(e.target.value)}
                    placeholder="0.00"
                    type="number"
                    value={tempLimit}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-xl border-2 border-slate-200 bg-slate-50 p-4">
                  <div>
                    <p className="font-semibold text-slate-900">Pause Card</p>
                    <p className="text-sm text-slate-600">
                      Temporarily disable this virtual card
                    </p>
                  </div>
                  <button
                    className={`relative h-8 w-14 rounded-full transition-colors ${
                      categorySettings[settingsCategory].paused
                        ? "bg-indigo-600"
                        : "bg-slate-300"
                    }`}
                    onClick={() =>
                      toggleCategorySetting(settingsCategory, "paused")
                    }
                    type="button"
                  >
                    <div
                      className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-md transition-transform ${
                        categorySettings[settingsCategory].paused
                          ? "translate-x-7"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between rounded-xl border-2 border-slate-200 bg-slate-50 p-4">
                  <div>
                    <p className="font-semibold text-slate-900">
                      AI Smart Routing
                    </p>
                    <p className="text-sm text-slate-600">
                      Let AI choose the best card automatically
                    </p>
                  </div>
                  <button
                    className={`relative h-8 w-14 rounded-full transition-colors ${
                      categorySettings[settingsCategory].aiRouting
                        ? "bg-indigo-600"
                        : "bg-slate-300"
                    }`}
                    onClick={() =>
                      toggleCategorySetting(settingsCategory, "aiRouting")
                    }
                    type="button"
                  >
                    <div
                      className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-md transition-transform ${
                        categorySettings[settingsCategory].aiRouting
                          ? "translate-x-7"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  className="flex-1 rounded-xl border-2 border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                  onClick={closeCategorySettings}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-indigo-500"
                  onClick={saveCategorySettings}
                  type="button"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
