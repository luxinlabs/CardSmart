from datetime import date, datetime, timedelta

from .database import Base, SessionLocal, engine
from .models import Card, Promotion, RewardRule, Transaction, User


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        existing_user = db.query(User).filter(User.id == 1).first()
        if existing_user:
            return

        user = User(
            id=1,
            name="Demo User",
            budget_weekly=200.0,
            budget_used=120.0,
            budget_alert_threshold=0.80,
            budget_last_reset_at=datetime.utcnow(),
        )
        db.add(user)
        db.flush()

        card_defs = [
            ("American Express", "Amex Gold", "4821"),
            ("Chase", "Sapphire Preferred", "1108"),
            ("Citi", "Double Cash", "9922"),
            ("Discover", "Discover It", "4207"),
            ("Capital One", "Venture", "7433"),
            ("Bank of America", "Cash Rewards", "6501"),
        ]

        cards: list[Card] = []
        for issuer, name, last4 in card_defs:
            card = Card(user_id=user.id, issuer=issuer, name=name, last4=last4)
            db.add(card)
            db.flush()
            cards.append(card)

        reward_map: dict[str, dict[str, float]] = {
            "Amex Gold": {
                "dining": 0.04,
                "groceries": 0.04,
                "gas": 0.01,
                "travel": 0.03,
                "other": 0.01,
            },
            "Sapphire Preferred": {
                "dining": 0.03,
                "groceries": 0.01,
                "gas": 0.01,
                "travel": 0.05,
                "other": 0.01,
            },
            "Double Cash": {
                "dining": 0.02,
                "groceries": 0.02,
                "gas": 0.02,
                "travel": 0.02,
                "other": 0.02,
            },
            "Discover It": {
                "dining": 0.01,
                "groceries": 0.05,
                "gas": 0.01,
                "travel": 0.01,
                "other": 0.01,
            },
            "Venture": {
                "dining": 0.01,
                "groceries": 0.01,
                "gas": 0.01,
                "travel": 0.02,
                "other": 0.01,
            },
            "Cash Rewards": {
                "dining": 0.02,
                "groceries": 0.02,
                "gas": 0.03,
                "travel": 0.01,
                "other": 0.01,
            },
        }

        for card in cards:
            for category, rate in reward_map[card.name].items():
                db.add(
                    RewardRule(
                        card_id=card.id,
                        category=category,
                        cashback_rate=rate,
                        monthly_cap=None,
                    )
                )

        expires_soon = date.today() + timedelta(days=21)
        expires_later = date.today() + timedelta(days=45)

        promo_defs = [
            ("Amex Gold", "10% back at Uber Eats", "dining", 0.10, expires_soon, "https://example.com/amex-ubereats"),
            ("Amex Gold", "8% at Whole Foods", "groceries", 0.08, expires_later, "https://example.com/amex-wholefoods"),
            ("Sapphire Preferred", "12% back on Lyft rides", "travel", 0.12, expires_later, "https://example.com/chase-lyft"),
            ("Sapphire Preferred", "6% dining weekends", "dining", 0.06, expires_soon, "https://example.com/chase-dining"),
            ("Double Cash", "5% back at Costco", "groceries", 0.05, expires_soon, "https://example.com/citi-costco"),
            ("Double Cash", "4% fuel stations", "gas", 0.04, expires_later, "https://example.com/citi-gas"),
            ("Discover It", "10% rotating groceries", "groceries", 0.10, expires_soon, "https://example.com/discover-rotating"),
            ("Discover It", "7% streaming", "other", 0.07, expires_later, "https://example.com/discover-streaming"),
            ("Venture", "9% on flights", "travel", 0.09, expires_later, "https://example.com/venture-flights"),
            ("Venture", "5% hotels", "travel", 0.05, expires_soon, "https://example.com/venture-hotels"),
            ("Cash Rewards", "8% gas stations", "gas", 0.08, expires_soon, "https://example.com/bofa-gas"),
            ("Cash Rewards", "5% grocery pickup", "groceries", 0.05, expires_later, "https://example.com/bofa-grocery"),
        ]

        by_name = {card.name: card for card in cards}
        for name, title, category, discount_pct, expires_at, url in promo_defs:
            db.add(
                Promotion(
                    card_id=by_name[name].id,
                    title=title,
                    category=category,
                    discount_pct=discount_pct,
                    expires_at=expires_at,
                    url=url,
                )
            )

        # Add sample transactions to demonstrate realistic spending
        sample_transactions = [
            (by_name["Amex Gold"].id, 45.50, "dining", 1.82),
            (by_name["Amex Gold"].id, 32.00, "groceries", 1.28),
            (by_name["Sapphire Preferred"].id, 18.75, "dining", 0.56),
            (by_name["Cash Rewards"].id, 12.50, "gas", 0.38),
            (by_name["Double Cash"].id, 8.25, "other", 0.17),
        ]

        for card_id, amount, category, cashback in sample_transactions:
            db.add(
                Transaction(
                    user_id=user.id,
                    card_id=card_id,
                    amount=amount,
                    category=category,
                    cashback_earned=cashback,
                    created_at=datetime.utcnow() - timedelta(hours=2),
                )
            )

        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed()
    print("Seed data inserted.")
