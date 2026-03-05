// CI/CD extra synthetic data — deployment histories for Web and Mobile

export const cicdExtra = [

  {
    id: 'cicd_deploy_004',
    appid: 'APPID-871198',
    source: 'cicd_pipelines',
    source_label: 'CI/CD',
    record_id: 'PIPE-4820-WEB',
    title: 'Pipeline run — TruView Web SPA v5.12.0 bundle optimisation (Monday)',
    text: `CI/CD PIPELINE RUN: PIPE-4820-WEB
Application: TruView Web (APPID-871198)
Pipeline: truview-web-prod-deploy
Run ID: PIPE-4820-WEB
Status: SUCCESS
Triggered: 2025-03-03T10:00:00Z (Monday 20:00 AEDT)
Completed: 2025-03-03T10:14:00Z
Duration: 14 minutes
Change record: CHG0104980
Author: James Blackwood (j.blackwood@truebank.com.au)
Commit: f4a2c8e1d9b3f7a5c2e4d8b1f6a9c3e7d2b5f8a1
Commit message: "feat: lazy-load transaction and payments modules, reduce initial bundle 340KB → 198KB"

PIPELINE STAGES:
1. Build (Vite + Webpack 5) — 5m 12s — PASSED
   Node.js 20.11.0, npm 10.2.4
   Production build output:
     dist/assets/index.[f4a2c8].js         198KB gzip (initial bundle — was 340KB)
     dist/assets/transactions.[d9b3f7].js   45KB gzip (lazy chunk — transaction history)
     dist/assets/payments.[a5c2e4].js       38KB gzip (lazy chunk — Pay Anyone, bill payments)
     dist/assets/settings.[d8b1f6].js       22KB gzip (lazy chunk — account settings)
     dist/assets/index.[a9c3e7].css         12KB gzip
   Bundle size check: PASSED (limit: 200KB — actual: 198KB ✓)
   Tree-shaking: removed 3 unused lodash imports, 2 unused icon components

2. Unit Tests (Jest + React Testing Library) — 2m 48s — PASSED
   312 tests, 0 failures, 0 skipped
   Coverage: 84.2% statements (threshold: 80%)

3. E2E Tests (Playwright) — 4m 15s — PASSED
   48 scenarios: account overview ✓, transaction history ✓, payments ✓, login flow ✓
   Browsers: Chromium, Firefox, WebKit (Safari)
   Note: lazy-loaded modules tested via Playwright page navigation — all modules loaded correctly

4. Bundle Analyser — 1m 10s — PASSED
   Generated treemap report (stored in GitLab artifacts)
   Largest chunks: React DOM (62KB), Redux Toolkit (24KB), React Query (18KB), Axios (12KB)
   No unexpected large dependencies detected

5. S3 Sync + CloudFront Invalidation — 1m 05s — PASSED
   S3 sync: 47 objects uploaded to truebank-truview-web-prod
   CloudFront invalidation created: I-WEB-4820 (/*) — distribution E1K9ABCDEF
   Invalidation status: InProgress at pipeline completion (CloudFront propagation ~5 minutes)

POST-DEPLOY VALIDATION:
- CloudFront health check: HTTP 200 on https://truview.truebank.com.au ✓
- Dynatrace RUM (Real User Monitoring): LCP improved from 1.92s to 1.71s (+220ms) ✓
  Measured over 500 real user sessions in first 30 minutes post-deploy
- First Contentful Paint (FCP): 0.81s (was 1.08s) ✓
- Time to Interactive (TTI): 1.45s (was 1.98s) ✓
- No errors in BFF logs post-deploy ✓

RELATED METRICS POST-DEPLOY:
SLO-TRUVIEW-WEB-LCP: improved from 97.3% → 97.8% compliance (30-day rolling)

GIT DETAILS:
Branch: main
Previous version: v5.11.3 (PIPE-4810-WEB — minor bug fix, last week)`,
    tags: ['pipeline', 'deployment', 'truview-web', 'spa', 'bundle-optimisation', 'vite', 'webpack', 'success', 'chg0104980', 'recent', 'lcp-improvement'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-03T10:14:00Z',
    ingest_ts: '2025-03-03T10:20:00Z',
    ttl_hours: 48,
    meta: { status: 'SUCCESS', duration_min: 14, change_record: 'CHG0104980', author: 'j.blackwood@truebank.com.au' }
  },

  {
    id: 'cicd_deploy_005',
    appid: 'APPID-871198',
    source: 'cicd_pipelines',
    source_label: 'CI/CD',
    record_id: 'PIPE-4780-WEB',
    title: 'Pipeline run — TruView Web BFF v3.9.0 middleware removal (CHG0104601)',
    text: `CI/CD PIPELINE RUN: PIPE-4780-WEB
Application: TruView Web (APPID-871198)
Pipeline: truview-web-bff-prod-deploy
Run ID: PIPE-4780-WEB
Status: SUCCESS
Triggered: 2025-03-03T08:00:00Z (Monday 18:00 AEDT)
Completed: 2025-03-03T08:11:00Z
Duration: 11 minutes
Change record: CHG0104601
Author: James Blackwood (j.blackwood@truebank.com.au)
Commit: b7d3e9a1c5f2b8d4e6a2c7f1b9d5e3a8c4f6b2d7
Commit message: "chore: remove deprecated middleware request-id-echo, legacy-correlation-header, deprecated-session-validator"

PIPELINE STAGES:
1. Build & Unit Test (Node.js 20) — 3m 42s — PASSED
   87 unit tests, 0 failures
   Lint: 0 errors, 0 warnings
2. Integration Tests — 4m 18s — PASSED
   47 BFF integration tests passed (tests include accounts/summary, transaction list, auth token validation)
   Redis mock integration: cache population and retrieval tested ✓
3. Container Image Build — 1m 10s — PASSED
   Image: truview/web-bff:v3.9.0 (SHA: sha256:7c4f9d2a...)
   Previous image: truview/web-bff:v3.8.5 (retained in registry for rollback)
4. Security Scan (Trivy) — 0m 50s — PASSED (0 critical, 1 medium — accepted)
5. ArgoCD Sync (prod-eks-web-01) — 1m 15s — PASSED
   Pods updated: truview-web-bff: 4 pods rolling updated
   Rolling update: 0 downtime (minReadySeconds: 30, maxSurge: 1, maxUnavailable: 0)

POST-DEPLOY VALIDATION:
- BFF health check: https://internal-bff-web.truebank.com/admin/health → {"status":"healthy"} ✓
- accounts/summary p50: 85ms (vs 97ms pre-deploy — 12ms improvement confirmed) ✓
- Circuit breakers: all CLOSED ✓
- No errors in first 5 minutes post-deploy ✓

NOTE: INC0092301 opened approximately 3 hours after this deployment. Investigation is ongoing as
to whether the middleware removal is directly responsible for the Redis cache invalidation race
condition, or if it was a pre-existing issue unmasked by the middleware removal.`,
    tags: ['pipeline', 'deployment', 'truview-web', 'bff', 'middleware', 'success', 'chg0104601', 'recent', 'correlated-incident'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-03T08:11:00Z',
    ingest_ts: '2025-03-03T08:15:00Z',
    ttl_hours: 72,
    meta: { status: 'SUCCESS', duration_min: 11, change_record: 'CHG0104601', author: 'j.blackwood@truebank.com.au' }
  },

  {
    id: 'cicd_history_002',
    appid: 'APPID-871198',
    source: 'cicd_pipelines',
    source_label: 'CI/CD',
    record_id: 'DEPLOY-HISTORY-TRUVIEW-WEB',
    title: 'TruView Web deployment history — last 10 deployments',
    text: `DEPLOYMENT HISTORY: TruView Web (APPID-871198)
Source: GitLab CI/CD + ArgoCD
Last Updated: 2025-03-04T10:00:00Z

Last 10 Production Deployments:

1.  PIPE-4820-WEB | 2025-03-03 10:00 UTC | SUCCESS | CHG0104980 | React SPA v5.12.0 — bundle lazy-loading (340KB→198KB) | j.blackwood
2.  PIPE-4780-WEB | 2025-03-03 08:00 UTC | SUCCESS | CHG0104601 | truview-web-bff v3.9.0 — remove deprecated middleware | j.blackwood
3.  PIPE-4745-WEB | 2025-02-26 03:00 UTC | SUCCESS | (no CHG — hotfix) | BFF v3.8.5 — Redis TTL hotfix (account TTL 180s→300s under load) | p.sharma
4.  PIPE-4710-WEB | 2025-02-24 22:00 UTC | SUCCESS | CHG0104512 | React SPA v5.11.3 — accessibility fixes (WCAG 2.1 AA compliance for screen reader support) | design-system-team
5.  PIPE-4688-WEB | 2025-02-21 03:00 UTC | SUCCESS | CHG0104478 | BFF v3.8.4 — circuit breaker threshold tuning (timeout 15s→30s for legacy-dda-adapter calls) | m.okonkwo
6.  PIPE-4650-WEB | 2025-02-19 22:00 UTC | FAILED (auto-rollback 4min) | React SPA v5.11.1-rc — Playwright E2E failure on Safari payments flow (webkit timing issue) | j.blackwood
7.  PIPE-4621-WEB | 2025-02-18 03:00 UTC | SUCCESS | CHG0104389 | BFF v3.8.3 — structured JSON logging (replaces unstructured console.log — required for Splunk ingestion) | web-platform-team
8.  PIPE-4590-WEB | 2025-02-14 22:00 UTC | SUCCESS | CHG0104310 | React SPA v5.11.0 — new Pay Anyone UI (QuickPay flow) | j.blackwood
9.  PIPE-4555-WEB | 2025-02-10 03:00 UTC | SUCCESS | CHG0104220 | BFF v3.8.2 — HPA min replicas 3→4 (sustained load increase post-Jan growth) | m.okonkwo
10. PIPE-4520-WEB | 2025-02-07 22:00 UTC | SUCCESS | CHG0104180 | React SPA v5.10.4 — transaction category icons refresh (new design system tokens) | design-system-team

DEPLOYMENT CADENCE: Average 2.3 deployments/week for TruView Web (mix of SPA and BFF deployments)
FAILURE RATE (last 30 days): 1 failure in 10 deployments (10%) — auto-recovered within 4 minutes
ROLLBACK CAPABILITY: All deployments tagged in GitLab registry; BFF rollback via kubectl rollout undo; SPA rollback via previous S3 objects + CloudFront invalidation
DEPLOYMENT WINDOW: BFF deployments: any time (rolling update, zero downtime); SPA deployments: preferred after 20:00 AEDT (low traffic)`,
    tags: ['deployment-history', 'truview-web', 'pipeline', 'recent', 'bff', 'spa', 'cadence', 'success', 'failure-rate'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-04T10:00:00Z',
    ingest_ts: '2025-03-04T10:00:00Z',
    ttl_hours: 4,
    meta: { deployment_count: 10, failure_rate: '10%', avg_per_week: 2.3 }
  },

  {
    id: 'cicd_history_003',
    appid: 'APPID-871204',
    source: 'cicd_pipelines',
    source_label: 'CI/CD',
    record_id: 'DEPLOY-HISTORY-TRUVIEW-MOBILE',
    title: 'TruView Mobile deployment history — last 10 deployments',
    text: `DEPLOYMENT HISTORY: TruView Mobile (APPID-871204)
Source: GitLab CI/CD + ArgoCD (BFF/backend) + App Store Connect / Play Console (native apps)
Last Updated: 2025-03-04T10:00:00Z

Last 10 Production Deployments (BFF and backend — not native app releases):

1.  PIPE-4756-PROD    | 2025-03-04 03:15 UTC | SUCCESS | CHG0104756 | notification-service v2.4.1 — firebase-admin 11.0.1 (firebase-messaging 9.3.2) — CORRELATED WITH INC0091205 | t.vance
2.  PIPE-HOTFIX-4756  | 2025-03-04 PENDING   | PENDING CAB APPROVAL | notification-service v2.4.0 rollback (revert firebase-admin to 10.3.0) | t.vance
3.  PIPE-4730-MOB     | 2025-03-01 22:00 UTC | SUCCESS | CHG0104698 | Mobile BFF v2.8.4 — FCM token endpoint improvements (partial fix; INC0092418 later found residual Mule rate limit issue) | t.vance
4.  PIPE-4700-MOB     | 2025-02-27 03:00 UTC | SUCCESS | CHG0104615 | Mobile BFF v2.8.3 — account summary payload optimisation (JSON response 60% smaller — strips unused fields) | t.vance
5.  PIPE-4665-MOB     | 2025-02-24 22:00 UTC | SUCCESS | CHG0104559 | notification-service v2.3.8 — retry queue depth metrics (Dynatrace custom metric: notification.retry.queue.depth) | t.vance
6.  PIPE-4630-MOB     | 2025-02-20 03:00 UTC | SUCCESS | CHG0104480 | Mobile BFF v2.8.2 — HPA min replicas 4→5 (pre-peak-season capacity increase per Q1 plan) | m.okonkwo
7.  PIPE-4601-MOB     | 2025-02-17 22:00 UTC | SUCCESS | CHG0104420 | notification-service v2.3.7 — APNs certificate hot-swap (deploy new cert expiring 2026-01-15, retire old cert) | t.vance
8.  PIPE-4575-MOB     | 2025-02-14 03:00 UTC | SUCCESS | CHG0104355 | Mobile BFF v2.8.1 — biometric re-auth threshold $500→$1,000 (business change approved by Digital Banking Leadership) | t.vance
9.  PIPE-4540-MOB     | 2025-02-10 22:00 UTC | FAILED (auto-rollback 5min) | Mobile BFF v2.8.0 — null pointer exception in /api/mobile/devices/token-refresh under load (missed in unit tests — load test revealed issue) | t.vance
10. PIPE-4510-MOB     | 2025-02-07 03:00 UTC | SUCCESS | CHG0104250 | notification-service v2.3.6 — FCM batch size limit fix (was sending batches of 1000 tokens; FCM max is 500 per call) | t.vance

NATIVE APP RELEASE HISTORY (most recent, separate from backend deployments):
- iOS v4.2.7: Released 2025-02-28 (App Store) — bug fixes, accessibility improvements, Face ID stability fix
- Android v4.2.7: Released 2025-02-26 (Play Store) — same feature set as iOS v4.2.7, Jetpack Compose migration for Settings screen
- iOS v4.2.6: Released 2025-01-31 — Quick Balance widget (iOS 17 interactive widget)
- Android v4.2.6: Released 2025-01-29 — Home screen widget, Pixel-optimised Compose UI

DEPLOYMENT CADENCE: Average 2.1 BFF/backend deployments/week; native app releases: ~2 per month
FAILURE RATE (backend, last 30 days): 1 failure in 10 (10%) — all auto-recovered
ROLLBACK CAPABILITY: BFF rollback via kubectl rollout undo (<5 min); notification-service rollback via ArgoCD image override; native app rollback requires App Store expedited review (iOS: 24-48h) or staged rollout pause (Android: immediate)`,
    tags: ['deployment-history', 'truview-mobile', 'pipeline', 'recent', 'bff', 'notification-service', 'cadence', 'native-app', 'ios', 'android'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-04T10:00:00Z',
    ingest_ts: '2025-03-04T10:00:00Z',
    ttl_hours: 4,
    meta: { deployment_count: 10, failure_rate: '10%', avg_per_week: 2.1 }
  },

];
