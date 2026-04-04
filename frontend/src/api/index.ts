const API_BASE = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8000";
const IS_PRODUCTION = import.meta.env.PROD;
const USE_MOCK = IS_PRODUCTION && !import.meta.env.VITE_API_BASE;

export type Card = {
  id?: number;
  card_id?: number;
  user_id: number;
  name: string;
  issuer: string;
  last4: string;
  active?: boolean;
};

export type RecommendRequest = {
  user_id: number;
  category: string;
  amount: number;
};

export type RecommendResponse = {
  recommended_card: {
    card_id: number;
    name: string;
    issuer: string;
    last4: string;
    cashback_rate: number;
    cashback_earned: number;
    reason: string;
  };
  alternatives: Array<{
    card_id: number;
    name: string;
    issuer: string;
    last4: string;
    cashback_rate: number;
    cashback_earned: number;
  }>;
};

export async function getCards(userId: number) {
  if (USE_MOCK) {
    return [
      { card_id: 1, user_id: userId, name: "Amex Gold", issuer: "American Express", last4: "1234", active: true },
      { card_id: 2, user_id: userId, name: "Chase Sapphire", issuer: "Chase", last4: "5678", active: true },
      { card_id: 3, user_id: userId, name: "Discover It", issuer: "Discover", last4: "9012", active: true },
    ];
  }
  
  const response = await fetch(`${API_BASE}/cards?user_id=${userId}`);
  if (!response.ok) throw new Error("Failed to fetch cards");
  const data = await response.json();
  return data.cards || [];
}

export async function addCard(payload: {
  user_id: number;
  name: string;
  issuer: string;
  last4: string;
}): Promise<Card> {
  const response = await fetch(`${API_BASE}/cards`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to add card");
  }
  return response.json();
}

export async function recommendCard(payload: RecommendRequest): Promise<RecommendResponse> {
  if (USE_MOCK) {
    // Mock response for production demo
    const mockCards = [
      { name: "Amex Gold", issuer: "American Express", last4: "1234", rate: 0.04 },
      { name: "Chase Sapphire Preferred", issuer: "Chase", last4: "5678", rate: 0.05 },
      { name: "Discover It", issuer: "Discover", last4: "9012", rate: 0.05 },
      { name: "Bank of America Cash Rewards", issuer: "Bank of America", last4: "3456", rate: 0.03 },
    ];
    const card = mockCards[Math.floor(Math.random() * mockCards.length)];
    const cashback = payload.amount * card.rate;
    const currentDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    return {
      recommended_card: {
        card_id: 1,
        name: card.name,
        issuer: card.issuer,
        last4: card.last4,
        cashback_rate: card.rate,
        cashback_earned: cashback,
        reason: `${card.name} offers ${(card.rate * 100).toFixed(1)}% cashback on ${payload.category} as of ${currentDate}. Best rate for this category.`,
      },
      alternatives: [],
    };
  }
  
  const response = await fetch(`${API_BASE}/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Failed to get recommendation");
  return response.json();
}

export async function logTransaction(payload: {
  user_id: number;
  card_id: number;
  amount: number;
  category: string;
}) {
  if (USE_MOCK) {
    return {
      transaction_id: Date.now(),
      ...payload,
      cashback_earned: payload.amount * 0.03,
    };
  }
  
  const response = await fetch(`${API_BASE}/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Failed to log transaction");
  return response.json();
}

export async function getBudgetStatus(userId: number) {
  if (USE_MOCK) {
    return {
      budget_weekly: 200,
      budget_used: 120,
    };
  }
  
  const response = await fetch(`${API_BASE}/budget/status?user_id=${userId}`);
  if (!response.ok) throw new Error("Failed to fetch budget status");
  return response.json();
}

export async function getPersonalizedPromos(userId: number) {
  const response = await fetch(`${API_BASE}/promotions/personalized?user_id=${userId}`);
  if (!response.ok) throw new Error("Failed to fetch promotions");
  return response.json();
}
