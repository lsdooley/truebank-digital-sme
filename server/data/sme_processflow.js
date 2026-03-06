// TrueBank Digital SME (APPID-7779311) — Process flow documentation

export const smeProcessflowChunks = [

  {
    id: 'sme_flow_001',
    appid: 'APPID-7779311',
    source: 'process_flow',
    source_label: 'Process Flow',
    record_id: 'FLOW-SME-QUERY-001',
    title: 'TrueBank Digital SME — End-to-end query processing flow',
    text: `PROCESS FLOW: TrueBank Digital SME — Query Processing
Document: FLOW-SME-QUERY-001
Owner: Platform AI Team
Last Updated: 2025-03-04

END-TO-END FLOW (user submits a question):

STEP 1 — USER INPUT (browser)
  User types query in ChatInterface.jsx and submits.
  Frontend sends: POST /api/chat { query, appid, sessionId }
  appid = currently selected scope (e.g. 'APPID-973193' or 'ALL')

STEP 2 — INTENT DETECTION (server/retrieval.js — detectIntent)
  Server checks query for intent keywords:
  - Policy intent: policy, compliance, regulation, gdpr, pci, requirement, permitted, standard, mandate, audit
  - CVE intent: cve, vulnerability, security, exploit, patch, exposure, risk, zero-day, dependency
  Intent flags determine which retrieval pools are activated.

STEP 3 — RETRIEVAL (server/retrieval.js — retrieveChunks)
  Pool A (always): knowledgeBase filtered by appid scope → scored → top 4
  Pool B (if policyIntent): POLICY chunks → scored → top 2
  Pool C (if cveIntent): CVE chunks → scored → top 2
  Maximum chunks: 8 (both intent pools active), 4 (normal query)

  Scoring per chunk:
  - +3.0 per query token matching chunk title
  - +2.0 per query token matching chunk tags
  - +1.0 per query token matching chunk body (unique tokens)
  - +5.0 per 2+ word phrase match in body
  - +3.0 per 2+ word phrase match in title
  - +2.0 if chunk appid matches selected scope
  - +0.8–1.5 recency bonus (based on ingest age)
  - +1.0–2.0 severity bonus (SEV1/SEV2 incidents score higher)
  Minimum score threshold: 0.5 (chunks below are excluded)

STEP 4 — PROMPT CONSTRUCTION (server/haiku.js)
  Static system prompt (cached by Anthropic — ~87% cache hit rate).
  User message: scope + timestamp + retrieved chunk texts (truncated at 2,000 chars each) + question.

STEP 5 — CLAUDE INFERENCE (Anthropic API)
  Model: claude-haiku-4-5-20251001 | max_tokens: 1,500
  Claude reads context records and generates a grounded, cited answer.
  [SOURCE: record_id] markers embedded in response for citation extraction.

STEP 6 — RESPONSE PARSING (server/haiku.js)
  Extract [SOURCE: record_id] markers → build citedChunks list.
  Strip markers from visible text.
  Return: { text, inputTokens, outputTokens, chunksUsed, citedChunks }

STEP 7 — RESPONSE (browser)
  ChatInterface renders markdown response.
  SourceBadge shows cited and retrieved sources.
  ReasoningTrace shows: tokens used, retrieval scores, intent pools activated, latency.

TYPICAL LATENCY BREAKDOWN:
  Retrieval: <5ms | Claude API: ~1,800ms p50 | Total p95: ~2.8s`,
    tags: ['process-flow', 'sme', 'query', 'retrieval', 'rag', 'claude', 'architecture', 'flow', 'end-to-end'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-04T08:00:00Z',
    ingest_ts: '2025-03-04T08:05:00Z',
    ttl_hours: 168,
    meta: { doc_type: 'Process Flow', owner: 'Platform AI Team' }
  },

];
