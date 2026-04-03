# CardSmart

CardSmart is a hackathon-ready credit card advisor that recommends the best card for each purchase, tracks weekly budget usage, and surfaces personalized promos.

## Stack

- Frontend: React + Tailwind (`frontend/`)
- Backend: FastAPI + SQLAlchemy + SQLite (`backend/`)
- Orchestration: n8n workflows (`n8n/workflows/`)
- LLM: Claude API via `ANTHROPIC_API_KEY` (with fallback reason generation)

## Repository Layout

- `backend/main.py` - FastAPI entrypoint
- `backend/models.py` - SQLAlchemy models
- `backend/routers/` - API routes
- `backend/services/` - scoring, LLM, promo matching
- `backend/seed_data.py` - demo user + cards + rewards + promos
- `frontend/src/pages/` - `Advisor`, `Budget`, `Dashboard`
- `frontend/src/components/` - shared UI components
- `frontend/src/api/index.ts` - fetch wrappers for backend
- `n8n/workflows/` - recommendation, budget alert, promo scanner workflows

## Quick Start (Local)

### Backend

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
python -m backend.seed_data
uvicorn backend.main:app --reload
```

Backend runs at `http://127.0.0.1:8000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://127.0.0.1:5173`.

Set optional API URL override:

```bash
# frontend/.env
VITE_API_BASE=http://127.0.0.1:8000
```

## Key Endpoints

- `POST /recommend`
- `POST /transactions`
- `GET /budget/status?user_id=1`
- `GET /promotions/personalized?user_id=1`
- `GET /cards?user_id=1`

## n8n Workflows

Import the JSON files from `n8n/workflows/` into n8n:

1. `card_recommendation.json`
2. `budget_alert.json`
3. `promo_scanner.json`

## Docker Compose

To run backend + frontend + n8n together:

```bash
docker compose up
```
