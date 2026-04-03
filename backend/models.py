from datetime import datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    budget_weekly: Mapped[float] = mapped_column(Float, default=200.0)
    budget_used: Mapped[float] = mapped_column(Float, default=0.0)
    budget_alert_threshold: Mapped[float] = mapped_column(Float, default=0.80)
    budget_last_reset_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    cards = relationship("Card", back_populates="user", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")


class Card(Base):
    __tablename__ = "cards"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    issuer: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    last4: Mapped[str] = mapped_column(String(4), nullable=False)

    user = relationship("User", back_populates="cards")
    reward_rules = relationship("RewardRule", back_populates="card", cascade="all, delete-orphan")
    promotions = relationship("Promotion", back_populates="card", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="card", cascade="all, delete-orphan")


class RewardRule(Base):
    __tablename__ = "reward_rules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    card_id: Mapped[int] = mapped_column(ForeignKey("cards.id"), nullable=False)
    category: Mapped[str] = mapped_column(String, nullable=False)
    cashback_rate: Mapped[float] = mapped_column(Float, nullable=False)
    monthly_cap: Mapped[float | None] = mapped_column(Float, nullable=True)

    card = relationship("Card", back_populates="reward_rules")


class Promotion(Base):
    __tablename__ = "promotions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    card_id: Mapped[int] = mapped_column(ForeignKey("cards.id"), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    category: Mapped[str] = mapped_column(String, nullable=False)
    discount_pct: Mapped[float] = mapped_column(Float, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(Date, nullable=False)
    url: Mapped[str] = mapped_column(String, nullable=False)

    card = relationship("Card", back_populates="promotions")


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    card_id: Mapped[int] = mapped_column(ForeignKey("cards.id"), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    category: Mapped[str] = mapped_column(String, nullable=False)
    cashback_earned: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="transactions")
    card = relationship("Card", back_populates="transactions")
