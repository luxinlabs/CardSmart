const API_BASE = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8000";

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
  const response = await fetch(`${API_BASE}/cards?user_id=${userId}`);
  if (!response.ok) throw new Error("Failed to fetch cards");
  return response.json();
}

export async function recommendCard(payload: RecommendRequest): Promise<RecommendResponse> {
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
  const response = await fetch(`${API_BASE}/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Failed to log transaction");
  return response.json();
}

export async function getBudgetStatus(userId: number) {
  const response = await fetch(`${API_BASE}/budget/status?user_id=${userId}`);
  if (!response.ok) throw new Error("Failed to fetch budget status");
  return response.json();
}

export async function getPersonalizedPromos(userId: number) {
  const response = await fetch(`${API_BASE}/promotions/personalized?user_id=${userId}`);
  if (!response.ok) throw new Error("Failed to fetch promotions");
  return response.json();
}
