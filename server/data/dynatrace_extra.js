// Dynatrace extra synthetic data — additional health snapshots and SLOs for Web and Mobile

export const dynatraceExtra = [

  // ─── HEALTH SNAPSHOTS ─────────────────────────────────────────────────────

  {
    id: 'dyna_health_002',
    appid: 'APPID-871198',
    source: 'dynatrace_health',
    source_label: 'Dynatrace',
    record_id: 'HEALTH-TRUVIEW-WEB-20250304',
    title: 'TruView Web health snapshot — 2025-03-04 10:00 UTC',
    text: `DYNATRACE SERVICE HEALTH SNAPSHOT: TruView Web
Timestamp: 2025-03-04T10:00:00Z
Cluster: prod-eks-web-01 + CloudFront prod-cf-truview-web

SERVICE HEALTH MATRIX:

1. truview-web-bff
   Status: DEGRADED (INC0092301 — Redis cache invalidation race condition)
   Request rate: 290 RPS (baseline 340 RPS — slightly reduced; users refreshing repeatedly on stale data)
   p50 latency: 85ms | p95: 340ms | p99: 780ms (elevated on cache-miss paths — upstream call to account-service)
   Error rate: 0.4% HTTP errors on /api/v2/accounts/summary (HTTP 200 stale data not counted as error)
   Redis cache hit rate: 71% (baseline: 93% — degraded, INC0092301 cause)
   Redis connection pool: 8/20 connections used (healthy)
   Circuit breakers: ALL CLOSED (account-service, transaction-service, auth-adapter all reachable)
   HPA: 4/4 replicas running (within normal range; HPA max: 10)
   Last deployment: 2025-03-03T08:00:00Z (CHG0104601 — v3.9.0)
   Active incidents: INC0092301

2. CloudFront (prod-cf-truview-web, E1K9ABCDEF)
   Status: HEALTHY
   Cache hit rate: 94.2% (for static assets /assets/*)
   Origin request rate (S3): 5.8% of requests
   Edge latency p50: 4ms | p95: 11ms
   Total requests/min: 1,840
   Top edge locations by traffic: Sydney (34%), Melbourne (22%), Singapore (12%), Auckland (8%)
   Last cache invalidation: 2025-03-03T10:14:00Z (PIPE-4820-WEB — SPA v5.12.0 deploy)

3. S3 Frontend Bucket (truebank-truview-web-prod)
   Status: HEALTHY
   Current SPA version: v5.12.0 (deployed Monday CHG0104980)
   Object count: 47 (index.html + hashed asset bundles)
   4xx error rate: 0.01% (expected — some direct S3 URL access attempts)

OVERALL STATUS: MONITORING (INC0092301 active — Redis cache; performance SLOs unaffected)

ACTIVE DYNATRACE ALERTS:
- ALERT-WEB-4412: truview-web-bff Redis cache hit rate below threshold (93% → 71%) — FIRING
- ALERT-WEB-4413: INC0092301 correlation tag applied to BFF service — INFO

RECENTLY RESOLVED:
- P-3854 (RESOLVED 2025-03-03T15:00Z) — accounts/summary latency — resolved via connection pool fix
- ALERT-WEB-4390 (RESOLVED 2025-03-03T10:30Z) — BFF middleware removal post-deploy check — GREEN`,
    tags: ['health-snapshot', 'truview-web', 'bff', 'cloudfront', 'redis', 'cache', 'dynatrace', 'metrics', 'monitoring'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-04T10:00:00Z',
    ingest_ts: '2025-03-04T10:00:00Z',
    ttl_hours: 1,
    meta: { snapshot_time: '2025-03-04T10:00:00Z', cluster: 'prod-eks-web-01', overall_status: 'MONITORING' }
  },

  {
    id: 'dyna_health_003',
    appid: 'APPID-871204',
    source: 'dynatrace_health',
    source_label: 'Dynatrace',
    record_id: 'HEALTH-TRUVIEW-MOBILE-20250304',
    title: 'TruView Mobile health snapshot — 2025-03-04 10:00 UTC',
    text: `DYNATRACE SERVICE HEALTH SNAPSHOT: TruView Mobile
Timestamp: 2025-03-04T10:00:00Z
Cluster: prod-eks-mobile-01

SERVICE HEALTH MATRIX:

1. truview-mobile-bff
   Status: DEGRADED (INC0092418 — Android FCM token registration 429 errors)
   Request rate: 520 RPS (below 580 RPS morning peak — peak subsiding at 10:00 UTC)
   p50 latency: 78ms | p95: 220ms | p99: 580ms
   Error rate: 0.3% overall (concentrated on /api/mobile/devices/token-refresh — HTTP 429)
     - /api/mobile/v2/accounts/summary: 0.05% error rate (healthy)
     - /api/mobile/v2/transactions/recent: 0.03% error rate (healthy)
     - /api/mobile/devices/token-refresh: 6.1% error rate (INC0092418 — Mule rate limit)
   Redis cache hit rate: 88% (healthy — mobile TTLs: 120s account, 30s transactions)
   Redis connection pool: 11/20 connections (healthy)
   Circuit breakers:
     - account-service: CLOSED (healthy)
     - transaction-service: CLOSED (healthy)
     - notification-service: HALF-OPEN (recovering post INC0091205 — APNs failures)
   HPA: 5/5 replicas (within normal range; HPA max: 12)
   Last deployment: 2025-03-04T03:15:00Z (PIPE-4756-PROD — notification-service v2.4.1)
   Active incidents: INC0091205 (push), INC0092418 (FCM tokens)

2. notification-service (shared with TruView Core)
   Status: DEGRADED (INC0091205)
   Request rate: 2,400 req/min
   iOS push delivery rate: 88.1% (threshold: 98% — SLO-TRUVIEW-MOBILE-PUSH BREACHED)
   Android FCM delivery rate: 99.8% (healthy)
   APNs connection resets: 340/hour (baseline: <5/hour — INC0091205 root cause)
   Notification retry queue depth: 14,200 messages (growing ~200/min)
   p50: 210ms | p95: 890ms | p99: 2,100ms (elevated — APNs retry loops)
   Rollback pipeline: PIPE-HOTFIX-4756 PENDING CAB approval (expected approval: 30–90 minutes)

3. Push Infrastructure
   Firebase FCM (Android): HEALTHY — 99.8% delivery, 240ms avg delivery latency
   Apple APNs (iOS): DEGRADED — connection pool exhausted per INC0091205/P-3887
     Symptom: 340 APNs connection resets/hour vs baseline <5/hour
     Root cause: firebase-messaging 9.3.2 per-batch connection creation (CHG0104756)
   APNs Certificate (com.truebank.truview.push): VALID (expires 2026-01-15)

OVERALL STATUS: DEGRADED (2 active incidents)

ACTIVE DYNATRACE ALERTS:
- P-3887 (OPEN): HTTP success rate on /api/mobile/push/send — 87.3% (threshold 95%)
- ALERT-MOB-5521 (FIRING): FCM token-refresh endpoint 429 error rate elevated
- SLO-TRUVIEW-MOBILE-PUSH: BREACHED (96.2% vs 98% target)

PEAK TRAFFIC CONTEXT:
Morning peak (07:00–09:00 EST = 22:00–00:00 UTC): 580 RPS, 420K daily active sessions
Evening peak (17:00–19:00 EST): 510 RPS
Current (10:00 UTC): 520 RPS (mid-morning ramp-down)`,
    tags: ['health-snapshot', 'truview-mobile', 'bff', 'push-notification', 'apns', 'fcm', 'dynatrace', 'metrics', 'degraded'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-04T10:00:00Z',
    ingest_ts: '2025-03-04T10:00:00Z',
    ttl_hours: 1,
    meta: { snapshot_time: '2025-03-04T10:00:00Z', cluster: 'prod-eks-mobile-01', overall_status: 'DEGRADED' }
  },

  // ─── ADDITIONAL SLOs ───────────────────────────────────────────────────────

  {
    id: 'dyna_slo_006',
    appid: 'APPID-871198',
    source: 'dynatrace_slo',
    source_label: 'Dynatrace',
    record_id: 'SLO-TRUVIEW-WEB-AVAIL',
    title: 'SLO — TruView Web BFF API Availability — HEALTHY',
    text: `SERVICE LEVEL OBJECTIVE: TruView Web — BFF API Availability
Application: TruView Web (APPID-871198)
SLO ID: SLO-TRUVIEW-WEB-AVAIL
Target: 99.9% BFF API availability (rolling 30 days)
Status: HEALTHY
Current: 99.94% rolling 30 days
Error Budget Remaining: 96% (burned: 4%)
Last Evaluated: 2025-03-04T09:50:00Z

MEASUREMENT:
- Availability = (HTTP 2xx + 3xx + 4xx responses) / total requests × 100
- HTTP 5xx responses count as unavailable
- Stale data (HTTP 200 with cached content) does NOT count as unavailable for this SLO

CURRENT STATUS NOTES:
- INC0092301 (Redis cache invalidation race condition) is active but NOT impacting this SLO
  Reason: BFF is returning HTTP 200 with stale data — clients receive valid responses, just not
  the freshest data. The SLO measures availability (reachability), not data freshness.
- Data freshness is tracked separately via application-level metrics and user experience SLOs
- Last 5xx event: 2025-03-03T11:15:00Z–14:30:00Z (P-3854, legacy-dda-adapter pool contention)
  Impact: 0.06% of budget burned during that 3-hour window

BUDGET BURN HISTORY (last 30 days):
- Week of 2025-03-03: 0.4% budget burned (normal operational traffic, P-3854 spike)
- Week of 2025-02-24: 0.2% burned (no incidents)
- Week of 2025-02-17: 1.1% burned (brief BFF restart after PIPE-4540-WEB failed deploy)
- Week of 2025-02-10: 0.8% burned (Mule API Gateway maintenance window)

DYNATRACE MONITORING:
Dashboard: TruView Web > SLO Overview > BFF Availability
Alert: fires at 99.7% (30-day rolling) — 1 alert in last 90 days`,
    tags: ['slo', 'availability', 'truview-web', 'healthy', 'bff', 'error-budget', 'api'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-04T09:50:00Z',
    ingest_ts: '2025-03-04T09:52:00Z',
    ttl_hours: 2,
    meta: { slo_status: 'HEALTHY', current_value: '99.94%', target: '99.9%', error_budget_remaining: '96%' }
  },

  {
    id: 'dyna_slo_007',
    appid: 'APPID-973193',
    source: 'dynatrace_slo',
    source_label: 'Dynatrace',
    record_id: 'SLO-TRUVIEW-CORE-KAFKA',
    title: 'SLO — TruView Core Kafka MSK Cluster Availability — HEALTHY',
    text: `SERVICE LEVEL OBJECTIVE: TruView Core — Kafka MSK Cluster Availability
Application: TruView Core (APPID-973193)
SLO ID: SLO-TRUVIEW-CORE-KAFKA
Target: 99.99% MSK cluster availability (rolling 30 days)
Status: HEALTHY
Current: 100.00% rolling 30 days
Error Budget Remaining: 100% (burned: 0%)
Last Evaluated: 2025-03-04T09:50:00Z

CLUSTER HEALTH:
- prod-kafka-trueview (AWS MSK): ALL 6 BROKERS ONLINE
- Under-replicated partitions: 0
- Offline partitions: 0
- ISR (In-Sync Replicas): meeting min-ISR of 2 across all topics
- Broker CPU utilisation: 18% average (healthy — headroom available)
- Broker disk utilisation: 34% (7-day retention; adequate capacity)
- Network throughput: 240 MB/s aggregate (capacity: 2 GB/s per broker)

IMPORTANT DISTINCTION:
The active INC0089341 (Kafka consumer lag on acct-sync-processor) is a CONSUMER-side issue,
not a Kafka cluster availability issue. The MSK cluster is fully healthy and producing/delivering
messages normally. The consumer group acct-sync-processor is failing to keep up due to memory
pressure on the consumer pods (root cause: memory leak in application code).

Consumer lag of 47,000 messages on truview-core-account-events does NOT affect this SLO.
Consumer health is tracked separately via Dynatrace custom metrics and INC0089341.

LAST MSK AVAILABILITY EVENT:
2024-11-14: Single broker restart during AWS MSK version upgrade (planned maintenance).
Duration: 3 minutes. No data loss. Replication maintained throughout.
Error budget impact: 0.007% (within budget).

SCHEMA REGISTRY (AWS Glue):
Status: HEALTHY. All schemas accessible. Last schema registration: 2025-02-27T05:00:00Z
(AccountEvent.v3 — post PIPE-4740-PROD fix).`,
    tags: ['slo', 'kafka', 'msk', 'truview-core', 'healthy', 'cluster-availability', 'brokers'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-04T09:50:00Z',
    ingest_ts: '2025-03-04T09:52:00Z',
    ttl_hours: 2,
    meta: { slo_status: 'HEALTHY', current_value: '100%', target: '99.99%', error_budget_remaining: '100%' }
  },

  {
    id: 'dyna_slo_008',
    appid: 'APPID-871198',
    source: 'dynatrace_slo',
    source_label: 'Dynatrace',
    record_id: 'SLO-TRUVIEW-WEB-LATENCY',
    title: 'SLO — TruView Web BFF Latency p95 < 800ms — HEALTHY',
    text: `SERVICE LEVEL OBJECTIVE: TruView Web — BFF API Latency
Application: TruView Web (APPID-871198)
SLO ID: SLO-TRUVIEW-WEB-LATENCY
Target: p95 BFF API latency < 800ms — 99% compliance (rolling 30 days)
Status: HEALTHY
Current: 99.4% compliance (rolling 30 days)
Error Budget Remaining: 60% (burned: 40%)
Last Evaluated: 2025-03-04T09:50:00Z

CURRENT METRICS:
- /api/v2/accounts/summary: p95 = 340ms (within budget, but elevated vs 220ms baseline pre-INC0092301)
  Note: Redis cache misses (INC0092301) cause p95 to spike on cache-miss requests as BFF falls
  through to account-service. Cache hit paths are fast (p95: 85ms).
- /api/v2/transactions: p95 = 195ms (healthy)
- /api/v2/transactions/recent: p95 = 110ms (healthy)
- /api/v2/payments/initiate: p95 = 680ms (within budget — involves fraud evaluation round-trip)

BREACH HISTORY (last 30 days):
- 2025-03-03T11:15–14:30: P-3854 legacy-dda-adapter contention — accounts/summary p95 2,340ms
  Budget burned during 3h window: 0.42%
- 2025-02-14T09:00–11:30: Elasticsearch slow queries on transaction-service (pre-CHG0104711 tuning)
  Budget burned: 0.31%
Total burned: ~0.73% of remaining 1% budget allowance

IMPACT OF CHG0104601 (middleware removal, v3.9.0):
Positive: p50 latency on accounts/summary improved from 97ms to 85ms (+12ms improvement).
Negative: Cache invalidation race condition (INC0092301) causing p99 spikes on cache-miss paths.
Net: SLO remains HEALTHY but error budget burn has slightly increased.

TREND: Budget burn rate 1.4× normal over last 7 days (INC0092301 contribution).
Action: Resolve INC0092301 to return to normal burn rate.`,
    tags: ['slo', 'latency', 'truview-web', 'healthy', 'bff', 'p95', 'error-budget', 'accounts-summary'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-04T09:50:00Z',
    ingest_ts: '2025-03-04T09:52:00Z',
    ttl_hours: 2,
    meta: { slo_status: 'HEALTHY', current_value: '99.4%', target: '99%', error_budget_remaining: '60%' }
  },

];
