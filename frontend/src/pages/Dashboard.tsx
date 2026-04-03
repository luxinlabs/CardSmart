import { useEffect, useState } from "react";

import { getCards } from "../api";
import CardTile from "../components/CardTile";

const USER_ID = 1;

type CardItem = {
  id: number;
  user_id: number;
  issuer: string;
  name: string;
  last4: string;
};

const bestCategoryMap: Record<string, string> = {
  "Amex Gold": "dining",
  "Sapphire Preferred": "travel",
  "Double Cash": "other",
  "Discover It": "groceries",
  Venture: "travel",
  "Cash Rewards": "gas",
};

export default function Dashboard() {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [showAddHint, setShowAddHint] = useState(false);

  useEffect(() => {
    async function loadCards() {
      try {
        const data = await getCards(USER_ID);
        const fetchedCards = data.cards || [];
        setCards(fetchedCards);
        if (fetchedCards.length > 0) {
          setSelectedCardId(fetchedCards[0].id);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load cards");
      }
    }

    loadCards();
  }, []);

  const selectedCard = cards.find((card) => card.id === selectedCardId) ?? null;

  function handleAddCardDemo() {
    setShowAddHint(true);
    const demoCardPool: CardItem[] = [
      {
        id: 101,
        user_id: USER_ID,
        issuer: "Chase",
        name: "Freedom Unlimited",
        last4: "8732",
      },
      {
        id: 102,
        user_id: USER_ID,
        issuer: "Citi",
        name: "Custom Cash",
        last4: "6439",
      },
    ];

    const nextCard = demoCardPool.find(
      (candidate) => !cards.some((card) => card.id === candidate.id),
    );
    if (!nextCard) {
      return;
    }

    setCards((prev) => [...prev, nextCard]);
    setSelectedCardId(nextCard.id);
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
        {error}
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Linked Cards</h2>
        <button
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          onClick={handleAddCardDemo}
          type="button"
        >
          Add Card
        </button>
      </div>

      {showAddHint ? (
        <div className="rounded-xl border border-brand-100 bg-brand-50 px-3 py-2 text-sm text-brand-800">
          Demo mode: "Add Card" appends a sample card so you can test
          interactions.
        </div>
      ) : null}

      {selectedCard ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Selected card
          </p>
          <h3 className="mt-1 text-lg font-bold text-slate-900">
            {selectedCard.name} •••• {selectedCard.last4}
          </h3>
          <p className="text-sm text-slate-600">{selectedCard.issuer}</p>
          <p className="mt-2 text-sm text-slate-700">
            Tip: Use this as your default for{" "}
            <span className="font-semibold capitalize">
              {bestCategoryMap[selectedCard.name] ?? "other"}
            </span>{" "}
            purchases.
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((card, index) => (
          <CardTile
            id={card.id}
            bestCategory={bestCategoryMap[card.name] ?? "other"}
            cashbackEarned={18 + index * 4.25}
            issuer={card.issuer}
            key={card.id}
            last4={card.last4}
            name={card.name}
            onSelect={(id) => setSelectedCardId(id ?? null)}
            promo="2x weekend boost"
            selected={selectedCardId === card.id}
          />
        ))}
      </div>
    </section>
  );
}
