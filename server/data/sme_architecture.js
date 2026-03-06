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
Last Reviewed: 2025-03-04
Status: Current (reflects production state)

SYSTEM OVERVIEW:
The TrueBank Digital SME is a Retrieval-Augmented Generation (RAG) system. It answers operations team questions by: (1) retrieving relevant records from a knowledge base using keyword scoring, (2) injecting those records as context into a Claude prompt, and (3) returning Claude's grounded, cited response.

COMPONENTS:

1. FRONTEND (React/Vite → S3 → CloudFront)
   - ChatInterface.jsx: query input, response rendering, markdown display
   - AppSelector.jsx: scope selector (TruView Core / Web / Mobile / SME / All)
   - ReasoningTrace.jsx: shows retrieval debug info (tokens, scores, chunks evaluated)
   - SourceBadge.jsx: displays cited and retrieved sources
   - Dashboard.jsx: wraps all components, manages layout

2. API LAYER (Amazon API Gateway HTTP API)
   - POST /api/chat: main query endpoint
   - GET /api/health: chunk count and server status
   - GET /api/freshness: source freshness status per app scope
   - CORS: enabled (POC — wildcard origin)

3. COMPUTE (AWS Lambda — truebank-sme-api)
   - server/app.js: Express router (wrapped for Lambda via aws-serverless-express)
   - server/retrieval.js: keyword scoring retrieval engine
   - server/haiku.js: Claude API client, prompt construction, response parsing
   - server/lambda.js: Lambda handler wrapper

4. KNOWLEDGE BASE (in-memory, loaded at cold start)
   - server/data/index.js: loads and timestamps all chunk arrays
   - 13 data source files covering ServiceNow, Confluence, Dynatrace, CI/CD, AWS, Architecture, Onboarding, Process Flow, Policy (global), CVE (global)
   - 152 chunks across 4 applications (APPID-973193, APPID-871198, APPID-871204, APPID-7779311) + 2 global pools (POLICY, CVE)

5. AI MODEL (Anthropic Claude)
   - Model: claude-haiku-4-5-20251001
   - Static system prompt (enables prompt caching)
   - Dynamic user message: scope + timestamp + retrieved chunks (truncated at 2,000 chars) + question
   - max_tokens: 1,500
   - Prompt cache hit rate: ~87% (warm traffic)`,
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

MIGRATION PATH (production):
When the POC converts to production: DynamoDB for chunk storage + Bedrock Titan Embeddings for vectors + cosine similarity in Lambda. Migration is isolated to server/retrieval.js and server/data/index.js — no frontend or prompt changes required.

REVIEW DATE: After stakeholder sign-off on POC — estimated Q2 2025`,
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

];
