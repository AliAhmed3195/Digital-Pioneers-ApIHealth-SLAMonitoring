# Next.js Code Structure Plan (Implementation-Ready)

## Objective

Define a production-grade, scalable project structure before feature implementation starts.

## Proposed Top-Level Structure

```text
src/
  app/
    dashboard/
    endpoints/
      [id]/
    incidents/
      [id]/
    simulator/
    layout.tsx
    page.tsx
    globals.css

  modules/
    ingestion/
    metrics/
    risk/
    incidents/
    reporting/
    alert-rules/

  shared/
    contracts/
    types/
    utils/
```

## Layering Rules

- `app/`: routing and UI composition only
- `modules/*/application`: use-cases and orchestration
- `modules/*/domain`: business entities, contracts, policies
- `modules/*/infrastructure`: adapters (db, AI provider, stream source)
- `shared/`: reusable cross-module contracts/utilities

## Dependency Direction

- `app` -> `modules/*/application`
- `application` -> `domain`
- `infrastructure` implements `domain` contracts
- no circular dependencies across modules

## First Build Scope (MVP Foundation)

- route skeletons for:
  - `/dashboard`
  - `/endpoints`
  - `/endpoints/[id]`
  - `/incidents`
  - `/incidents/[id]`
  - `/simulator`
- module boundaries and interfaces:
  - `RiskScorer`
  - `IncidentRepository`
  - `ReportGenerator`
  - `LogSourceAdapter`
