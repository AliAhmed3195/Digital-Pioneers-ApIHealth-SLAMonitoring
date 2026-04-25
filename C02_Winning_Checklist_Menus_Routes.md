# C-02 Winning Checklist, Menus, and Routes

## 1) Winning Checklist (One-by-One)

1. Live API health dashboard (response time, error rate, uptime)
2. Per-endpoint SLA/SLO thresholds (p95, error rate, uptime target)
3. Traffic-light risk scoring (Green/Amber/Red)
4. Explainable risk reasons (trend, threshold cross, spike, baseline drift)
5. Baseline vs current comparison
6. p95/p99 metrics visibility
7. Incident detection and grouping (signature-based)
8. Incident timeline (start, peak, stabilized, resolved)
9. Alert fatigue controls (dedupe, cooldown, severity)
10. One-click AI incident report (Impact, Evidence, Timeline, Next Steps)
11. Grounded reporting (facts only, no invented numbers)
12. Report export (Markdown/PDF)
13. Resolution workflow (Open -> Acknowledged -> Resolved)
14. Incident history page with filters
15. AI command bar for log filtering (optional but strong)
16. Saved queries/saved alerts
17. Smart alert rule creation from English (optional parser)
18. Top contributor analysis (latency/error impact by endpoint)
19. Error fingerprinting (top messages and counts)
20. Correlation hints (deploy marker/downstream dependency hints)
21. Synthetic incident simulator (demo-safe)
22. Data quality panel (missing/parsing/dropped logs)
23. PII masking for safe demos
24. Polished UI/UX states and drill-down
25. One-slide architecture diagram
26. Before/after impact proof points
27. Tight 2-3 minute demo script

## 2) Final Menu Structure

### Primary Sidebar Menus

1. **Overview (Dashboard)**
2. **Endpoints**
3. **Incidents**
4. **Log Explorer**
5. **AI Reports**
6. **Alert Rules**
7. **SLA/SLO Settings**
8. **Simulator/Replay**
9. **Reports & Exports**
10. **Admin/Data**

### Contextual Detail Views

- Endpoint Details (inside Endpoints)
- Incident Details (inside Incidents)

### Top Bar Actions

- Global time range selector (15m/1h/24h)
- Environment switch (Demo/Prod-sim)
- Global search
- Context-aware "Generate Report"

## 3) Recommended Route Map (Next.js)

- `/dashboard`
- `/endpoints`
- `/endpoints/[id]`
- `/incidents`
- `/incidents/[id]`
- `/logs`
- `/ai-reports`
- `/alert-rules`
- `/sla-settings`
- `/simulator`
- `/exports`
- `/admin-data`

## 4) MVP Cut (Must Build First)

- `/dashboard`, `/endpoints`, `/incidents`, `/incidents/[id]`, `/simulator`
- risk scorer + explainability reasons
- incident lifecycle statuses
- one-click AI report on incident details

## 5) WOW Features (Add After MVP)

- natural language command bar
- export center with report history
- smart alert rule parser (English -> structured rule)

## 6) Judging Rubric Alignment (Quick Mapping)

- **Business clarity**: define pain with measurable ops impact
- **AI innovation**: grounded incident summarizer + optional NL query assistant
- **Technical implementation**: complete end-to-end working flow
- **Business impact**: MTTR/time-to-report improvements
- **UI/UX quality**: clear navigation + explainable statuses
- **Feasibility**: mock-to-real ingestion path clearly stated
- **Storytelling**: simulate -> detect -> explain -> report -> resolve

## 7) Engineering Standards for Scale (SOLID + Patterns Checklist)

### Must-Follow Engineering Rules

1. Keep route handlers thin; business logic only in services
2. Separate domain logic from infrastructure (DB, LLM, stream provider)
3. Introduce interfaces before concrete implementations
4. Use DTO/schema validation at module boundaries
5. Keep modules independent; no circular dependencies

### Patterns to Enforce in This Product

- **Strategy**: pluggable risk algorithms and alert evaluation logic
- **Repository**: persistence abstraction for incidents/rules/reports
- **Adapter**: convert any incoming log format to canonical schema
- **Factory**: instantiate AI/export providers by config
- **Observer/Event Bus**: propagate metric/risk/incident state updates

### Future Resource Onboarding (Easy Change Management)

- new developer can start per module folder with clear responsibility
- each module should have:
  - `README.md` with purpose + contracts
  - service interface definitions
  - unit tests for critical paths
- maintain architecture decision notes:
  - why scorer chosen
  - why thresholds configured
  - when to switch infra layer

### Extension Scenarios (Designed Upfront)

- add new log source without touching risk engine (adapter-based)
- replace DB backend without changing domain services (repository-based)
- add another AI provider without changing incident module (factory + interface)
- add enterprise auth/RBAC as separate module without rewriting core logic
