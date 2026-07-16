# 2Skill — AI Skills Assessment

A prototype that assesses practical AI skills through three realistic work tasks. Participants complete each task with the help of an AI assistant; traps are planted in the task material (wrong numbers, contradicting sources, confidential context) to measure real judgment, not just prompt-writing. When the assessment is finished, the session is graded by Claude and a personal PDF report is emailed to the participant.

## How it works

1. **Intake** — the participant enters their email and answers a short profile questionnaire.
2. **Three tasks** — a monthly payments report, a research briefing, and a partner-facing slide deck. Each comes with a brief, materials, a time limit, and an embedded AI chat.
3. **Report** — on submitting the last task, the server grades the full session (chat transcripts, deliverables, telemetry) against hidden rubrics using Claude, renders a branded PDF, and emails it to the address from step 1.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create (or edit) `.env.local` in the project root:

```bash
# Anthropic API — powers the in-task AI assistant and the report grading
ANTHROPIC_API_KEY=sk-ant-...

# Comma-separated list of access keys. Participants open the app with ?k=<key>
ACCESS_KEYS=key-one,key-two

# Report email delivery — any SMTP provider works.
# For Gmail: use an App Password (https://myaccount.google.com/apppasswords),
# NOT your normal account password.
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password_here
MAIL_FROM=2Skill <your_email@gmail.com>
```

> **Note:** Next.js only reads `.env.local` at startup — restart the dev server after changing it.

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000/?k=key-one](http://localhost:3000/?k=key-one) (using one of your `ACCESS_KEYS`). Opening the app without a valid `?k=` parameter shows **"This link is not valid."**

## Development helpers

| URL | What it does |
|---|---|
| `/?k=<key>&dev=1` | Dev navigation bar: jump between steps, prefill deliverables, reset the session |
| `/api/report/preview` | Renders the PDF report with sample grades — preview the design without completing an assessment (development only) |
| `/debug` | Server-side usage/telemetry view |

## Architecture notes

- **Access control** — [`lib/auth.ts`](lib/auth.ts) validates keys against `ACCESS_KEYS`. Session state lives in the browser (`sessionStorage`); server-side telemetry is in-memory only ([`lib/store.ts`](lib/store.ts)) and resets on restart — acceptable for a demo, not production.
- **Task content & traps** — everything lives in [`lib/mockData.ts`](lib/mockData.ts). The apparent inconsistencies in Task 2's sources are intentional; don't "fix" them.
- **Grading** — [`lib/report/grading.ts`](lib/report/grading.ts) holds the rubrics (the answer key) server-side and calls Claude with structured output to score each task.
- **PDF report** — [`lib/report/pdf.tsx`](lib/report/pdf.tsx) via `@react-pdf/renderer`, styled to match the app's palette.
- **Email** — [`lib/report/mail.ts`](lib/report/mail.ts) via `nodemailer`; the report endpoint is [`app/api/report/route.ts`](app/api/report/route.ts).
