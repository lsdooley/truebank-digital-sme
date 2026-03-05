// ServiceNow synthetic data — additional incidents, changes, problems
// All timestamps relative to 2025-03-04T10:00:00Z as "now"
// These records are supplemental to servicenow.js (servicenowChunks)

export const servicenowExtra = [

  // ─── ADDITIONAL ACTIVE INCIDENTS ───────────────────────────────────────────

  {
    id: 'sn_inc_004',
    appid: 'APPID-871198',
    source: 'servicenow_incidents',
    source_label: 'ServiceNow',
    record_id: 'INC0092301',
    title: 'SEV3 — TruView Web BFF Redis session cache invalidation race condition causing stale account data',
    text: `INCIDENT: INC0092301
Severity: SEV3
State: In Progress
Application: TruView Web (APPID-871198)
Opened: 2025-03-04T07:12:00Z (approximately 3 hours ago)
Assigned To: Web Platform Team
Priority: 3 - Medium
Business Impact: ~8% of authenticated Web sessions seeing stale account balances and transaction data after login

SUMMARY:
Approximately 8% of TruView Web sessions are receiving stale account balance and transaction data immediately after logging in. Affected users see balances that do not reflect recent transactions (lag of up to 300 seconds / 5 minutes). The issue was introduced by the truview-web-bff v3.9.0 deployment (CHG0104601, deployed 2025-03-03T08:00:00Z). Root cause analysis has confirmed that the removal of the legacy-correlation-header middleware in CHG0104601 unintentionally removed the X-Cache-Bust: session-init header that was injected into all /api/v2/accounts/summary requests immediately after session establishment. This header was consumed by the BFF Redis cache layer to trigger a mandatory TTL refresh on first load, ensuring fresh data on login. Without this header, the Redis cache serves the previously cached account summary (TTL: 300 seconds) to the new session.

IMPACT:
- Affected users: approximately 8% of new login sessions — calculated at 14,400 sessions over the past 3 hours based on daily average of 180,000 sessions/day
- Symptom: Account Overview page shows balance and recent transactions as of up to 5 minutes before login — not current
- Users who notice stale data typically refresh the page, which hits the BFF after Redis TTL expires naturally — second load is correct
- No data corruption or incorrect write operations — read-only impact (stale display only)
- Financial risk: customers making payment decisions based on stale balances — escalated to Web EM (James Blackwood) for business risk assessment
- No SLO breach on availability or latency SLOs — HTTP 200 responses are being returned; data is simply stale

TIMELINE:
- 2025-03-03T08:00:00Z: CHG0104601 deployed — truview-web-bff v3.9.0 — middleware removal (legacy-correlation-header, request-id-echo, deprecated-session-validator)
- 2025-03-04T06:58:00Z: First customer complaint received via Zendesk: "My balance shows the wrong amount when I log in"
- 2025-03-04T07:05:00Z: Web Platform Team engineer (Claire Watts) begins investigation
- 2025-03-04T07:12:00Z: INC0092301 opened — SEV3
- 2025-03-04T07:34:00Z: Redis cache hit rate drop confirmed in Dynatrace BFF dashboard — cache hit rate degraded from 93% baseline to 71% (elevated cache misses on new session establishment)
- 2025-03-04T07:55:00Z: Code review of CHG0104601 diff identifies removal of X-Cache-Bust header injection in legacy-correlation-header middleware
- 2025-03-04T08:20:00Z: Root cause confirmed — CHG0104601 middleware removal inadvertently removed cache-bust behaviour on session init
- 2025-03-04T08:45:00Z: Workaround applied to 2 of 4 BFF pods (rolling restart clears in-memory cache state temporarily — reduces stale window for affected pods)
- 2025-03-04T09:15:00Z: Web Platform Team developing targeted fix — re-implement cache-bust on session establishment without re-introducing deprecated middleware
- 2025-03-04T10:00:00Z: Fix in code review — target deployment during tonight's maintenance window (22:00 AEDT) pending CAB approval

ROOT CAUSE:
The X-Cache-Bust: session-init header was injected by the legacy-correlation-header middleware on all requests where a new session token was detected. This header was consumed by the BFF's Redis cache module (packages/cache/src/redisCache.js) to call cache.del() on the accounts:summary:{userId} key before population, ensuring the first authenticated request always fetched fresh data from account-service. The middleware was removed in CHG0104601 as it was categorised as "legacy" without documentation of this secondary behaviour. The X-Cache-Bust consumer in redisCache.js was not removed — it remains in place but never receives the triggering header.

WORKAROUND:
1. Rolling restart of truview-web-bff pods clears all in-memory cache state and evicts Redis keys for active connections. Stale data window is reduced to 0 for ~10 minutes post-restart before cache repopulates.
   kubectl rollout restart deployment/truview-web-bff -n truview-web
   Note: This is temporary — cache repopulates within 5 minutes and stale login issue recurs.
2. Users can be advised to wait 5 minutes after login or manually refresh the Account Overview page.
3. Customer service team briefed — Zendesk macro ZD-MACRO-4421 created for handling customer contacts.

FIX IN PROGRESS:
Targeted fix: inject X-Cache-Bust: session-init behaviour directly in the session validation middleware (session-validator.js) without reinstating the removed middleware chain. PR #web-bff-1874 in code review. Target deployment: tonight maintenance window 22:00 AEDT (CHG0105012-related window).

ESCALATION:
- Escalated to James Blackwood (Web EM) at 08:30 — acknowledged, not requesting SEV escalation at this time
- Marcus Okonkwo (SRE Lead) aware — monitoring
- Sarah Kimberley (Head of Platform) briefed by James Blackwood at 09:00

CORRELATION: CHG0104601 (truview-web-bff v3.9.0 middleware removal, deployed 2025-03-03T08:00:00Z)
RELATED PROBLEMS: PRB0012589 (Redis cache stampede — separate issue, same Redis tier)`,
    tags: ['incident', 'sev3', 'truview-web', 'tier1', 'redis', 'cache', 'stale-data', 'session', 'bff', 'in-progress', 'chg0104601'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-04T10:00:00Z',
    ingest_ts: '2025-03-04T10:02:00Z',
    ttl_hours: 1,
    meta: { severity: 'SEV3', state: 'In Progress', assigned_to: 'Web Platform Team', correlation: 'CHG0104601' }
  },

  {
    id: 'sn_inc_005',
    appid: 'APPID-871204',
    source: 'servicenow_incidents',
    source_label: 'ServiceNow',
    record_id: 'INC0092418',
    title: 'SEV3 — TruView Mobile Android FCM device token registration failures — 429 rate limiting on token-refresh endpoint',
    text: `INCIDENT: INC0092418
Severity: SEV3
State: In Progress
Application: TruView Mobile (APPID-871204)
Opened: 2025-03-04T09:02:00Z (approximately 1 hour ago)
Assigned To: Mobile Platform Team
Priority: 3 - Medium
Business Impact: ~6% of Android devices (approximately 34,000 devices) failing to register or refresh FCM device tokens; affected users are not receiving push notifications correctly

SUMMARY:
Approximately 6% of active Android devices are failing to complete FCM (Firebase Cloud Messaging) device token registration or refresh operations after app resume from background. Firebase console reports 34,000 device tokens flagged as "stale" (last successful registration >24 hours ago). Affected Android users have not received push notifications (balance alerts, transaction confirmations, payment reminders) since the token refresh failure began. Root cause has been identified as the Mule API Gateway rate limit policy (CHG0104333, deployed 2025-02-28) incorrectly applying its SLA rate limit policy to the internal endpoint /api/mobile/devices/token-refresh. This endpoint was not explicitly excluded from the rate limit policy scope when CHG0104333 was implemented.

IMPACT:
- Affected devices: approximately 34,000 Android devices with stale FCM tokens (Firebase console: Messaging > Tokens > Stale count)
- Symptom: Android users miss push notifications for balance threshold alerts, transaction confirmations, and payment reminders
- iOS devices: unaffected — iOS uses a separate APNs token registration path (/api/mobile/apns/token-register) which is already excluded from rate limit policy
- Push notification delivery rate for Android: degraded from 99.2% to 93.4% over past 24 hours
- SLO impact: SLO-TRUVIEW-MOBILE-PUSH currently at 96.2% combined (iOS also degraded due to INC0091205) — well below 98% target
- No financial transaction impact — payment processing and balance reads are unaffected
- Customer experience: silent degradation — customers do not receive an error, they simply stop receiving notifications

TIMELINE:
- 2025-02-28T04:00:00Z: CHG0104333 deployed — Mule API Gateway rate limit policy update (200 RPS → 500 RPS for internal endpoints)
- 2025-03-03T~09:00:00Z: FCM token staleness begins accumulating — not immediately noticed as Android push delivery degrades gradually
- 2025-03-04T08:45:00Z: Firebase console automated alert: "Stale token count exceeded 30,000 threshold" — alert to t.vance@truebank.com.au
- 2025-03-04T08:55:00Z: Thomas Vance (Mobile EM) begins investigation — reviews BFF logs
- 2025-03-04T09:02:00Z: INC0092418 opened
- 2025-03-04T09:18:00Z: BFF logs confirm 429 Too Many Requests responses on POST /api/mobile/devices/token-refresh — rate: ~85 errors/minute at peak morning session resume
- 2025-03-04T09:25:00Z: Mule API Gateway logs confirm rate limit policy applying to /api/mobile/devices/* paths — not excluded from CHG0104333 scope
- 2025-03-04T09:35:00Z: Root cause confirmed — CHG0104333 rate limit policy scope too broad; /api/mobile/devices/* paths should be exempt (internal device management, not customer data API)
- 2025-03-04T09:42:00Z: Fix identified — add path exclusion /api/mobile/devices/* to rate limit policy in Mule API Gateway config
- 2025-03-04T09:55:00Z: CHG0105012 raised for tonight's maintenance window (22:00 AEDT) — CAB submission in progress

ROOT CAUSE:
The CHG0104333 Mule API Gateway rate limit policy update applied a blanket rate limit of 500 RPS to all paths under /api/mobile/*. The intent was to rate-limit external-facing customer API endpoints to prevent abuse. However, the policy was applied without explicit path exclusions for internal device management endpoints. The /api/mobile/devices/token-refresh endpoint is called by the mobile app on every app resume from background (iOS and Android), generating a burst of 80-150 RPS during morning peak session resume (07:00-09:00 EST). Android devices use this endpoint exclusively for FCM token management; when the endpoint returns 429, the mobile app silently fails the token refresh (no retry logic implemented — see PRB0012632 for related mobile error handling gaps).

The FCM token staleness accumulates over time as tokens are not refreshed. Google FCM automatically expires tokens after 270 days of inactivity, but TrueBank's push platform marks tokens as stale after 48 hours without refresh for security hygiene.

WORKAROUND:
No immediate self-service workaround available for affected devices. Mobile app must successfully call /api/mobile/devices/token-refresh — only possible once rate limit exclusion is deployed.
Interim measures:
1. Mobile Platform Team: manually pushed token re-registration event to 34,000 affected devices via Firebase Admin SDK batch operation (in progress as of 09:55 — expected to complete in 4 hours)
2. Mule API Gateway admin: temporarily increased rate limit on /api/mobile/devices/* to 2,000 RPS via emergency config patch — applied 09:58 as bridge until CHG0105012 is deployed
3. Monitoring: Firebase console refresh every 15 minutes to track stale token count recovery

FIX:
CHG0105012 (Normal Change) raised — excludes /api/mobile/devices/* paths from Mule rate limit policy. Scheduled for 22:00 AEDT maintenance window tonight. CAB submission at 10:00 AEDT — expedited review requested given SLO breach context (INC0091205 + INC0092418 combined push SLO at 96.2%).

ESCALATION:
- Thomas Vance (Mobile EM) owns this incident
- Marcus Okonkwo (SRE Lead) aware — monitoring combined push SLO impact
- Sarah Kimberley briefed on combined push SLO breach (INC0091205 + INC0092418)

CORRELATION: CHG0104333 (Mule API Gateway rate limit increase, deployed 2025-02-28T04:00:00Z)
RELATED INCIDENTS: INC0091205 (iOS push failures — separate root cause, concurrent SLO impact)`,
    tags: ['incident', 'sev3', 'truview-mobile', 'tier1', 'android', 'fcm', 'push-notification', 'token-refresh', 'rate-limit', 'mule', 'in-progress', 'chg0104333'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-04T10:00:00Z',
    ingest_ts: '2025-03-04T10:02:00Z',
    ttl_hours: 1,
    meta: { severity: 'SEV3', state: 'In Progress', assigned_to: 'Mobile Platform Team', correlation: 'CHG0104333' }
  },

  // ─── ADDITIONAL CHANGE RECORDS ──────────────────────────────────────────────

  {
    id: 'sn_chg_006',
    appid: 'APPID-871198',
    source: 'servicenow_changes',
    source_label: 'ServiceNow',
    record_id: 'CHG0104980',
    title: 'Standard Change — TruView Web React SPA v5.12.0 — bundle size optimisation and lazy loading',
    text: `CHANGE RECORD: CHG0104980
Type: Standard Change
Application: TruView Web (APPID-871198)
State: Successful — Closed
Deployed: 2025-03-03T10:00:00Z (Monday 20:00 AEDT)
Change Owner: Web Platform Team
Change Implementer: James Blackwood (j.blackwood@truebank.com.au)
Risk Level: Low
Change Advisory Board Approval: Pre-approved (Standard Change template SCTMPL-0039 — Frontend SPA deployment)

CHANGE SUMMARY:
TruView Web React SPA version upgrade from v5.11.2 to v5.12.0. Primary change: bundle size optimisation via code splitting and lazy loading of the Transaction History module. The Transaction History module was previously bundled in the main application chunk, contributing ~142KB (gzipped) to the initial bundle. With route-based lazy loading via React.lazy() and Webpack 5 dynamic imports, the Transaction History module now loads on-demand only when the user navigates to the Transactions screen.

CHANGE DETAILS:
- Application: TruView Web SPA (React 18, Webpack 5)
- Version: v5.11.2 → v5.12.0
- Deployment pipeline: PIPE-4820-WEB (see CI/CD records)
- Git commit: e8a2f94c3b71d5e9a1f84c2d06e7b3a5c9d1f820
- Changes implemented:
  1. Transaction History module refactored to lazy-loaded route chunk (src/features/transactions/index.lazy.tsx)
  2. Payments module refactored to lazy-loaded route chunk (src/features/payments/index.lazy.tsx)
  3. React.lazy() + Suspense wrappers added to Router configuration (src/App.tsx)
  4. Webpack 5 chunk naming configured for cache-friendly hashed filenames
  5. Loading skeleton component added for Suspense fallback on transaction and payments screens
- Bundle size before: 340KB gzipped (main chunk, including all features)
- Bundle size after: 198KB gzipped (initial bundle, main + accounts features only)
  - transactions.[hash].js lazy chunk: 45KB gzipped
  - payments.[hash].js lazy chunk: 38KB gzipped
- Total bytes served on first load: reduced by 142KB (42% reduction)

PERFORMANCE IMPACT (MEASURED):
- Dynatrace RUM (Real User Monitoring) — 24h post-deployment comparison:
  - LCP (Largest Contentful Paint): 1.92s → 1.71s (improvement of 220ms, ~11.5%)
  - FCP (First Contentful Paint): 1.45s → 1.28s (improvement of 170ms)
  - Initial bundle transfer time (p50): 680ms → 395ms on 4G mobile connection
- Performance budget compliance: initial bundle 198KB < 200KB budget (CI bundle-analyzer enforced)
- No regression on Transaction History page load — lazy chunk loads in 85ms p50 on subsequent visit (CloudFront cached)

IMPLEMENTATION STEPS:
1. Webpack 5 build executed with production optimisation (PIPE-4820-WEB stage 1)
2. Unit tests (Jest): 312 tests — 0 failures
3. E2E tests (Playwright, 48 scenarios): PASSED — includes Transaction History navigation scenarios verifying lazy loading works correctly
4. Bundle analysis: 198KB confirmed
5. S3 sync: all assets uploaded with content-hash filenames (max-age 31536000 / 1 year cache headers)
6. S3 index.html: uploaded with Cache-Control: no-cache, no-store
7. CloudFront cache invalidation: aws cloudfront create-invalidation --distribution-id E1K9ABCDEF --paths "/*" — completed in 47 seconds (all edge locations)

POST-IMPLEMENTATION VALIDATION:
- CloudFront X-Cache: Hit from cloudfront confirmed on asset requests
- index.html: no-cache confirmed via response headers
- Dynatrace RUM LCP improvement confirmed at T+2h: 1.71s (target SLO: <2.5s) ✓
- No new incidents or customer complaints post-deployment ✓
- SLO-TRUVIEW-WEB-LCP: healthy, error budget increased

ROLLBACK PROCEDURE:
S3 sync previous version assets + CloudFront invalidation. Previous SPA version (v5.11.2) assets retained in S3 with /previous/ prefix for 14-day rollback window. Rollback time estimated: 3 minutes.

POST-IMPLEMENTATION STATUS: Successful. Closed 2025-03-03T12:30:00Z. No correlated incidents.`,
    tags: ['change', 'standard', 'truview-web', 'react', 'spa', 'bundle-optimisation', 'lazy-loading', 'webpack', 'cloudfront', 'successful', 'recent', 'performance'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-03T12:30:00Z',
    ingest_ts: '2025-03-04T02:15:00Z',
    ttl_hours: 48,
    meta: { change_type: 'Standard', state: 'Successful', risk: 'Low', deployed: '2025-03-03T10:00:00Z', implementer: 'j.blackwood' }
  },

  {
    id: 'sn_chg_007',
    appid: 'APPID-871204',
    source: 'servicenow_changes',
    source_label: 'ServiceNow',
    record_id: 'CHG0105012',
    title: 'Normal Change — TruView Mobile BFF Mule rate limit policy exclusion for device management endpoints',
    text: `CHANGE RECORD: CHG0105012
Type: Normal Change
Application: TruView Mobile (APPID-871204)
State: Approved — Scheduled
Scheduled Deployment: 2025-03-04T12:00:00Z (tonight 22:00 AEDT)
Change Owner: Mobile Platform Team
Change Implementer: Thomas Vance (t.vance@truebank.com.au)
Risk Level: Low
Change Advisory Board Approval: Approved 2025-03-04T13:30:00Z (CAB expedited review — INC0092418 SLO breach context)

CHANGE SUMMARY:
Mule API Gateway policy update to exclude TruView Mobile device management API paths (/api/mobile/devices/*) from the SLA rate limit policy applied in CHG0104333. The rate limit policy currently applies to all /api/mobile/* paths, which incorrectly rate-limits the FCM device token refresh endpoint. This change is a targeted fix for INC0092418 (Android FCM device token registration failures).

BUSINESS JUSTIFICATION:
INC0092418 (SEV3, active) — 34,000 Android devices have stale FCM tokens due to /api/mobile/devices/token-refresh returning 429 Too Many Requests. Combined with INC0091205 (iOS push failures), TruView Mobile push notification SLO is at 96.2% vs 98% target. CAB expedited review approved given SLO breach impact on mobile push reliability.

CHANGE DETAILS:
- Gateway: prod-mule-apigw-01 (Mule API Gateway, shared bank-wide deployment)
- Policy: rate-limit-sla-policy v3.2.1 (same version — configuration change only)
- Current policy scope: all paths matching /api/mobile/* — applies 500 RPS limit per authenticated consumer
- Updated policy scope: all paths matching /api/mobile/* EXCEPT /api/mobile/devices/*
- Paths excluded from rate limiting:
  - /api/mobile/devices/token-refresh (FCM/APNs token registration)
  - /api/mobile/devices/register (new device registration)
  - /api/mobile/devices/deregister (device removal on logout)
  - /api/mobile/devices/preferences (push notification preferences)
- Rationale for exclusion: device management endpoints are internal operational calls initiated by the mobile app on every session resume — they do not expose customer data and their volume is proportional to active session count, not to per-user API usage. Rate limiting these endpoints provides no abuse protection benefit and introduces outage risk.

IMPLEMENTATION STEPS:
1. Mobile Platform Team to update Mule policy configuration file: truview-mobile-api-policy.xml (path exclusions added to rate-limit-sla-policy section)
2. Configuration pushed to Mule deployment pipeline (PIPE-mule-policy-update)
3. Mule API Gateway hot-reload of policy configuration (no service restart required — Mule policy hot-reload supported)
4. Post-deployment validation:
   a. POST /api/mobile/devices/token-refresh — confirm HTTP 200 (not 429)
   b. POST /api/mobile/v2/accounts/summary — confirm rate limit still applying (returns 429 at >500 RPS on test harness)
   c. Firebase console stale token count — monitor reduction over 1 hour

RISK ASSESSMENT:
- Risk: Low
- Removing rate limit on device management endpoints does not expose customer financial data APIs
- These endpoints use JWT authentication — unauthenticated calls still rejected at auth layer
- Volume of device management calls is bounded by active session count (~420,000 sessions/day, not adversarially scalable)
- Rollback: Mule policy hot-reload of previous config takes <2 minutes

ROLLBACK PROCEDURE:
1. Revert truview-mobile-api-policy.xml to previous version in GitLab
2. Trigger Mule policy hot-reload pipeline
3. Estimated rollback time: 3 minutes

POST-IMPLEMENTATION VALIDATION:
- INC0092418 resolution: monitor Firebase console stale token count for 1 hour post-deployment
- Target: stale token count declining from 34,000 — full recovery expected within 4-6 hours as devices resume sessions
- Alert: if stale token count does not decline within 1 hour, trigger rollback and escalate to Platform Engineering

CORRELATION: INC0092418 (Android FCM token failures), CHG0104333 (original rate limit change)`,
    tags: ['change', 'normal', 'truview-mobile', 'mule', 'api-gateway', 'rate-limit', 'fcm', 'device-management', 'scheduled', 'cab-approved', 'fix-for-inc0092418'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-04T13:30:00Z',
    ingest_ts: '2025-03-04T14:00:00Z',
    ttl_hours: 8,
    meta: { change_type: 'Normal', state: 'Approved — Scheduled', risk: 'Low', scheduled: '2025-03-04T12:00:00Z', implementer: 't.vance' }
  },

  {
    id: 'sn_chg_008',
    appid: 'APPID-973193',
    source: 'servicenow_changes',
    source_label: 'ServiceNow',
    record_id: 'CHG0104711',
    title: 'Standard Change — TruView Core transaction-service Elasticsearch composite index optimisation',
    text: `CHANGE RECORD: CHG0104711
Type: Standard Change
Application: TruView Core (APPID-973193) — transaction-service
State: Successful — Closed
Deployed: 2025-02-25T19:00:00Z (last Tuesday 05:00 AEDT maintenance window)
Change Owner: Platform Engineering
Risk Level: Medium
Change Advisory Board Approval: Pre-approved (Standard Change template SCTMPL-0051 — Elasticsearch index optimisation)

CHANGE SUMMARY:
Elasticsearch index optimisation for the TruView Core transaction-service. Two composite indexes added to the truview-transactions-v3 index: (1) composite index on (accountId, timestamp) for account-scoped transaction list queries, and (2) composite index on (merchantCategory, timestamp) for the new spend analytics feature (APPID-871198 Insights tab). Deployed via zero-downtime index alias swap.

CHANGE DETAILS:
- Service: transaction-service (TruView Core, APPID-973193)
- Elasticsearch cluster: prod-es-truview-01 (AWS OpenSearch Service, 3 data nodes, r6g.xlarge.search)
- Existing index: truview-transactions-v3 (28GB, 140M documents)
- New index: truview-transactions-v4 (reindexed with composite indexes)

INDEXES ADDED:
1. Composite index: (accountId: keyword, timestamp: date) — DESC order on timestamp
   - Query pattern targeted: GET /v2/transactions?accountId={id}&limit=50&sort=desc
   - Pre-optimisation: p95 query time 380ms (full scan with sort on 140M documents)
   - Post-optimisation: p95 query time 95ms (index seek on 28GB subset)
2. Composite index: (merchantCategory: keyword, timestamp: date)
   - Query pattern targeted: GET /v2/transactions/analytics?merchantCategory={cat}&dateFrom={d}&dateTo={d}
   - New endpoint supporting Insights tab (launched Web SPA v5.11.0)
   - Pre-optimisation: p95 query time 520ms
   - Post-optimisation: p95 query time 110ms

IMPLEMENTATION STEPS (zero-downtime index alias swap):
1. Tuesday 05:00 AEDT: Created new index truview-transactions-v4 with optimised mappings
2. 05:15: Started Elasticsearch reindex API call: POST /_reindex (source: truview-transactions-v3, dest: truview-transactions-v4)
   - Reindex duration: 2 hours 28 minutes (140M documents at ~15,700 docs/sec)
3. 07:43: Reindex complete — validated document count: v3=140,221,845, v4=140,221,845 ✓
4. 07:45: Validated composite indexes built correctly (GET /truview-transactions-v4/_stats)
5. 07:48: Switched Elasticsearch alias: DELETE transactions_alias → truview-transactions-v3; POST /_aliases {"actions": [{"add": {"index": "truview-transactions-v4", "alias": "transactions_alias"}}]}
   - Alias switch is atomic — zero downtime
6. 07:49: Post-swap smoke test via transaction-service /health/es endpoint: HTTP 200 ✓
7. 07:52: Dynatrace: transaction-service Elasticsearch p95 dropped from 380ms to 95ms ✓
8. 08:00: Old index truview-transactions-v3 archived (read-only snapshot to S3, retained 30 days)

POST-IMPLEMENTATION VALIDATION:
- transaction-service /v2/transactions p95 latency: 95ms (target <400ms) ✓
- transaction-service /v2/transactions/analytics p95: 110ms (new endpoint) ✓
- Elasticsearch cluster health: green ✓
- Shard distribution: balanced across 3 data nodes ✓
- No consumer impact during reindex (old alias served queries throughout) ✓

POST-IMPLEMENTATION STATUS: Successful. Closed 2025-02-25T09:00:00Z. No incidents correlated.

RELATED: This optimisation directly supports the Web SPA Insights tab launched in v5.11.0 (CHG0104590) and reduces transaction search latency below the SLO target of p95 <400ms.`,
    tags: ['change', 'standard', 'truview-core', 'transaction-service', 'elasticsearch', 'opensearch', 'index', 'optimisation', 'zero-downtime', 'successful', 'recent'],
    classification: 'INTERNAL',
    freshness_ts: '2025-02-25T09:00:00Z',
    ingest_ts: '2025-03-04T02:15:00Z',
    ttl_hours: 72,
    meta: { change_type: 'Standard', state: 'Successful', risk: 'Medium', deployed: '2025-02-25T19:00:00Z' }
  },

  // ─── ADDITIONAL PROBLEM RECORDS ─────────────────────────────────────────────

  {
    id: 'sn_prb_002',
    appid: 'APPID-871198',
    source: 'servicenow_problems',
    source_label: 'ServiceNow',
    record_id: 'PRB0012589',
    title: 'Known Error — TruView Web BFF Redis cache stampede under peak load (>340 RPS)',
    text: `PROBLEM RECORD: PRB0012589
State: Known Error
Application: TruView Web (APPID-871198) — truview-web-bff
Problem Manager: Web Platform Team
Assigned To: Web Platform Team (Engineering Manager: James Blackwood)
Opened: 2025-02-18T09:00:00Z
Last Updated: 2025-03-03T16:00:00Z

PROBLEM STATEMENT:
During peak load periods when the truview-web-bff processes >340 RPS (observed during 09:00–11:00 EST business banking peak), a cache stampede pattern occurs on the Redis cache layer for the /api/v2/accounts/summary endpoint. When a Redis cache key for accounts:summary:{userId} expires or is evicted under memory pressure, multiple concurrent BFF pod instances (4 replicas) simultaneously detect a cache miss on the same key and all initiate upstream calls to account-service to repopulate the cache. This causes a brief but severe spike in account-service request rate, temporarily overwhelming the account-service connection pool (PRB0012441) and generating a secondary 503 spike for affected users.

KNOWN ERROR STATUS:
Root cause is fully identified. A permanent fix is in development (BFF v3.10.0). Workaround in place.

ROOT CAUSE ANALYSIS:
The truview-web-bff Redis cache implementation (packages/cache/src/redisCache.js) uses a simple cache-aside pattern with no coordination between BFF pod replicas. When a cache key expires:
1. Pod A (acct-summary request): cache miss detected → initiates GET /v2/accounts/{id} to account-service
2. Pod B (concurrent request for same userId, different connection): cache miss detected (same key not yet repopulated) → initiates second GET /v2/accounts/{id} to account-service
3. Pod C, Pod D: same — 4 simultaneous calls to account-service for the same account
This is the classic "thundering herd" / cache stampede pattern. Under 340 RPS with 4 BFF replicas, at peak cache expiry volume (~500 keys expiring per second at TTL=300s), account-service receives bursts of up to 500 additional RPS above baseline (from 340 to 840 RPS) for 1-2 second windows.

IMPACT OBSERVED:
- account-service: burst RPS spikes to 500+ for 1-2 seconds during cache expiry windows
- account-service connection pool exhaustion (PRB0012441): spikes trigger pool saturation → HTTP 503 on 2-4% of concurrent requests during spike window
- TruView Web: ~2-4% of /api/v2/accounts/summary requests return 503 during peak windows (lasting 1-3 seconds)
- Frequency: 3-5 stampede events per peak hour
- Dynatrace: visible as periodic 503 spikes on account-service (P-3854 Dynatrace alert history)

WORKAROUND (currently active):
1. Redis cache TTL on account summary keys extended from 300 seconds to 600 seconds during peak window (reduces expiry event frequency by 50%). Implemented via BFF config REDIS_ACCOUNT_SUMMARY_TTL_SECONDS=600 environment variable.
   - Trade-off: balance data up to 10 minutes stale at worst case (was 5 minutes)
   - Applied by: m.okonkwo@truebank.com.au on 2025-02-20
2. Account-service HPA pre-scaled before 07:00 EST to 8 replicas (reduces per-pod load during stampede events)
   - Pre-scaling runbook: KB0034512 (workaround section)

PERMANENT FIX:
Implement probabilistic cache refresh (PER — Probabilistic Early Recomputation) in truview-web-bff v3.10.0:
- PER algorithm: before a cache key expires, introduce a probabilistic early-recomputation based on time-to-live remaining and a tuning constant (beta)
- Each BFF pod independently decides whether to recompute based on: P(recompute) = 1 if currentTime + beta * GAP * log(rand()) >= expiry_time
- This eliminates coordinated cache miss — only one pod recomputes at a time, staggered across expiry window
- Additionally: implement Redis SET NX (set-if-not-exists) mutex lock on cache population to prevent concurrent repopulation even if PER is bypassed
- Planned release: v3.10.0, Q2 2025 (target April release — pending Web Platform capacity post-compliance feature work)

RELATED INCIDENTS:
- INC0088719 (504 timeouts on accounts/summary — partially caused by stampede events)
- INC0092301 (active — cache invalidation race condition — related to Redis layer, separate root cause)

RELATED PROBLEMS:
- PRB0012441 (account-service connection pool exhaustion — exacerbated by stampede RPS spikes)`,
    tags: ['problem', 'known-error', 'truview-web', 'bff', 'redis', 'cache-stampede', 'thundering-herd', 'account-service', 'workaround', 'performance'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-03T16:00:00Z',
    ingest_ts: '2025-03-04T02:15:00Z',
    ttl_hours: 72,
    meta: { problem_state: 'Known Error', assigned_to: 'Web Platform Team', workaround: 'Redis TTL extension + HPA pre-scale', fix_version: 'BFF v3.10.0' }
  },

  {
    id: 'sn_prb_003',
    appid: 'APPID-871204',
    source: 'servicenow_problems',
    source_label: 'ServiceNow',
    record_id: 'PRB0012632',
    title: 'Known Error — TruView Mobile iOS biometric authentication silent failure on first attempt (iOS 16.x)',
    text: `PROBLEM RECORD: PRB0012632
State: Known Error
Application: TruView Mobile (APPID-871204) — iOS Native App
Problem Manager: Mobile Platform Team
Assigned To: Mobile Platform Team (Engineering Manager: Thomas Vance)
Opened: 2025-02-05T10:00:00Z
Last Updated: 2025-03-01T11:00:00Z

PROBLEM STATEMENT:
On iOS 16.x devices (iOS 16.0 through 16.7.x), TruView Mobile Face ID and Touch ID authentication silently fails on the first biometric authentication attempt when the app is transitioning from background to foreground. Users experience a brief biometric prompt that dismisses without completing, then must manually re-tap to authenticate. The second attempt succeeds consistently. This affects approximately 12% of the TruView Mobile iOS user base (iOS 16.x device share), generating significant negative app store reviews (App Store rating dip noted: 3.8 stars for 1-star reviews mentioning "Face ID broken").

KNOWN ERROR STATUS:
Root cause identified. Permanent fix in development (iOS app v4.3.0). Workaround documented in KB-MOB-0061.

ROOT CAUSE ANALYSIS:
iOS 16.x introduced a change in the timing of app lifecycle callbacks, specifically the applicationDidBecomeActive / sceneDidBecomeActive notification sequence. The TruView iOS app initiates LocalAuthentication framework's LAContext.evaluatePolicy() call in response to the UIApplication.didBecomeActiveNotification. On iOS 16.x, this notification fires slightly earlier in the foreground transition sequence than on iOS 15.x, at a point where the UI window hierarchy has not yet fully completed its transition animation. The LAContext evaluation is attempted while the UIWindow is still in a transient state, causing the Face ID / Touch ID prompt to appear and immediately be dismissed by the OS animation framework, reporting an LAError.userCancel error which the app treats as user-initiated cancellation (silent dismissal, no error shown).

This is a known race condition in LAContext usage — documented in Apple Developer Forums thread #12983 and Apple Feedback ID: FB12039284.

iOS 17.x: Apple fixed the lifecycle callback ordering — issue does not reproduce on iOS 17.x or iOS 18.x.

AFFECTED DEVICE BREAKDOWN (from Dynatrace RUM mobile SDK):
- iOS 16.x devices: 12% of TruView Mobile iOS user base (~29,000 daily active users)
- iOS 16.0–16.3.x: 4% of iOS base — worst affected (longest animation transition)
- iOS 16.4–16.7.x: 8% of iOS base — moderately affected
- iOS 17.x+: Not affected
- iOS 15.x: Not affected (smaller population due to upgrade rates)

USER IMPACT:
- Users must attempt biometric authentication twice on every app foreground transition requiring biometric re-auth (high-value transactions >$1,000, pay anyone initiation, settings changes)
- 12% of iOS users affected — significant UX degradation
- No security impact — the second attempt succeeds and authentication is not bypassed
- App Store sentiment: 3.8-star average rating on most recent 30 reviews — 40% mention "Face ID not working on first try"

WORKAROUND (KB-MOB-0061):
Workaround for users: attempt biometric auth twice — second attempt always succeeds.
Developer-side interim fix (not deployed — would require app store review):
- Add 150ms delay before initiating LAContext.evaluatePolicy() in applicationDidBecomeActive callback to allow window hierarchy transition to complete
- This approach is considered a "best effort" workaround — Apple's official guidance is to evaluate LAPolicy in response to a window-level readiness callback rather than application lifecycle callbacks
- NOT deployed because: delay approach is fragile and not aligned with Apple's recommended pattern; proper fix is required (see permanent fix below)

PERMANENT FIX:
TruView iOS v4.3.0 — refactor biometric authentication trigger to use windowScene(_:didUpdate:interfaceOrientation:traitCollection:) callback (iOS 16+) or UIScene.activationState == .foregroundActive guard check before initiating LAContext. This ensures biometric auth is only initiated when the window hierarchy is stable.
- Target release: iOS app v4.3.0 (in development — Mobile Platform Team iOS squad)
- Target completion: Q2 2025 (April sprint, pending App Store review cycle)
- App Store review estimate: 1-3 business days standard review

RELATED DOCUMENTS:
- KB-MOB-0061: Biometric Auth Silent Failure — User-Facing Workaround
- Apple Developer Forums Thread: developer.apple.com/forums/thread/12983
- Apple Feedback: FB12039284 (status: Engineering review — no commitment to backport to iOS 16.x)`,
    tags: ['problem', 'known-error', 'truview-mobile', 'ios', 'biometric', 'face-id', 'touch-id', 'lacontext', 'race-condition', 'ios-16', 'ux-degradation'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-01T11:00:00Z',
    ingest_ts: '2025-03-04T02:15:00Z',
    ttl_hours: 72,
    meta: { problem_state: 'Known Error', assigned_to: 'Mobile Platform Team', workaround: 'KB-MOB-0061', fix_version: 'iOS v4.3.0 Q2 2025' }
  },

];
