// ServiceNow synthetic data — incidents, changes, CMDB, problems
// All timestamps relative to 2025-03-04T10:00:00Z as "now"

export const servicenowChunks = [

  // ─── ACTIVE INCIDENTS ──────────────────────────────────────────────────────

  {
    id: 'sn_inc_001',
    appid: 'APPID-973193',
    source: 'servicenow_incidents',
    source_label: 'ServiceNow',
    record_id: 'INC0089341',
    title: 'SEV2 — TruView Core Kafka consumer lag spike on account-events topic',
    text: `INCIDENT: INC0089341
Severity: SEV2
State: In Progress
Application: TruView Core (APPID-973193)
Opened: 2025-03-04T04:12:00Z (approximately 6 hours ago)
Assigned To: Platform SRE Team
Priority: 2 - High

SUMMARY:
Kafka consumer group acct-sync-processor is experiencing a significant lag spike on the truview-core-account-events topic. Current consumer lag is 47,000 messages behind the head offset. The consumer group processes account balance update events consumed by the account-service microservice. This lag is causing downstream account balance refresh delays in TruView Web of 8–12 minutes. TruView Mobile account summary is similarly delayed.

IMPACT:
- TruView Web (/api/v2/accounts/summary): Account balance data is stale by 8–12 minutes for active sessions
- TruView Mobile (account summary screen): Balance data delayed, push notifications for balance thresholds delayed
- Fraud Detection Service: Real-time account balance available via separate sync path; partial impact only
- Estimated affected users: ~43,000 active sessions currently showing stale balances

TIMELINE:
- 2025-03-04T04:08:00Z: Dynatrace alert P-3891 triggered — Kafka consumer throughput degraded
- 2025-03-04T04:12:00Z: INC0089341 opened, assigned to Platform SRE Team
- 2025-03-04T04:45:00Z: Confirmed lag started accumulating after 2025-03-04T03:15:00Z deployment window
- 2025-03-04T05:30:00Z: Workaround applied — POST /admin/consumer/reset-offset triggered on acct-sync-processor
- 2025-03-04T05:35:00Z: Lag reduced to 47,000 but not clearing — processor consuming but not keeping up
- 2025-03-04T08:00:00Z: Memory utilisation on consumer pods confirmed at 94% (threshold: 85%)
- 2025-03-04T09:15:00Z: Root cause investigation pointing to memory leak in acct-sync-processor-7d9f8b-xkp2q pod following Wednesday deployment CHG0104892

ROOT CAUSE INVESTIGATION:
Memory utilisation on the acct-sync-processor pod acct-sync-processor-7d9f8b-xkp2q has climbed to 94% since the Wednesday 09:15 deployment (CHG0104892 — Kafka consumer memory limit increase from 512Mi to 768Mi). The increased limit appears to have masked a pre-existing memory leak that is now manifesting. The consumer pod is performing GC pauses every 2–3 minutes, each pause lasting 800–1,200ms, causing the consumer to fall behind.

WORKAROUND:
1. POST /admin/consumer/reset-offset on the account-events processor (applied at 05:30)
2. Increase consumer replicas from 3 to 5: kubectl scale deployment/acct-sync-processor --replicas=5
3. Monitor lag via Dynatrace dashboard: TruView Core > Kafka Consumers

NEXT STEPS:
- Platform Engineering investigating memory leak in consumer code post-CHG0104892
- Consider rolling back CHG0104892 if lag does not clear within 2 hours
- Rollback command: kubectl rollout undo deployment/acct-sync-processor

CORRELATION: CHG0104892 (Kafka consumer memory limit increase, deployed Wednesday 09:15)`,
    tags: ['incident', 'sev2', 'kafka', 'truview-core', 'tier1', 'consumer-lag', 'account-events', 'memory-leak', 'in-progress'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-04T09:55:00Z',
    ingest_ts: '2025-03-04T09:58:00Z',
    ttl_hours: 1,
    meta: { severity: 'SEV2', state: 'In Progress', assigned_to: 'Platform SRE Team', correlation: 'CHG0104892' }
  },

  {
    id: 'sn_inc_002',
    appid: 'APPID-871204',
    source: 'servicenow_incidents',
    source_label: 'ServiceNow',
    record_id: 'INC0091205',
    title: 'SEV3 — TruView Mobile iOS push notification delivery failures',
    text: `INCIDENT: INC0091205
Severity: SEV3
State: In Progress
Application: TruView Mobile (APPID-871204)
Opened: 2025-03-04T08:03:00Z (approximately 2 hours ago)
Assigned To: Mobile Platform Team
Priority: 3 - Medium

SUMMARY:
Push notification delivery failures affecting iOS devices only. Approximately 12% of push notifications are not being delivered. Apple APNs (Apple Push Notification service) gateway is showing elevated connection resets. Android push delivery via Firebase is unaffected. The issue correlates with the TruView Core notification-service v2.4.1 deployment at 09:15 Wednesday (CHG0104756 — iOS push notification library upgrade from firebase-messaging 9.1.0 to 9.3.2).

IMPACT:
- Approximately 12% of iOS push notifications not delivered
- Affected notification types: balance alerts, transaction confirmations, payment reminders
- TruView Mobile daily active sessions: ~420,000; iOS share approximately 58% (~244,000 users)
- Estimated affected sessions: ~29,000 iOS users missing notifications
- Android users: unaffected
- SLO BREACH: TruView Mobile Push Notification Delivery SLO at 96.2% (threshold: 98%)

TIMELINE:
- 2025-03-04T07:58:00Z: Dynatrace alert P-3887 triggered — HTTP success rate on /api/mobile/push/send dropped to 87.3%
- 2025-03-04T08:03:00Z: INC0091205 opened by on-call engineer
- 2025-03-04T08:30:00Z: Confirmed iOS-only scope; Android delivery nominal
- 2025-03-04T08:45:00Z: APNs connection pool showing 340 resets in past hour (baseline: <5/hour)
- 2025-03-04T09:10:00Z: Correlation identified with CHG0104756 (firebase-messaging 9.1.0 → 9.3.2)
- 2025-03-04T09:40:00Z: TruView Mobile release v4.2.7-hotfix prepared in pipeline; awaiting approval

ROOT CAUSE INVESTIGATION:
The upgrade from firebase-messaging 9.1.0 to 9.3.2 (CHG0104756) introduced a change in the APNs connection handling behaviour. The new library version is not correctly reusing APNs persistent connections and is creating new connections for each notification batch, exhausting the APNs connection pool. Apple enforces a maximum of 1,000 concurrent APNs connections per certificate.

WORKAROUND:
- No immediate workaround available without rollback
- Monitoring notification retry queue; notifications are queued for retry within 24 hours per APNs spec

ROLLBACK PATH:
- Mobile release v4.2.7-hotfix available in pipeline (reverts firebase-messaging to 9.1.0)
- Requires Change Advisory Board expedited approval (CHG required)
- Estimated rollback deployment time: 45 minutes post-approval

CORRELATION: CHG0104756 (iOS push notification library upgrade, deployed Wednesday 09:15)`,
    tags: ['incident', 'sev3', 'mobile', 'push-notification', 'apns', 'ios', 'truview-mobile', 'tier1', 'in-progress', 'slo-breach'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-04T09:50:00Z',
    ingest_ts: '2025-03-04T09:53:00Z',
    ttl_hours: 1,
    meta: { severity: 'SEV3', state: 'In Progress', assigned_to: 'Mobile Platform Team', correlation: 'CHG0104756' }
  },

  {
    id: 'sn_inc_003',
    appid: 'APPID-871198',
    source: 'servicenow_incidents',
    source_label: 'ServiceNow',
    record_id: 'INC0088719',
    title: 'SEV3 — TruView Web intermittent 504 Gateway Timeout on /api/v2/accounts/summary',
    text: `INCIDENT: INC0088719
Severity: SEV3
State: Monitoring
Application: TruView Web (APPID-871198)
Opened: 2025-03-03T11:22:00Z (approximately 23 hours ago)
Assigned To: Platform SRE Team
Priority: 3 - Medium

SUMMARY:
Intermittent 504 Gateway Timeout errors on the TruView Web /api/v2/accounts/summary endpoint. Affecting approximately 3% of requests. Dynatrace distributed tracing confirms the timeout is originating in the call chain truview-core-account-service → legacy-dda-adapter. The legacy-dda-adapter is a mainframe bridge service. The timeouts correlate with periods of elevated mainframe response times.

IMPACT:
- 3% of /api/v2/accounts/summary requests returning HTTP 504
- Users: Account summary page shows loading spinner or error state for ~3% of page loads
- No data loss or corruption observed
- Correlated with INC0089341 (Kafka consumer lag adding to account-service load)

TIMELINE:
- 2025-03-03T11:15:00Z: Dynatrace P-3854 triggered — response time elevated on accounts/summary (p95: 2,340ms)
- 2025-03-03T11:22:00Z: INC0088719 opened
- 2025-03-03T13:45:00Z: Root cause identified: legacy-dda-adapter connection pool contention under load
- 2025-03-03T14:30:00Z: Connection pool tuning applied — legacy-dda-adapter pool size increased from 20 to 35
- 2025-03-03T15:30:00Z: P-3854 resolved; Dynatrace p95 returned to 1,240ms
- 2025-03-04T09:00:00Z: Monitoring — 504 rate reduced to 3% but not eliminated; believed linked to INC0089341 (Kafka lag increasing account-service load)

CURRENT STATUS:
Incident in Monitoring state. Connection pool tuning partially resolved the timeout rate. Remaining 3% timeout rate is believed to be secondary impact from INC0089341 (Kafka consumer lag increasing account-service processing load). Expected to fully resolve when INC0089341 is closed.

KNOWN WORKAROUND:
Page refresh resolves individual user impact. No systemic workaround available beyond resolving INC0089341.`,
    tags: ['incident', 'sev3', 'truview-web', 'tier1', '504', 'gateway-timeout', 'account-summary', 'legacy-dda-adapter', 'monitoring'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-04T09:00:00Z',
    ingest_ts: '2025-03-04T09:05:00Z',
    ttl_hours: 4,
    meta: { severity: 'SEV3', state: 'Monitoring', assigned_to: 'Platform SRE Team', correlation: 'INC0089341' }
  },

  // ─── RECENT CHANGES ────────────────────────────────────────────────────────

  {
    id: 'sn_chg_001',
    appid: 'APPID-973193',
    source: 'servicenow_changes',
    source_label: 'ServiceNow',
    record_id: 'CHG0104892',
    title: 'Standard Change — TruView Core Kafka consumer memory limit increase',
    text: `CHANGE RECORD: CHG0104892
Type: Standard Change
Application: TruView Core (APPID-973193)
State: Post-Implementation Review Pending
Deployed: 2025-03-04T03:15:00Z (Wednesday 09:15 AEDT / 03:15 UTC)
Change Owner: Platform Engineering
Risk Level: Low
Change Advisory Board Approval: Pre-approved (Standard Change template SCTMPL-0044)

CHANGE SUMMARY:
Kafka consumer memory limit increase from 512Mi to 768Mi across all acct-sync-processor consumer deployments in EKS cluster prod-eks-trueview-01. This change was raised to address consumer OOMKill events observed under peak load (07:00–09:00 EST) logged in PRB0012441.

CHANGE DETAILS:
- Target deployments: acct-sync-processor (3 replicas), transaction-sync-consumer (2 replicas)
- Previous memory limit: 512Mi; memory request: 256Mi
- New memory limit: 768Mi; memory request: 384Mi
- Kubernetes manifest updated in truview-core/deploy/consumers/acct-sync-processor.yaml
- Deployed via pipeline run #pipe-4892-prod (see CI/CD records)

IMPLEMENTATION STEPS:
1. Applied updated manifest to prod-eks-trueview-01 via ArgoCD sync
2. Rolling restart performed — 0 downtime, 1 pod updated at a time
3. Validation: all 3 replicas reached Running state within 4 minutes
4. Post-deploy: consumer lag on account-events checked — nominal at T+10 minutes

ROLLBACK PROCEDURE:
kubectl rollout undo deployment/acct-sync-processor -n truview-core
kubectl rollout undo deployment/transaction-sync-consumer -n truview-core
Estimated rollback time: 3–5 minutes.

POST-IMPLEMENTATION STATUS:
Review Pending. NOTE: This change is currently under investigation as a correlating factor in INC0089341 (Kafka consumer lag spike, opened 6 hours post-deployment). The memory limit increase may have masked a pre-existing memory leak by delaying OOMKill restarts.

CORRELATION WITH INCIDENTS: INC0089341 (SEV2 active), PRB0012441`,
    tags: ['change', 'standard', 'truview-core', 'kafka', 'consumer', 'memory', 'eks', 'acct-sync-processor', 'recent', 'correlated-incident'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-04T09:30:00Z',
    ingest_ts: '2025-03-04T09:33:00Z',
    ttl_hours: 8,
    meta: { change_type: 'Standard', state: 'PIR Pending', risk: 'Low', deployed: '2025-03-04T03:15:00Z' }
  },

  {
    id: 'sn_chg_002',
    appid: 'APPID-871204',
    source: 'servicenow_changes',
    source_label: 'ServiceNow',
    record_id: 'CHG0104756',
    title: 'Standard Change — TruView Mobile iOS push notification library upgrade',
    text: `CHANGE RECORD: CHG0104756
Type: Standard Change
Application: TruView Mobile (APPID-871204)
State: Post-Implementation Review Pending
Deployed: 2025-03-04T03:15:00Z (Wednesday 09:15 AEDT)
Change Owner: Mobile Platform Team
Risk Level: Medium
Change Advisory Board Approval: Approved 2025-03-03T14:00:00Z

CHANGE SUMMARY:
Upgrade of the Firebase Cloud Messaging iOS push notification library from firebase-messaging 9.1.0 to 9.3.2 in the TruView Mobile backend notification service. The upgrade was raised to incorporate APNs HTTP/2 API improvements and fix a known token rotation issue in 9.1.0 (Firebase issue #firebase-ios-9871).

CHANGE DETAILS:
- Service: notification-service (component of TruView Core, consumed by TruView Mobile)
- Library: firebase-admin 11.0.1 (includes firebase-messaging 9.3.2)
- Previous: firebase-admin 10.3.0 (firebase-messaging 9.1.0)
- Deployment: Docker image truview/notification-service:v2.4.1 deployed to prod-eks-trueview-01
- Test coverage: 47 unit tests passed; iOS integration tests run against APNs sandbox (not production)

RISK FACTORS:
- Medium risk: library version jump introduces new APNs connection handling behaviour
- iOS production APNs behaviour may differ from sandbox
- No canary deployment performed (standard change did not require it)

ROLLBACK PROCEDURE:
- Mobile release v4.2.7-hotfix available in pipeline (tagged in GitLab)
- Hotfix reverts firebase-admin to 10.3.0 and notification-service image to v2.4.0
- Requires CAB expedited approval for emergency rollback
- Estimated rollback time: 45 minutes post-approval

POST-IMPLEMENTATION STATUS:
Review Pending. NOTE: This change is currently under active investigation as the root cause of INC0091205 (iOS push notification delivery failures, SEV3, opened 2 hours post-deployment).

CORRELATION WITH INCIDENTS: INC0091205`,
    tags: ['change', 'standard', 'truview-mobile', 'push-notification', 'ios', 'firebase', 'apns', 'library-upgrade', 'recent', 'correlated-incident'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-04T09:30:00Z',
    ingest_ts: '2025-03-04T09:33:00Z',
    ttl_hours: 8,
    meta: { change_type: 'Standard', state: 'PIR Pending', risk: 'Medium', deployed: '2025-03-04T03:15:00Z' }
  },

  {
    id: 'sn_chg_003',
    appid: 'APPID-871198',
    source: 'servicenow_changes',
    source_label: 'ServiceNow',
    record_id: 'CHG0104601',
    title: 'Normal Change — TruView Web BFF API route optimisation',
    text: `CHANGE RECORD: CHG0104601
Type: Normal Change
Application: TruView Web (APPID-871198)
State: Successful — Closed
Deployed: 2025-03-03T08:00:00Z (Monday 18:00 AEDT)
Change Owner: Web Platform Team
Risk Level: Low
Change Advisory Board Approval: Approved

CHANGE SUMMARY:
BFF (Backend for Frontend) API route optimisation — removal of redundant middleware chain on the /api/v2/accounts/summary path. Three middleware functions (request-id-echo, legacy-correlation-header, deprecated-session-validator) were no longer required following the Auth Service migration to JWT in Q4. Their removal reduces per-request processing overhead by approximately 12ms.

CHANGE DETAILS:
- Service: truview-web-bff (prod-eks-web-01)
- Image: truview/web-bff:v3.8.2 → v3.9.0
- Middleware removed: request-id-echo, legacy-correlation-header, deprecated-session-validator
- Zero code logic changes; pure configuration/route cleanup

IMPLEMENTATION:
Deployed Monday 18:00 during low-traffic window. Pipeline run #pipe-4601-prod. All 47 BFF integration tests passed. No canary required for low-risk middleware removal.

POST-IMPLEMENTATION STATUS: Successful. Closed 2025-03-03T10:30:00Z. No incidents correlated. Performance monitoring confirmed expected 12ms reduction in median latency on accounts summary path.`,
    tags: ['change', 'normal', 'truview-web', 'bff', 'middleware', 'optimisation', 'successful', 'recent'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-03T10:30:00Z',
    ingest_ts: '2025-03-04T02:15:00Z',
    ttl_hours: 24,
    meta: { change_type: 'Normal', state: 'Successful', risk: 'Low', deployed: '2025-03-03T08:00:00Z' }
  },

  {
    id: 'sn_chg_004',
    appid: 'APPID-973193',
    source: 'servicenow_changes',
    source_label: 'ServiceNow',
    record_id: 'CHG0104333',
    title: 'Normal Change — TruView Core Mule API Gateway rate limit increase',
    text: `CHANGE RECORD: CHG0104333
Type: Normal Change
Application: TruView Core (APPID-973193)
State: Successful — Closed
Deployed: 2025-02-28T04:00:00Z (last Friday 14:00 AEDT)
Change Owner: Platform Engineering
Risk Level: Low

CHANGE SUMMARY:
Mule API Gateway policy update — rate limit increase for internal services on the /internal/account-events endpoint. Previous limit: 200 RPS per consuming service. New limit: 500 RPS per consuming service. Change raised due to Fraud Detection Service hitting rate limits during peak periods (07:00–09:00 EST), causing delayed fraud evaluations.

CHANGE DETAILS:
- Gateway: prod-mule-apigw-01 (Mule API Gateway, bank-wide deployment)
- Policy: rate-limit-sla-policy v3.2.1 → v3.2.1 (config change only)
- Endpoints affected: /internal/account-events, /internal/transaction-stream
- Approved consuming services: Fraud Detection (APPID-445821), Core Banking Adapter (APPID-100034)

POST-IMPLEMENTATION STATUS: Successful. No incidents correlated. Fraud Detection Service rate limit alerts have not fired since deployment.`,
    tags: ['change', 'normal', 'truview-core', 'mule', 'api-gateway', 'rate-limit', 'successful', 'recent'],
    classification: 'INTERNAL',
    freshness_ts: '2025-02-28T06:00:00Z',
    ingest_ts: '2025-03-04T02:15:00Z',
    ttl_hours: 48,
    meta: { change_type: 'Normal', state: 'Successful', risk: 'Low', deployed: '2025-02-28T04:00:00Z' }
  },

  {
    id: 'sn_chg_005',
    appid: 'APPID-973193',
    source: 'servicenow_changes',
    source_label: 'ServiceNow',
    record_id: 'CHG0103981',
    title: 'Standard Change — TruView Core EKS node pool upgrade t3.xlarge to t3.2xlarge',
    text: `CHANGE RECORD: CHG0103981
Type: Standard Change
Application: TruView Core (APPID-973193)
State: Successful — Closed
Deployed: 2025-02-25T19:00:00Z (last Tuesday maintenance window 05:00 AEDT)
Change Owner: Platform Engineering
Risk Level: Medium

CHANGE SUMMARY:
EKS node pool upgrade for the truview-core-processing node group from t3.xlarge (4 vCPU, 16GB RAM) to t3.2xlarge (8 vCPU, 32GB RAM). Change driven by sustained CPU utilisation >80% during peak hours on the processing node group. Approved as part of Q1 capacity planning cycle.

CHANGE DETAILS:
- EKS cluster: prod-eks-trueview-01
- Node group: truview-core-processing
- Previous instance type: t3.xlarge (4 vCPU, 16GB)
- New instance type: t3.2xlarge (8 vCPU, 32GB)
- Node count: unchanged at 5 nodes
- Maintenance window: 05:00–07:00 AEDT Tuesday (lowest traffic period)
- Migration strategy: new nodes provisioned, pods drained from old nodes, old nodes terminated

POST-IMPLEMENTATION STATUS: Successful. CPU utilisation on truview-core-processing node group reduced from sustained 82% to 44% during peak hours. Node upgrade confirmed operational. No incidents correlated.`,
    tags: ['change', 'standard', 'truview-core', 'eks', 'node-pool', 'capacity', 'infrastructure', 'successful', 'recent'],
    classification: 'INTERNAL',
    freshness_ts: '2025-02-25T21:30:00Z',
    ingest_ts: '2025-03-04T02:15:00Z',
    ttl_hours: 72,
    meta: { change_type: 'Standard', state: 'Successful', risk: 'Medium', deployed: '2025-02-25T19:00:00Z' }
  },

  // ─── CMDB RECORDS ──────────────────────────────────────────────────────────

  {
    id: 'sn_cmdb_001',
    appid: 'APPID-973193',
    source: 'servicenow_cmdb',
    source_label: 'ServiceNow',
    record_id: 'CMDB-APPID-973193',
    title: 'CMDB — TruView Core (APPID-973193) application record',
    text: `CMDB APPLICATION RECORD: TruView Core
APPID: APPID-973193
Application Name: TruView Core
Criticality: Tier 1 (Mission Critical)
Business Owner: Digital Banking Platform — Head of Platform: Sarah Kimberley (sarah.kimberley@truebank.com.au)
IT Owner: Platform Engineering — Engineering Manager: David Nguyen (david.nguyen@truebank.com.au)
On-Call Rotation: Platform SRE Team — PagerDuty schedule: truview-core-oncall
  - Primary on-call (current rotation): Marcus Okonkwo (m.okonkwo@truebank.com.au)
  - Secondary: Priya Sharma (p.sharma@truebank.com.au)
  - Escalation: David Nguyen (david.nguyen@truebank.com.au)

INFRASTRUCTURE COMPONENTS:
- EKS Cluster: prod-eks-trueview-01 (us-east-1, node groups: truview-core-processing, truview-core-general)
- Kafka Cluster: prod-kafka-trueview (MSK, 6 brokers, replication factor 3)
- API Gateway: prod-mule-apigw-01 (Mule API Gateway, shared bank-wide deployment)
- PostgreSQL RDS: prod-rds-truview-core-01 (db.r6g.2xlarge, Multi-AZ, us-east-1)
- Redis Cache: prod-redis-truview-01 (ElastiCache, r6g.large, 2 nodes)

MICROSERVICES (7):
1. account-service — core account data and balance management
2. transaction-service — transaction processing and history
3. notification-service — push and email notification orchestration
4. auth-adapter — authentication token validation and SSO bridge
5. legacy-dda-adapter — mainframe bridge for DDA (Demand Deposit Account) queries
6. event-router — Kafka topic routing and event fan-out
7. api-gateway-bridge — Mule API Gateway integration layer

DOWNSTREAM DEPENDENCIES (services that consume TruView Core):
- TruView Web (APPID-871198): consumes all 7 microservices
- TruView Mobile (APPID-871204): consumes account-service, transaction-service, notification-service
- Fraud Detection Service (APPID-445821): consumes account-service (sync, /fraud/evaluate) and event-router (Kafka)
- Customer Notification Hub (APPID-678234): consumes notification-service (async Kafka topic notifications-outbound)
- Core Banking Adapter (APPID-100034): bidirectional — TruView Core legacy-dda-adapter calls Core Banking; Core Banking calls account-service for reconciliation

DATA CLASSIFICATION: Restricted (contains PII and financial account data)
RECOVERY OBJECTIVES: RTO 4 hours, RPO 15 minutes`,
    tags: ['cmdb', 'truview-core', 'appid-973193', 'tier1', 'infrastructure', 'microservices', 'on-call', 'dependencies', 'ownership'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-03T22:00:00Z',
    ingest_ts: '2025-03-04T02:15:00Z',
    ttl_hours: 24,
    meta: { app_tier: 'Tier 1', business_owner: 'Digital Banking Platform', it_owner: 'Platform Engineering' }
  },

  {
    id: 'sn_cmdb_002',
    appid: 'APPID-871198',
    source: 'servicenow_cmdb',
    source_label: 'ServiceNow',
    record_id: 'CMDB-APPID-871198',
    title: 'CMDB — TruView Web (APPID-871198) application record',
    text: `CMDB APPLICATION RECORD: TruView Web
APPID: APPID-871198
Application Name: TruView Web
Criticality: Tier 1 (Mission Critical)
Business Owner: Digital Banking Platform — Head of Digital: Rachel Torres (r.torres@truebank.com.au)
IT Owner: Web Platform Team — Engineering Manager: James Blackwood (j.blackwood@truebank.com.au)
On-Call Rotation: Platform SRE Team — PagerDuty: truview-web-oncall

INFRASTRUCTURE COMPONENTS:
- Frontend: React SPA, hosted on S3 bucket truebank-truview-web-prod, served via CloudFront distribution E1K9ABCDEF (prod-cf-truview-web)
- BFF: Node.js Backend for Frontend on EKS cluster prod-eks-web-01 (node group: web-bff-general, t3.large, 4 nodes)
- CDN: CloudFront distribution prod-cf-truview-web (us-east-1 + 12 edge locations)

TRAFFIC METRICS:
- Daily Active Sessions: ~180,000
- Peak Traffic Window: 09:00–11:00 EST (coincides with business banking open)
- Peak RPS (BFF): 340 RPS at peak
- Average page load time (LCP): 1.8s

UPSTREAM DEPENDENCIES:
- TruView Core (APPID-973193): all 7 microservices (via Mule API Gateway)
- Auth Service (APPID-556712): JWT validation for all authenticated requests
- Analytics Platform (APPID-789012): client-side event forwarding

DATA CLASSIFICATION: Restricted (session data and financial account display)
RECOVERY OBJECTIVES: RTO 2 hours, RPO 0 (stateless frontend, BFF stateless)`,
    tags: ['cmdb', 'truview-web', 'appid-871198', 'tier1', 'react', 'bff', 'cloudfront', 'on-call'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-03T22:00:00Z',
    ingest_ts: '2025-03-04T02:15:00Z',
    ttl_hours: 24,
    meta: { app_tier: 'Tier 1', business_owner: 'Digital Banking Platform', it_owner: 'Web Platform Team' }
  },

  {
    id: 'sn_cmdb_003',
    appid: 'APPID-871204',
    source: 'servicenow_cmdb',
    source_label: 'ServiceNow',
    record_id: 'CMDB-APPID-871204',
    title: 'CMDB — TruView Mobile (APPID-871204) application record',
    text: `CMDB APPLICATION RECORD: TruView Mobile
APPID: APPID-871204
Application Name: TruView Mobile
Criticality: Tier 1 (Mission Critical)
Business Owner: Digital Banking Platform — Head of Mobile: Lena Okafor (l.okafor@truebank.com.au)
IT Owner: Mobile Platform Team — Engineering Manager: Thomas Vance (t.vance@truebank.com.au)
On-Call Rotation: Platform SRE Team — PagerDuty: truview-mobile-oncall

INFRASTRUCTURE COMPONENTS:
- iOS App: Native Swift, distributed via App Store (bundle: com.truebank.truview, v4.2.7)
- Android App: Native Kotlin, distributed via Play Store (package: com.truebank.truview, v4.2.7)
- BFF: Node.js Backend for Frontend on EKS cluster prod-eks-mobile-01 (node group: mobile-bff-general, t3.large, 5 nodes)
- Push Infrastructure: Firebase Cloud Messaging (Android + iOS), Apple APNs (iOS direct)
- APNs Certificate: com.truebank.truview.push — expires 2026-01-15

TRAFFIC METRICS:
- Daily Active Sessions: ~420,000 (largest TruView channel)
- Peak Traffic Windows: 07:00–09:00 EST (morning), 17:00–19:00 EST (evening commute)
- Peak RPS (BFF): 580 RPS at morning peak
- iOS / Android split: approximately 58% iOS / 42% Android

UPSTREAM DEPENDENCIES:
- TruView Core (APPID-973193): account-service, transaction-service, notification-service
- Auth Service (APPID-556712): OAuth 2.0 token validation
- Firebase/FCM: push notification delivery (Android + iOS relay)
- Apple APNs: direct iOS push delivery

DATA CLASSIFICATION: Restricted (contains PII and financial account data)
RECOVERY OBJECTIVES: RTO 4 hours, RPO 0 (stateless BFF)`,
    tags: ['cmdb', 'truview-mobile', 'appid-871204', 'tier1', 'ios', 'android', 'bff', 'push-notifications', 'on-call'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-03T22:00:00Z',
    ingest_ts: '2025-03-04T02:15:00Z',
    ttl_hours: 24,
    meta: { app_tier: 'Tier 1', business_owner: 'Digital Banking Platform', it_owner: 'Mobile Platform Team' }
  },

  // ─── PROBLEMS ──────────────────────────────────────────────────────────────

  {
    id: 'sn_prb_001',
    appid: 'APPID-973193',
    source: 'servicenow_problems',
    source_label: 'ServiceNow',
    record_id: 'PRB0012441',
    title: 'Known Error — TruView Core account-service connection pool exhaustion under load',
    text: `PROBLEM RECORD: PRB0012441
State: Known Error
Application: TruView Core (APPID-973193) — account-service
Problem Manager: Platform Engineering
Opened: 2025-01-15T09:00:00Z
Last Updated: 2025-03-01T14:00:00Z

PROBLEM STATEMENT:
TruView Core account-service experiences intermittent PostgreSQL connection pool exhaustion when sustained request load exceeds 350 RPS. At this load threshold, the connection pool (HikariCP, max pool size: 20) reaches saturation, and new requests queue behind pool acquisition timeout (30 seconds). Connections that time out return HTTP 503 to the caller.

KNOWN ERROR STATUS:
Root cause identified: HikariCP max pool size of 20 is insufficient for the account-service load profile. The RDS instance (prod-rds-truview-core-01, db.r6g.2xlarge) can support up to 800 connections; the current pool configuration leaves significant headroom unused.

WORKAROUND (documented in KB0034512):
1. Immediate mitigation: reduce consumer concurrency on acct-sync-processor to reduce account-service RPS
   kubectl set env deployment/acct-sync-processor CONSUMER_CONCURRENCY=5
2. Restart affected pods to clear connection pool state:
   kubectl rollout restart deployment/account-service -n truview-core
3. Validate recovery: monitor Dynatrace dashboard for connection pool metrics

ROOT CAUSE:
HikariCP max pool size configured at 20 in account-service application.properties. This value has not been tuned since the service was first deployed 18 months ago when load was <100 RPS. Current peak load is 340 RPS with occasional spikes to 400 RPS.

FIX:
Proposed fix: increase HikariCP maximumPoolSize from 20 to 50, set minimumIdle to 10. Change in progress — Platform Engineering. No confirmed deployment date.

RELATED INCIDENTS: INC0088719 (INC linked — 504 timeouts on accounts/summary correlated with pool exhaustion)
RELATED CHANGES: CHG0104892 (Kafka consumer memory increase — post-implementation review may reveal secondary pool impact)`,
    tags: ['problem', 'known-error', 'truview-core', 'account-service', 'connection-pool', 'postgresql', 'hikaricp', 'load', 'workaround'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-01T14:00:00Z',
    ingest_ts: '2025-03-04T02:15:00Z',
    ttl_hours: 72,
    meta: { problem_state: 'Known Error', assigned_to: 'Platform Engineering', workaround: 'KB0034512' }
  },

];
