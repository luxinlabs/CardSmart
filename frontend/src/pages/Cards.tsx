import { useEffect, useState } from "react";
import { addCard, getCards, type Card } from "../api";

const USER_ID = 1;

export default function Cards() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCard, setNewCard] = useState({
    name: "",
    issuer: "",
    last4: "",
  });

  useEffect(() => {
    async function loadCards() {
      try {
        const data = await getCards(USER_ID);
        setCards(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load cards:", error);
        setCards([]);
      } finally {
        setLoading(false);
      }
    }
    loadCards();
  }, []);

  const cardBrands = [
    {
      name: "Chase Sapphire Reserve",
      issuer: "Chase",
      gradient: "from-blue-600 to-indigo-700",
      logo: "💎",
    },
    {
      name: "American Express Gold",
      issuer: "Amex",
      gradient: "from-amber-400 to-yellow-500",
      logo: "🏆",
    },
    {
      name: "Capital One Venture",
      issuer: "Capital One",
      gradient: "from-red-500 to-rose-600",
      logo: "✈️",
    },
    {
      name: "Citi Double Cash",
      issuer: "Citi",
      gradient: "from-slate-600 to-slate-800",
      logo: "💰",
    },
  ];

  async function handleAddCard() {
    if (!newCard.name || !newCard.issuer || !newCard.last4) return;

    try {
      const savedCard = await addCard({
        user_id: USER_ID,
        name: newCard.name,
        issuer: newCard.issuer,
        last4: newCard.last4,
      });

      setCards([...cards, savedCard]);
      setNewCard({ name: "", issuer: "", last4: "" });
      setShowAddCard(false);
    } catch (error) {
      console.error("Failed to add card:", error);
      alert(error instanceof Error ? error.message : "Failed to add card");
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-slate-600">Loading cards...</p>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">My Cards</h1>
          <p className="mt-2 text-slate-600">
            Manage your personal credit cards
          </p>
        </div>
        <button
          className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-indigo-500"
          onClick={() => setShowAddCard(true)}
          type="button"
        >
          + Add Card
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, index) => {
          const brandInfo = cardBrands[index % cardBrands.length];
          return (
            <div
              className="group relative overflow-hidden rounded-2xl shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
              key={card.id || card.card_id}
            >
              <div
                className={`relative h-56 bg-gradient-to-br p-6 ${brandInfo.gradient}`}
              >
                <div className="absolute right-4 top-4 h-12 w-16 rounded-lg bg-white/20 backdrop-blur-sm" />
                <div className="absolute right-6 top-6 h-8 w-12 rounded-md bg-white/30" />

                <div className="relative flex h-full flex-col justify-between text-white">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wider opacity-90">
                      Credit Card
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-3xl">{brandInfo.logo}</span>
                      <p className="text-2xl font-bold">{card.name}</p>
                    </div>
                  </div>

                  <div>
                    <p className="font-mono text-xl tracking-widest">
                      •••• •••• •••• {card.last4}
                    </p>
                    <div className="mt-3 flex items-end justify-between">
                      <div>
                        <p className="text-xs uppercase opacity-75">Issuer</p>
                        <p className="text-lg font-semibold">{card.issuer}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase opacity-75">Status</p>
                        <p className="text-sm font-semibold">
                          {card.active ? "✓ Active" : "Inactive"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </div>
          );
        })}
      </div>

      {cards.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <p className="text-xl font-semibold text-slate-600">
            No cards added yet
          </p>
          <p className="mt-2 text-slate-500">Click "Add Card" to get started</p>
        </div>
      )}

      {showAddCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-slate-900">
                Add New Card
              </h3>
              <button
                className="rounded-full p-2 hover:bg-slate-100"
                onClick={() => setShowAddCard(false)}
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

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Card Name
                </label>
                <input
                  className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  onChange={(e) =>
                    setNewCard({ ...newCard, name: e.target.value })
                  }
                  placeholder="e.g., Chase Sapphire Reserve"
                  type="text"
                  value={newCard.name}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Issuer
                </label>
                <input
                  className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  onChange={(e) =>
                    setNewCard({ ...newCard, issuer: e.target.value })
                  }
                  placeholder="e.g., Chase, Amex, Citi"
                  type="text"
                  value={newCard.issuer}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Last 4 Digits
                </label>
                <input
                  className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 font-mono text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  maxLength={4}
                  onChange={(e) =>
                    setNewCard({ ...newCard, last4: e.target.value })
                  }
                  placeholder="1234"
                  type="text"
                  value={newCard.last4}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  className="flex-1 rounded-xl border-2 border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                  onClick={() => setShowAddCard(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
                  disabled={!newCard.name || !newCard.issuer || !newCard.last4}
                  onClick={handleAddCard}
                  type="button"
                >
                  Add Card
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
