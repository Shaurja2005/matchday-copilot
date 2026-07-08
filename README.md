# MatchDay Copilot — FIFA World Cup 2026 GenAI Stadium Assistant

> **Hackathon submission** — Fan Navigation, Crowd Management & Multilingual Real-Time Assistance

---

## Chosen Vertical

**Fan Navigation, Crowd Management & Multilingual Real-Time Assistance**

We chose this vertical because it directly addresses the three most common pain points at a major international sporting event:
1. **Fans** don't speak the local language and can't navigate a 70,000-seat stadium.
2. **Staff/Volunteers** are overwhelmed with repetitive fan questions and need instant decision support.
3. **Organizers** lack a unified, real-time view of crowd dynamics across multiple zones and gates.

MatchDay Copilot unifies all three into a single GenAI-powered platform with persona-specific views.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND (Port 3000)               │
│   React 18 + TypeScript + Tailwind CSS               │
│   ┌─────────┐  ┌──────────────┐  ┌──────────────┐   │
│   │Fan Page │  │Staff Dashboard│  │Control Room  │   │
│   │Chat+Map │  │Heatmap+Triage │  │Summary+Query │   │
│   └────┬────┘  └──────┬───────┘  └──────┬───────┘   │
└────────┼──────────────┼─────────────────┼────────────┘
         │    API calls (no LLM from browser)
         ▼
┌─────────────────────────────────────────────────────┐
│                   BACKEND (Port 5000)                │
│   Node.js + Express + TypeScript                     │
│                                                      │
│   ┌──────────────┐  ┌────────────────────────────┐  │
│   │  API Routes  │  │     GenAI Service Layer     │  │
│   │  /api/chat   │  │  anthropicService.ts        │  │
│   │  /api/crowd  │  │  safetyCheck.ts             │  │
│   │  /api/staff  │  │  vectorStore.ts (RAG)       │  │
│   │  /api/organizer  └────────────────────────────┘  │
│   └──────────────┘                                   │
│                                                      │
│   ┌────────────────────────────────────────────────┐ │
│   │       Rules + GenAI Hybrid Decision Engine     │ │
│   │  Stage 1: Deterministic threshold checks       │ │
│   │  Stage 2: GenAI generates human-readable rec.  │ │
│   │  isHumanApprovalRequired = true (ALWAYS)       │ │
│   └────────────────────────────────────────────────┘ │
│                                                      │
│   ┌────────────────┐  ┌──────────────────────────┐   │
│   │ Crowd Simulator│  │  Mock Data Layer          │   │
│   │ (±5% per tick) │  │  gates/zones/queues/FAQ   │   │
│   └────────────────┘  └──────────────────────────┘   │
└─────────────────────────────────────────────────────┘
         │
         ▼ (server-side only, key in env var)
┌─────────────────────────────────────────────────────┐
│              Anthropic Claude API                    │
│  (or GENAI_MODE=mock for development)                │
└─────────────────────────────────────────────────────┘
```

### Rules + GenAI Hybrid Decision Logic

This is a **two-stage hybrid** architecture:

**Stage 1 — Deterministic Rules** (fast, no LLM cost, predictable):
- Queue wait > 20 minutes → trigger decision
- Zone density > 85% → trigger decision
- These rules are hardcoded in `decisionEngine.ts` and run synchronously

**Stage 2 — GenAI Enhancement** (human-readable, contextual):
- When a rule fires, a GenAI call generates a human-readable recommendation and rationale
- The AI **never takes action** — it only produces text for a human operator to review
- `isHumanApprovalRequired: true` is hardcoded on every Decision object (never false)

This approach ensures: predictable costs, auditable decision triggers, and LLM value added only for communication quality, not for binary go/no-go decisions.

---

## How to Run Locally

### Prerequisites
- Node.js 18+
- npm 9+

### 1. Clone & setup environment
```bash
git clone <repo-url>
cd Stadium_operations

# Copy the env template
cp .env.example backend/.env

# Edit backend/.env:
# - Set GEMINI_API_KEY=sk-gemini-... (or leave GENAI_MODE=mock for demo)
```

### 2. Start the backend
```bash
cd backend
npm install
npm run dev
# → Running on http://localhost:5000
```

### 3. Start the frontend
```bash
cd frontend
npm install
npm run dev
# → Running on http://localhost:3000
```

### 4. Run tests
```bash
# Backend tests (unit + integration, no API key required)
cd backend
npm test

