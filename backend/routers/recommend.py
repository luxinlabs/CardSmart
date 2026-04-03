from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Card, Promotion
from ..schemas import CardSummary, RecommendRequest, RecommendResponse
from ..services.card_scorer import score_card
from ..services.llm_client import generate_recommendation_reason

router = APIRouter()


@router.post("", response_model=RecommendResponse)
async def recommend_card(payload: RecommendRequest, db: Session = Depends(get_db)):
    cards = db.query(Card).filter(Card.user_id == payload.user_id).all()
    if not cards:
        raise HTTPException(status_code=404, detail="No cards found for user")

    scored_cards: list[dict] = []

    for card in cards:
        rules = card.reward_rules
        promos = [promo for promo in card.promotions if promo.expires_at >= date.today()]
        final_rate, cashback_earned = score_card(
            card=card,
            rules=rules,
            promos=promos,
            category=payload.category,
            amount=payload.amount,
        )
        scored_cards.append(
            {
                "card": card,
                "cashback_rate": final_rate,
                "cashback_earned": cashback_earned,
                "active_promos": [p.title for p in promos if p.category == payload.category],
            }
        )

    scored_cards.sort(key=lambda item: item["cashback_earned"], reverse=True)
    winner = scored_cards[0]

    reason = await generate_recommendation_reason(
        card_name=winner["card"].name,
        issuer=winner["card"].issuer,
        cashback_rate=winner["cashback_rate"],
        cashback_earned=winner["cashback_earned"],
        category=payload.category,
        amount=payload.amount,
        active_promos=winner["active_promos"],
    )

    alternatives = [
        CardSummary(
            card_id=item["card"].id,
            name=item["card"].name,
            issuer=item["card"].issuer,
            last4=item["card"].last4,
            cashback_rate=round(item["cashback_rate"], 4),
            cashback_earned=round(item["cashback_earned"], 2),
        )
        for item in scored_cards[1:3]
    ]

    return {
        "recommended_card": {
            "card_id": winner["card"].id,
            "name": winner["card"].name,
            "issuer": winner["card"].issuer,
            "last4": winner["card"].last4,
            "cashback_rate": round(winner["cashback_rate"], 4),
            "cashback_earned": round(winner["cashback_earned"], 2),
            "reason": reason,
        },
        "alternatives": alternatives,
    }
