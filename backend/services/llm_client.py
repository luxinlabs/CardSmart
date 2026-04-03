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
    api_key = os.getenv("MINIMAX_API_KEY")
    if not api_key:
        promo_suffix = f" Active promo: {active_promos[0]}." if active_promos else ""
        return (
            f"{card_name} from {issuer} gives the highest return for {category} at "
            f"{cashback_rate * 100:.1f}% (~${cashback_earned:.2f} on ${amount:.2f})."
            f"{promo_suffix}"
        )

    endpoint = os.getenv("MINIMAX_API_URL", "https://api.minimax.chat/v1/text/chatcompletion_v2")
    model = os.getenv("MINIMAX_MODEL", "abab6.5s-chat")

    prompt = (
        f"The user is buying {category} for ${amount:.2f}. "
        f"The best card is {card_name} ({issuer}) with {cashback_rate*100:.1f}% cashback. "
        f"Estimated savings: ${cashback_earned:.2f}. "
        f"Active promos: {', '.join(active_promos) if active_promos else 'none'}. "
        "Write exactly one plain-English sentence explaining why this card wins."
    )

    headers = {
        "Authorization": f"Bearer {api_key}",
        "content-type": "application/json",
    }
    payload = {
        "model": model,
        "max_tokens": 120,
        "temperature": 0.2,
        "messages": [
            {
                "role": "system",
                "content": "You are a concise credit card rewards assistant.",
            },
            {"role": "user", "content": prompt},
        ],
    }

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(endpoint, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
    except Exception:
        promo_suffix = f" Active promo: {active_promos[0]}." if active_promos else ""
        return (
            f"{card_name} from {issuer} gives the highest return for {category} at "
            f"{cashback_rate * 100:.1f}% (~${cashback_earned:.2f} on ${amount:.2f})."
            f"{promo_suffix}"
        )

    choices = data.get("choices")
    if isinstance(choices, list) and choices:
        choice = choices[0]
        if isinstance(choice, dict):
            message = choice.get("message")
            if isinstance(message, dict):
                text = str(message.get("content", "")).strip()
                if text:
                    return text
            text = str(choice.get("text", "")).strip()
            if text:
                return text

    reply = data.get("reply")
    if isinstance(reply, str) and reply.strip():
        return reply.strip()

    output_text = data.get("output_text")
    if isinstance(output_text, str) and output_text.strip():
        return output_text.strip()

    return (
        f"{card_name} from {issuer} gives the highest return for {category} at "
        f"{cashback_rate * 100:.1f}% (~${cashback_earned:.2f} on ${amount:.2f})."
    )
