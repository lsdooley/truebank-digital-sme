// CI/CD pipeline synthetic data — deployments, history, pipeline runs

export const cicdChunks = [

  {
    id: 'cicd_deploy_001',
    appid: 'APPID-973193',
    source: 'cicd_pipelines',
    source_label: 'CI/CD',
    record_id: 'PIPE-4892-PROD',
    title: 'Pipeline run — TruView Core CHG0104892 deployment (Wednesday 09:15 AEDT)',
    text: `CI/CD PIPELINE RUN: PIPE-4892-PROD
Application: TruView Core (APPID-973193)
Pipeline: truview-core-prod-deploy
Run ID: PIPE-4892-PROD
Status: SUCCESS
Triggered: 2025-03-04T03:10:00Z (Wednesday 09:10 AEDT)
Completed: 2025-03-04T03:28:00Z
Duration: 18 minutes
Triggered by: Automated CD (ArgoCD sync — git commit c7f3a89)
Change record: CHG0104892
Author: Platform Engineering (automated deployment bot: truview-cd-bot)

PIPELINE STAGES:
1. Build & Unit Test — 4m 12s — PASSED (247 unit tests, 0 failures)
2. Integration Test — 6m 45s — PASSED (83 integration tests, 0 failures)
3. Container Image Build — 1m 55s — PASSED
   Images built:
   - truview/acct-sync-processor:v1.8.3 (SHA: sha256:9f3d2a7b...)
   - truview/transaction-sync-consumer:v1.4.1 (SHA: sha256:4e8c1f2a...)
4. Security Scan (Trivy) — 2m 10s — PASSED (0 critical, 2 medium — accepted)
5. Kubernetes Manifest Update — 0m 30s — PASSED
   Files changed:
   - deploy/consumers/acct-sync-processor.yaml (resources.limits.memory: 512Mi → 768Mi, resources.requests.memory: 256Mi → 384Mi)
   - deploy/consumers/transaction-sync-consumer.yaml (resources.limits.memory: 512Mi → 768Mi)
6. ArgoCD Sync (prod-eks-trueview-01) — 3m 20s — PASSED
   Pods updated:
   - acct-sync-processor: 3 pods rolling updated (0 downtime)
   - transaction-sync-consumer: 2 pods rolling updated (0 downtime)

POST-DEPLOY VALIDATION:
- Health check: account-service /health → HTTP 200 ✓
- Kafka consumer lag at T+10m: acct-sync-processor LAG=0 ✓
- Dynatrace synthetic test: account-service latency p95 340ms ✓

NOTE: Deployment succeeded. However, INC0089341 was opened 4 hours after this deployment as memory leak manifested. Post-implementation review for CHG0104892 is PENDING pending incident resolution.

GIT DETAILS:
Commit: c7f3a89b4d2e18f9a3c71d5e8b2f04c9d7e6a1b2
Branch: main
Commit message: "chore: increase kafka consumer memory limits for acct-sync-processor and transaction-sync-consumer"`,
    tags: ['pipeline', 'deployment', 'truview-core', 'kafka', 'consumer', 'memory', 'success', 'chg0104892', 'recent'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-04T03:28:00Z',
    ingest_ts: '2025-03-04T03:35:00Z',
    ttl_hours: 48,
    meta: { status: 'SUCCESS', duration_min: 18, change_record: 'CHG0104892', author: 'truview-cd-bot' }
  },

  {
    id: 'cicd_deploy_002',
    appid: 'APPID-871204',
    source: 'cicd_pipelines',
    source_label: 'CI/CD',
    record_id: 'PIPE-4756-PROD',
    title: 'Pipeline run — TruView Mobile CHG0104756 notification-service v2.4.1 deployment',
    text: `CI/CD PIPELINE RUN: PIPE-4756-PROD
Application: TruView Mobile (APPID-871204) / TruView Core notification-service
Pipeline: truview-core-notification-prod-deploy
Run ID: PIPE-4756-PROD
Status: SUCCESS
Triggered: 2025-03-04T03:10:00Z (same deployment window as CHG0104892)
Completed: 2025-03-04T03:22:00Z
Duration: 12 minutes
Change record: CHG0104756
Author: Mobile Platform Team (t.vance@truebank.com.au)
Commit: a8d4c2e9f1b35a7c4d8e2f6a1b9c3d7e5f2a4b1

PIPELINE STAGES:
1. Build & Unit Test — 3m 08s — PASSED (47 unit tests — notification-service, 0 failures)
2. iOS Push Integration Test (APNs Sandbox) — 4m 22s — PASSED
   Note: APNs sandbox tests passed with firebase-messaging 9.3.2. Production APNs behaviour may differ.
3. Container Image Build — 1m 15s — PASSED
   Image: truview/notification-service:v2.4.1 (SHA: sha256:2b7f9a3c...)
4. Security Scan — 0m 55s — PASSED (0 critical, 0 medium)
5. ArgoCD Sync (prod-eks-trueview-01) — 2m 20s — PASSED
   Pods updated: notification-service: 2 pods rolling updated

POST-DEPLOY VALIDATION:
- Health check: notification-service /health → HTTP 200 ✓
- Push test notification (Android): delivered ✓
- Push test notification (iOS sandbox): delivered ✓ (NOTE: sandbox, not production APNs)

ROLLBACK ARTIFACT:
- Previous image: truview/notification-service:v2.4.0 (available in registry)
- Hotfix branch: release/v4.2.7-hotfix (reverts firebase-admin to 10.3.0)
- Hotfix pipeline: PIPE-HOTFIX-4756 (PENDING CAB approval as of 2025-03-04T09:40:00Z)

NOTE: INC0091205 opened 4h43m after this deployment. Rollback path available via PIPE-HOTFIX-4756.`,
    tags: ['pipeline', 'deployment', 'truview-mobile', 'notification-service', 'firebase', 'apns', 'success', 'chg0104756', 'recent', 'hotfix-pending'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-04T03:22:00Z',
    ingest_ts: '2025-03-04T03:30:00Z',
    ttl_hours: 48,
    meta: { status: 'SUCCESS', duration_min: 12, change_record: 'CHG0104756', author: 't.vance@truebank.com.au' }
  },

  {
    id: 'cicd_deploy_003',
    appid: 'APPID-973193',
    source: 'cicd_pipelines',
    source_label: 'CI/CD',
    record_id: 'PIPE-4721-PROD-FAIL',
    title: 'Pipeline run — TruView Core event-router FAILED — Kafka schema compatibility (last Thursday)',
    text: `CI/CD PIPELINE RUN: PIPE-4721-PROD-FAIL
Application: TruView Core (APPID-973193) — event-router service
Pipeline: truview-core-prod-deploy
Run ID: PIPE-4721-PROD-FAIL
Status: FAILED (auto-rolled back)
Triggered: 2025-02-27T03:00:00Z (last Thursday 13:00 AEDT)
Failed: 2025-02-27T03:08:00Z
Auto-rollback completed: 2025-02-27T03:16:00Z (8 minutes total)
Author: Platform Engineering (auto-deploy from git merge to main)
Commit: e2f8a1b7c4d9e3f5a2b8c6d1e7f4a9b3c2d8e5f1
Commit message: "feat: event-router schema evolution — add new account-closure event type"

FAILURE DETAILS:
Stage: Integration Test — FAILED at 08m 15s
Test: KafkaSchemaCompatibilityTest.testAccountEventSchemaForwardCompatibility
Error: Schema compatibility check FAILED for truview-core-account-events
  New schema version: truview.core.AccountEvent.v3
  Existing schema in AWS Glue Schema Registry: truview.core.AccountEvent.v2
  Compatibility mode: FORWARD (new schema must be backward-readable by consumers of v2)
  VIOLATION: New field 'closureReason' (required, no default) is not backward-compatible with v2 consumers
  Affected consumers: acct-sync-processor (pinned to AccountEvent.v2 schema), Fraud Detection (APPID-445821)

RESOLUTION:
2025-02-27T04:30:00Z: Platform Engineering manually registered schema with closureReason field set to optional (default: null) in AWS Glue Schema Registry
2025-02-27T05:00:00Z: Re-run pipeline PIPE-4740-PROD — SUCCESS
2025-02-28T09:00:00Z: acct-sync-processor updated to consume AccountEvent.v3 (separate deployment)

LESSONS LEARNED:
Schema changes that add required fields without defaults are always FORWARD-incompatible. Schema changes must be tested against the Schema Registry before committing. Added schema compatibility pre-check to pipeline (deployed in PIPE-4801-INFRA).`,
    tags: ['pipeline', 'deployment', 'truview-core', 'event-router', 'kafka', 'schema', 'failed', 'auto-rollback', 'schema-registry'],
    classification: 'INTERNAL',
    freshness_ts: '2025-02-27T03:16:00Z',
    ingest_ts: '2025-03-04T02:15:00Z',
    ttl_hours: 72,
    meta: { status: 'FAILED', auto_rollback: true, duration_min: 8, failure_stage: 'Integration Test' }
  },

  {
    id: 'cicd_history_001',
    appid: 'APPID-973193',
    source: 'cicd_pipelines',
    source_label: 'CI/CD',
    record_id: 'DEPLOY-HISTORY-TRUVIEW-CORE',
    title: 'TruView Core deployment history — last 10 deployments',
    text: `DEPLOYMENT HISTORY: TruView Core (APPID-973193)
Source: GitLab CI/CD + ArgoCD
Last Updated: 2025-03-04T10:00:00Z

Last 10 Production Deployments:

1. PIPE-4892-PROD | 2025-03-04 03:15 UTC | SUCCESS | CHG0104892 | acct-sync-processor memory 512→768Mi | truview-cd-bot
2. PIPE-4756-PROD | 2025-03-04 03:15 UTC | SUCCESS | CHG0104756 | notification-service v2.4.1 (firebase 9.3.2) | t.vance
3. PIPE-4820-PROD | 2025-03-03 08:00 UTC | SUCCESS | CHG0104601 | truview-web-bff v3.9.0 (middleware removal) | j.blackwood
4. PIPE-4801-INFRA | 2025-03-02 22:00 UTC | SUCCESS | CHG0104333 (post-apply) | Pipeline schema compat pre-check added | p.sharma
5. PIPE-4780-PROD | 2025-02-28 04:00 UTC | SUCCESS | CHG0104333 | Mule rate limit config 200→500 RPS | truview-cd-bot
6. PIPE-4740-PROD | 2025-02-27 05:00 UTC | SUCCESS | (re-run of failed PIPE-4721) | event-router AccountEvent.v3 schema | platform-eng
7. PIPE-4721-PROD  | 2025-02-27 03:00 UTC | FAILED (auto-rollback 8min) | event-router schema incompatibility | platform-eng
8. PIPE-4690-PROD | 2025-02-25 19:00 UTC | SUCCESS | CHG0103981 | EKS node pool t3.xlarge→t3.2xlarge | truview-cd-bot
9. PIPE-4650-PROD | 2025-02-20 22:00 UTC | SUCCESS | Runbook KB0031022 update (docs only) | m.okonkwo
10. PIPE-4622-PROD | 2025-02-18 03:00 UTC | SUCCESS | transaction-service v2.1.4 (Elasticsearch index tuning) | p.sharma

DEPLOYMENT CADENCE: Average 1.8 deployments/week for TruView Core
FAILURE RATE (last 30 days): 1 failure in 10 deployments (10%) — all auto-recovered`,
    tags: ['deployment-history', 'truview-core', 'pipeline', 'recent', 'cadence', 'success', 'failure-rate'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-04T10:00:00Z',
    ingest_ts: '2025-03-04T10:00:00Z',
    ttl_hours: 4,
    meta: { deployment_count: 10, failure_rate: '10%' }
  },

];
