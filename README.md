# Community Hero

**The Citizen-Led Municipal Rectification Platform**

> *A vigilant citizenry is the cornerstone of the commonwealth.*

Built for **Vibe2Ship** (Coding Ninjas × Google for Developers) — Problem Statement 2: *Community Hero — Hyperlocal Problem Solver*.

Community Hero lets citizens report local infrastructure issues — potholes, drainage, sidewalk damage, streetlights, and more — with a photo and a location. A multi-agent AI pipeline takes it from there: classifying the issue, checking for duplicates, routing it to the right department, tracking its SLA, and escalating it automatically if it's left unresolved.

---

## Live Demo

- **App:** *[deployed Cloud Run URL]*
- **Repo:** *[this repository]*

---

## The Problem

Reporting a civic issue today is fragmented and opaque — no consistent intake, no automatic triage, no visibility into whether anything actually happens after a report is filed. Community Hero replaces that with a single pipeline: report → understand → verify → route → track → resolve, with AI doing the triage work a human dispatcher would otherwise have to do manually.

---

## How It Works: The Multi-Agent Pipeline

Every report moves through five purpose-built agents, each in its own file, each with a single responsibility:

| Agent | File | Responsibility |
|---|---|---|
| **Intake** | `lib/services/agents/intake.ts` | Sends the photo + citizen description to Gemini's multimodal vision model. Returns a structured `{ category, severity, confidence, reasoning }` and validates it against the live category/severity config. |
| **Dedup** | `lib/services/agents/dedup.ts` | Runs a Haversine-distance check against open reports in the same category. Flags genuine duplicates (`duplicateOf`) instead of creating noise. |
| **Routing** | `lib/services/agents/routing.ts` | Assigns the correct municipal department and SLA window based on category and priority, both pulled live from Firestore — never hardcoded. |
| **Escalation** | `lib/services/agents/escalation.ts` | Checks elapsed time since routing against the configured SLA. Reports that breach their window are automatically marked `escalated`. |
| **Insight** | `lib/services/agents/insight.ts` | Generates a short, citizen-facing pattern observation from aggregate report data for the public Impact Dashboard. |

An **orchestration manager** (`lib/services/agents/manager.ts`) runs the pipeline end-to-end for each new submission and persists every status transition to the report's own audit trail.

### Status Lifecycle

```
submitted → categorized → routed → resolved
                  ↘                    ↗
                needs_review      escalated
```

- **`needs_review`** — the safety net. If Gemini's call fails, returns low confidence, or the response doesn't validate, the report lands here with a clear reason logged — never silently dropped, never crashing the request.
- **`escalated`** — triggered automatically when a routed report exceeds its SLA window for its priority level, no manual intervention required.

This status-machine design is deliberate: every agent is independently swappable, every failure mode degrades gracefully instead of breaking the pipeline, and every category/SLA value is config-driven so policy can change without a code change.

---

## Key Features

- **AI-powered visual categorization** — Gemini multimodal vision + text, with a confidence threshold (≥50%) gating automatic acceptance vs. manual review.
- **Automatic deduplication** — geo-radius matching prevents duplicate tickets for the same real-world issue.
- **Dynamic routing** — department and SLA assignment pulled from live Firestore config, not hardcoded.
- **SLA-based auto-escalation** — overdue reports are flagged automatically, on demand.
- **Community verification** — citizens can confirm reports they're independently affected by ("I've seen this too"), backed by verified Firebase ID tokens, with a small reputation-point reward for the original reporter.
- **Interactive public map** — Leaflet + OpenStreetMap (CartoDB Positron tiles), severity-color-coded markers, no Maps API billing dependency.
- **Citizen dashboard** — personal report history with full status timelines, plus a citywide Impact Dashboard with category/department breakdowns and an AI-generated insight summary.
- **Resilient by design** — retry logic with model fallback on transient AI errors, graceful degradation to manual review rather than failure.

---

## Tech Stack

**Frontend:** Next.js (App Router), React, Tailwind CSS
**Backend:** Next.js API routes on a Node.js server runtime
**Database:** Cloud Firestore (Native mode)
**Auth:** Firebase Authentication (Google Sign-In)
**AI:** Google Gemini API — multimodal vision + text classification, with model fallback for resilience
**Maps:** Leaflet + OpenStreetMap
**Deployment:** Google AI Studio → Cloud Run

### Google Technologies Used

- **Google AI Studio** — core build and deployment platform
- **Gemini API** (multimodal vision + text) — issue categorization and predictive insights
- **Firebase Authentication** — Google Sign-In, citizen identity
- **Cloud Firestore** — primary data store
- **Firebase Admin SDK** — trusted server-side pipeline operations
- **Cloud Run** — application hosting

---

## Data Model

Four Firestore collections, kept intentionally thin and config-driven:

- **`reports`** — the core entity: media, geo, AI classification, status, SLA priority, department, full history audit trail.
- **`config`** — category taxonomy, severity levels, SLA hours per priority. Editable without a redeploy.
- **`departments`** — routing targets per category.
- **`users`** — citizen profiles, role, reputation points.

---

## Design Decisions Worth Noting

- **Images are stored as compressed base64 data URIs directly in Firestore documents**, not in a separate object storage bucket — a deliberate choice made to stay within the platform's available tooling, with client-side compression keeping each report well under Firestore's document size limit.
- **Leaflet/OpenStreetMap was chosen over a default Maps embed** specifically to avoid an unrelated billing dependency, and because its fully customizable tile styling matches this app's editorial visual theme — a corporate map widget would have clashed with it.
- **Every external AI call has a fallback path.** A transient model failure never surfaces as a broken page to the citizen — it surfaces as a clearly logged `needs_review` status, which is itself a demonstration of the fault-tolerant design this architecture was built around from day one.

---

## Project Structure

```
app/
  report/         — citizen reporting form
  map/            — public issues map
  dashboard/      — personal + community dashboard
  api/
    reports/      — submission, listing, single-report endpoints
    reports/confirm/ — community verification endpoint
    escalations/check/ — manual SLA escalation trigger
    insights/     — AI-generated civic insight endpoint
lib/
  services/agents/ — the five-agent pipeline
  firebase.ts      — client SDK
  firebase-admin.ts — trusted server-side SDK
  gemini.ts        — Gemini API client
  types.ts         — shared TypeScript interfaces
  constants.ts     — status lifecycle, severity levels
firestore.rules    — security rules
```

---

## Acknowledgements

Built solo for Vibe2Ship, using Google AI Studio's Build Mode as the core development environment, end to end — from the multi-agent backend to the deployed Cloud Run instance.
