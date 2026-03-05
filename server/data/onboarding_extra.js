// Onboarding extra synthetic data — per-team guides, SRE playbook, dev workflow, post-mortems

export const onboardingExtra = [

  {
    id: 'onboard_core_001',
    appid: 'APPID-973193',
    source: 'confluence_onboarding',
    source_label: 'Onboarding',
    record_id: 'ONBOARD-CORE-003',
    title: 'TruView Core — New Engineer Deep Dive Guide',
    text: `ONBOARDING GUIDE: TruView Core — Engineering Deep Dive
Document: /wiki/spaces/TRUVIEW/pages/Core-Engineer-Onboarding
Last Updated: 2025-02-15
Owner: David Nguyen (Platform Engineering EM)

TRUVIEW CORE OVERVIEW:
TruView Core (APPID-973193) is the backend platform that all TruView channels depend on.
It consists of 6 primary microservices deployed on prod-eks-trueview-01 (AWS EKS, ap-southeast-2).

MICROSERVICES:
1. account-service (Java 17, Spring Boot 3.2)
   - Owns account balance and profile data
   - Reads from RDS PostgreSQL (primary) + Redis cache (TTL 60s)
   - Exposes: GET /api/v3/accounts/{accountId}/summary, GET /api/v3/accounts/{accountId}/profile
   - Publishes: AccountBalanceUpdated events to Kafka topic truview-core-account-events
   - Repo: gitlab.truebank.com.au/truview/account-service
   - Tech lead: Amir Hassan (a.hassan@truebank.com.au)

2. transaction-service (Java 17, Spring Boot 3.2)
   - Owns transaction history search and categorisation
   - Backed by Elasticsearch 8.11 (7-day hot tier) + S3/Athena (cold storage > 7 days)
   - Exposes: GET /api/v3/transactions (paginated, filterable), GET /api/v3/transactions/recent
   - Repo: gitlab.truebank.com.au/truview/transaction-service
   - Tech lead: Yuki Tanaka (y.tanaka@truebank.com.au)

3. payment-service (Java 17, Spring Boot 3.2)
   - Processes Pay Anyone and BPAY payments
   - Integrates with Mule API Gateway → legacy-dda-adapter → Core Banking (IBM Mainframe z/OS)
   - Fraud evaluation: synchronous call to fraud-evaluation-service (p95 ~450ms) before settlement
   - Exposes: POST /api/v3/payments/initiate, GET /api/v3/payments/{paymentId}/status
   - Repo: gitlab.truebank.com.au/truview/payment-service
   - Tech lead: Amir Hassan (a.hassan@truebank.com.au)

4. auth-adapter (Node.js 20, Express)
   - Validates JWT tokens issued by TrueBank IAM (Okta-hosted)
   - Rate limiting: 100 token validation requests/second per upstream service
   - Stateless — no database; calls Okta JWKS endpoint with local key cache (TTL 300s)
   - Repo: gitlab.truebank.com.au/truview/auth-adapter
   - Tech lead: James Blackwood (j.blackwood@truebank.com.au) — shared with Web

5. notification-service (Node.js 20, Express)
   - Sends push notifications via Firebase FCM (Android) and Apple APNs (iOS)
   - Backed by Redis queue (retry queue), publishes metrics to Dynatrace
   - Shared with TruView Mobile — Mobile BFF calls this service
   - Repo: gitlab.truebank.com.au/truview/notification-service
   - Tech lead: Thomas Vance (t.vance@truebank.com.au)

6. acct-sync-processor (Java 17, Spring Boot 3.2)
   - Kafka consumer group: acct-sync-processor
   - Consumes: truview-core-account-events (AccountBalanceUpdated events)
   - Syncs account data to downstream systems (reporting DB, fraud scoring engine)
   - Active incident: INC0089341 — consumer lag 47,000 messages (memory leak investigation)
   - Repo: gitlab.truebank.com.au/truview/acct-sync-processor
   - Tech lead: Amir Hassan

KAFKA TOPICS (AWS MSK, ap-southeast-2):
- truview-core-account-events: AccountBalanceUpdated, AccountProfileChanged
- truview-core-payment-events: PaymentInitiated, PaymentSettled, PaymentFailed
- truview-core-notification-events: NotificationRequested, NotificationDelivered
- Retention: 7 days | Replication: 3 | Min ISR: 2
- Schema registry: AWS Glue Schema Registry (Avro)

DATABASE LAYER:
- RDS PostgreSQL 15.4 (primary: db.r6g.xlarge) — accounts, payment records
- Read replica (db.r6g.large) — all read traffic from transaction-service secondary queries
- Redis (ElastiCache, cluster mode, 6 nodes) — shared caching layer across all services
- Elasticsearch 8.11 (AWS OpenSearch 2.11) — transaction search index

LOCAL DEVELOPMENT:
1. git clone git@gitlab.truebank.com.au:truview/truview-core.git
2. cd truview-core && cp .env.example .env.local
3. docker-compose up -d  # starts Kafka (Confluent), PostgreSQL, Redis, mock Elasticsearch
4. ./mvnw spring-boot:run -pl account-service  # run individual service
5. Postman collection: /wiki/spaces/TRUVIEW/pages/Core-API-Postman-Collection
6. Integration tests against local stack: ./mvnw verify -pl account-service -Pintegration

COMMON PITFALLS FOR NEW ENGINEERS:
- Do NOT test against prod Kafka topics. Use local Confluent container or staging.
- Redis TTL changes require a code review with SRE. Incorrect TTLs caused INC0089341 previously.
- The legacy-dda-adapter has a known 30s timeout ceiling. Do not set upstream timeouts higher.
- Never use console.log in Java services — structured logging only (Logback/SLF4J + JSON encoder).
- Account balance updates are eventually consistent (Kafka delay). Do not assume sync updates.`,
    tags: ['onboarding', 'truview-core', 'microservices', 'kafka', 'java', 'architecture', 'local-dev', 'account-service', 'payment-service'],
    classification: 'INTERNAL',
    freshness_ts: '2025-02-15T10:00:00Z',
    ingest_ts: '2025-03-04T01:00:00Z',
    ttl_hours: 168,
    meta: { doc_type: 'Team Onboarding Guide', owner: 'david.nguyen@truebank.com.au', appid: 'APPID-973193' }
  },

  {
    id: 'onboard_web_001',
    appid: 'APPID-871198',
    source: 'confluence_onboarding',
    source_label: 'Onboarding',
    record_id: 'ONBOARD-WEB-004',
    title: 'TruView Web — New Engineer Deep Dive Guide',
    text: `ONBOARDING GUIDE: TruView Web — Engineering Deep Dive
Document: /wiki/spaces/TRUVIEW/pages/Web-Engineer-Onboarding
Last Updated: 2025-03-01
Owner: James Blackwood (Web Platform EM)

TRUVIEW WEB OVERVIEW:
TruView Web (APPID-871198) delivers the bank-grade SPA experience at https://truview.truebank.com.au.
Two deployable components: React SPA (CloudFront + S3) and truview-web-bff (EKS).

REACT SPA (truview-web-spa):
- Framework: React 18.2 + Vite 5.0 + React Router 6.4
- State: Redux Toolkit (RTK) for global state + React Query 5 for server state
- UI: Custom design system tokens (CSS variables) — no component library
- Build: Vite (dev) + Webpack 5 (production bundle analyser only for reporting)
- Testing: Jest 29 + React Testing Library 14 + Playwright 1.42 (E2E)
- Current version: v5.12.0 (deployed 2025-03-03)
- Repo: gitlab.truebank.com.au/truview/truview-web-spa
- Tech lead: James Blackwood

KEY SCREENS:
- /dashboard → account overview (Redux: accountSlice)
- /transactions → transaction history, filterable (React Query: useTransactions)
- /pay → Pay Anyone and BPAY (form flow: PayAnyoneForm, BpayForm)
- /settings → account settings, notification prefs (lazy-loaded chunk)
- Auth: OAuthRedirect → Okta PKCE flow → TokenStore (sessionStorage, never localStorage)

TRUVIEW WEB BFF (truview-web-bff):
- Runtime: Node.js 20, Express 4.18
- Current version: v3.9.0 (deployed 2025-03-03 — CHG0104601)
- EKS: prod-eks-web-01, namespace: truview-web, 4 replicas (HPA 4–10)
- Repo: gitlab.truebank.com.au/truview/truview-web-bff
- Key routes:
    GET  /api/v2/accounts/summary       → account-service + Redis cache (TTL 180s normal / 300s under load)
    GET  /api/v2/transactions           → transaction-service (paginated)
    GET  /api/v2/transactions/recent    → transaction-service (last 5, fast path)
    POST /api/v2/payments/initiate      → payment-service (fraud check included, p95 ~680ms)
    GET  /api/v2/auth/token             → auth-adapter (JWT validation)
- Redis: shared ElastiCache cluster, BFF uses key prefix "web-bff:"
- Active alert: ALERT-WEB-4412 — Redis cache hit rate 71% (INC0092301 — race condition in cache invalidation)

INFRASTRUCTURE:
- CloudFront (E1K9ABCDEF): global CDN, edge nodes in Sydney, Melbourne, Singapore, Auckland
- S3 bucket: truebank-truview-web-prod (private, OAC only via CloudFront)
- SPA deployment: S3 sync + CloudFront invalidation (/* after each deploy)
- BFF deployment: Docker image → ECR → ArgoCD (GitOps) → EKS rolling update

LOCAL DEVELOPMENT:
1. git clone git@gitlab.truebank.com.au:truview/truview-web-spa.git
2. npm install && cp .env.example .env.local
3. npm run dev  # Vite dev server on localhost:5173 (proxies /api to BFF)
4. BFF local: git clone truview-web-bff && npm install && npm run dev  # port 3001
5. E2E: npx playwright test (requires BFF running + mock backend in .env.local)
6. Storybook: npm run storybook  # component library browser on localhost:6006

CI/CD PIPELINE (GitLab):
Stage 1: Build (Vite) — 5-6 min
Stage 2: Unit Tests (Jest) — 3 min
Stage 3: E2E (Playwright, 3 browsers) — 4-5 min
Stage 4: Bundle Analyser (treemap) — 1 min
Stage 5: S3 Sync + CloudFront Invalidation — 1 min

COMMON PITFALLS:
- SPA tokens are in sessionStorage (not localStorage or cookies) — never change this (security policy ADR-065)
- All financial amounts use Dinero.js for decimal precision — never use floating point arithmetic for money
- Lazy-loaded chunks: do not import from /transactions or /pay modules in the initial bundle
- BFF caches account summary for 180s — if testing fresh data, use ?cache=false query param (dev only; stripped in prod by BFF middleware)
- Playwright Safari timing: WebKit is slower; add waitForLoadState('networkidle') on lazy-loaded routes

DESIGN SYSTEM:
All UI tokens are CSS variables defined in src/styles/tokens.css
Do not hardcode colours or spacing. Use: var(--colour-brand-primary), var(--space-4), etc.
Token changes require design-system-team review (slack: #design-system)`,
    tags: ['onboarding', 'truview-web', 'react', 'spa', 'bff', 'node', 'vite', 'playwright', 'local-dev', 'cloudfront'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-01T10:00:00Z',
    ingest_ts: '2025-03-04T01:00:00Z',
    ttl_hours: 168,
    meta: { doc_type: 'Team Onboarding Guide', owner: 'j.blackwood@truebank.com.au', appid: 'APPID-871198' }
  },

  {
    id: 'onboard_mobile_001',
    appid: 'APPID-871204',
    source: 'confluence_onboarding',
    source_label: 'Onboarding',
    record_id: 'ONBOARD-MOBILE-005',
    title: 'TruView Mobile — New Engineer Deep Dive Guide',
    text: `ONBOARDING GUIDE: TruView Mobile — Engineering Deep Dive
Document: /wiki/spaces/TRUVIEW/pages/Mobile-Engineer-Onboarding
Last Updated: 2025-02-20
Owner: Thomas Vance (Mobile Platform EM)

TRUVIEW MOBILE OVERVIEW:
TruView Mobile (APPID-871204) delivers native iOS and Android banking apps.
Current live versions: iOS v4.2.7 (App Store), Android v4.2.7 (Play Store)
420,000+ daily active sessions; morning peak 07:00–09:00 AEST.

MOBILE APPS:
iOS (Swift / SwiftUI):
- Minimum iOS: 16.0 (covers 97.3% of TruView user base)
- Architecture: MVVM + Combine for reactive bindings
- Keychain: token storage only (never NSUserDefaults for auth)
- Face ID / Touch ID: Local Authentication framework; biometric re-auth threshold $1,000 (CHG0104355)
- Push: APNs (Apple Push Notification service) — certificate valid until 2026-01-15
- Repo: gitlab.truebank.com.au/truview/truview-ios

Android (Kotlin / Jetpack Compose):
- Minimum Android: API 28 (Android 9.0) — covers 96.1% of user base
- Architecture: MVVM + ViewModel + StateFlow
- Keystore: EncryptedSharedPreferences for token storage
- Biometric: BiometricPrompt API; same $1,000 threshold
- Push: Firebase Cloud Messaging (FCM) — currently degraded on token-refresh endpoint (INC0092418)
- Repo: gitlab.truebank.com.au/truview/truview-android

TRUVIEW MOBILE BFF (truview-mobile-bff):
- Runtime: Node.js 20, Express 4.18
- Current version: v2.8.4 (deployed 2025-03-01)
- EKS: prod-eks-mobile-01, namespace: truview-mobile, 5 replicas (HPA 5–12)
- Repo: gitlab.truebank.com.au/truview/truview-mobile-bff
- Key routes:
    GET  /api/mobile/v2/accounts/summary        → account-service (JSON 60% smaller — strips unused fields)
    GET  /api/mobile/v2/transactions/recent     → transaction-service (last 10 items, sorted by date)
    POST /api/mobile/devices/register           → registers FCM/APNs device token
    POST /api/mobile/devices/token-refresh      → updates stale device tokens (INC0092418 — 429 errors from Mule)
    POST /api/mobile/v2/payments/quick-transfer → payment-service (Quick Transfer flow)
- Redis: TTL 120s for account summary, 30s for recent transactions (faster TTLs than Web for freshness)
- Circuit breaker: notification-service currently HALF-OPEN (recovering — INC0091205)

NOTIFICATION SERVICE (shared with TruView Core):
- Manages APNs and FCM delivery
- Active issue: INC0091205 — iOS push delivery rate 88.1% (SLO target: 98%)
  Root cause: firebase-messaging 9.3.2 creates new APNs connection per notification batch
  Fix: rollback to firebase-admin 10.3.0 — PIPE-HOTFIX-4756 pending CAB approval
- Retry queue: Redis-backed; max 3 retries with exponential backoff (1s, 4s, 16s)

NATIVE APP RELEASE PROCESS:
iOS:
1. Create release branch: release/ios/v4.x.x
2. Increment build number (CFBundleVersion): auto-incremented by Fastlane
3. Run Fastlane: bundle exec fastlane ios beta  (uploads to TestFlight)
4. TestFlight QA: minimum 48 hours internal testing before App Store submission
5. App Store review: typically 24–48h; expedited review available for critical fixes
6. Staged rollout: 10% → 50% → 100% (24h between stages)

Android:
1. Create release branch: release/android/v4.x.x
2. Run Fastlane: bundle exec fastlane android deploy (signs + uploads to Play Console)
3. Internal testing track → closed testing (48h) → production staged rollout
4. Staged rollout: 5% → 20% → 100% (monitor crash rate + ANR rate in Play Console before expanding)
5. CRITICAL: Android rollout can be paused immediately if crash rate > 0.5%

LOCAL DEVELOPMENT (iOS):
1. git clone git@gitlab.truebank.com.au:truview/truview-ios.git
2. cd truview-ios && open TruView.xcodeproj
3. Select "Development" scheme (points to staging BFF, not prod)
4. Run on Simulator (iPhone 15 Pro) or physical device (requires developer provisioning profile)
5. Mock push notifications: use ./scripts/simulate_apns.sh to send simulated payloads

LOCAL DEVELOPMENT (Android):
1. git clone git@gitlab.truebank.com.au:truview/truview-android.git
2. Open in Android Studio Hedgehog (2023.1.1+)
3. Select "staging" flavour (not prod) — buildVariants panel
4. Run on emulator (Pixel 7 API 34) or physical device with USB debugging

COMMON PITFALLS:
- Never commit .p12 certificate files or GoogleService-Info.plist to git (secrets manager only)
- iOS Simulator does NOT support push notifications — test on physical device or use simulate_apns.sh
- Android: FCM token changes on app reinstall — ensure token-refresh endpoint handles 429 gracefully (INC0092418)
- Binary size limit: iOS IPA < 100MB OTA / Android APK < 150MB (Play Store limits)
- Dark mode: all UI must support dark mode (iOS: trait collection; Android: DayNight theme). Screenshot both in PR.`,
    tags: ['onboarding', 'truview-mobile', 'ios', 'android', 'swift', 'kotlin', 'bff', 'push', 'apns', 'fcm', 'local-dev', 'fastlane'],
    classification: 'INTERNAL',
    freshness_ts: '2025-02-20T10:00:00Z',
    ingest_ts: '2025-03-04T01:00:00Z',
    ttl_hours: 168,
    meta: { doc_type: 'Team Onboarding Guide', owner: 't.vance@truebank.com.au', appid: 'APPID-871204' }
  },

  {
    id: 'onboard_sre_001',
    appid: 'ALL',
    source: 'confluence_onboarding',
    source_label: 'Onboarding',
    record_id: 'ONBOARD-SRE-006',
    title: 'TruView SRE — On-Call Handbook and Incident Playbook',
    text: `SRE ON-CALL HANDBOOK: TruView Platform
Document: /wiki/spaces/SRE/pages/TruView-OnCall-Handbook
Last Updated: 2025-02-28
Owner: Marcus Okonkwo (SRE Lead)

ON-CALL STRUCTURE:
Primary on-call: rotates weekly among SRE team (Marcus Okonkwo, Priya Sharma, + 2 senior engineers)
Schedule: PagerDuty — truview-core-oncall, truview-web-oncall, truview-mobile-oncall
Hours: 24/7/365. Primary on-call carries pager. Secondary is backup if primary unreachable.
Response SLAs: SEV1 acknowledge within 5 min / SEV2 within 15 min / SEV3 within 2 hours.

SEVERITY DEFINITIONS:
SEV1 — Customer-facing outage or data integrity risk:
  - Total login failure / authentication down
  - Payment processing fully unavailable
  - Account balance incorrectly displayed to 1,000+ users
  - SLO availability breach (< 99.9% in rolling hour)
  Action: Immediate page, war room in #truview-incident-bridge, executive notification

SEV2 — Significant degradation affecting >5% of users:
  - Push notification delivery < 90% (iOS or Android)
  - p95 latency > 2,000ms sustained for 10+ minutes
  - Kafka consumer lag > 100,000 messages on any mission-critical topic
  - Redis cache hit rate < 70% causing widespread stale data
  Action: Page on-call, open incident bridge, notify EM

SEV3 — Partial degradation, <5% of users affected:
  - p95 latency elevated but < 2,000ms (current INC0092301 is SEV3)
  - FCM token-refresh 429 errors (current INC0092418 is SEV3)
  - Non-critical SLO breached
  Action: Create ServiceNow incident, assign to relevant team, monitor

SEV4 — Minor issue, no user impact:
  - Build pipeline non-critical failure
  - Non-production environment degradation
  - Informational alerts (capacity planning signals)
  Action: Create ticket, schedule work in next sprint

INCIDENT RESPONSE PROCESS:
1. DETECT: PagerDuty alert or manual escalation
2. ACKNOWLEDGE: Respond in PagerDuty within SLA. Join #truview-incident-bridge.
3. TRIAGE (first 10 minutes):
   a. Confirm scope: which app? which endpoint? what % of users?
   b. Check Dynatrace: service health, error rate, latency, recent deploys
   c. Check ServiceNow: any recent change records in last 2 hours?
   d. Check GitLab CI/CD: any pipeline runs in last 4 hours?
   e. Post initial assessment to bridge: "Investigating: [symptom]. Likely cause: [hypothesis]."
4. CONTAIN: If cause is a recent deployment, initiate rollback immediately (do not wait to confirm)
5. DIAGNOSE: Logs (Splunk: index=truview-prod), metrics (Dynatrace), circuit breakers
6. RESOLVE: Fix or rollback. Verify with health checks and Dynatrace metrics.
7. COMMUNICATE: Update ServiceNow incident notes every 30 minutes. Notify stakeholders at resolution.
8. POST-INCIDENT: PIR due within 3 business days (SRE creates draft, EM reviews, team signs off)

DYNATRACE DASHBOARDS:
- TruView Core: https://truebank.dynatrace.com/dashboard#truview-core-prod
- TruView Web: https://truebank.dynatrace.com/dashboard#truview-web-prod
- TruView Mobile: https://truebank.dynatrace.com/dashboard#truview-mobile-prod
- SLO Overview: https://truebank.dynatrace.com/slo-overview

KUBERNETES QUICK REFERENCE (EKS):
# Get pod status
kubectl get pods -n truview-core
kubectl get pods -n truview-web
kubectl get pods -n truview-mobile

# Check pod logs
kubectl logs -n truview-core deploy/account-service --tail=200 -f

# Rollback a deployment (immediate — use before ArgoCD sync)
kubectl rollout undo deployment/truview-web-bff -n truview-web

# Check HPA scaling state
kubectl get hpa -n truview-core

# Redis cache inspection (staging only — never prod without SRE lead approval)
redis-cli -h $REDIS_HOST -p 6379 --tls -a $REDIS_AUTH KEYS "web-bff:*" | head -20

SPLUNK SEARCH (incident triage):
index=truview-prod source=truview-web-bff level=ERROR earliest=-30m
index=truview-prod source=notification-service "APNs" earliest=-1h
index=truview-prod source=account-service "cache miss" | stats count by endpoint earliest=-15m

COMMON RUNBOOK LOCATIONS:
- KB0041033: TruView Web BFF triage (Redis/cache issues)
- KB0044112: CloudFront cache invalidation failures
- KB0052891: iOS push notification / APNs rollback procedure
- KB0055204: TruView Mobile scaling (HPA emergency scale)
- KB0058374: Elasticsearch slow queries (transaction-service)
- All runbooks: /wiki/spaces/SRE/pages/Runbooks`,
    tags: ['onboarding', 'sre', 'on-call', 'incident', 'severity', 'playbook', 'dynatrace', 'kubernetes', 'splunk', 'runbooks', 'pagerduty'],
    classification: 'INTERNAL',
    freshness_ts: '2025-02-28T10:00:00Z',
    ingest_ts: '2025-03-04T01:00:00Z',
    ttl_hours: 168,
    meta: { doc_type: 'SRE Handbook', owner: 'm.okonkwo@truebank.com.au' }
  },

  {
    id: 'onboard_cicd_devwf_001',
    appid: 'ALL',
    source: 'confluence_onboarding',
    source_label: 'Onboarding',
    record_id: 'ONBOARD-DEVWORKFLOW-007',
    title: 'TruView — Development Workflow, Branching, and Change Management',
    text: `DEVELOPER WORKFLOW GUIDE: TruView Platform
Document: /wiki/spaces/TRUVIEW/pages/Dev-Workflow-and-Change-Management
Last Updated: 2025-02-12
Owner: Platform Engineering

GIT BRANCHING STRATEGY:
All TruView repos follow trunk-based development with short-lived feature branches.

main         — production. Protected. Requires 2 approvals + all CI checks green.
staging      — pre-production. Auto-deploys to staging EKS on merge.
feature/*    — feature branches. Branch from main. Merge via MR (merge request). Max 2 days lifespan.
hotfix/*     — urgent production fixes. Branch from main, direct MR to main after SRE approval.
release/*    — native app releases only (iOS/Android). Managed by Fastlane.

COMMIT MESSAGE FORMAT:
<type>(<scope>): <short description>
Types: feat, fix, chore, refactor, perf, test, docs, ci
Examples:
  feat(payments): add BPAY reference validation
  fix(bff): resolve Redis cache stampede on accounts/summary
  chore(deps): bump firebase-admin 10.3.0→11.0.1
  perf(spa): lazy-load transactions and payments modules

MERGE REQUEST (MR) REQUIREMENTS:
- Title follows commit message format
- Description: What changed? Why? How tested?
- 2 peer approvals (1 must be tech lead for architectural changes)
- All CI stages green (build, unit tests, E2E for SPA changes)
- No unresolved review comments
- Change record linked in MR description for production-impacting changes

CHANGE ADVISORY BOARD (CAB) PROCESS:
All production deployments require a ServiceNow Change Record (CHG).
- Standard changes: submit CHG 5 business days before planned deploy; auto-approved if low risk template
- Normal changes: CAB review Tuesday/Thursday 10:00 AEST; requires risk assessment, rollback plan, test evidence
- Emergency changes: #cab-emergency Slack channel; requires CTO approval; post-hoc documentation within 24h
- Hotfix exception: SRE lead can approve hotfix deploys out-of-hours (must raise CHG retrospectively)

DEPLOYMENT WINDOWS:
- TruView Core microservices: any time (rolling updates, zero downtime)
- TruView Web BFF: any time (rolling updates, zero downtime)
- TruView Web SPA (CloudFront/S3): preferred 20:00–22:00 AEST weekdays (low traffic) — not a hard rule
- TruView Mobile BFF: any time (rolling updates, zero downtime)
- Native app releases (iOS/Android): submit any time; production rollout coordinated with Mobile EM
- Database migrations: maintenance window only — Saturdays 02:00–05:00 AEST (requires DBA approval)

ENVIRONMENTS:
dev:        shared development EKS. Auto-deploys on merge to feature/* branches. No CAB needed.
staging:    production-mirror EKS. Auto-deploys on merge to staging. Performance/integration testing here.
prod:       production EKS. Deploys via ArgoCD GitOps sync after CAB approval.

ARGOCD (GitOps):
- UI: https://argocd.internal.truebank.com.au
- Each service has an ArgoCD Application syncing from the service's Helm chart in GitLab
- Sync is manual for prod (requires ArgoCD approval role). Auto-sync for dev/staging.
- Image tags: services use immutable SHA-pinned tags in prod (never "latest")
- Rollback: ArgoCD → Application → History → sync previous revision (faster than kubectl rollout undo)

FEATURE FLAGS:
- Tool: AWS AppConfig (centrally managed by Platform Engineering)
- Flags are evaluated at BFF level — SPA and native apps receive feature availability in the /api/*/accounts/summary response
- New features behind flags: flag must be on in dev→staging before prod
- Flag cleanup: remove flag + code within 2 sprints of full prod rollout (tech debt policy)

CODE REVIEW CULTURE:
- Reviewers must check for: correctness, security, performance, observability (are new paths logged?)
- Leave comments as suggestions, not demands
- "Nit:" prefix for non-blocking style suggestions
- Tech leads unblock stalled MRs (48h without response → escalate to EM)
- Mobile PRs: always include screenshots of light mode + dark mode`,
    tags: ['onboarding', 'workflow', 'branching', 'git', 'cicd', 'change-management', 'cab', 'argocd', 'feature-flags', 'deployment'],
    classification: 'INTERNAL',
    freshness_ts: '2025-02-12T10:00:00Z',
    ingest_ts: '2025-03-04T01:00:00Z',
    ttl_hours: 168,
    meta: { doc_type: 'Developer Workflow Guide', owner: 'Platform Engineering' }
  },

  {
    id: 'onboard_postmortem_001',
    appid: 'ALL',
    source: 'confluence_onboarding',
    source_label: 'Onboarding',
    record_id: 'ONBOARD-PIR-EXAMPLES-008',
    title: 'TruView — Post-Incident Review (PIR) examples and blameless culture guide',
    text: `POST-INCIDENT REVIEW GUIDE: TruView Platform
Document: /wiki/spaces/SRE/pages/PIR-Guide-and-Examples
Last Updated: 2025-01-30
Owner: Marcus Okonkwo (SRE Lead)

BLAMELESS CULTURE:
TruView follows the Google SRE model of blameless post-mortems. The goal is to understand
system failure, not assign individual blame. Engineers are expected to share information
openly. "This was my change" is valued — it helps root cause analysis, not career impact.
Blame impedes learning and reduces future reporting. The system is always the root cause.

PIR TEMPLATE:
All PIRs must be completed within 3 business days of incident resolution.
Template: /wiki/spaces/SRE/pages/PIR-Template

Sections:
1. Summary: 1-paragraph overview (what happened, when, impact)
2. Timeline: chronological events (UTC timestamps, actioned by whom)
3. Root Cause: technical root cause (not person root cause)
4. Contributing Factors: environmental, process, or tooling gaps
5. Impact: user impact (% of users, duration, SLO budget burned)
6. What Went Well: detection speed, response, comms, tools
7. What Didn't Go Well: gaps in alerting, runbooks, process
8. Action Items: specific, assigned, time-bound improvements

EXAMPLE PIR SUMMARY — INC0089341 (Kafka consumer lag):
Incident: Consumer lag on acct-sync-processor reached 47,000 messages.
Root cause: Memory leak in AccountEvent deserialization — heap exhaustion caused consumer slowdown.
Impact: Reporting DB sync delayed 4+ hours; no user-visible impact (read paths unaffected).
What went well: Dynatrace alert fired at 5,000 messages lag; SRE responded in 8 minutes.
What didn't go well: Memory leak had been present for 6 days before triggering alert.
Action items:
  - Reduce lag alert threshold from 5,000 → 1,000 messages [m.okonkwo, due 2025-03-10]
  - Add heap memory dashboard to Dynatrace consumer monitoring [a.hassan, due 2025-03-14]
  - Add integration test for large AccountEvent payload deserialization [a.hassan, due 2025-03-21]

EXAMPLE PIR SUMMARY — INC0091205 (iOS push degradation):
Incident: iOS push delivery dropped to 88.1% (SLO: 98%) after firebase-admin upgrade.
Root cause: firebase-messaging 9.3.2 creates a new APNs connection per notification batch,
exhausting the APNs connection pool. Baseline: <5 resets/hour; incident: 340 resets/hour.
Impact: 11.9% of iOS push notifications undelivered. Duration: ongoing (rollback pending CAB).
What went well: Dynatrace P-3887 alert fired within 3 minutes of deployment.
What didn't go well: firebase-admin release notes did not document APNs connection behavior change.
Integration tests did not cover APNs connection pool exhaustion under load.
Action items:
  - Rollback firebase-admin to 10.3.0 [t.vance, pending CAB] — PIPE-HOTFIX-4756
  - Add load test for notification-service APNs connection pool [t.vance, due 2025-03-21]
  - Update firebase-admin upgrade checklist: test APNs under load in staging [Platform Eng, due 2025-03-14]

EXAMPLE PIR SUMMARY — PIPE-4650-WEB (failed SPA deploy):
Incident: React SPA v5.11.1-rc deployment auto-rolled back in 4 minutes.
Root cause: Playwright E2E test failure on Safari (WebKit) payments flow — race condition in
  payment confirmation modal. waitForSelector timeout on webkit vs chromium timing difference.
Impact: Zero user impact (auto-rollback before CloudFront invalidation completed).
What went well: E2E testing caught the issue before any user traffic hit the new version.
What didn't go well: WebKit timing differences were not caught in local developer testing
  (developers test Chrome). CI pipeline runs WebKit but was only added 2 sprints ago.
Action items:
  - Add webkit-specific wait in PaymentConfirmModal.test.ts [j.blackwood, due 2025-02-28] ✓ DONE
  - Add WebKit browser to developer Playwright config (playwright.config.local.ts) [j.blackwood] ✓ DONE

MEETING CADENCE:
- Weekly SRE sync: Monday 10:00 AEST — review open incidents, SLO burn rates, upcoming changes
- PIR review: Wednesday 11:00 AEST (monthly, or as needed after SEV1/SEV2)
- Tech leads sync: Thursday 14:00 AEST — architecture, ADRs, cross-team dependencies
- Platform all-hands: first Friday of month, 14:00 AEST — OKR review, product updates`,
    tags: ['onboarding', 'post-incident', 'pir', 'blameless', 'sre', 'incident-review', 'culture', 'examples', 'meetings'],
    classification: 'INTERNAL',
    freshness_ts: '2025-01-30T10:00:00Z',
    ingest_ts: '2025-03-04T01:00:00Z',
    ttl_hours: 168,
    meta: { doc_type: 'PIR Guide', owner: 'm.okonkwo@truebank.com.au' }
  },

  {
    id: 'onboard_tooling_001',
    appid: 'ALL',
    source: 'confluence_onboarding',
    source_label: 'Onboarding',
    record_id: 'ONBOARD-TOOLING-009',
    title: 'TruView — Developer Tooling Reference (Slack, Splunk, PagerDuty, Dynatrace)',
    text: `DEVELOPER TOOLING REFERENCE: TruView Platform
Document: /wiki/spaces/TRUVIEW/pages/Developer-Tooling
Last Updated: 2025-02-05
Owner: Platform Engineering

SLACK CHANNELS:
#truview-platform-eng    — Platform Engineering team (Core microservices, EKS, Kafka)
#truview-web-eng         — Web Platform team (SPA, BFF, CloudFront)
#truview-mobile-eng      — Mobile Platform team (iOS, Android, Mobile BFF)
#truview-sre-oncall      — SRE alerts and on-call coordination
#truview-incident-bridge — Active incident bridge (auto-created by PagerDuty for SEV1/2)
#truview-deployments     — CI/CD notifications (pipeline success/failure, rollbacks)
#truview-monitoring      — Dynatrace alerts, SLO breach notifications
#cab-emergency           — Emergency change advisory board requests
#design-system           — Design system tokens, component library updates

PAGERDUTY:
URL: https://truebank.pagerduty.com
Services: truview-core-oncall, truview-web-oncall, truview-mobile-oncall
Escalation: 5 min primary → 15 min secondary → 30 min EM
On-call schedule: weekly rotation; schedule changes → SRE lead
Mobile app: required for all on-call engineers (push notifications for pages)

DYNATRACE:
URL: https://truebank.dynatrace.com
Access: request viewer role from SRE team (#truview-sre-oncall)
Key dashboards:
  TruView Core: service health matrix, Kafka consumer lag, RDS connection pool
  TruView Web: BFF request rate, Redis cache hit rate, CloudFront edge latency
  TruView Mobile: BFF latency per endpoint, APNs/FCM delivery rates, circuit breakers
RUM (Real User Monitoring): Web SPA — LCP, FCP, TTI per page
Custom metrics: notification.retry.queue.depth (Mobile), kafka.consumer.lag (Core)
Alert routing: Dynatrace → PagerDuty → #truview-monitoring Slack

SPLUNK (Log Aggregation):
URL: https://splunk.internal.truebank.com.au
Index: truview-prod (production), truview-staging (staging)
Retention: 90 days hot + 1 year cold
Common searches:
  Errors in BFF:       index=truview-prod source=truview-web-bff level=ERROR
  APNs failures:       index=truview-prod "APNs" "connection reset"
  Payment failures:    index=truview-prod source=payment-service "PaymentFailed"
  Kafka lag alerts:    index=truview-prod source=acct-sync-processor "consumer lag"
Splunk dashboards: saved under /truview/ prefix (TruView Core Health, BFF Error Analysis, etc.)

GITLAB CI/CD:
URL: https://gitlab.truebank.com.au/truview
Pipelines: truview-core, truview-web-spa, truview-web-bff, truview-mobile-bff, truview-ios, truview-android, notification-service
Pipeline status → #truview-deployments Slack (success/failure notifications)
Artifacts: stored 30 days (bundle analyser treemaps, test reports, Playwright screenshots)
Registry: ECR (AWS) for container images. Naming: truview/<service>:<version>
  e.g., truview/web-bff:v3.9.0, truview/notification-service:v2.4.1

ARGOCD (GitOps):
URL: https://argocd.internal.truebank.com.au
Applications: one per service per environment (e.g., truview-web-bff-prod, truview-core-account-service-prod)
Sync: manual for prod, auto for dev/staging
Rollback: History → select previous revision → Sync
Access: request editor role from Platform Engineering (viewer role auto-granted with EKS access)

SERVICENOW:
URL: https://truebank.service-now.com
ITIL modules used by engineering: Incidents (INC), Changes (CHG), Problems (PRB), CMDB
All engineers must have basic ITIL role (auto-provisioned on AD onboarding)
Incident assignment groups: TruView-Core-ENG, TruView-Web-ENG, TruView-Mobile-ENG, TruView-SRE
Change templates: Standard Change — BFF Rolling Update, Standard Change — SPA Deploy (low risk, pre-approved)

AWS CONSOLE ACCESS:
Prod: read-only access for engineers (role: truview-dev-readonly, login via SSO)
Staging: read-write for engineers (role: truview-dev-staging)
Admin access: SRE lead only for prod (m.okonkwo, p.sharma)
Key services used: EKS, ECR, ElastiCache, RDS, MSK, CloudFront, S3, CloudWatch, AppConfig

CONFLUENCE SPACES:
/wiki/spaces/TRUVIEW   — engineering documentation, ADRs, runbooks
/wiki/spaces/SRE       — SRE runbooks, PIR archive, SLO definitions
/wiki/spaces/ARCH      — enterprise architecture, component diagrams
/wiki/spaces/SECURITY  — security policies, APRA CPS 234 controls
Search tip: use space:TRUVIEW label:runbook to find runbooks quickly`,
    tags: ['onboarding', 'tooling', 'slack', 'pagerduty', 'dynatrace', 'splunk', 'gitlab', 'argocd', 'servicenow', 'aws', 'confluence'],
    classification: 'INTERNAL',
    freshness_ts: '2025-02-05T10:00:00Z',
    ingest_ts: '2025-03-04T01:00:00Z',
    ttl_hours: 168,
    meta: { doc_type: 'Tooling Reference', owner: 'Platform Engineering' }
  },

];
