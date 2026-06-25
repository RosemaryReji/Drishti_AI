# Drishti AI

India's Climate Digital Twin.

Drishti AI is a climate intelligence platform for India that turns weather, hazard, and village-level data into an immersive decision surface. The current MVP combines a Cesium-based India map, animated atmospheric layers, hyperlocal forecasts, early-warning alerts, and a FastAPI backend backed by PostGIS.

The goal is not to show a static weather dashboard. The goal is to make climate feel alive, spatial, and actionable.

## What this project does

- Visualizes India as a living climate field with temperature, rainfall, clouds, wind, heat signatures, AQI, and hazard overlays
- Lets users search by village name, block, district, or pincode
- Shows village-level forecasts, active alerts, and AI-style climate projections
- Falls back to mock data when the API is unavailable, so the UI still works during development
- Exposes a clean API layer for villages, forecasts, alerts, and prediction summaries

## Design Direction

This project follows the design language in [Drishti_AI_Design.md](Drishti_AI_Design.md).

Key principles:

- The climate should feel alive
- Use animated cloud systems
- Use moving wind particles
- Use dynamic rainfall overlays
- Use real-time heat signatures
- Use terrain-aware environmental layers
- Avoid static maps wherever possible

That is reflected in the current India map experience, which uses animated overlays instead of a flat map-first interface.

## Stack

| Layer | Tech |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Map / Visualization | CesiumJS, Recharts |
| Backend | FastAPI, SQLAlchemy, Pydantic |
| Database | PostgreSQL + PostGIS |
| Cache / Messaging | Redis, Kafka |
| Containerization | Docker Compose |

## Repo Layout

```text
Drishti AI/
|-- frontend/               # Next.js app with Cesium climate twin UI
|-- backend/                # FastAPI API, models, routes, seed flow
|-- docker-compose.yml      # Full local stack
|-- .env.example            # Environment template
|-- Drishti_AI_PRD.md       # Product requirements
|-- Drishti_AI_Design.md    # UI and experience direction
`-- Drishti_AI_TechStack.md  # Implementation and stack notes
```

## Quick Start

### Option 1: Run everything with Docker

1. Copy `.env.example` to `.env` and adjust values if needed.
2. Start the stack:

```bash
docker compose up --build
```

3. Open the app:

- Frontend: http://localhost:3000
- API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/api/health

### Option 2: Run frontend and backend separately

#### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

Then open http://localhost:3000.

## Environment Variables

`.env.example` documents the available settings. The most important ones are:

| Variable | Purpose |
| --- | --- |
| `FRONTEND_PORT` | Port used by the Next.js app |
| `BACKEND_PORT` | Port used by FastAPI |
| `NEXT_PUBLIC_API_BASE_URL` | Frontend API base URL |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` / `POSTGRES_HOST` / `POSTGRES_PORT` | Database connection settings |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_URL` | Redis connection settings |
| `KAFKA_BOOTSTRAP_SERVERS` | Kafka bootstrap address |
| `OPENSEARCH_*` | Reserved for future search / indexing work |
| `NOVU_API_KEY` | Reserved for notifications |
| `INDIC_TRANS_URL`, `KOKORO_TTS_URL`, `COQUI_TTS_URL` | Reserved for future AI microservices |

If you only want to run the current MVP, the Docker defaults are enough.

## API Surface

The backend mounts its routes under `/api`.

### Health

- `GET /api/health`

### Villages

- `GET /api/villages`
- `GET /api/villages?query=poonjar`
- `GET /api/villages/nearest?lat=9.68&lon=76.90&radius_km=50`
- `GET /api/villages/{village_id}`

### Forecasts

- `GET /api/forecasts/{village_id}?days=10`
- `GET /api/forecasts/predictions/{village_id}`

### Alerts

- `GET /api/alerts`
- `GET /api/alerts?risk_level=SEVERE`
- `GET /api/alerts/village/{village_id}`

### Docs

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Frontend Experience

The current dashboard includes:

- India-centered Cesium climate map
- Animated climate layers for clouds, wind, rainfall, heat, AQI, and disaster risk
- Panchayat search and selection
- Forecast cards and trend charts
- AI-style climate predictor summaries
- Text-to-speech forecast readout
- Multilingual UI support

## Backend Notes

The backend is intentionally simple and MVP-friendly:

- FastAPI serves the API
- SQLAlchemy defines the data model
- Pydantic handles schema validation
- Startup creates tables automatically for rapid prototyping
- Seed data provides sample panchayats, forecasts, and alerts

## Current Data Model

The core entities are:

- `Panchayat`
- `Forecast`
- `Alert`

Forecast records currently include:

- temperature
- rainfall
- humidity
- wind speed
- wind direction
- AQI
- UV index
- timestamp

## Development Workflow

Useful commands:

- `docker compose up --build`
- `npm run dev` in `frontend/`
- `npm run build` in `frontend/`
- `npm run typecheck` in `frontend/`

The frontend is designed to keep working even if the backend is offline, which makes UI iteration faster.

## Roadmap

This MVP is the base layer for a larger climate operating system. The next obvious steps are:

- richer 3D terrain and atmospheric effects
- live climate ingestion from real services
- stronger alert and notification workflows
- simulation tools for agriculture, hazard planning, and climate risk
- historical analytics and playback
- multilingual expansion at scale

## Troubleshooting

- If the frontend shows mock data, the API is probably offline or the base URL is wrong.
- If Docker startup is slow, PostgreSQL/PostGIS and Kafka may still be initializing.
- If favicon or UI assets look stale, hard refresh the browser after restarting the app.

## Notes

- This repository is currently an MVP slice aligned to the design and PRD documents in the repo.
- Open `Drishti_AI_PRD.md`, `Drishti_AI_Design.md`, and `Drishti_AI_TechStack.md` for the full product and implementation direction.
