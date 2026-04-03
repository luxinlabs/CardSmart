from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Card, Transaction, User
from ..schemas import TransactionCreate, TransactionResponse
from ..services.card_scorer import score_card

router = APIRouter()


@router.post("", response_model=TransactionResponse)
def create_transaction(payload: TransactionCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    card = db.query(Card).filter(Card.id == payload.card_id, Card.user_id == payload.user_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found for user")

    _, cashback_earned = score_card(
        card=card,
        rules=card.reward_rules,
        promos=card.promotions,
        category=payload.category,
        amount=payload.amount,
    )

    tx = Transaction(
        user_id=payload.user_id,
        card_id=payload.card_id,
        amount=payload.amount,
        category=payload.category,
        cashback_earned=cashback_earned,
        created_at=datetime.utcnow(),
    )
    db.add(tx)

    user.budget_used += payload.amount

    db.commit()
    db.refresh(tx)

    return {
        "transaction_id": tx.id,
        "cashback_earned": round(cashback_earned, 2),
        "budget_used": round(user.budget_used, 2),
    }
