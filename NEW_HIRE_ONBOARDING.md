# New Hire Onboarding - C-02 SLA Monitor

## Goal

Get a new engineer productive in the project quickly with clear module ownership and extension points.

## Day 1 Checklist

1. Read `DOCS_INDEX.md`
2. Read `C02_SLA_Product_Blueprint.md`
3. Read `C02_Winning_Checklist_Menus_Routes.md`
4. Read all rules in `.cursor/rules/`
5. Confirm understanding of MVP vs WOW feature boundary

## Product in One Paragraph

This product monitors API health, computes SLA risk deterministically, creates incidents with explainable reasons, and uses AI only for grounded reporting and optional query assistance.

## Module Responsibilities (Expected Structure)

- `ingestion`: normalize raw logs to canonical schema
- `metrics`: aggregate windowed metrics (p95/p99/error rate/uptime)
- `risk`: compute risk score and status with deterministic logic
- `incidents`: dedupe/group/update incident lifecycle
- `reporting`: AI summary generation and export formatting
- `alert-rules`: evaluate and apply rule policies

## Key Contracts (Must Stay Stable)

- canonical log input contract
- metrics output contract
- risk output contract (level, score, reasons)
- incident entity contract
- report generation input/output contract

## Engineering Non-Negotiables

- no business logic in route handlers or UI components
- interfaces before implementations (SOLID + DIP)
- schema validation at boundaries
- typed errors and structured logs
- unit tests for parser, aggregator, scorer, incident grouping

## How to Add New Feature Safely

1. map feature to module
2. define/update contract first
3. add service implementation behind interface
4. add tests
5. update docs (`Blueprint` + `Winning Checklist` if user-facing)

## How to Add New Data Source

1. implement adapter to canonical schema
2. keep metrics/risk modules unchanged
3. verify with contract tests

## How to Change AI Provider

1. keep `ReportGenerator` interface same
2. add new provider implementation via factory
3. run regression checks for grounded output format
