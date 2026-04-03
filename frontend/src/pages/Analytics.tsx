import { useEffect, useState } from "react";
import { getBudgetStatus } from "../api";

const USER_ID = 1;

type SpendingInsight = {
  category: string;
  amount: number;
  trend: "up" | "down" | "stable";
  percentage: number;
};

type Recommendation = {
  id: string;
  title: string;
  description: string;
  type: "card" | "savings" | "cashback";
  icon: string;
};

export default function Analytics() {
  const [weeklyBudget, setWeeklyBudget] = useState(200);
  const [weeklyUsed, setWeeklyUsed] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const budget = await getBudgetStatus(USER_ID);
        setWeeklyBudget(budget.budget_weekly ?? 200);
        setWeeklyUsed(budget.budget_used ?? 0);
      } catch (error) {
        console.error("Failed to load analytics:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const spendingInsights: SpendingInsight[] = [
    { category: "Dining", amount: 42, trend: "up", percentage: 15 },
    { category: "Groceries", amount: 30, trend: "stable", percentage: 0 },
    { category: "Travel", amount: 26, trend: "down", percentage: -8 },
    { category: "Gas", amount: 22, trend: "up", percentage: 12 },
  ];

  const recommendations: Recommendation[] = [
    {
      id: "1",
      title: "Maximize Dining Rewards",
      description:
        "You spend 35% on dining. Consider the Amex Gold card for 4% cashback on restaurants.",
      type: "card",
      icon: "🍽️",
    },
    {
      id: "2",
      title: "Save on Groceries",
      description:
        "Switch to Discover It for rotating 5% cashback on groceries this quarter.",
      type: "savings",
      icon: "🛒",
    },
    {
      id: "3",
      title: "Travel Rewards Opportunity",
      description:
        "Your travel spending is growing. Chase Sapphire Preferred offers 5% on travel.",
      type: "cashback",
      icon: "✈️",
    },
    {
      id: "4",
      title: "Gas Station Cashback",
      description:
        "Bank of America Cash Rewards gives 3% back at gas stations - perfect for your usage.",
      type: "card",
      icon: "⛽",
    },
  ];

  const advertisements = [
    {
      id: "ad1",
      title: "Limited Time: 100,000 Bonus Points",
      subtitle: "Chase Sapphire Preferred",
      description:
        "Earn 100K points after $4,000 spend in 3 months. Perfect for your travel spending!",
      gradient: "from-blue-600 to-indigo-700",
      cta: "Learn More",
      url: "https://creditcards.chase.com/rewards-credit-cards/sapphire/preferred",
    },
    {
      id: "ad2",
      title: "5% Cashback on All Purchases",
      subtitle: "Discover It Cashback Match",
      description:
        "Get 5% rotating categories + cashback match for first year. Great for groceries!",
      gradient: "from-orange-500 to-amber-600",
      cta: "Apply Now",
      url: "https://www.discover.com/credit-cards/cashback-bonus/",
    },
  ];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-slate-600">Loading analytics...</p>
      </div>
    );
  }

  const savingsRate =
    weeklyUsed > 0 ? ((weeklyUsed * 0.03) / weeklyUsed) * 100 : 0;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Analytics</h1>
        <p className="mt-2 text-slate-600">
          Insights and recommendations based on your spending behavior
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-100 p-3">
              <svg
                className="h-6 w-6 text-indigo-600"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Spent This Week</p>
              <p className="text-2xl font-bold text-slate-900">
                ${weeklyUsed.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-green-100 p-3">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-slate-600">Avg. Cashback Rate</p>
              <p className="text-2xl font-bold text-slate-900">
                {savingsRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-100 p-3">
              <svg
                className="h-6 w-6 text-amber-600"
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
            <div>
              <p className="text-sm text-slate-600">Budget Remaining</p>
              <p className="text-2xl font-bold text-slate-900">
                ${(weeklyBudget - weeklyUsed).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Credit Score Improvement */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">
          Credit Score Improvement
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Actions you can take to improve your credit score
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border-2 border-green-200 bg-green-50 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-green-100 p-2">
                <svg
                  className="h-6 w-6 text-green-600"
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
              <div className="flex-1">
                <h3 className="font-bold text-green-900">On-Time Payments</h3>
                <p className="mt-1 text-sm text-green-800">
                  You're maintaining 100% on-time payment history. Keep it up!
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-green-200">
                    <div className="h-full w-full rounded-full bg-green-600" />
                  </div>
                  <span className="text-xs font-semibold text-green-700">
                    100%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-amber-100 p-2">
                <svg
                  className="h-6 w-6 text-amber-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-amber-900">Credit Utilization</h3>
                <p className="mt-1 text-sm text-amber-800">
                  You're at 60% utilization. Try to keep it below 30% for better
                  scores.
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-amber-200">
                    <div className="h-full w-3/5 rounded-full bg-amber-600" />
                  </div>
                  <span className="text-xs font-semibold text-amber-700">
                    60%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-blue-100 p-2">
                <svg
                  className="h-6 w-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-blue-900">
                  Increase Credit Limit
                </h3>
                <p className="mt-1 text-sm text-blue-800">
                  Request a credit limit increase to lower your utilization
                  ratio automatically.
                </p>
                <button
                  className="mt-2 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
                  type="button"
                >
                  Request Increase
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border-2 border-purple-200 bg-purple-50 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-purple-100 p-2">
                <svg
                  className="h-6 w-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-purple-900">Account Age</h3>
                <p className="mt-1 text-sm text-purple-800">
                  Your average account age is 2.5 years. Older accounts improve
                  your score.
                </p>
                <p className="mt-2 text-xs text-purple-700">
                  Keep your oldest accounts open and active.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Spending Trend Graph */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">Spending Trend</h2>
        <p className="mt-1 text-sm text-slate-600">
          Your spending over the last 4 weeks
        </p>

        <div className="mt-6 flex h-64 items-end justify-between gap-2">
          <div className="flex flex-1 flex-col items-center">
            <div className="relative w-full">
              <div className="h-32 w-full rounded-t-lg bg-gradient-to-t from-indigo-600 to-indigo-400" />
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-2 py-1 text-xs font-bold text-white">
                $85
              </div>
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-600">Week 1</p>
          </div>
          <div className="flex flex-1 flex-col items-center">
            <div className="relative w-full">
              <div className="h-40 w-full rounded-t-lg bg-gradient-to-t from-indigo-600 to-indigo-400" />
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-2 py-1 text-xs font-bold text-white">
                $102
              </div>
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-600">Week 2</p>
          </div>
          <div className="flex flex-1 flex-col items-center">
            <div className="relative w-full">
              <div className="h-36 w-full rounded-t-lg bg-gradient-to-t from-indigo-600 to-indigo-400" />
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-2 py-1 text-xs font-bold text-white">
                $95
              </div>
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-600">Week 3</p>
          </div>
          <div className="flex flex-1 flex-col items-center">
            <div className="relative w-full">
              <div className="h-48 w-full rounded-t-lg bg-gradient-to-t from-green-600 to-green-400" />
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 rounded-full bg-green-600 px-2 py-1 text-xs font-bold text-white">
                $120
              </div>
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-600">Week 4</p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-full bg-indigo-600" />
            <span className="text-slate-600">Previous Weeks</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-full bg-green-600" />
            <span className="text-slate-600">Current Week</span>
          </div>
        </div>
      </div>

      {/* Spending Insights */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">Spending Insights</h2>
        <p className="mt-1 text-sm text-slate-600">
          How your spending compares to last week
        </p>

        <div className="mt-4 space-y-3">
          {spendingInsights.map((insight) => (
            <div
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4"
              key={insight.category}
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">
                  {insight.category === "Dining"
                    ? "🍔"
                    : insight.category === "Groceries"
                      ? "🛍️"
                      : insight.category === "Travel"
                        ? "🚗"
                        : "⛽"}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">
                    {insight.category}
                  </p>
                  <p className="text-sm text-slate-600">
                    ${insight.amount.toFixed(2)} this week
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {insight.trend === "up" && (
                  <div className="flex items-center gap-1 rounded-full bg-red-100 px-3 py-1">
                    <svg
                      className="h-4 w-4 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M5 10l7-7m0 0l7 7m-7-7v18"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="text-sm font-semibold text-red-600">
                      +{insight.percentage}%
                    </span>
                  </div>
                )}
                {insight.trend === "down" && (
                  <div className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1">
                    <svg
                      className="h-4 w-4 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="text-sm font-semibold text-green-600">
                      {insight.percentage}%
                    </span>
                  </div>
                )}
                {insight.trend === "stable" && (
                  <div className="rounded-full bg-slate-200 px-3 py-1">
                    <span className="text-sm font-semibold text-slate-600">
                      Stable
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">
          AI Recommendations
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Personalized suggestions to maximize your rewards
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {recommendations.map((rec) => (
            <div
              className="rounded-xl border-2 border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 transition-all hover:border-indigo-300 hover:shadow-md"
              key={rec.id}
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl">{rec.icon}</div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900">{rec.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {rec.description}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        rec.type === "card"
                          ? "bg-blue-100 text-blue-700"
                          : rec.type === "savings"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {rec.type === "card"
                        ? "Card Suggestion"
                        : rec.type === "savings"
                          ? "Save Money"
                          : "Cashback Boost"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sponsored Offers */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">
            Sponsored Offers
          </h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            ADVERTISEMENT
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {advertisements.map((ad) => (
            <a
              className={`group relative block overflow-hidden rounded-2xl bg-gradient-to-br p-6 text-white shadow-xl transition-all hover:scale-105 ${ad.gradient}`}
              href={ad.url}
              key={ad.id}
              rel="noopener noreferrer"
              target="_blank"
            >
              <div className="absolute right-4 top-4 h-12 w-16 rounded-lg bg-white/20 backdrop-blur-sm" />
              <div className="absolute right-6 top-6 h-8 w-12 rounded-md bg-white/30" />

              <div className="relative">
                <p className="text-sm font-semibold uppercase tracking-wide opacity-90">
                  {ad.subtitle}
                </p>
                <h3 className="mt-1 text-2xl font-bold">{ad.title}</h3>
                <p className="mt-3 text-sm opacity-90">{ad.description}</p>

                <span className="mt-4 inline-block rounded-xl bg-white/30 px-6 py-2 font-semibold backdrop-blur-sm transition-all group-hover:bg-white/40">
                  {ad.cta} →
                </span>
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
