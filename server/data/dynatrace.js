// Dynatrace synthetic data — problem events, SLO status, service health

export const dynatraceChunks = [

  // ─── ACTIVE PROBLEM EVENTS ────────────────────────────────────────────────

  {
    id: 'dyna_prob_001',
    appid: 'APPID-973193',
    source: 'dynatrace_problems',
    source_label: 'Dynatrace',
    record_id: 'P-3891',
    title: 'Dynatrace Problem P-3891 — TruView Core Kafka consumer throughput degraded (OPEN)',
    text: `DYNATRACE PROBLEM: P-3891
Status: OPEN
Title: Kafka consumer throughput degraded — acct-sync-processor
Application: TruView Core (APPID-973193)
Opened: 2025-03-04T04:08:00Z (approximately 6 hours ago)
Impact Score: 450 (High)
Affected Entities: acct-sync-processor (Kubernetes workload), truview-core-account-events (Kafka topic)
Correlated ServiceNow Incident: INC0089341

ROOT CAUSE ANALYSIS:
Dynatrace AI (Davis) has identified the following root cause chain:
1. Memory utilisation on acct-sync-processor pods elevated to 94% (baseline: 55–65%, threshold alert: 85%)
2. GC pause frequency increased to 1 pause per 2.2 minutes (baseline: 1 per 45 minutes)
3. GC pause duration averaging 1,100ms (baseline: <100ms)
4. Consumer poll interval exceeding max.poll.interval.ms (30,000ms) during GC pauses
5. Kafka broker marking consumer as failed and triggering consumer group rebalance
6. Consumer group rebalance adds 15–30 seconds of zero-throughput per event
7. Net result: consumer throughput reduced by ~68% from baseline; lag accumulating at 8,000 messages/minute

METRICS AT TIME OF ALERT (2025-03-04T04:08:00Z):
- Consumer throughput: 3,200 messages/min (baseline: 10,000 msg/min)
- Consumer lag on truview-core-account-events: 12,000 messages
- Memory utilisation on acct-sync-processor-7d9f8b-xkp2q: 94%
- GC pause rate: 0.45 pauses/min
- CPU utilisation: 42% (not the constraint)

CURRENT METRICS (2025-03-04T10:00:00Z):
- Consumer lag: 47,000 messages (growing, despite scale-out to 5 replicas)
- Memory utilisation (across 5 pods): 89–94%
- Consumer throughput: 5,100 messages/min (5 replicas vs 3 baseline)
- Lag growth rate: ~3,000 messages/min net accumulation

IMPACT:
- account-service: processing backpressure from lag — contributing to PRB0012441 connection pool exhaustion
- TruView Web /api/v2/accounts/summary: balance data stale 8–12 minutes
- TruView Mobile account summary: balance data delayed
- Fraud Detection: receiving account balance events 8–12 minutes late

DAVIS AI HYPOTHESIS:
Deployment CHG0104892 (memory limit increase 512Mi → 768Mi) delayed OOMKill restart that would have previously cleared the memory leak. The memory leak itself predates CHG0104892 and is the underlying cause. Davis confidence: 78%.`,
    tags: ['dynatrace', 'problem', 'kafka', 'consumer-lag', 'memory', 'truview-core', 'open', 'acct-sync-processor', 'p-3891', 'gc-pause'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-04T09:58:00Z',
    ingest_ts: '2025-03-04T10:00:00Z',
    ttl_hours: 1,
    meta: { problem_status: 'OPEN', impact_score: 450, correlated_inc: 'INC0089341' }
  },

  {
    id: 'dyna_prob_002',
    appid: 'APPID-871204',
    source: 'dynatrace_problems',
    source_label: 'Dynatrace',
    record_id: 'P-3887',
    title: 'Dynatrace Problem P-3887 — TruView Mobile push notification HTTP success rate degraded (OPEN)',
    text: `DYNATRACE PROBLEM: P-3887
Status: OPEN
Title: HTTP success rate on /api/mobile/push/send degraded — 87.3% (threshold: 95%)
Application: TruView Mobile (APPID-871204)
Opened: 2025-03-04T07:58:00Z (approximately 2 hours ago)
Impact Score: 220 (Medium)
Affected Entities: notification-service (Kubernetes workload), /api/mobile/push/send (HTTP service)
Correlated ServiceNow Incident: INC0091205

ROOT CAUSE ANALYSIS:
Dynatrace AI (Davis) has identified:
1. HTTP success rate on /api/mobile/push/send dropped from 99.2% baseline to 87.3%
2. Failing requests returning HTTP 500 with body: {"error": "APNs connection reset", "code": "APNS_CONN_ERR"}
3. APNs outbound connection pool on notification-service showing 340 resets/hour (baseline: <5/hour)
4. Pattern: failures occur exclusively on requests targeting iOS device tokens; Android (FCM) requests unaffected
5. Deployment correlation: notification-service v2.4.1 (CHG0104756) deployed at 03:15 UTC; problem opened at 07:58 UTC (4h43m after deployment — lag due to slow accumulation of APNs connection pool exhaustion)

METRICS:
- /api/mobile/push/send success rate: 87.3% (threshold: 95%)
- APNs connection resets per hour: 340 (baseline: <5)
- iOS push delivery rate: 88.1%
- Android (FCM) push delivery rate: 99.8% (unaffected)
- Notification retry queue depth: 14,200 (growing)

DAVIS AI HYPOTHESIS:
firebase-messaging 9.3.2 (introduced in CHG0104756) changed APNs connection handling from connection reuse to per-batch connection creation. Apple APNs enforces a maximum of 1,000 concurrent connections per certificate. With 420,000 daily active mobile users, the notification-service is exceeding this limit during peak notification dispatch periods. Davis confidence: 91%.`,
    tags: ['dynatrace', 'problem', 'push-notification', 'apns', 'ios', 'truview-mobile', 'open', 'p-3887', 'http-success-rate'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-04T09:55:00Z',
    ingest_ts: '2025-03-04T09:57:00Z',
    ttl_hours: 1,
    meta: { problem_status: 'OPEN', impact_score: 220, correlated_inc: 'INC0091205' }
  },

  {
    id: 'dyna_prob_003',
    appid: 'APPID-871198',
    source: 'dynatrace_problems',
    source_label: 'Dynatrace',
    record_id: 'P-3854',
    title: 'Dynatrace Problem P-3854 — TruView Web accounts/summary latency elevated (RESOLVED)',
    text: `DYNATRACE PROBLEM: P-3854
Status: RESOLVED
Title: Response time elevated on /api/v2/accounts/summary (p95: 2,340ms, threshold: 1,500ms)
Application: TruView Web (APPID-871198)
Opened: 2025-03-03T11:15:00Z
Resolved: 2025-03-03T12:00:00Z (duration: 45 minutes)
Impact Score: 180 (Medium — resolved)
Correlated ServiceNow Incident: INC0088719

ROOT CAUSE (RESOLVED):
1. p95 latency on /api/v2/accounts/summary elevated to 2,340ms (threshold: 1,500ms)
2. Dynatrace trace analysis: 87% of latency attributed to downstream call truview-web-bff → account-service → legacy-dda-adapter
3. legacy-dda-adapter: connection pool to IBM MQ contending under sustained load
4. IBM MQ connection pool (size: 20) reaching saturation during 09:00–11:00 EST peak window

RESOLUTION:
2025-03-03T13:45:00Z: Platform SRE increased legacy-dda-adapter IBM MQ connection pool from 20 to 35
2025-03-03T14:30:00Z: p95 latency returned to 1,240ms
2025-03-03T15:00:00Z: P-3854 auto-resolved by Dynatrace (threshold compliance restored)

NOTE: INC0088719 remains open in Monitoring state. The 3% 504 error rate on accounts/summary is believed to be secondary impact from INC0089341 (Kafka lag adding load to account-service). P-3854 is resolved but the underlying INC continues monitoring.`,
    tags: ['dynatrace', 'problem', 'accounts-summary', 'latency', 'truview-web', 'resolved', 'p-3854', 'legacy-dda-adapter'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-03T15:00:00Z',
    ingest_ts: '2025-03-04T02:15:00Z',
    ttl_hours: 24,
    meta: { problem_status: 'RESOLVED', impact_score: 180, duration_minutes: 45, correlated_inc: 'INC0088719' }
  },

  // ─── SLO STATUS ───────────────────────────────────────────────────────────

  {
    id: 'dyna_slo_001',
    appid: 'APPID-973193',
    source: 'dynatrace_slo',
    source_label: 'Dynatrace',
    record_id: 'SLO-TRUVIEW-CORE-AVAIL',
    title: 'SLO — TruView Core Availability (99.95% target) — HEALTHY',
    text: `SERVICE LEVEL OBJECTIVE: TruView Core — Availability
Application: TruView Core (APPID-973193)
SLO ID: SLO-TRUVIEW-CORE-AVAIL
Target: 99.95% availability (rolling 30 days)
Status: HEALTHY
Current: 99.97% rolling 30 days
Error Budget Remaining: 82% (burned: 18%)
Last Evaluated: 2025-03-04T09:50:00Z

NOTES:
- Availability calculated as: (successful requests / total requests) × 100
- The active SEV2 incident (INC0089341) is reducing availability but not yet breaching SLO due to partial service degradation (account balance delays, not complete unavailability)
- Error budget consumption rate has increased in last 6 hours due to INC0089341
- At current consumption rate, error budget will be exhausted in approximately 18 days if incident is not resolved
- Monitoring: Dynatrace dashboard TruView Core > SLO Overview`,
    tags: ['slo', 'availability', 'truview-core', 'healthy', '99.97', 'error-budget'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-04T09:50:00Z',
    ingest_ts: '2025-03-04T09:52:00Z',
    ttl_hours: 2,
    meta: { slo_status: 'HEALTHY', current_value: '99.97%', target: '99.95%' }
  },

  {
    id: 'dyna_slo_002',
    appid: 'APPID-973193',
    source: 'dynatrace_slo',
    source_label: 'Dynatrace',
    record_id: 'SLO-TRUVIEW-CORE-LATENCY',
    title: 'SLO — TruView Core Latency p95 < 500ms — AT RISK',
    text: `SERVICE LEVEL OBJECTIVE: TruView Core — Latency
Application: TruView Core (APPID-973193)
SLO ID: SLO-TRUVIEW-CORE-LATENCY
Target: p95 internal API latency < 500ms — 99.5% compliance (rolling 30 days)
Status: AT RISK
Current: 99.2% compliance (threshold: 99.5%)
Error Budget Remaining: 37% (burned: 63%)
Last Evaluated: 2025-03-04T09:50:00Z

BREACH HISTORY (last 7 days):
- 2025-03-04T04:08:00Z – present: account-service latency elevated due to INC0089341 GC pauses
- 2025-03-03T11:15:00Z – 2025-03-03T14:30:00Z: legacy-dda-adapter latency (P-3854, resolved)

NOTES:
- Current p95 on account-service internal APIs: 780ms (threshold: 500ms)
- At current error budget burn rate (1.8× normal), SLO will BREACH within approximately 5 days if INC0089341 is not resolved
- Action required: resolve INC0089341 to restore latency compliance
- Dynatrace alert will fire if SLO drops to 99.0%`,
    tags: ['slo', 'latency', 'truview-core', 'at-risk', 'p95', 'error-budget', 'account-service'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-04T09:50:00Z',
    ingest_ts: '2025-03-04T09:52:00Z',
    ttl_hours: 2,
    meta: { slo_status: 'AT RISK', current_value: '99.2%', target: '99.5%' }
  },

  {
    id: 'dyna_slo_003',
    appid: 'APPID-871198',
    source: 'dynatrace_slo',
    source_label: 'Dynatrace',
    record_id: 'SLO-TRUVIEW-WEB-LCP',
    title: 'SLO — TruView Web Page Load (LCP < 2.5s) — HEALTHY',
    text: `SERVICE LEVEL OBJECTIVE: TruView Web — Page Load Performance
Application: TruView Web (APPID-871198)
SLO ID: SLO-TRUVIEW-WEB-LCP
Target: LCP (Largest Contentful Paint) < 2.5 seconds — 97% compliance
Status: HEALTHY
Current: 97.8% compliance (rolling 30 days)
Error Budget Remaining: 74%
Last Evaluated: 2025-03-04T09:50:00Z

NOTES:
- LCP measured via Dynatrace Real User Monitoring (RUM) on TruView Web SPA
- Healthy despite active INC0088719 — the 504 errors (3% of accounts/summary requests) are not reflected in LCP compliance because LCP measures page render time, not API response completeness
- CHG0104601 (BFF middleware removal, Monday) contributed a ~12ms improvement in BFF response times, visible in LCP trend`,
    tags: ['slo', 'lcp', 'page-load', 'truview-web', 'healthy', 'rum'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-04T09:50:00Z',
    ingest_ts: '2025-03-04T09:52:00Z',
    ttl_hours: 2,
    meta: { slo_status: 'HEALTHY', current_value: '97.8%', target: '97%' }
  },

  {
    id: 'dyna_slo_004',
    appid: 'APPID-871204',
    source: 'dynatrace_slo',
    source_label: 'Dynatrace',
    record_id: 'SLO-TRUVIEW-MOBILE-AVAIL',
    title: 'SLO — TruView Mobile API Availability — HEALTHY',
    text: `SERVICE LEVEL OBJECTIVE: TruView Mobile — API Availability
Application: TruView Mobile (APPID-871204)
SLO ID: SLO-TRUVIEW-MOBILE-AVAIL
Target: 99.9% API availability (rolling 30 days)
Status: HEALTHY
Current: 99.91% rolling 30 days
Error Budget Remaining: 90%
Last Evaluated: 2025-03-04T09:50:00Z

NOTES:
- API availability is measured at the BFF tier (prod-eks-mobile-01)
- The active INC0091205 (push notification failures) does not impact this SLO — push notification delivery is tracked separately in SLO-TRUVIEW-MOBILE-PUSH
- BFF API endpoints serving account and transaction data are unaffected by the push notification issue`,
    tags: ['slo', 'availability', 'truview-mobile', 'healthy', 'api'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-04T09:50:00Z',
    ingest_ts: '2025-03-04T09:52:00Z',
    ttl_hours: 2,
    meta: { slo_status: 'HEALTHY', current_value: '99.91%', target: '99.9%' }
  },

  {
    id: 'dyna_slo_005',
    appid: 'APPID-871204',
    source: 'dynatrace_slo',
    source_label: 'Dynatrace',
    record_id: 'SLO-TRUVIEW-MOBILE-PUSH',
    title: 'SLO — TruView Mobile Push Notification Delivery — BREACHED',
    text: `SERVICE LEVEL OBJECTIVE: TruView Mobile — Push Notification Delivery
Application: TruView Mobile (APPID-871204)
SLO ID: SLO-TRUVIEW-MOBILE-PUSH
Target: 98% push notification delivery rate (rolling 24 hours)
Status: BREACHED
Current: 96.2% rolling 24 hours (threshold: 98%)
Error Budget: EXHAUSTED (0% remaining for this window)
Last Evaluated: 2025-03-04T09:50:00Z

BREACH DETAIL:
- Breach started: 2025-03-04T07:58:00Z (correlated with P-3887 open)
- Current delivery rate: 96.2% (iOS + Android combined)
- iOS delivery rate: 88.1%
- Android delivery rate: 99.8%
- Notifications undelivered in last 24h: approximately 41,300 notifications
- Retry queue depth: 14,200 notifications pending retry

ESCALATION STATUS:
- SLO breach automatically triggered PagerDuty alert to Mobile Platform Team on-call: Thomas Vance
- Business impact notification sent to Head of Mobile: Lena Okafor
- SLO breach report due within 24 hours of resolution per TrueBank SLO policy

NOTE: This SLO is BREACHED due to INC0091205 (CHG0104756 — firebase-messaging 9.3.2 APNs connection handling change). Rollback CHG0104756 is the expected resolution path.`,
    tags: ['slo', 'push-notification', 'truview-mobile', 'breached', 'ios', 'apns', 'delivery-rate', 'slo-breach'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-04T09:50:00Z',
    ingest_ts: '2025-03-04T09:52:00Z',
    ttl_hours: 1,
    meta: { slo_status: 'BREACHED', current_value: '96.2%', target: '98%', error_budget: '0%' }
  },

  // ─── SERVICE HEALTH SNAPSHOTS ─────────────────────────────────────────────

  {
    id: 'dyna_health_001',
    appid: 'APPID-973193',
    source: 'dynatrace_health',
    source_label: 'Dynatrace',
    record_id: 'HEALTH-TRUVIEW-CORE-20250304',
    title: 'TruView Core microservice health snapshot — 2025-03-04 10:00 UTC',
    text: `DYNATRACE SERVICE HEALTH SNAPSHOT: TruView Core
Timestamp: 2025-03-04T10:00:00Z
Cluster: prod-eks-trueview-01

SERVICE HEALTH MATRIX:

1. account-service
   Status: DEGRADED (INC0089341 secondary impact)
   Request rate: 320 RPS (baseline: 290 RPS, elevated due to retry traffic)
   p50 latency: 340ms | p95: 780ms (THRESHOLD BREACH) | p99: 1,450ms
   Error rate: 2.8% (HTTP 503 — pool exhaustion, PRB0012441)
   Pod count: 3/3 Running
   Last deployment: 2025-03-04T03:15:00Z (CHG0104892)
   Memory: 68% avg across pods (healthy — separate from acct-sync-processor)

2. transaction-service
   Status: HEALTHY
   Request rate: 180 RPS
   p50: 95ms | p95: 210ms | p99: 380ms
   Error rate: 0.02%
   Pod count: 3/3 Running
   Last deployment: 2025-02-18T03:00:00Z

3. notification-service
   Status: DEGRADED (INC0091205 — APNs failures)
   Request rate: 2,400 req/min
   p50: 210ms | p95: 890ms | p99: 2,100ms (elevated — APNs retry delays)
   Error rate: 12.7% (iOS APNs only)
   Pod count: 2/2 Running
   Last deployment: 2025-03-04T03:15:00Z (CHG0104756)

4. auth-adapter
   Status: HEALTHY
   Request rate: 520 RPS
   p50: 12ms | p95: 38ms | p99: 65ms
   Error rate: 0.01%
   Pod count: 2/2 Running
   Last deployment: 2025-02-10T22:00:00Z

5. legacy-dda-adapter
   Status: HEALTHY (post P-3854 resolution)
   Request rate: 95 RPS
   p50: 420ms | p95: 780ms | p99: 1,100ms (mainframe-backed — expected higher latency)
   Error rate: 0.4%
   Pod count: 2/2 Running
   IBM MQ connection pool: 22/35 (63% utilisation, healthy post-fix)
   Last deployment: 2025-01-20T03:00:00Z

6. event-router
   Status: HEALTHY
   Kafka throughput: 5,100 events/min (reduced from 10,000/min baseline — acct-sync-processor lag impact)
   p50: 8ms | p95: 22ms | p99: 45ms
   Error rate: 0.01%
   Pod count: 2/2 Running
   Last deployment: 2025-02-01T03:00:00Z (auto-rolled-back from failed deploy 2025-02-27 — see CI/CD records)

7. api-gateway-bridge
   Status: HEALTHY
   Request rate: 890 RPS
   p50: 5ms | p95: 18ms | p99: 35ms
   Error rate: 0.03%
   Pod count: 2/2 Running
   Last deployment: 2025-02-05T03:00:00Z`,
    tags: ['health-snapshot', 'truview-core', 'microservices', 'account-service', 'latency', 'error-rate', 'dynatrace', 'metrics'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-04T10:00:00Z',
    ingest_ts: '2025-03-04T10:00:00Z',
    ttl_hours: 1,
    meta: { snapshot_time: '2025-03-04T10:00:00Z', cluster: 'prod-eks-trueview-01' }
  },

];
