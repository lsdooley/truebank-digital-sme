// TrueBank Digital SME (APPID-7779311) — Architecture and design decision records

export const smeArchitectureChunks = [

  {
    id: 'sme_arch_001',
    appid: 'APPID-7779311',
    source: 'architecture_ea',
    source_label: 'Architecture/ADR',
    record_id: 'ARCH-SME-RAG-OVERVIEW',
    title: 'TrueBank Digital SME — RAG architecture overview and component diagram',
    text: `ARCHITECTURE ARTIFACT: TrueBank Digital SME RAG Architecture
Type: System Architecture Overview
Owner: Platform AI Team
Last Reviewed: 2026-03-11
Status: Current (reflects production state — v2.3)

SYSTEM OVERVIEW:
The TrueBank Digital SME is a Retrieval-Augmented Generation (RAG) system. It answers operations team questions by: (1) retrieving relevant records from a knowledge base using keyword scoring, (2) injecting those records as context into a Claude prompt, and (3) returning Claude's grounded, cited response. As of v2.3, the knowledge base is hybrid: static in-memory chunks plus live chunks synced from CloudWatch Logs every 15 minutes via DynamoDB.

COMPONENTS:

1. FRONTEND (React/Vite → S3 → CloudFront)
   - ChatInterface.jsx: query input, streaming response rendering, markdown display
   - AppSelector.jsx: scope selector (TruView Core / Web / Mobile / SME / All)
   - ReasoningTrace.jsx: shows retrieval debug info (tokens, scores, chunks evaluated)
   - Dashboard.jsx: application portfolio, degraded banner with dynamic SME routing
   - About.jsx: architecture overview, process flow diagram, versioned changelog
   - Sidebar.jsx: quick queries scoped per app, session stats, build time

2. API LAYER (Amazon API Gateway HTTP API)
   - POST /api/chat: main query endpoint (non-streaming)
   - POST /api/chat/stream: SSE streaming variant
   - GET /api/health: chunk count and server status
   - GET /api/freshness: source freshness status per app scope
   - CORS: enabled (POC — wildcard origin)

3. COMPUTE (AWS Lambda — truebank-sme-api)
   - server/app.js: Express router (wrapped for Lambda via @vendia/serverless-express)
   - server/retrieval.js: async keyword scoring retrieval — 4 pools (app, policy, CVE, live)
   - server/dynamo.js: DynamoDB live chunk reader with 5-minute in-memory cache
   - server/haiku.js: Claude API client, prompt construction, citation extraction
   - server/lambda.js: Lambda handler wrapper

4. KNOWLEDGE BASE — STATIC (in-memory, loaded at cold start)
   - server/data/index.js: loads and timestamps all chunk arrays
   - 115 chunks across 4 apps + 2 global pools (POLICY, CVE)
   - Sources: ServiceNow, Confluence, Dynatrace, CI/CD, AWS/CMDB, Architecture, Onboarding, Process Flow, Policy, CVE

4b. KNOWLEDGE BASE — LIVE (DynamoDB, refreshed every 15 min)
   - Table: truebank-sme-live-chunks (PAY_PER_REQUEST, 24h TTL auto-expiry)
   - 3 live chunks written by log-sync Lambda: CW-PERF-CURRENT, CW-ERRORS-CURRENT, CW-TREND-6H
   - Merged with static chunks at query time via server/dynamo.js (5-min cache)

5. LOG SYNC (AWS Lambda — truebank-sme-log-sync)
   - Triggered: EventBridge rate(15 minutes)
   - Queries CloudWatch Logs Insights for /aws/lambda/truebank-sme-api
   - Writes 3 structured knowledge chunks to DynamoDB (performance, errors, 6h trend)
   - Enables live operational queries: errors in last 15 min, request volume, latency trend

6. AI MODEL (Anthropic Claude)
   - Model: claude-haiku-4-5-20251001
   - Static system prompt (enables prompt caching)
   - Dynamic user message: scope + timestamp + retrieved chunks (truncated at 2,000 chars) + question
   - max_tokens: 1,500
   - Prompt cache hit rate: ~87% (warm traffic)

RETRIEVAL POOLS:
   Pool A (always): app-scoped static chunks — maxChunks=4
   Pool B (policyIntent): global POLICY pool — maxPolicyChunks=2
   Pool C (cveIntent): global CVE pool — maxCveChunks=2
   Pool D (liveIntent): live DynamoDB chunks — maxLiveChunks=3
   Intent triggered by keyword sets in query (requests, errors, latency, today, etc.)`,
    tags: ['architecture', 'rag', 'sme', 'overview', 'lambda', 'claude', 'retrieval', 'knowledge-base', 'components'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-04T08:00:00Z',
    ingest_ts: '2025-03-04T08:05:00Z',
    ttl_hours: 168,
    meta: { doc_type: 'Architecture Overview', owner: 'Platform AI Team' }
  },

  {
    id: 'sme_arch_002',
    appid: 'APPID-7779311',
    source: 'architecture_ea',
    source_label: 'Architecture/ADR',
    record_id: 'ADR-SME-001',
    title: 'ADR-SME-001: In-memory knowledge base over database for POC phase',
    text: `ARCHITECTURE DECISION RECORD: ADR-SME-001
Title: Use in-memory knowledge base instead of database for POC phase
Status: Accepted
Date: 2025-02-28
Author: Platform AI Team

CONTEXT:
The Digital SME requires a knowledge base of operational records (incidents, changes, architecture docs, policies) that can be searched on each query. Options considered: (1) in-memory JavaScript arrays loaded at startup, (2) DynamoDB with keyword filtering, (3) DynamoDB + Bedrock embeddings for vector search, (4) Pinecone or pgvector for ANN search.

DECISION:
Use in-memory JavaScript arrays for the POC phase.

RATIONALE:
1. Speed: In-memory lookup is <1ms. Any database option adds 10–300ms network latency per query.
2. Cost: Zero database cost. DynamoDB scan costs grow linearly with chunk count and query volume.
3. Simplicity: No infrastructure to provision, no data pipeline. Knowledge base is updated by editing JS files and redeploying Lambda.
4. Scale fit: 80–200 chunks fits comfortably in 512MB Lambda memory (~5MB for text content).
5. POC timeline: Database migration is a 1–2 sprint effort. In-memory approach is deployable in hours.

CONSEQUENCES:
- Knowledge base updates require a Lambda redeployment (~13 minutes CI/CD)
- No semantic (vector) search — keyword scoring only; misses synonyms and intent nuance
- Cannot scale beyond ~10,000 chunks without hitting Lambda memory limits

UPDATE (2026-03-11 — v2.3):
Phase 1 of the DynamoDB migration path has been implemented. A DynamoDB table (truebank-sme-live-chunks) now stores live operational data from CloudWatch Logs, synced every 15 minutes. The in-memory knowledge base remains for the stable static corpus. This is a hybrid approach: static chunks in memory, live/volatile chunks in DynamoDB.

MIGRATION PATH (production):
Full migration: DynamoDB for all chunk storage + Bedrock Titan Embeddings for vectors + cosine similarity in Lambda. Migration is isolated to server/retrieval.js and server/data/index.js — no frontend or prompt changes required.

REVIEW DATE: After stakeholder sign-off on POC`,
    tags: ['adr', 'architecture', 'sme', 'knowledge-base', 'in-memory', 'database', 'rag', 'design-decision'],
    classification: 'INTERNAL',
    freshness_ts: '2025-02-28T10:00:00Z',
    ingest_ts: '2025-03-04T08:05:00Z',
    ttl_hours: 168,
    meta: { doc_type: 'ADR', status: 'Accepted', owner: 'Platform AI Team' }
  },

  {
    id: 'sme_arch_003',
    appid: 'APPID-7779311',
    source: 'architecture_ea',
    source_label: 'Architecture/ADR',
    record_id: 'ADR-SME-002',
    title: 'ADR-SME-002: Claude Haiku as the inference model for cost and latency',
    text: `ARCHITECTURE DECISION RECORD: ADR-SME-002
Title: Use Claude Haiku (claude-haiku-4-5-20251001) as inference model
Status: Accepted
Date: 2025-02-28
Author: Platform AI Team

CONTEXT:
The Digital SME is a POC with a budget target of <$50/month and a latency target of p95 <5s response time. The model must be capable of grounded, structured answers from operational records. Candidates evaluated: Claude Haiku (haiku-4-5), Claude Sonnet (sonnet-4-6), GPT-4o-mini.

DECISION:
Use claude-haiku-4-5-20251001.

RATIONALE:
1. Cost: Haiku input: $0.80/1M tokens. Sonnet input: $3.00/1M tokens. At 100 queries/day with ~2,100 input tokens per query: Haiku = ~$5/month, Sonnet = ~$19/month.
2. Latency: Haiku p50 ~1.2s, p95 ~2.8s (including retrieval). Sonnet p50 ~3.1s, p95 ~7.2s. Haiku meets the 5s target; Sonnet does not.
3. Quality for RAG: Both models perform comparably on grounded Q&A tasks where context is explicitly provided. Haiku's smaller context window is not a constraint at 4 chunks × 2,000 chars.
4. Prompt caching: Both models support caching. After CHG0105021 (static system prompt), cache hit rate is 87% — reduces effective input token cost by ~90% for cached tokens.

CONSEQUENCES:
- For complex multi-hop reasoning across many records, Sonnet may produce higher quality responses. This can be revisited if POC feedback identifies quality gaps.
- Model ID must be pinned in haiku.js to avoid unintended upgrades.

UPGRADE PATH: If quality feedback requires Sonnet, change model ID in haiku.js — no other changes required.`,
    tags: ['adr', 'architecture', 'sme', 'claude', 'haiku', 'model-selection', 'cost', 'latency', 'design-decision'],
    classification: 'INTERNAL',
    freshness_ts: '2025-02-28T10:00:00Z',
    ingest_ts: '2025-03-04T08:05:00Z',
    ttl_hours: 168,
    meta: { doc_type: 'ADR', status: 'Accepted', owner: 'Platform AI Team' }
  },

  {
    id: 'sme_arch_004',
    appid: 'APPID-7779311',
    source: 'architecture_ea',
    source_label: 'Architecture/ADR',
    record_id: 'ADR-SME-003',
    title: 'ADR-SME-003: CloudWatch Logs Insights → DynamoDB for live operational knowledge',
    text: `ARCHITECTURE DECISION RECORD: ADR-SME-003
Title: Use CloudWatch Logs Insights + DynamoDB for live operational knowledge chunks
Status: Accepted
Date: 2026-03-11
Author: Platform AI Team

CONTEXT:
The Digital SME knowledge base was entirely static — updated only on Lambda redeployment. This meant the SME could not answer questions about live operational state: current error rates, request volumes, Lambda latency trends. Options considered: (1) Amazon OpenSearch Service with log ingestion pipeline, (2) CloudWatch Logs Insights + Lambda sync to DynamoDB, (3) direct CloudWatch Logs API calls at query time, (4) Bedrock Knowledge Bases with S3 data source.

DECISION:
CloudWatch Logs Insights → DynamoDB via a scheduled sync Lambda (rate: 15 minutes).

RATIONALE:
1. Free tier fit: CloudWatch Logs Insights is included in free tier usage for this log volume. DynamoDB PAY_PER_REQUEST at <100 writes/day costs ~$0.00. OpenSearch minimum instance (t3.small) costs ~$25/month after 12-month free tier expires.
2. No new service dependency: CloudWatch is already capturing Lambda logs. DynamoDB was the natural next step in the existing architecture.
3. Latency: DynamoDB Scan at 3 items is <5ms. Querying CloudWatch Logs Insights at query time would add 2–10 seconds per request (async query polling).
4. Simplicity: Sync Lambda is 150 lines. OpenSearch ingestion pipeline (Kinesis Firehose + index mapping + IAM) would be 3–5x the infrastructure complexity.
5. Graceful degradation: If DynamoDB is unavailable, server/dynamo.js returns stale cache or empty array — SME continues with static knowledge base only.

IMPLEMENTATION:
- sync-lambda/index.mjs: queries 3 Logs Insights patterns (REPORT perf, ERROR filter, hourly trend), writes to DynamoDB with 24h TTL
- server/dynamo.js: reads live chunks with 5-min in-memory cache
- retrieval.js Pool D: liveIntent detection surfaces CloudWatch chunks for operational queries
- Chunks use the same schema as static chunks — no retrieval engine changes required

CONSEQUENCES:
- Live data is up to 15 minutes stale (acceptable for operational queries)
- Only covers Lambda metrics — no RDS, ECS, or external service logs (sufficient for SME self-monitoring)
- DynamoDB TTL means chunks auto-expire after 24h — no manual cleanup required

FUTURE:
If log volume grows or other services need coverage, consider Amazon Data Firehose → S3 → Athena for historical queries alongside this pattern for real-time.`,
    tags: ['adr', 'architecture', 'sme', 'cloudwatch', 'dynamodb', 'live-sync', 'logs', 'design-decision', 'v2.3'],
    classification: 'INTERNAL',
    freshness_ts: '2026-03-11T07:00:00Z',
    ingest_ts: '2026-03-11T07:00:00Z',
    ttl_hours: 168,
    meta: { doc_type: 'ADR', status: 'Accepted', owner: 'Platform AI Team' }
  },

];
