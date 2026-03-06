// TrueBank Digital SME (APPID-7779311) — ServiceNow synthetic data
// Incidents, changes, CMDB, and problems for the SME platform itself

export const smeServicenowChunks = [

  // ─── INCIDENTS ─────────────────────────────────────────────────────────────

  {
    id: 'sme_inc_001',
    appid: 'APPID-7779311',
    source: 'servicenow_incidents',
    source_label: 'ServiceNow',
    record_id: 'INC0092841',
    title: 'SEV3 — TrueBank Digital SME Claude API latency spike — p95 >12s',
    text: `INCIDENT: INC0092841
Severity: SEV3
State: Resolved
Application: TrueBank Digital SME (APPID-7779311)
Opened: 2025-03-03T14:22:00Z
Resolved: 2025-03-03T16:05:00Z
Assigned To: Platform AI Team
Priority: 3 - Medium

SUMMARY:
Claude API (claude-haiku-4-5-20251001) response latency spiked to p95 >12 seconds for a 103-minute window. Normal p95 is 2.1 seconds. The SME Lambda function (truebank-sme-api) hit its 29-second timeout for 8% of requests during the window. Anthropic status page showed elevated API latency across claude-haiku-4-5 in us-east-1.

IMPACT:
- 8% of SME chat requests timed out with HTTP 504 from API Gateway
- Users received "AI model temporarily unavailable" error — knowledge base chunks were still retrieved and returned
- Zero data loss; stateless Lambda ensured no session corruption
- Affected users: ~34 concurrent sessions during the 14:00–16:00 window

TIMELINE:
- 2025-03-03T14:18:00Z: CloudWatch alarm — Lambda duration p95 >10,000ms
- 2025-03-03T14:22:00Z: INC0092841 opened
- 2025-03-03T14:35:00Z: Confirmed external — Anthropic status page updated (elevated API latency)
- 2025-03-03T16:03:00Z: Anthropic status page: resolved
- 2025-03-03T16:05:00Z: INC0092841 resolved — Lambda p95 returned to 2.2s

ROOT CAUSE: External — Anthropic API platform latency event. No TrueBank infrastructure fault.

WORKAROUND APPLIED:
The existing error handling in haiku.js returned retrieved knowledge base chunks to the UI even during model failure, providing partial value to users.

FOLLOW-UP:
- Consider adding exponential backoff retry (max 2 retries, 3s initial delay) for transient API errors
- Review Lambda timeout — current 29s; consider increasing to 45s to survive brief latency spikes
CORRELATION: None internal`,
    tags: ['incident', 'sev3', 'sme', 'claude-api', 'latency', 'lambda-timeout', 'anthropic', 'resolved', 'external'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-03T16:05:00Z',
    ingest_ts: '2025-03-03T16:10:00Z',
    ttl_hours: 48,
    meta: { severity: 'SEV3', state: 'Resolved', assigned_to: 'Platform AI Team', correlation: 'External/Anthropic' }
  },

  {
    id: 'sme_inc_002',
    appid: 'APPID-7779311',
    source: 'servicenow_incidents',
    source_label: 'ServiceNow',
    record_id: 'INC0091988',
    title: 'SEV4 — TrueBank Digital SME high token consumption — cost alert threshold breached',
    text: `INCIDENT: INC0091988
Severity: SEV4
State: Resolved
Application: TrueBank Digital SME (APPID-7779311)
Opened: 2025-03-02T09:11:00Z
Resolved: 2025-03-02T11:45:00Z
Assigned To: Platform AI Team

SUMMARY:
AWS Cost Anomaly Detection alert fired — Anthropic API spend projected to exceed monthly budget threshold of $50 USD. Root cause was the system prompt containing a dynamic timestamp (new Date().toISOString()) which prevented Claude prompt caching from activating. Every request was billed at full input token rate for the ~380-token system prompt.

IMPACT:
- Cost anomaly — no user-facing impact
- Estimated excess spend: ~$18 USD above expected for the 72-hour period
- Token audit showed input tokens averaging 6,200 per request vs expected ~2,800

ROOT CAUSE:
haiku.js system prompt included Current date/time: ${new Date().toISOString()} — this value changes every second, making the system prompt unique per call. Claude's prompt caching requires the system prompt to be byte-identical across calls. The dynamic timestamp completely defeated caching.

FIX APPLIED (CHG0105021):
- Moved timestamp and active scope from system prompt to user message
- System prompt is now fully static — identical on every call
- Chunk text truncation added: MAX_CHUNK_CHARS = 2000 (previously unlimited)
- maxChunks reduced from 6 to 4

POST-FIX METRICS:
- Input tokens per request: reduced from ~6,200 to ~2,100 average
- Prompt cache hit rate: 87% of requests (measured over 4 hours post-fix)
- Cost projection: back within budget

CORRELATION: CHG0105021`,
    tags: ['incident', 'sev4', 'sme', 'token-cost', 'prompt-caching', 'haiku', 'cost-anomaly', 'resolved'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-02T11:45:00Z',
    ingest_ts: '2025-03-02T11:50:00Z',
    ttl_hours: 72,
    meta: { severity: 'SEV4', state: 'Resolved', assigned_to: 'Platform AI Team', correlation: 'CHG0105021' }
  },

  // ─── CHANGES ───────────────────────────────────────────────────────────────

  {
    id: 'sme_chg_001',
    appid: 'APPID-7779311',
    source: 'servicenow_changes',
    source_label: 'ServiceNow',
    record_id: 'CHG0105021',
    title: 'Standard Change — SME token optimisation: static prompt, chunk truncation, reduced maxChunks',
    text: `CHANGE RECORD: CHG0105021
Type: Standard Change
Application: TrueBank Digital SME (APPID-7779311)
State: Successful — Closed
Deployed: 2025-03-02T10:30:00Z
Change Owner: Platform AI Team
Risk Level: Low

CHANGE SUMMARY:
Three token efficiency improvements to the Digital SME platform following INC0091988 (cost anomaly — dynamic timestamp defeating prompt caching):

1. Static system prompt — removed dynamic timestamp from system prompt, moved to user message. Enables Claude prompt caching. Expected cache hit rate: >80% after warm-up.
2. Chunk truncation — added MAX_CHUNK_CHARS = 2000 limit per chunk. Prevents runbook/architecture chunks (up to 12,952 chars) from consuming the full token budget.
3. Reduced maxChunks — decreased from 6 to 4. Top-4 scored chunks provide equivalent answer quality with 33% fewer context tokens.

FILES CHANGED:
- server/haiku.js — system prompt refactored, MAX_CHUNK_CHARS constant added, truncation logic
- server/app.js — maxChunks: 6 → 4

DEPLOYMENT:
Pipeline PIPE-SME-5021-PROD. Lambda function updated via SAM deploy. Zero downtime — Lambda alias routing ensured no in-flight requests dropped.

POST-DEPLOY METRICS (4h observation):
- Average input tokens: 6,200 → 2,100 per request
- Prompt cache hit rate: 87%
- Answer quality: no regression observed in manual testing
- Cost projection: within $50/month budget at current query volume

CORRELATION: INC0091988`,
    tags: ['change', 'standard', 'sme', 'token-optimisation', 'prompt-caching', 'haiku', 'chunk-truncation', 'successful'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-02T14:30:00Z',
    ingest_ts: '2025-03-02T14:35:00Z',
    ttl_hours: 72,
    meta: { change_type: 'Standard', state: 'Successful', risk: 'Low', deployed: '2025-03-02T10:30:00Z' }
  },

  {
    id: 'sme_chg_002',
    appid: 'APPID-7779311',
    source: 'servicenow_changes',
    source_label: 'ServiceNow',
    record_id: 'CHG0104890',
    title: 'Normal Change — SME knowledge base expansion: policy, CVE, process flow, SME self-data',
    text: `CHANGE RECORD: CHG0104890
Type: Normal Change
Application: TrueBank Digital SME (APPID-7779311)
State: Successful — Closed
Deployed: 2025-03-04T08:00:00Z
Change Owner: Platform AI Team
Risk Level: Low

CHANGE SUMMARY:
Knowledge base expansion for stakeholder demonstration iteration. Added four new data categories:

1. Policy data (appid: POLICY) — bank-wide policies: PCI-DSS, GDPR, data retention, incident management, change management, access control. 15 chunks. Retrieved only on policy/compliance query intent.
2. CVE data (appid: CVE) — vulnerability records for libraries used across TruView platform. 15 chunks. Retrieved only on security/vulnerability query intent.
3. Process flow data — end-to-end process flows for TruView Core, Web, Mobile, and Digital SME. 12 chunks. App-scoped, retrieved via normal scoring.
4. SME self-referential data — ServiceNow, CI/CD, AWS, architecture, onboarding, and process flow records for APPID-7779311 (this application). Enables users to query the SME platform about itself.

RETRIEVAL ENGINE CHANGES:
- Added detectIntent(query) function — keyword matching for policy and CVE intent
- Multi-pool retrieval: app chunks (max 4) + policy pool (max 2, conditional) + CVE pool (max 2, conditional)
- Maximum total chunks per request: 8 (policy + CVE both triggered); 4 (normal queries)

KNOWLEDGE BASE SIZE: 80 → 152 chunks across 4 applications and 2 global pools

CORRELATION: None`,
    tags: ['change', 'normal', 'sme', 'knowledge-base', 'policy', 'cve', 'process-flow', 'retrieval', 'successful'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-04T08:00:00Z',
    ingest_ts: '2025-03-04T08:05:00Z',
    ttl_hours: 72,
    meta: { change_type: 'Normal', state: 'Successful', risk: 'Low', deployed: '2025-03-04T08:00:00Z' }
  },

  // ─── CMDB ──────────────────────────────────────────────────────────────────

  {
    id: 'sme_cmdb_001',
    appid: 'APPID-7779311',
    source: 'servicenow_cmdb',
    source_label: 'ServiceNow',
    record_id: 'CMDB-APPID-7779311',
    title: 'CMDB — TrueBank Digital SME (APPID-7779311) application record',
    text: `CMDB APPLICATION RECORD: TrueBank Digital SME
APPID: APPID-7779311
Application Name: TrueBank Digital SME
Criticality: Tier 3 (Internal Tool — POC)
Business Owner: Digital Banking Platform — Head of Platform: Sarah Kimberley (sarah.kimberley@truebank.com.au)
IT Owner: Platform AI Team — Lead: Larry Dooley (l.dooley@truebank.com.au)
On-Call: Platform AI Team — Slack: #platform-ai (no 24/7 pagerduty — business hours support only)

DESCRIPTION:
AI-powered Subject Matter Expert assistant for TruView platform operations teams. Uses Claude Haiku (Anthropic) with retrieval-augmented generation (RAG) over a synthetic knowledge base of 152 operational records. Enables SREs and platform engineers to query incident, change, CMDB, architecture, policy, and CVE data via natural language.

INFRASTRUCTURE (AWS — serverless):
- Compute: AWS Lambda — function: truebank-sme-api (Node.js 20, 512MB, timeout: 29s, us-east-1)
- API: Amazon API Gateway HTTP API — endpoint: https://[api-id].execute-api.us-east-1.amazonaws.com
- Frontend: React/Vite SPA — S3 bucket: truebank-sme-frontend-prod — CloudFront: prod-cf-sme
- SAM Stack: truebank-digital-sme (us-east-1)
- Secrets: ANTHROPIC_API_KEY stored in AWS SSM Parameter Store (/truebank/sme/anthropic-api-key)

EXTERNAL DEPENDENCIES:
- Anthropic API (claude-haiku-4-5-20251001) — chat completions endpoint
- No database — knowledge base is in-memory (loaded at Lambda cold start)

DATA CLASSIFICATION: Internal (operational metadata — no PII, no financial account data)
RECOVERY OBJECTIVES: RTO 24 hours (Tier 3), RPO N/A (stateless, no persistent data)
COST: ~$15–50/month (Anthropic API + AWS free tier)`,
    tags: ['cmdb', 'sme', 'appid-7779311', 'tier3', 'lambda', 'rag', 'anthropic', 'serverless', 'internal-tool'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-04T08:00:00Z',
    ingest_ts: '2025-03-04T08:05:00Z',
    ttl_hours: 168,
    meta: { app_tier: 'Tier 3', business_owner: 'Digital Banking Platform', it_owner: 'Platform AI Team' }
  },

  // ─── PROBLEMS ──────────────────────────────────────────────────────────────

  {
    id: 'sme_prb_001',
    appid: 'APPID-7779311',
    source: 'servicenow_problems',
    source_label: 'ServiceNow',
    record_id: 'PRB0012901',
    title: 'Known Error — SME retrieval quality degrades for multi-hop questions crossing app boundaries',
    text: `PROBLEM RECORD: PRB0012901
State: Known Error
Application: TrueBank Digital SME (APPID-7779311)
Problem Manager: Platform AI Team
Opened: 2025-03-01T10:00:00Z
Last Updated: 2025-03-04T08:00:00Z

PROBLEM STATEMENT:
When a user asks a question that spans multiple TruView applications — for example "how does a balance update in TruView Core affect TruView Web?" — the retrieval system scores and returns chunks from a single primary app context. Cross-application dependency chunks (architecture records with appid: ALL) are retrieved but may be ranked below single-app chunks, resulting in incomplete answers for dependency-chain questions.

KNOWN ERROR STATUS:
Root cause identified: BM25-style keyword scoring does not model cross-application relevance. A chunk describing TruView Core account-service interactions receives the same score whether the question is scoped to Core or to All TruView. The appid bonus in the scoring function (+2.0 for matching appid) can suppress ALL-scoped architecture chunks when a specific app is selected.

WORKAROUND:
Users can switch scope to "All TruView" for questions about cross-application behaviour. This ensures architecture chunks with appid: ALL are included in the candidate pool without the appid filter suppressing them.

PROPOSED FIX:
Implement query intent classification to detect cross-app questions and automatically temporarily widen the appid scope to ALL for the retrieval step. Or, weight appid: ALL chunks more heavily when cross-app keywords are detected (impact, downstream, dependency, blast radius).

No confirmed fix date — POC phase. Will be addressed in production iteration.`,
    tags: ['problem', 'known-error', 'sme', 'retrieval', 'cross-app', 'multi-hop', 'rag', 'scoring'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-04T08:00:00Z',
    ingest_ts: '2025-03-04T08:05:00Z',
    ttl_hours: 168,
    meta: { problem_state: 'Known Error', assigned_to: 'Platform AI Team', workaround: 'Switch to All TruView scope' }
  },

];
