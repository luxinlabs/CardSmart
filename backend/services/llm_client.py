import os

import httpx


async def generate_recommendation_reason(
    card_name: str,
    issuer: str,
    cashback_rate: float,
    cashback_earned: float,
    category: str,
    amount: float,
    active_promos: list[str],
) -> str:
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        promo_suffix = f" Active promo: {active_promos[0]}." if active_promos else ""
        return (
            f"{card_name} from {issuer} gives the highest return for {category} at "
            f"{cashback_rate * 100:.1f}% (~${cashback_earned:.2f} on ${amount:.2f})."
            f"{promo_suffix}"
        )

    prompt = (
        f"The user is buying {category} for ${amount:.2f}. "
        f"The best card is {card_name} ({issuer}) with {cashback_rate*100:.1f}% cashback. "
        f"Estimated savings: ${cashback_earned:.2f}. "
        f"Active promos: {', '.join(active_promos) if active_promos else 'none'}. "
        "Write exactly one plain-English sentence explaining why this card wins."
    )

    headers = {
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }
    payload = {
        "model": "claude-3-5-sonnet-20240620",
        "max_tokens": 120,
        "messages": [{"role": "user", "content": prompt}],
    }

    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.post("https://api.anthropic.com/v1/messages", headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()

    content = data.get("content", [])
    if content and isinstance(content, list):
        text = content[0].get("text", "").strip()
        if text:
            return text

    return (
        f"{card_name} from {issuer} gives the highest return for {category} at "
        f"{cashback_rate * 100:.1f}% (~${cashback_earned:.2f})."
    )
