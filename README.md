# MatchDay Copilot — FIFA World Cup 2026 GenAI Stadium Assistant

---

## Chosen Vertical

**Fan Navigation, Crowd Management & Multilingual Real-Time Assistance**

We chose this vertical because it directly addresses the three most common pain points at a major international sporting event:
1. **Fans** don't speak the local language and can't navigate a 70,000-seat stadium.
2. **Staff/Volunteers** are overwhelmed with repetitive fan questions and need instant decision support.
3. **Organizers** lack a unified, real-time view of crowd dynamics across multiple zones and gates.

MatchDay Copilot unifies all three into a single GenAI-powered platform with persona-specific views.

---

## Challenge Focus Area Alignment

Every focus area from the FIFA World Cup 2026 GenAI challenge is explicitly addressed:

| Focus Area | Feature | Implementation Location |
|---|---|---|
| **Navigation** | Interactive SVG stadium map + wayfinding chat assistant | `frontend/src/components/map/StadiumMap.tsx`, `backend/src/prompts/fanAssistant.ts` |
| **Crowd Management** | Real-time heatmap, 2-stage decision engine (rules + GenAI), density alerts | `backend/src/services/crowd/decisionEngine.ts`, `frontend/src/components/dashboard/CrowdHeatmap.tsx` |
| **Accessibility** | Wheelchair routing, high-contrast mode, large text, WCAG 2.1 AA compliance, skip-to-content link | `frontend/src/contexts/AccessibilityContext.tsx`, `frontend/src/pages/FanPage.tsx` |
| **Transportation** | Transport route data (metro, shuttle, rideshare, walking, bus) with ETA, crowding, and carbon data; dynamically injected into AI prompts | `backend/src/data/transport.json`, `backend/src/routes/crowd.ts` |
| **Sustainability** | Live carbon footprint panel: per-mode CO₂ estimates that dynamically react to current crowd occupancy; AI-generated reduction suggestions | `backend/src/routes/organizer.ts`, `backend/src/prompts/organizerSummary.ts` |
| **Multilingual Assistance** | Language detection + response in fan's language (EN/ES/FR/PT/AR); staff quick-reply tool translates English notes into fan's language | `backend/src/services/genai/geminiService.ts`, `backend/src/prompts/staffBriefing.ts` |
| **Operational Intelligence** | AI shift briefing for staff, incident creation + AI triage, natural-language query over live data | `backend/src/routes/staff.ts`, `backend/src/routes/organizer.ts` |
| **Real-Time Decision Support** | Hybrid rules+GenAI decision engine: deterministic thresholds fire instantly, GenAI enriches recommendations for human review | `backend/src/services/crowd/decisionEngine.ts` |

### Persona Alignment

| Challenge Persona | MatchDay Copilot View | URL |
|---|---|---|
| **Fan** | Fan View — chat assistant + interactive map | `/fan` |
| **Volunteer / Staff** | Volunteer Dashboard — heatmap, incidents, briefing, quick-reply | `/staff` |
| **Senior Organizer** | Organizer Control Room — AI summary, NL query, sustainability | `/organizer` |

---

## Approach and Logic: Rules + GenAI Hybrid Decision Support

The challenge calls for "logical decision making based on user context" and "real-time decision support." MatchDay Copilot implements this as a **two-stage hybrid architecture** — never purely AI, never purely rules alone.

### Stage 1 — Deterministic Rules (fast, predictable, no LLM cost)

Explicit numeric thresholds are checked against live crowd data on every `/api/crowd/decisions` call:

| Condition | Threshold | Rationale |
|---|---|---|
| Queue wait time | ≥ 20 minutes | UEFA operational guideline for crowd rerouting action |
| Zone density | ≥ 85% | Safety-critical threshold: risk of crush behavior |
| Zone density (critical) | ≥ 95% | Immediate all-hands response required |

If a threshold is breached, a `Decision` object is created with a **deterministic `triggerReason`** — no AI involved.

### Stage 2 — GenAI Enhancement (human-readable, contextual)

When a rule fires, a GenAI call generates a **human-readable recommendation + rationale** that staff can act on. The AI never makes the binary decision — it only explains it in actionable language.

```
[Queue at Gate A: 28min] → Rule fires → Decision created
         ↓
GenAI: "Consider redirecting fans from Gate A to Gate C (8 min wait).
        Rationale: Queue is increasing and Gate C has the shortest wait
        currently available."
```

