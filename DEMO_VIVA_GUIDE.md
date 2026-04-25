# Digital Pioneer - Demo & Viva Guide (Easy Language)

Ye file aapko **demo dene** aur **viva questions answer karne** ke liye simple script deti hai.
Language intentionally simple rakhi gayi hai.

---

## 1) One-line Pitch

`Digital Pioneer` ek **API Health & SLA Monitor** hai jo logs analyze karta hai, risk detect karta hai, incidents banata hai, aur AI se summary + recommended action deta hai.

---

## 2) Problem Statement (Aap kya solve kar rahe ho)

Real world me teams ke paas bohat logs hote hain, lekin:
- SLA breach ka pata late chalta hai
- incidents manually identify karne me time lagta hai
- root cause aur action plan clear nahi hota

**Hamari app ka goal:** issue jaldi detect karo, impact samjho, aur actionable report do.

---

## 3) Solution Summary (Simple)

Hamari app:
- logs ingest karti hai (`.txt`, `.log`)
- endpoint-wise metrics nikalti hai (error rate, latency)
- SLA thresholds ke against risk calculate karti hai
- incidents create/update karti hai
- monitor run me AI summary generate karti hai
- warning/critical alerts pe email send karti hai (Brevo)

---

## 4) Main Modules (Easy words)

- **Dashboard**: health overview + charts + monitor status
- **Logs Explorer**: log upload, filter, clear
- **Endpoints**: endpoint-wise performance and risk
- **Incidents**: detected issues list and details
- **AI Reports**: incident ke liye AI report generation
- **Exports**: report output and JSON export
- **SLA/SLO Settings**: latency/error thresholds configure
- **Monitor**: periodic analysis (manual + cron style)

---

## 5) Demo Script (5-7 minutes)

## Step 1 - Login
- Login page open karo
- Sign in karke dashboard pe jao

## Step 2 - Dashboard Walkthrough
- Total requests, endpoints, at-risk endpoints explain karo
- Monitor cards (lookback, alerts) dikhayo
- Charts se risk visualization explain karo

## Step 3 - Log Ingestion
- `Logs Explorer` pe jao
- `.txt` ya `.log` upload karo
- Filter apply karke data verify karo

## Step 4 - Risk & Incident
- `Endpoints` page pe risk changes dikhao
- `Incidents` page pe active incidents explain karo

## Step 5 - SLA/SLO Impact
- `SLA/SLO Settings` me thresholds change karo (example: latency low set karo)
- Preview impact run karo
- show karo ke at-risk endpoints ka count change hota hai

## Step 6 - Monitor Run + Email
- Dashboard me `Run Monitor Now` click karo
- alerts count show karo
- agar warning/critical alert hai to email trigger explain karo

## Step 7 - AI Report
- `AI Reports` me report generate karo
- incident summary + recommended action explain karo

---

## 6) Viva Ready Answers (Short & Strong)

### Q1: Ye project AI kaise use karta hai?
AI monitor summaries, incident narrative, aur recommended actions ke liye use hoti hai. Core metrics deterministic logic se aati hain.

### Q2: Deterministic + AI hybrid kyun?
Deterministic part reliability deta hai (accurate calculations), AI part readability aur faster decision support deta hai.

### Q3: SLA breach kaise detect hota hai?
Per endpoint error rate aur p95 latency thresholds compare hoti hain. Threshold cross hone pe risk increase hota hai.

### Q4: Email kab send hoti hai?
Monitor run ke baad agar alerts me `warning` ya `critical` severity ho to Brevo se email send hoti hai.

### Q5: Iska deployment model kya hai?
Next.js app, Vercel-friendly architecture, env-based config, cron endpoint support.

### Q6: Future scale ka plan?
In-memory/file storage se managed Postgres (Neon/Supabase/Vercel Postgres) pe move kar sakte hain.

---

## 7) Important Env Variables (Simple reference)

- `GROQ_API_KEY`
- `MODEL_NAME`
- `BREVO_API_KEY`
- `ALERT_TO_EMAIL`
- `ALERT_FROM_EMAIL`
- `MONITOR_CRON_SECRET`
- `CRON_SECRET`
- `MONITOR_LOOKBACK_MINUTES`
- `MONITOR_ALLOW_UI_TRIGGER`

---

## 8) Important Line for Judges

> "This product reduces mean time to detect (MTTD) and mean time to respond (MTTR) by combining automated SLA monitoring with AI-guided incident context."

---

## 9) Honest Limitations (Agar poocha jaye)

- Current version me kuch state local runtime files pe persist hoti hai
- Enterprise production ke liye DB-backed persistence recommended hai
- Log parsing generic hai, but domain-specific parser se accuracy aur improve hoti hai

---

## 10) Closing Statement (Memorize)

`Digital Pioneer` ek practical observability product hai jo raw logs ko business-actionable insights me convert karta hai.  
Isme monitoring, risk detection, AI summarization, aur alerting ek hi workflow me diya gaya hai - fast, clear, and production-oriented.

