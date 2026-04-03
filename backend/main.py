from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import budget, cards, promotions, recommend, transactions

Base.metadata.create_all(bind=engine)

app = FastAPI(title="CardSmart API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cards.router, prefix="/cards", tags=["cards"])
app.include_router(transactions.router, prefix="/transactions", tags=["transactions"])
app.include_router(recommend.router, prefix="/recommend", tags=["recommend"])
app.include_router(budget.router, prefix="/budget", tags=["budget"])
app.include_router(promotions.router, prefix="/promotions", tags=["promotions"])


@app.get("/health")
def health_check():
    return {"status": "ok"}