### Human-in-the-Loop Guarantee

`isHumanApprovalRequired: true` is **hardcoded** on every Decision object. This field is never false. The frontend surfaces decisions as "Suggested Actions" with Acknowledge/Dismiss buttons. No action is ever taken automatically.

### Why This Approach Delivers "Real-Time Decision Support"

- **Predictable costs**: LLM is only called when a rule fires, not on every tick
- **Auditable triggers**: Every Decision has a `triggerReason` from deterministic logic — fully auditable
- **Contextual communication**: GenAI adds communication quality that pure rules cannot
- **Graceful degradation**: If GenAI fails, a deterministic fallback recommendation is used — the system never goes dark

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND (Port 3000)               │
│   React 18 + TypeScript + Tailwind CSS               │
│   ┌─────────────┐ ┌───────────────┐ ┌─────────────┐ │
│   │  Fan View   │ │  Volunteer    │ │  Organizer  │ │
│   │  Chat + Map │ │  Dashboard    │ │  Control    │ │
│   │             │ │  Heatmap +    │ │  Room       │ │
│   │             │ │  Incidents    │ │             │ │
│   └──────┬──────┘ └──────┬────────┘ └──────┬──────┘ │
└──────────┼───────────────┼─────────────────┼────────┘
           │    API calls (no LLM from browser)
           ▼
┌─────────────────────────────────────────────────────┐
│                   BACKEND (Port 5000)                │
│   Node.js + Express + TypeScript                     │
│                                                      │
│   ┌──────────────┐  ┌────────────────────────────┐  │
│   │  API Routes  │  │     GenAI Service Layer     │  │
│   │  /api/chat   │  │  geminiService.ts (Gemini)  │  │
│   │  /api/crowd  │  │  safetyCheck.ts             │  │
│   │  /api/staff  │  │  vectorStore.ts (RAG)       │  │
│   │  /api/org.   │  └────────────────────────────┘  │
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
│              Google Gemini API (2.5 Flash)           │
│  (or GENAI_MODE=mock for development)                │
└─────────────────────────────────────────────────────┘
```

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
# - Set GEMINI_API_KEY=... (or leave GENAI_MODE=mock for demo)
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

# Backend tests with coverage report
cd backend
npm run test:coverage

# Frontend tests (accessibility + component)
cd frontend
npm test
```

---

## Test Coverage

Backend coverage is tracked via `jest --coverage`. Key coverage targets:

| Module | Coverage Focus |
|---|---|
| `decisionEngine.ts` | Threshold boundary conditions, human-in-the-loop guarantee |
| `geminiService.ts` | Mock mode, cache behavior, API error fallback |
| `safetyCheck.ts` | Pattern matching, truncation, injection detection |
| `vectorStore.ts` | FAQ retrieval relevance, empty-query edge cases |
| `chat.ts` (route) | GenAI failure/timeout, safety flag, prompt injection |
| `rateLimiter.ts` | Configuration verification, endpoint availability |

Run `cd backend && npm run test:coverage` to generate a full HTML report in `backend/coverage/`.

---

## Environment Variables

See [`.env.example`](./.env.example) for all variables.

Key variables:

| Variable | Default | Description |
|---|---|---|
| `GEMINI_API_KEY` | — | Gemini API key (server-side only, never exposed to browser) |
| `GENAI_MODE` | `mock` | Set to `mock` to use stubbed AI responses (no API key required) |
| `PORT` | `5000` | Backend server port |
| `FRONTEND_URL` | `http://localhost:3000` | CORS allowed origin |
| `RATE_LIMIT_MAX_REQUESTS` | `20` | Max chat requests per minute per IP (GenAI cost protection) |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate limit window in milliseconds |
| `CACHE_TTL_SECONDS` | `300` | FAQ response cache TTL (5 minutes) |

---

## Security

### Security Headers

