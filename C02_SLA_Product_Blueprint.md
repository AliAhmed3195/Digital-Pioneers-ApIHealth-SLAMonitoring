# C-02 SLA Monitor - Final Product Blueprint

## 1) Final Product Direction

- **Chosen challenge**: C-02 (API Health and SLA Monitor + AI Incident Summarizer)
- **Target outcome**: winning-focused hackathon MVP with strong demo and clear business impact
- **Core value**: detect SLA risk early, explain why it happened, generate incident report fast

## 2) Final Build Approach

- **App type**: Web app
- **Tech direction**: Next.js (TypeScript) full-stack
- **Architecture style**: single codebase for frontend + API routes + simulator
- **AI strategy**: hybrid
  - deterministic engine for metrics/risk
  - AI for summarization and optional natural language query assist

## 3) Scope Strategy (Hackathon-Safe)

- Build high-impact MVP first, then add 2-3 wow features
- Avoid overscope items (full APM stack, complex infra, deep ML)
- Use mock data with realistic runtime simulation for repeatable demo

## 4) Runtime Data Strategy

- **Primary source**: mock logs stored on server
- **Runtime feel**: server-side replay/simulation stream (SSE preferred)
- **Modes**:
  - live replay mode
  - scenario replay mode (latency ramp, 503 spike, slow-no-error)
  - optional static upload mode

## 5) Database Decision

- **MVP option A (fastest)**: no DB (in-memory state + mock files)
- **MVP option B (recommended polish)**: SQLite + Prisma
- Suggested persisted entities:
  - incidents
  - alert rules
  - saved queries
  - generated reports

## 6) AI Usage Boundaries

- **Use AI for**:
  - one-click incident report generation
  - optional command bar for NL log filtering/Q&A
- **Do not use AI for**:
  - p95/p99 calculations
  - error rate/uptime calculations
  - risk color decision engine

## 7) Theme and UI Decision (Final)

- **Final theme**: Light-first professional FinTech dashboard (industry-standard style)
- **Brand direction**: olive/forest accents for navigation and primary actions
- **SLA semantic colors**: strict and standardized
  - Green = healthy
  - Amber = risk warning
  - Red = critical
- **Glassmorphism**: optional, only for small accent areas; not full-app base style

## 8) Must-Have MVP Features

- dashboard with KPI cards (uptime, error rate, p95, request volume)
- endpoint-level risk status (Green/Amber/Red)
- explainable risk reasons ("why risky")
- incident creation + grouping + status flow
- incident timeline
- one-click incident summary/report

## 9) High-Impact Add-ons (After MVP)

- natural language log search
- report export (Markdown/PDF)
- alert dedupe + cooldown controls
- SLO/SLA settings screen per endpoint
- scenario simulator controls for demos

## 10) Demo Philosophy

- show complete flow, not isolated charts
- prove each AI output is grounded by numbers/time windows
- highlight measurable before/after impact:
  - faster detection
  - reduced incident reporting time
  - improved response workflow

## 11) Scalability and Maintainability Architecture (SOLID-First)

### Core Architectural Style

- use **modular monolith** initially (fast for hackathon), but with clear module boundaries for future microservice extraction
- define bounded modules:
  - `ingestion`
  - `metrics`
  - `risk-scoring`
  - `incident-management`
  - `reporting`
  - `alert-rules`

### SOLID Mapping (How to Apply)

- **Single Responsibility**:
  - parser only parses logs
  - aggregator only computes metrics windows
  - risk service only computes risk/severity
  - report service only formats AI/report output
- **Open/Closed**:
  - use strategy interfaces for scoring and alert policies so new algorithms can be added without changing existing handlers
- **Liskov Substitution**:
  - all scorer implementations must return same output contract (risk level, score, reasons)
- **Interface Segregation**:
  - keep small interfaces (e.g., `LogSource`, `RiskScorer`, `IncidentRepository`, `ReportGenerator`)
- **Dependency Inversion**:
  - depend on abstractions, not concrete DB/LLM providers
  - swap SQLite -> Postgres or OpenAI -> other provider with adapter changes only

### Recommended Design Patterns

- **Strategy Pattern**:
  - risk scoring strategies (threshold, trend-based, hybrid)
  - alert rule evaluation strategies
- **Factory Pattern**:
  - build provider-specific clients (LLM/report exporters/stream sources)
- **Repository Pattern**:
  - isolate persistence for incidents/rules/reports
- **Adapter Pattern**:
  - normalize external log sources to common internal schema
- **Observer/Event-Driven Pattern**:
  - log ingested -> metrics updated -> risk evaluated -> incident updated
- **Command Pattern** (optional):
  - for simulator actions and replay commands

### Scalability Decisions (Future-Ready)

- keep clear API contract layer (`/api/*`) separate from domain services
- add async processing queue later for heavy tasks (batch reports/replay imports)
- store immutable incident events for audit trail and debugging
- use feature flags for experimental modules (AI command bar, smart rules)
- move from in-memory cache to Redis when concurrent usage grows

### Change-Friendliness Rules

- every module must expose:
  - input contract
  - output contract
  - error contract
- avoid business logic inside UI components and API route handlers
- add unit tests per service before integration tests
- document extension points:
  - add new risk formula
  - add new data source
  - add new report format
