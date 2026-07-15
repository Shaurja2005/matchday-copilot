# Contributing to MatchDay Copilot

## Code Structure Overview

Understanding the folder layout will help you add new features in the right places.

```
Stadium_operations/
├── backend/                      # Node.js + Express + TypeScript API server
│   ├── src/
│   │   ├── data/                 # Static mock JSON datasets
│   │   │   ├── faq-knowledge-base.json   # RAG source of truth
│   │   │   ├── gates.json                # Gate metadata (static)
│   │   │   ├── zones.json                # Initial zone state
│   │   │   ├── queues.json               # Initial queue state
│   │   │   └── transport.json            # Transport routes
│   │   │
│   │   ├── middleware/           # Express middleware (request lifecycle)
│   │   │   ├── inputValidator.ts # express-validator rules + sanitization
│   │   │   └── rateLimiter.ts    # express-rate-limit configurations
│   │   │
│   │   ├── prompts/              # ALL GenAI prompt templates (never inline in routes)
│   │   │   ├── fanAssistant.ts   # Fan-facing chat prompts
│   │   │   ├── staffBriefing.ts  # Staff briefing + quick-reply prompts
│   │   │   ├── organizerSummary.ts  # Control-room prompts + system prompt constants
│   │   │   └── incidentTriage.ts # Incident classification prompts
│   │   │
│   │   ├── routes/               # Express route handlers (thin controllers)
│   │   │   ├── chat.ts           # POST /api/chat, POST /api/chat/staff-reply
│   │   │   ├── crowd.ts          # GET /api/crowd/* (zones, queues, decisions, etc.)
│   │   │   ├── staff.ts          # GET/POST/PATCH /api/staff/*
│   │   │   └── organizer.ts      # GET/POST /api/organizer/*
│   │   │
│   │   ├── services/
│   │   │   ├── crowd/
│   │   │   │   ├── crowdSimulator.ts    # Real-time crowd state simulation
│   │   │   │   └── decisionEngine.ts   # Rules + GenAI hybrid decision logic
│   │   │   ├── genai/
│   │   │   │   ├── geminiService.ts    # Gemini API client + LRU cache
│   │   │   │   └── safetyCheck.ts      # Output safety filtering
│   │   │   └── rag/
│   │   │       └── vectorStore.ts      # TF-IDF FAQ retrieval
│   │   │
│   │   ├── types/
│   │   │   └── index.ts          # ALL shared TypeScript interfaces
│   │   │
│   │   └── utils/
│   │       ├── logger.ts          # Structured logger (console wrapper)
│   │       └── crowdFormatter.ts  # Shared crowd data formatting functions
│   │
│   └── tests/                    # Jest unit + integration tests
│       ├── chat.integration.test.ts
│       ├── decisionEngine.test.ts
│       ├── geminiService.test.ts
│       ├── organizer.integration.test.ts
│       ├── rateLimiter.test.ts
│       ├── safetyCheck.test.ts
│       ├── staff.integration.test.ts
│       └── vectorStore.test.ts
│
├── frontend/                     # React 18 + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/
│   │   │   ├── chat/             # ChatWidget (fan assistant UI)
│   │   │   ├── dashboard/        # CrowdHeatmap, IncidentLog (staff UI)
│   │   │   ├── map/              # StadiumMap (interactive SVG)
│   │   │   └── shared/           # NavBar, shared UI elements
│   │   │
│   │   ├── contexts/             # React context providers
│   │   │   ├── AccessibilityContext.tsx  # High contrast, large text toggles
│   │   │   └── PersonaContext.tsx        # Fan/Staff/Organizer persona state
│   │   │
│   │   ├── pages/                # Top-level page components
│   │   │   ├── FanPage.tsx        # Fan View — chat + map
│   │   │   ├── StaffPage.tsx      # Volunteer Dashboard — heatmap + incidents
│   │   │   ├── OrganizerPage.tsx  # Organizer Control Room — summary + query
│   │   │   └── HomePage.tsx       # Landing / persona selector
│   │   │
│   │   ├── types/                # Frontend TypeScript interfaces
│   │   └── utils/
│   │       └── api.ts            # All backend API calls (never call APIs directly in components)
│   │
│   └── tests/                    # Accessibility + component tests
│       ├── ChatWidget.a11y.test.tsx
│       ├── Dashboard.a11y.test.tsx
│       └── setup.ts
│
├── docs/                         # Design system documentation
├── .env.example                  # Environment variable template
├── CONTRIBUTING.md               # This file
├── IMPROVEMENTS.md               # Change log for evaluators
└── README.md                     # Setup, architecture, and approach
```

---

## Where to Add New Features

### Adding a new API endpoint
1. Create the **prompt template** in `backend/src/prompts/` (or add to an existing file).
2. Add the **route handler** in `backend/src/routes/`. Keep it thin — business logic belongs in services.
3. Register the router in `backend/src/index.ts` if it's a new router file.
4. Add **validation** in `backend/src/middleware/inputValidator.ts` if accepting user input.
5. Add **types** to `backend/src/types/index.ts`.
6. Add **tests** in `backend/tests/`.
7. Add the corresponding **API client function** in `frontend/src/utils/api.ts`.

### Adding a new frontend view / page
1. Create the **page component** in `frontend/src/pages/`.
2. Add a **route** in `frontend/src/App.tsx`.
3. Add accessibility tests in `frontend/tests/`.

### Changing GenAI prompts
All prompts live in `backend/src/prompts/`. Edit there — never put prompt strings inline in route handlers.

### Changing decision thresholds
Thresholds are exported constants in `backend/src/services/crowd/decisionEngine.ts`:
- `QUEUE_ALERT_THRESHOLD_MINUTES` (default: 20)
- `DENSITY_ALERT_THRESHOLD_PERCENT` (default: 85)
- `DENSITY_CRITICAL_THRESHOLD_PERCENT` (default: 95)

Corresponding display thresholds are in `backend/src/utils/crowdFormatter.ts`.

### Adding mock data
Edit the JSON files in `backend/src/data/`. The RAG FAQ knowledge base is in `faq-knowledge-base.json`.

---

## Development Workflow

```bash
# 1. Start the backend
cd backend && npm run dev

# 2. Start the frontend (separate terminal)
cd frontend && npm run dev

# 3. Run all backend tests
cd backend && npm test

# 4. Run frontend accessibility tests
cd frontend && npm test

# 5. Run linter
cd backend && npm run lint
cd frontend && npx eslint src --ext .tsx,.ts
```

## Key Conventions

- **Prompt strings never inline in routes** — always in `prompts/`
- **No GenAI calls from the frontend** — all AI calls go through the Express API
- **Every Decision has `isHumanApprovalRequired: true`** — never change this
- **Safety check every AI output** before returning to users — `checkContentSafety()`
- **Add JSDoc** to every exported function explaining WHY, not just what
- **TypeScript strict mode** — no `any`, no untyped returns on exports
