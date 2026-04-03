from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Card
from ..schemas import CardCreate, CardListResponse, CardResponse

router = APIRouter()


@router.get("", response_model=CardListResponse)
def list_cards(user_id: int, db: Session = Depends(get_db)):
    cards = db.query(Card).filter(Card.user_id == user_id).all()
    return {
        "cards": [
            CardResponse(
                id=card.id,
                user_id=card.user_id,
                issuer=card.issuer,
                name=card.name,
                last4=card.last4,
            )
            for card in cards
        ]
    }


@router.post("", response_model=CardResponse)
def add_card(payload: CardCreate, db: Session = Depends(get_db)):
    existing = (
        db.query(Card)
        .filter(Card.user_id == payload.user_id, Card.last4 == payload.last4)
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Card with same last4 already exists for user")

    card = Card(
        user_id=payload.user_id,
        issuer=payload.issuer,
        name=payload.name,
        last4=payload.last4,
    )
    db.add(card)
    db.commit()
    db.refresh(card)
    return CardResponse(
        id=card.id,
        user_id=card.user_id,
        issuer=card.issuer,
        name=card.name,
        last4=card.last4,
    )