All responses include security headers via [helmet](https://helmetjs.github.io/):
- `Content-Security-Policy` — restricts resource loading to known origins
- `X-Content-Type-Options: nosniff` — prevents MIME sniffing attacks
- `X-Frame-Options: SAMEORIGIN` — prevents clickjacking
- `Strict-Transport-Security` — enforces HTTPS in production

### Rate Limiting

| Endpoint | Limit | Rationale |
|---|---|---|
| `/api/chat*` | 20 req/min/IP | Each call incurs GenAI API cost; prevents abuse and cost overrun |
| `/api/crowd/*`, `/api/staff/*`, `/api/organizer/*` | 100 req/min/IP | Data endpoints, more permissive but still protected |

### Input Security

- All user input validated with `express-validator` before processing
- Prompt injection patterns detected and stripped by `sanitizeUserInput()` in `safetyCheck.ts`
- All GenAI output passes through `checkContentSafety()` before being returned to users
- API keys loaded from environment variables only — never committed or browser-exposed
- Request body size limited to 10kb to prevent token-stuffing attacks

### Dependency Security

Run `npm audit` periodically in both `backend/` and `frontend/` to check for known vulnerabilities.

---

## Assumptions

1. **Simulated live data**: All crowd density, queue times, and transport data is simulated. In production, this would connect to real turnstile sensors, access control systems, and transport APIs.
2. **"Real-time" in this demo**: The crowd simulator updates every 30 seconds with ±5% density fluctuation. The frontend polls every 30 seconds.
3. **Supported languages**: English, Spanish, French, Portuguese, Arabic. Language detection uses a heuristic fast-path for English (no API call) and falls back to Gemini for other scripts.
4. **Authentication**: No user authentication is implemented. In production, the staff/organizer views would be behind role-based access control.
5. **Incident storage**: Incidents are stored in-memory (resets on restart). Production would use a persistent database.
6. **RAG embeddings**: The vector store uses TF-IDF cosine similarity as a lightweight approximation. Production would use proper embeddings (e.g., `text-embedding-004`).

---

## Known Limitations & Next Steps

### Current Limitations
- No persistent storage (incidents reset on server restart)
- Language detection makes an extra API call for non-English text (could be done client-side with a lightweight model)
- RAG uses TF-IDF rather than true semantic embeddings
- No WebSocket for truly push-based real-time updates
- No authentication / RBAC for staff/organizer views

### What We'd Build Next
1. **Real data connectors**: Integrate with turnstile APIs, ticketing systems, and transport APIs
2. **True vector embeddings**: Use `text-embedding-004` + ChromaDB for semantic search
3. **WebSocket**: Push crowd density updates in real-time instead of polling
4. **Authentication**: OAuth2 + RBAC to separate fan/staff/organizer access
5. **Persistent incident store**: PostgreSQL with audit log
6. **Mobile app**: React Native wrapper for the fan-facing view
7. **Predictive analytics**: ML model trained on historical crowd patterns to forecast density 30+ minutes ahead

---

## Project Structure

```
Stadium_operations/
├── backend/                    # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── data/               # Mock JSON datasets (labeled as simulated)
│   │   ├── middleware/         # Rate limiter, input validator
│   │   ├── prompts/            # All LLM prompt templates (never inline in routes)
│   │   ├── routes/             # API route handlers (thin controllers)
│   │   ├── services/
│   │   │   ├── crowd/          # Crowd simulator + decision engine
│   │   │   ├── genai/          # Gemini service + safety check
│   │   │   └── rag/            # Vector store for FAQ retrieval
│   │   ├── types/              # TypeScript interfaces (shared contracts)
│   │   └── utils/              # Logger, crowd data formatters
│   └── tests/                  # Unit + integration tests (no API key required)
├── frontend/                   # React 18 + TypeScript + Tailwind
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── contexts/           # Accessibility + Persona contexts
│   │   ├── pages/              # Fan View, Volunteer Dashboard, Organizer Control Room
│   │   ├── types/              # TypeScript interfaces
│   │   └── utils/              # API client (all backend calls go through here)
│   └── tests/                  # Accessibility tests (jest-axe, WCAG 2.1 AA)
├── docs/                       # Design system documentation
├── .env.example                # Environment variable template
├── CONTRIBUTING.md             # Code structure guide for contributors
├── IMPROVEMENTS.md             # Change log for evaluators
└── README.md                   # This file
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for a detailed guide on where to add new features.

---

*MatchDay Copilot — Built for the FIFA World Cup 2026 GenAI Hackathon.*
*All stadium data is simulated. No official FIFA data, trademarks, or licensed imagery is used.*
