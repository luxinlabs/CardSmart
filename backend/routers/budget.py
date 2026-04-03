from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import BudgetStatusResponse

router = APIRouter()


def _monday_of(dt: datetime) -> datetime:
    return dt - timedelta(days=dt.weekday())


def _reset_budget_if_needed(user: User, now: datetime) -> bool:
    now_monday = _monday_of(now).date()
    last_reset_monday = _monday_of(user.budget_last_reset_at).date()
    if now_monday > last_reset_monday:
        user.budget_used = 0.0
        user.budget_last_reset_at = now
        return True
    return False


@router.get("/status", response_model=BudgetStatusResponse)
def get_budget_status(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if _reset_budget_if_needed(user, datetime.utcnow()):
        db.commit()

    budget_remaining = max(user.budget_weekly - user.budget_used, 0.0)
    utilization_pct = (user.budget_used / user.budget_weekly * 100.0) if user.budget_weekly > 0 else 0.0
    alert = utilization_pct >= user.budget_alert_threshold * 100

    return {
        "budget_weekly": round(user.budget_weekly, 2),
        "budget_used": round(user.budget_used, 2),
        "budget_remaining": round(budget_remaining, 2),
        "utilization_pct": round(utilization_pct, 2),
        "alert": alert,
        "alert_message": (
            f"You've used {round(utilization_pct):.0f}% of your weekly budget."
            if alert
            else "You are within your weekly budget."
        ),
    }
