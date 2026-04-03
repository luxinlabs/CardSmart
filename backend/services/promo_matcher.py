from collections import Counter

from sqlalchemy.orm import Session

from ..models import Promotion, Transaction


def top_personalized_promos(db: Session, user_id: int, limit: int = 3) -> list[Promotion]:
    spend_history = db.query(Transaction).filter(Transaction.user_id == user_id).all()
    category_count = Counter([t.category for t in spend_history])

    promos = db.query(Promotion).all()
    if not category_count:
        return promos[:limit]

    ranked = sorted(
        promos,
        key=lambda promo: (
            category_count.get(promo.category, 0),
            promo.discount_pct,
        ),
        reverse=True,
    )
    return ranked[:limit]