# Frontend tests (accessibility + component)
cd frontend
npm test
```

---

## Environment Variables

See [`.env.example`](./.env.example) for all variables.

Key variables:

| Variable | Default | Description |
|---|---|---|
| `GEMINI_API_KEY` | — | Gemini API key (server-side only) |
| `GENAI_MODE` | `mock` | Set to `mock` to use stubbed AI responses |
| `PORT` | `5000` | Backend server port |
| `FRONTEND_URL` | `http://localhost:3000` | CORS allowed origin |
| `RATE_LIMIT_MAX_REQUESTS` | `20` | Max chat requests per minute per IP |
| `CACHE_TTL_SECONDS` | `300` | FAQ response cache TTL |

---

## Assumptions

1. **Simulated live data**: All crowd density, queue times, and transport data is simulated. In production, this would connect to real turnstile sensors, access control systems, and transport APIs.
2. **"Real-time" in this demo**: The crowd simulator updates every 30 seconds with ±5% density fluctuation. The frontend polls every 30 seconds.
3. **Supported languages**: English, Spanish, French, Portuguese, Arabic. Language detection uses Claude (or falls back to English in mock mode).
4. **Authentication**: No user authentication is implemented. In production, the staff/organizer views would be behind role-based access control.
5. **Incident storage**: Incidents are stored in-memory (resets on restart). Production would use a persistent database.
6. **RAG embeddings**: The vector store uses TF-IDF cosine similarity as a lightweight approximation. Production would use proper embeddings (e.g., `text-embedding-3-small`).

---

## Known Limitations & Next Steps

### Current Limitations
- No persistent storage (incidents reset on server restart)
- Language detection makes an extra API call (could be done client-side with a lightweight model)
- RAG uses TF-IDF rather than true semantic embeddings
- No WebSocket for truly push-based real-time updates
- No authentication / RBAC for staff/organizer views

### What We'd Build Next
1. **Real data connectors**: Integrate with turnstile APIs, ticketing systems, and transport APIs
2. **True vector embeddings**: Use `text-embedding-3-small` + ChromaDB for semantic search
3. **WebSocket**: Push crowd density updates in real-time instead of polling
4. **Authentication**: OAuth2 + RBAC to separate fan/staff/organizer access
5. **Persistent incident store**: PostgreSQL with audit log
6. **Mobile app**: React Native wrapper for the fan-facing view (majority of stadium fans use phones)
7. **Predictive analytics**: ML model trained on historical crowd patterns to forecast density 30+ minutes ahead

---

## Security Notes

- API keys are loaded from environment variables only — never committed or exposed to the frontend
- All LLM calls are server-side only
- Rate limiting: 20 chat requests per minute per IP (configurable)
- Input validation on every user-submitted field (express-validator)
- Prompt injection detection and sanitization on all user inputs
- Content safety check on all LLM output before returning to fans
- No PII is stored beyond the session's in-memory conversation history

---

## Project Structure

```
Stadium_operations/
├── backend/                    # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── data/               # Mock JSON datasets (labeled as simulated)
│   │   ├── middleware/         # Rate limiter, input validator
│   │   ├── prompts/            # All LLM prompt templates (never inline)
│   │   ├── routes/             # API route handlers
│   │   ├── services/
│   │   │   ├── crowd/          # Crowd simulator + decision engine
│   │   │   ├── genai/          # Anthropic service + safety check
│   │   │   └── rag/            # Vector store for FAQ retrieval
│   │   ├── types/              # TypeScript interfaces
│   │   └── utils/              # Logger
│   └── tests/                  # Unit + integration tests
├── frontend/                   # React 18 + TypeScript + Tailwind
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── contexts/           # Accessibility + Persona contexts
│   │   ├── pages/              # Fan, Staff, Organizer, Home, Settings
│   │   ├── types/              # TypeScript interfaces
│   │   └── utils/              # API client
│   └── tests/                  # Accessibility tests (jest-axe)
├── docs/
│   └── DESIGN.md               # Design tokens and system
├── .env.example                # Environment variable template
└── README.md
```

---

*MatchDay Copilot — Built for the FIFA World Cup 2026 GenAI Hackathon.*
*All stadium data is simulated. No official FIFA data, trademarks, or licensed imagery is used.*
