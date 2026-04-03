from datetime import date

from ..models import Card, Promotion, RewardRule


def score_card(
    card: Card,
    rules: list[RewardRule],
    promos: list[Promotion],
    category: str,
    amount: float,
) -> tuple[float, float]:
    base_rule = next((rule for rule in rules if rule.category == category), None)
    fallback_rule = next((rule for rule in rules if rule.category == "other"), None)

    base_rate = 0.01
    if base_rule:
        base_rate = base_rule.cashback_rate
    elif fallback_rule:
        base_rate = fallback_rule.cashback_rate

    promo_bonus = 0.0
    for promo in promos:
        if promo.card_id == card.id and promo.category == category and promo.expires_at >= date.today():
            promo_bonus = max(promo_bonus, promo.discount_pct)

    final_rate = base_rate + promo_bonus
    cashback_earned = final_rate * amount
    return final_rate, cashback_earned
