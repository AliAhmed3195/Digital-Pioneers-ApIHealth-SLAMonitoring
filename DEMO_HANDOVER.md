# Digital Pioneer - Demo Handover

## 1) Live Demo URL

- Vercel App: `https://digital-pioneers-ap-i-health-sla-monitoring-4n1n-dtoy5urp4.vercel.app`

## 2) Demo Login Credentials

- Username: `digitalpioneer@avanzasolutions.com`
- Password: `DigitalPioneer`

## 3) Recommended Jury Demo Flow (5-10 min)

1. Login with demo account.
2. Go to `Simulator / Replay` and run:
   - `LATENCY_RAMP`
   - `ERROR_SPIKE`
3. Open `Dashboard` and show:
   - risk indicators
   - latency / error charts
   - monitor status
4. Open `Incidents` and show new/active incidents.
5. Open `AI Reports` and generate report.
6. Download report PDF from reports/exports flow.
7. Open `Alert Rules` and show:
   - create/edit/enable-disable/delete functionality
8. Open `Admin/Data` and show:
   - source health
   - data quality stats
   - environment + PII masking controls

## 4) What You Need Before Demo

- Stable internet connection.
- Live Vercel URL accessible.
- Valid `.env` values in deployed project (already configured in your deployment):
  - `GROQ_API_KEY`
  - `BREVO_API_KEY`
  - `ALERT_TO_EMAIL`
  - `ALERT_FROM_EMAIL`
  - `MONITOR_CRON_SECRET` / `CRON_SECRET`
- Browser zoom at 90%-100% for clean UI in projection.
- Sample scenario ready in simulator for predictable output.

## 5) Quick Troubleshooting Notes

- If no fresh incidents appear, run simulator scenario again and refresh `Dashboard`/`Incidents`.
- If email alert is not received, still proceed with UI proof (risk + incident + report generation), then mention email depends on provider/API quota and key validity.
- On hosted deployments, large log file uploads may be limited by platform payload constraints.

## 6) One-Line Pitch

Digital Pioneer converts raw API logs into proactive SLA intelligence with deterministic risk scoring plus AI incident summaries, reducing MTTD and MTTR for operations teams.

