from datetime import date, datetime

from pydantic import BaseModel


class CardSummary(BaseModel):
    card_id: int
    name: str
    issuer: str
    last4: str
    cashback_rate: float
    cashback_earned: float


class RecommendRequest(BaseModel):
    user_id: int
    category: str
    amount: float


class RecommendCardResponse(CardSummary):
    reason: str


class RecommendResponse(BaseModel):
    recommended_card: RecommendCardResponse
    alternatives: list[CardSummary]


class TransactionCreate(BaseModel):
    user_id: int
    card_id: int
    amount: float
    category: str


class TransactionResponse(BaseModel):
    transaction_id: int
    cashback_earned: float
    budget_used: float


class BudgetStatusResponse(BaseModel):
    budget_weekly: float
    budget_used: float
    budget_remaining: float
    utilization_pct: float
    alert: bool
    alert_message: str


class PromotionResponse(BaseModel):
    id: int
    card_id: int
    card_name: str
    title: str
    category: str
    discount_pct: float
    expires_at: date
    url: str


class PersonalizedPromotionsResponse(BaseModel):
    promos: list[PromotionResponse]


class CardCreate(BaseModel):
    user_id: int
    issuer: str
    name: str
    last4: str


class CardResponse(BaseModel):
    id: int
    user_id: int
    issuer: str
    name: str
    last4: str


class CardListResponse(BaseModel):
    cards: list[CardResponse]


class UserBudgetSummary(BaseModel):
    id: int
    name: str
    budget_weekly: float
    budget_used: float
    budget_alert_threshold: float
    budget_last_reset_at: datetime
