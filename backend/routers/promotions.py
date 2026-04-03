from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Card, Promotion
from ..schemas import PersonalizedPromotionsResponse
from ..services.promo_matcher import top_personalized_promos

router = APIRouter()


@router.get("/personalized", response_model=PersonalizedPromotionsResponse)
def get_personalized_promotions(user_id: int, db: Session = Depends(get_db)):
    promos = top_personalized_promos(db, user_id=user_id, limit=3)

    return {
        "promos": [
            {
                "id": promo.id,
                "card_id": promo.card_id,
                "card_name": promo.card.name,
                "title": promo.title,
                "category": promo.category,
                "discount_pct": promo.discount_pct,
                "expires_at": promo.expires_at,
                "url": promo.url,
            }
            for promo in promos
            if promo.expires_at >= date.today()
        ]
    }


@router.post("/refresh")
def refresh_promotions(db: Session = Depends(get_db)):
    promos = db.query(Promotion).all()
    return {"count": len(promos), "status": "ok"}
