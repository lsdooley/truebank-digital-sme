# TrueBank Digital SME Platform

A Command Center-aesthetic AI assistant that gives bank operations teams structured, evidence-grounded answers about the TruView application platform. Powered by Claude Haiku with retrieval-augmented generation (RAG) over a synthetic knowledge base.

## Prerequisites

- Node.js 18+ (tested on v24)
- npm
- An Anthropic API key

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# 3. Start the application
npm run dev
```

The app runs on **http://localhost:5173** (Vite dev server).
The API runs on **http://localhost:3001** (Express).

## Architecture

```
Browser (React SPA)
  └── Vite dev server :5173
        └── /api/* proxy → Express :3001
              ├── GET  /api/health          — server health
              ├── GET  /api/freshness       — source freshness by APPID scope
              └── POST /api/chat            — query → retrieve → Haiku → response
```

### Knowledge Base

Synthetic data loaded in-memory at server startup from `server/data/`:

| Source | Records | Coverage |
|---|---|---|
| ServiceNow | Incidents (INC), Changes (CHG), CMDB, Problems (PRB) | TruView Core, Web, Mobile |
| Confluence | ADRs, Runbooks (KB), Service Catalog, Onboarding | All TruView |
| Dynatrace | Problem events (P-), SLO status, Health snapshots | All TruView |
| CI/CD | Pipeline runs, deployment history | All TruView |
| AWS/CMDB | EKS topology, CloudTrail, Config compliance | TruView Core |
| Architecture | Interaction diagrams, Blast radius, Kafka topology | All TruView |
| Onboarding | Team contacts, escalation matrix | All TruView |

Ingest timestamps are set relative to server start so freshness states (LIVE / SYNCED / STALE) work correctly at any time.

### Retrieval

Custom TF-IDF keyword scoring in `server/retrieval.js`:
- Title match: +3.0 per token
- Tag match: +2.0 per token
- Text match: +1.0 per unique token
- Exact phrase bonus: +5.0
- APPID scope match: +2.0
- Recency bonus: +1.5 (< 6h), +0.8 (< 24h)
- Severity bonus: SEV2 +2.0, SEV3 +1.0

### AI Model

Claude Haiku (`claude-haiku-4-5-20251001`) via `@anthropic-ai/sdk`.
Strict system prompt: answer only from provided records, cite every claim with `[SOURCE: record_id]`.
Graceful degradation: if the API is unavailable, returns retrieved chunks with an error message.

## Application Scope

This prototype is scoped to three TruView applications:
- **TruView Core** — APPID-973193 (Tier 1)
- **TruView Web** — APPID-871198 (Tier 1)
- **TruView Mobile** — APPID-871204 (Tier 1)

The Dashboard shows 13 applications. Non-TruView apps display a "not onboarded" state.

## Key Interaction Scenarios

| Query | Expected top results |
|---|---|
| "What changed in the last 72 hours?" | CHG0104892, CHG0104756, CHG0104601 |
| "Is there an active incident on TruView Core?" | INC0089341, P-3891 |
| "What is the blast radius if account-service goes down?" | ARCH-BLAST-RADIUS-ACCOUNT-SERVICE |
| "Show me the runbook for Kafka consumer lag" | KB0036891 |
| "What SLOs are currently breached?" | SLO-TRUVIEW-MOBILE-PUSH, SLO-TRUVIEW-CORE-LATENCY |
| "Who do I escalate TruView Core incidents to?" | ONBOARD-ESCALATION-002, CMDB-APPID-973193 |

## Design Notes

- **No authentication** — single user prototype
- **No database** — all knowledge is in-memory JSON
- **No Docker** — local development only
- **No streaming** — HTTP request/response (one Haiku call per query)
- Confluence data is purposefully set to show as SYNCED (~2h lag) to demonstrate the freshness bar states
