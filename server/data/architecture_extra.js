// Architecture / EA artifact supplemental synthetic data
// These records are supplemental to architecture.js (architectureChunks)

export const architectureExtra = [

  {
    id: 'arch_web_001',
    appid: 'APPID-871198',
    source: 'architecture_ea',
    source_label: 'Architecture/ADR',
    record_id: 'ARCH-TRUVIEW-WEB-ARCHITECTURE',
    title: 'TruView Web — Complete Architecture Document',
    text: `ARCHITECTURE DOCUMENT: TruView Web
Record ID: ARCH-TRUVIEW-WEB-ARCHITECTURE
Application: TruView Web (APPID-871198)
Owner: Enterprise Architecture + Web Platform Team
Last Reviewed: 2025-02-20
Status: Current (reflects production state as of Q1 2025)

OVERVIEW:
TruView Web is TrueBank's authenticated web banking portal for business and retail customers. It serves approximately 180,000 daily active sessions, predominantly during business hours (09:00–17:00 EST). The application is a React 18 Single-Page Application (SPA) per ADR-078, served from Amazon S3 via CloudFront CDN, with a Node.js Backend for Frontend (BFF) layer running on Amazon EKS. All business logic and data resides in TruView Core (APPID-973193); TruView Web is a pure presentation + data aggregation layer.

---
FRONTEND ARCHITECTURE:

React 18 SPA (truview-web repository — gitlab.truebank.com.au/truview/truview-web):
- React 18 with Concurrent Mode features (Suspense, lazy, startTransition)
- React Router v6 with nested route layout (ProtectedRoute wrapper validates auth state before rendering)
- Redux Toolkit for global client-state management:
    accounts slice: account list, selected account, balance display mode
    transactions slice: transaction history, filters, pagination cursor
    auth slice: session status, user profile, biometric state (N/A for Web)
    ui slice: loading states, notification toasts, modal state
- React Query v5 (TanStack Query) for server state management and caching:
    Queries configured with staleTime: 5 * 60 * 1000 (5 minutes — account balances)
    Queries with staleTime: 30 * 1000 (30 seconds — recent transactions)
    React Query cache is client-side only — complements Redis cache on BFF
    Automatic background refetch on window focus (re-fetches stale queries when user returns to tab)
- styled-components v6 for CSS-in-JS component styling (bank brand design tokens from @truebank/design-system package)
- Route modules (all lazy-loaded per ADR-078):
    src/features/accounts/ — Account overview, account detail, balance history (lazy)
    src/features/transactions/ — Transaction history, search, filters, export (lazy)
    src/features/payments/ — Pay Anyone, BPAY, transfers, payment history (lazy)
    src/features/settings/ — Profile, notifications, security settings (lazy)
    src/features/insights/ — Spend analytics, merchant category breakdown (lazy — new in v5.11.0)
- Webpack 5 with Module Federation (used for micro-frontend capability — not currently active; prepared for future)
- Bundle performance budget: initial load <200KB gzipped (enforced by CI — fails if exceeded)
- Testing: Jest 29 + React Testing Library (unit), Playwright (E2E, 48 scenarios covering critical paths)

---
CDN LAYER:

CloudFront Distribution: prod-cf-truview-web (Distribution ID: E1K9ABCDEF)
- Origin 1: S3 bucket truebank-truview-web-prod (static SPA assets)
- Origin 2: truview-web-bff EKS service (via ALB — for /api/* paths)
- 12 edge locations (AP-SOUTHEAST-2 [Sydney primary], US-EAST-1, EU-WEST-1, plus 9 additional)
- CloudFront behaviours:
    /api/*          → BFF origin — Cache-Control: no-cache (API calls never cached at CDN)
    /assets/*       → S3 origin — Cache-Control: public, max-age=31536000, immutable (1-year cache, content-hashed filenames)
    /static/*       → S3 origin — same as /assets/*
    /* (default)    → S3 origin, index.html — Cache-Control: no-cache, no-store (SPA routing: all paths serve index.html)
- Custom error pages: HTTP 403 and 404 from S3 → serve /index.html with HTTP 200 (enables client-side SPA routing for direct URL access)
- HTTPS enforced: HTTP → HTTPS redirect at CloudFront edge (no HTTP traffic reaches origin)
- TLS certificate: ACM — *.truebank.com.au (auto-renews)
- Edge latency (p50): 4-6ms (Sydney users), 20-30ms (US/EU users)
- Cache hit rate (static assets): ~94% (baseline — stale content ratio low due to 1-year immutable cache headers)
- Origin request rate (to S3): ~5.8% of total asset requests (cache misses — new deployments or new users)
- Custom domain: web.truebank.com.au → CloudFront distribution

---
BFF LAYER:

Service: truview-web-bff (see SVCCATALOG-TRUVIEW-WEB-BFF for full details)
Technology: Node.js 20, Express, Redis (ioredis), opossum circuit breakers
Deployment: prod-eks-web-01, namespace truview-web, 4 replicas (HPA 4-10)
Current version: v3.9.0 (CHG0104601 — NOTE: INC0092301 active against this version)

BFF responsibilities:
1. Authentication enforcement: validates JWT on every request via auth-adapter (Redis-cached 15 min)
2. Data aggregation: composes responses from multiple TruView Core microservices per request
3. Response shaping: maps Core API responses to Web-optimised DTOs (includes fields Web UI needs, removes mobile-specific fields)
4. Caching: Redis cache-aside for account data (TTL 600s) and transaction data (TTL 60s)
5. Circuit breaking: protects TruView Web from Core service failures with fallback responses

---
AUTHENTICATION FLOW (detailed):

1. User navigates to web.truebank.com.au (browser)
2. index.html served by CloudFront → React SPA boots → checks Redux auth slice: no session
3. React Router ProtectedRoute detects unauthenticated → redirects to auth page
4. SPA redirects browser to Auth Service (APPID-556712): https://auth.truebank.com.au/oauth/authorize?response_type=code&client_id=truview-web&redirect_uri=https://web.truebank.com.au/oauth/callback&scope=openid+accounts+transactions&state=[CSRF-token]
5. Auth Service (APPID-556712) presents login form — validates credentials against Active Directory (AD LDAP) + MFA (SMS OTP via Twilio, or TOTP via Authenticator app)
6. Auth Service issues Authorization Code → browser redirects to https://web.truebank.com.au/oauth/callback?code=[code]&state=[CSRF-token]
7. SPA's /oauth/callback route posts code to BFF: POST /api/auth/exchange {code, codeVerifier (PKCE)}
8. BFF (server-side) calls Auth Service token endpoint: POST https://auth.truebank.com.au/oauth/token {grant_type: authorization_code, code, redirect_uri, client_id, client_secret}
9. Auth Service returns: {access_token (JWT, 1h), refresh_token (opaque, 7d), id_token (OIDC)}
10. BFF stores refresh_token in Redis (key: refresh:{sessionId}, TTL: 8h) and sets HttpOnly cookie on response: Set-Cookie: truview-session=[sessionId]; HttpOnly; Secure; SameSite=Strict; Path=/api/; Max-Age=28800
11. BFF returns JWT access_token to SPA (in response body — not in cookie, as it needs to be inspectable for user profile extraction)
12. SPA stores access_token in Redux auth slice (memory only — NOT localStorage) and user profile decoded from id_token
13. All subsequent BFF API calls: browser sends Cookie: truview-session=[sessionId] → BFF validates session, fetches access_token from Redis, forwards JWT to auth-adapter for every upstream Core API call
14. JWT refresh (automatic): BFF detects access_token expiry (checks exp claim) → uses stored refresh_token in Redis → calls Auth Service /oauth/token (grant_type: refresh_token) → issues new access_token → transparently continues request
15. Session logout: SPA calls POST /api/auth/logout → BFF deletes Redis session key + calls Auth Service /oauth/revoke for refresh_token → BFF clears session cookie → SPA clears Redux state
    Note: JWT access_token is cached valid in auth-adapter Redis for up to 15 minutes — full revocation propagation delay: up to 15 minutes

---
KEY PAGE FLOWS WITH LATENCY BUDGETS:

Account Overview page (target LCP <1.5s):
  CloudFront edge delivery of index.html + main bundle: 4ms + 2ms = 6ms
  React SPA boot + auth state check: 80ms (cached auth slice in Redux)
  BFF /api/v2/accounts/summary:
    Redis cache HIT (93% probability): 5ms Redis + 25ms BFF processing = 30ms
    Redis cache MISS (7% probability): 5ms Redis + 35ms account-service call (p50: 340ms) + legacy-dda-adapter (p50: 420ms) = ~800ms [creates visible delay]
  Total LCP (cache hit, typical): 6ms + 80ms + 30ms = ~116ms (well within SLO)
  Total LCP (cache miss, first load): 6ms + 80ms + 800ms ≈ 886ms (still within SLO — p50 case)
  p95 full page load (including CDN asset fetching): 1.71s (measured via Dynatrace RUM — CHG0104980 result)

Transaction History page (target LCP <1.2s — lazy chunk + data):
  Lazy chunk load (transactions.[hash].js, 45KB gzip, CloudFront cached): 15ms (p50)
  BFF /api/v2/transactions: Redis cache hit: 8ms + 20ms BFF = 28ms; Cache miss: 8ms + Elasticsearch (p50: 95ms) = 103ms
  Total LCP (cache hit, typical): 6ms + 80ms + 15ms + 28ms ≈ 129ms
  Total p95 (with cache miss and Elasticsearch): ~350ms (within SLO)

Payments page:
  Lazy chunk load (payments.[hash].js, 38KB gzip): 12ms
  POST /api/v2/payments/initiate: 800ms-1.5s (dominated by NPP payment processing — see ARCH-TRANSACTION-FLOW)

---
ERROR STATES AND DEGRADED MODE:

Account-service circuit breaker OPEN:
  BFF detects OPEN state → serves cached Redis balance data with response header X-Cache-Age: [seconds]
  SPA detects X-Cache-Age header → displays yellow banner: "Balance data as of [X] minutes ago. Tap to refresh."
  If Redis cache also expired: BFF returns HTTP 503 → SPA displays: "Account data temporarily unavailable. Please try again." with retry button

All TruView Core services down (circuit breakers all OPEN, no cache):
  BFF returns HTTP 503 → SPA detects global error state → displays full-page scheduled maintenance page
  Static maintenance page also served by CloudFront if BFF itself is down (CloudFront custom error page: HTTP 502/503 → /maintenance.html from S3)

CDN failure (CloudFront outage — extremely rare — AWS multi-AZ):
  Users reach origin directly (S3 + BFF ALB via Route 53 failover if configured) — covered in DR plan

---
CLOUDFRONT BEHAVIOURS SUMMARY:
  Path Pattern   | Origin  | Cache TTL              | Notes
  /api/*         | BFF ALB | no-cache               | API calls — never CDN cached
  /assets/*      | S3      | max-age=31536000       | Content-hashed — 1 year immutable
  /static/*      | S3      | max-age=31536000       | Fonts, images — immutable
  /favicon.ico   | S3      | max-age=86400          | 1 day
  /* (default)   | S3      | no-cache               | index.html — always fresh from S3

---
RECOVERY OBJECTIVES:
  RTO: 2 hours (Tier 1 — aligned with bank SLA for digital banking channels)
  RPO: 0 (TruView Web is stateless — no persistent state; all data in TruView Core)
  Typical actual recovery time: <15 minutes via BFF rollback; <5 minutes for CDN/S3 issues`,
    tags: ['architecture', 'truview-web', 'appid-871198', 'react', 'spa', 'cloudfront', 'bff', 'redis', 'authentication', 'latency-budget', 'eks', 'rto'],
    classification: 'INTERNAL',
    freshness_ts: '2025-02-20T00:00:00Z',
    ingest_ts: '2025-03-04T00:00:00Z',
    ttl_hours: 168,
    meta: { doc_type: 'Architecture', app: 'TruView Web', cloudfront_id: 'E1K9ABCDEF', reviewed: '2025-02-20' }
  },

  {
    id: 'arch_mob_001',
    appid: 'APPID-871204',
    source: 'architecture_ea',
    source_label: 'Architecture/ADR',
    record_id: 'ARCH-TRUVIEW-MOBILE-ARCHITECTURE',
    title: 'TruView Mobile — Complete Architecture Document',
    text: `ARCHITECTURE DOCUMENT: TruView Mobile
Record ID: ARCH-TRUVIEW-MOBILE-ARCHITECTURE
Application: TruView Mobile (APPID-871204)
Owner: Enterprise Architecture + Mobile Platform Team
Last Reviewed: 2025-02-15
Status: Current (reflects production state as of Q1 2025)

OVERVIEW:
TruView Mobile is TrueBank's native mobile banking application, serving approximately 420,000 daily active sessions. It is the largest TruView digital channel (2.3x the Web channel). The application is available on iOS (App Store — com.truebank.truview) and Android (Play Store — com.truebank.truview), with separate native codebases per ADR-071. A Mobile BFF (Node.js) runs on prod-eks-mobile-01 to aggregate and optimise data from TruView Core.

Current mobile app version: v4.2.7 (iOS and Android — released 2025-02-12)
User split: 58% iOS (~244,000 daily active users) / 42% Android (~176,000 daily active users)

---
SHARED BUSINESS LOGIC — Kotlin Multiplatform Mobile (KMM):

Library: truview-mobile-shared (GitLab: gitlab.truebank.com.au/truview/truview-mobile-shared)
Technology: Kotlin Multiplatform Mobile (KMM) 1.9
Consumed by:
  - iOS app as Swift Package (binary XCFramework, updated via Swift Package Manager)
  - Android app as Gradle module (AAR artifact, published to internal Maven repo)

Shared modules in truview-mobile-shared:
  data/models/       — Account, Transaction, PaymentRecipient, NotificationPreference Kotlin data classes (shared via KMM)
  domain/validation/ — Account number validation, BSB validation, payment amount validation rules
  domain/formatting/ — Currency formatting, date formatting, account number masking (e.g. **** **** 1234)
  data/parsers/      — JSON response parsers (Kotlin Serialization, shared parsing logic)
  domain/business/   — Business rules: payment limits, daily transfer limits, high-value threshold ($1,000 biometric re-auth requirement)

What is NOT shared (remains in native platform codebases):
  - UI layer (UIKit/SwiftUI for iOS, Jetpack Compose/View for Android — platform-native by ADR-071)
  - Authentication (Keychain for iOS, Android Keystore for Android — platform-specific security APIs)
  - Push notification registration (APNs for iOS, FCM for Android — divergent APIs)
  - Biometric authentication (LocalAuthentication for iOS, BiometricPrompt for Android)
  - Background sync (BGTaskScheduler for iOS, WorkManager for Android)

---
iOS ARCHITECTURE:

Repository: gitlab.truebank.com.au/truview/truview-ios
Language: Swift 5.9
Minimum deployment target: iOS 15.0 (covers 98.7% of TruView Mobile iOS user base)
UI framework: UIKit + SwiftUI hybrid
  - Legacy screens (account overview, transaction history): UIKit (UITableViewController, UICollectionViewController)
  - New screens (insights, pay-to-mobile, notification preferences): SwiftUI (mandatory for all new development)
  - Navigation: UINavigationController wrapping SwiftUI views (NavigationStack in pure SwiftUI modules)
Reactive programming: Combine framework (Swift Combine for data binding between ViewModel and View)
Data layer: TruViewAPIClient (URLSession-based HTTP client, JWT injection, retry logic)
Secure storage:
  - JWT access token: iOS Keychain (kSecAttrAccessibleWhenUnlockedThisDeviceOnly)
  - Refresh token: iOS Keychain with Secure Enclave protection (kSecAttrTokenIDSecureEnclave on supported devices — iPhone X+)
  - Account PIN (fallback biometric): Keychain with biometric ACL (kSecAccessControlBiometryAny)
Biometric authentication: LocalAuthentication framework (LAContext.evaluatePolicy)
  - KNOWN ISSUE: PRB0012632 — iOS 16.x silent failure on first attempt (LAContext race condition with foreground transition)
  - Fix in v4.3.0 (Q2 2025)
Background refresh: BGTaskScheduler (BGAppRefreshTask) — updates balance cache while app is backgrounded; runs ~15 min intervals when app has been used recently
Screen recording prevention: UIScreen.isCaptured check in SceneDelegate — blurs sensitive views if screen recording detected (regulatory requirement)
Push notifications: via Firebase Cloud Messaging iOS SDK → FCM relays to APNs
  - Direct APNs path also supported for time-critical balance alerts (bypasses FCM relay for <5s delivery SLA)
  - APNs certificate: com.truebank.truview.push (expires 2026-01-15)
Certificate pinning: URLSession with NSURLSessionDelegate — pins to truebank.com.au leaf certificate SHA-256 fingerprint (rotation managed by Security team quarterly)

---
ANDROID ARCHITECTURE:

Repository: gitlab.truebank.com.au/truview/truview-android
Language: Kotlin 1.9
Minimum SDK: Android API 26 (Android 8.0 Oreo — covers 99.2% of TruView Mobile Android user base)
UI framework: MVVM + Jetpack Compose (mandatory for all new features) + legacy XML Views (existing screens)
  - ViewModels: AndroidX ViewModel with StateFlow for reactive UI updates
  - New screens: Jetpack Compose with Material Design 3
  - Legacy screens: XML Layout + View Binding + LiveData
Data layer: TruViewApiService (Retrofit 2.9, OkHttp 4.12, Moshi for JSON parsing)
Secure storage:
  - JWT access token: Android Keystore (AES-256-GCM encrypted SharedPreferences via EncryptedSharedPreferences)
  - Refresh token: Android Keystore with StrongBox Keymaster (hardware-backed on supported devices — Pixel 3+, Samsung Galaxy S10+)
  - Screen recording prevention: FLAG_SECURE set on all Activity windows containing account/transaction data
Biometric authentication: BiometricPrompt API (AndroidX Biometric)
Background sync: WorkManager (PeriodicWorkRequest, 15-minute interval constraint: NetworkType.CONNECTED)
Push notifications: Firebase Cloud Messaging (FCM) — native Android support
  - FCM token management: registered via Mobile BFF /api/mobile/devices/token-refresh on every app resume
  - CURRENT ISSUE: INC0092418 — rate limiting on token-refresh endpoint causing stale tokens for 34,000 Android devices
Certificate pinning: OkHttp CertificatePinner with SHA-256 pin for truebank.com.au

---
AUTHENTICATION FLOW (Mobile-specific):

1. App launch: check for valid access token in Keychain/Keystore (JWT exp claim check)
2. If no token / expired: initiate OAuth 2.0 PKCE flow
3. App opens ASWebAuthenticationSession (iOS) / Chrome Custom Tab (Android) to Auth Service:
   https://auth.truebank.com.au/oauth/authorize?response_type=code&client_id=truview-mobile&code_challenge=[SHA256(codeVerifier)]&code_challenge_method=S256&redirect_uri=truview://oauth/callback
4. Auth Service validates credentials + MFA (SMS OTP or TOTP)
5. Auth Service redirects to app via deep link: truview://oauth/callback?code=[code]
6. App intercepts deep link → calls Mobile BFF: POST /api/mobile/v2/auth/exchange {code, codeVerifier}
7. Mobile BFF exchanges code with Auth Service for {access_token (JWT, 1h), refresh_token (opaque, 7d), id_token}
8. Mobile BFF stores refresh_token in secure server-side session (Redis key: mobile:refresh:{deviceId}, TTL: 7d)
9. Mobile BFF returns access_token and id_token to app in response body
10. App stores: access_token in Keychain/Keystore (read for API calls); refresh_token on server (app does not receive server-side refresh_token — BFF manages refresh transparently)
11. All Mobile API calls: Authorization: Bearer [access_token] header → BFF validates JWT via auth-adapter → forwards authenticated request to TruView Core
12. Biometric re-auth required for: transaction amount >$1,000, Pay Anyone initiation, account settings changes
    Flow: LAContext.evaluatePolicy (iOS) / BiometricPrompt.authenticate (Android) → success → app includes X-Biometric-Auth: confirmed header in BFF request → BFF forwards to Core as elevated-auth context

---
PUSH NOTIFICATION ARCHITECTURE:

Firebase Cloud Messaging (FCM) as the universal push notification provider:
  Android: FCM delivers directly to Android device (native FCM)
  iOS: FCM SDK proxies to APNs (Firebase → APNs → iPhone)
  Direct APNs: supported for time-critical notifications (notification-service can bypass FCM for priority APNs delivery)

Notification payload types:
  balance_alert (data message — silent):
    Delivered as FCM data message (no system tray notification)
    App processes in background via FCM data message handler
    App updates balance in local cache and posts local notification if balance exceeds user-configured threshold
  transaction_confirmation (notification message):
    System notification: "Payment of $X to [Recipient] complete"
    Tapping opens app to transaction detail view (notification action: open_transaction?id=[txnId])
  payment_reminder (scheduled notification message):
    System notification: "BPAY payment to [Biller] due in 2 days"
    Scheduled via notification-service on biller due date - 2 days trigger

APNS Certificate details:
  Certificate: com.truebank.truview.push
  Type: Apple Push Notification Service certificate (APS Production)
  Expiry: 2026-01-15 (next renewal: 2025-11-15 — Security team calendar reminder)
  Team ID: TRUEBANK1234
  Bundle ID: com.truebank.truview

CURRENT ACTIVE ISSUES:
  INC0091205: APNs delivery failures (iOS) — firebase-messaging 9.1.0 → 9.3.2 regression (CHG0104756) — connection pool exhaustion
  INC0092418: FCM token refresh failures (Android) — Mule rate limit on /api/mobile/devices/token-refresh (CHG0104333)

---
OFFLINE CAPABILITY:

Cached locally on device (displayed when network unavailable):
  iOS: Core Data (TruViewCacheStore entity: Account, CachedTransaction)
  Android: Room database (AccountEntity, TransactionEntity)
  Cached data: account balance + last 10 transactions (fetched on every successful API call, stored locally)
  Offline display: balance and transactions shown with banner "Last updated [X] minutes ago — tap to refresh"
  Stale threshold: if cache >60 minutes old, display "Balance information may be outdated" warning (yellow)
  If cache >24 hours: display error state "Unable to load account data. Please connect to the internet."
  Payments: DISABLED when offline (requires live API call for fraud check and NPP submission)
  Biometric login: enabled offline (validates stored credentials locally — does not require network)

---
APP RELEASE PROCESS:

iOS release:
  1. Feature complete → internal TestFlight (Mobile Platform Team + QA, ~20 devices)
  2. TestFlight external beta (opt-in customers registered in beta program, ~500 users, 2 weeks)
  3. App Store submission (Xcode → App Store Connect → Submit for Review)
  4. Apple review: 1-3 business days (expedited review available: ~24h — use for critical hotfixes)
  5. Phased rollout: 1% → 10% → 50% → 100% over 7 days (monitored via Dynatrace RUM crash rate)
  6. Full rollout: 100% if crash rate within baseline during phased rollout

Android release:
  1. Feature complete → internal testing track (Mobile Platform Team + QA)
  2. Closed testing track (beta testers, 1 week)
  3. Production with staged rollout: 10% → 50% → 100% over 7 days
  4. Google Play review: hours to 2 business days

Emergency hotfix (backend-side — no app release required):
  BFF/notification-service/Core changes that fix bugs without app code change can be deployed without app release
  Example: INC0091205 rollback (notification-service v2.4.0 rollback) — deployed to EKS, no app store submission

Emergency hotfix (app-side — requires app release):
  iOS: request expedited review via Apple Developer portal (appstoreconnect.apple.com) — typical: ~24h
  Android: expedited review not formally offered — typical review: <4h for incremental updates

---
RECOVERY OBJECTIVES:
  RTO: 4 hours (Tier 1 — 4h RTO accounts for App Store review cycle if app-side fix required)
  RPO: 0 (stateless BFF; local device cache is a display cache only, not system of record)
  Backend-side fix RTO: <30 minutes (BFF rollback similar to Web BFF — no app release cycle)
  App Store fix RTO: 24-48 hours (expedited review) + phased rollout time`,
    tags: ['architecture', 'truview-mobile', 'appid-871204', 'ios', 'android', 'swift', 'kotlin', 'kmm', 'push-notification', 'apns', 'fcm', 'authentication', 'offline', 'app-store', 'rto'],
    classification: 'INTERNAL',
    freshness_ts: '2025-02-15T00:00:00Z',
    ingest_ts: '2025-03-04T00:00:00Z',
    ttl_hours: 168,
    meta: { doc_type: 'Architecture', app: 'TruView Mobile', reviewed: '2025-02-15' }
  },

  {
    id: 'arch_blast_002',
    appid: 'ALL',
    source: 'architecture_ea',
    source_label: 'Architecture/ADR',
    record_id: 'ARCH-BLAST-RADIUS-KAFKA-FAILURE',
    title: 'Blast Radius Analysis — prod-kafka-trueview MSK Cluster Complete Failure',
    text: `ARCHITECTURE ARTIFACT: Blast Radius Analysis
Record ID: ARCH-BLAST-RADIUS-KAFKA-FAILURE
Title: Complete failure of prod-kafka-trueview (MSK cluster) — all brokers unavailable
Severity Classification: CRITICAL — would trigger SEV1 incident
Owner: Enterprise Architecture / Platform SRE Team
Last Reviewed: 2025-01-20
Kafka Cluster: prod-kafka-trueview (AWS MSK, 6 brokers across 3 AZs in ap-southeast-2, replication factor 3, minimum ISR 2)

FAILURE SCENARIO:
All 6 MSK brokers become unavailable simultaneously — e.g. cluster-level network partition, AWS MSK control plane issue affecting all AZs simultaneously, or catastrophic configuration error. Note: single-AZ failure (2 brokers) is tolerated by MSK multi-AZ design and is NOT covered by this blast radius document.

---
IMMEDIATE IMPACTS (0–30 SECONDS POST-FAILURE):

1. TruView Core — all Kafka producers (account-service, transaction-service, event-router) fail to publish events:
   - account-service: TransactionPending and AccountBalanceUpdated events cannot be published → producer.send() returns error
   - transaction-service: TransactionCommitted events cannot be published
   - event-router: cannot relay events between topics
   - Producer behaviour: Kafka Java client buffers unsent messages in memory (producer.buffer.memory = 32MB per service, 3 producer services = 96MB combined buffer)
   - At peak load (~340 RPS account-service + ~200 RPS transaction-service): buffer exhaustion in approximately 90 seconds
   - Before buffer exhaustion: producer.send() blocks (backpressure) but does not drop — synchronous API calls to account-service still succeed (DDA queries go to RDS, not Kafka)

2. acct-sync-processor and transaction-sync-consumer: consumers immediately stop receiving messages (Kafka broker unavailable):
   - Consumers enter polling loop with exponential backoff
   - Redis cache stops receiving new AccountBalanceUpdated events → cached balances freeze at time of Kafka failure
   - New transactions written to PostgreSQL RDS but not yet reflected in Elasticsearch or Redis

---
SHORT-TERM IMPACTS (2–5 MINUTES POST-FAILURE):

3. Redis cache TTL expiry begins:
   - account summary cache TTL: 600s (10 min) — cache remains valid for up to 10 minutes post-failure
   - account balance cache TTL: 120s (2 min) — begins expiring within 2 minutes
   - As TTLs expire: account-service falls back to PostgreSQL RDS for each balance lookup
   - RDS load increase: estimated +40% RPS on prod-rds-truview-core-01 as cache misses redirect to RDS
   - RDS can sustain this load (db.r6g.2xlarge, connection pool now serving direct balance queries)

4. notification-service: cannot consume truview-core-notification-triggers topic:
   - Push notifications (balance alerts, transaction confirmations) STOP being generated
   - Already-queued notifications in-flight to APNs/FCM will complete, but no NEW notification triggers

5. Fraud Detection Service (APPID-445821):
   - Primary signal path: loses account event stream from truview-core-account-events
   - Falls back to: REST polling of account-service GET /v2/accounts/{id}/balance every 30 seconds
   - Fraud evaluation latency increases from near-real-time (Kafka event-driven, ~500ms) to polling interval (30s)
   - Transaction fraud evaluation: synchronous POST /fraud/evaluate still available (this is a REST call, not Kafka) — real-time fraud scoring for in-progress payments is unaffected
   - Risk: fraud signals based on account event patterns (rapid balance changes) are delayed by up to 30s

---
MEDIUM-TERM IMPACTS (15+ MINUTES POST-FAILURE):

6. Producer buffer exhaustion (90 seconds max at peak, longer at off-peak):
   - account-service producer buffer exhausted → account-service begins DROPPING Kafka events (AccountBalanceUpdated events lost)
   - Fallback: account-service writes dropped events to DLQ (Dead Letter Queue) S3 bucket: s3://truebank-truview-kafka-dlq/account-events/{timestamp}/
   - Transaction events similarly written to DLQ
   - NOTE: DLQ events will be replayed after Kafka recovery — see Recovery Sequence below

7. TruView Web and Mobile: account balances now served from PostgreSQL RDS directly (cache TTL expired):
   - Response time increases: account-service p50 increases from 30ms (Redis cache hit) to 340ms (RDS direct) → BFF to 420ms (includes legacy-dda-adapter)
   - Users experience slower page loads but accurate balances (RDS is the system of record)
   - No incorrect data — just slower

8. Customer Notification Hub (APPID-678234):
   - Stops receiving events from notifications-outbound topic
   - No new customer notifications (email, SMS) generated during outage window
   - Backlogged notifications will replay on Kafka recovery

9. TruView Core Elasticsearch:
   - transaction-service event processing from Kafka stops → Elasticsearch transaction index stops receiving new transaction records
   - Transaction search reflects state as of Kafka failure time (historical searches work; new transactions not indexed until recovery)
   - Write-ahead log (PostgreSQL WAL) captures all transactions — Elasticsearch replay on recovery

---
NOT IMPACTED (synchronous paths survive Kafka failure):

- Login and authentication: Auth Service (APPID-556712) is fully independent — zero Kafka dependency
- Card transactions: Core Banking (APPID-100034) processes card transactions via IBM MQ (separate messaging system) — not Kafka-dependent
- Payment processing (real-time): account-service → Core Banking Adapter → IBM MQ → Core Banking — NPP payment execution path is synchronous REST + IBM MQ, not Kafka
- Balance lookups: account-service → PostgreSQL RDS → legacy-dda-adapter (mainframe) — survives Kafka failure (slower, cache miss path)
- Fraud evaluation: POST /fraud/evaluate (synchronous REST) — survives (see reduced efficacy note above)

---
RECOVERY SEQUENCE (after MSK restores):

1. MSK auto-recovery (AWS managed): brokers restart; leadership election completes; replication catches up
   MSK RTO per AWS SLA: 30 minutes for multi-AZ broker failure; 4 hours for region-level event (extremely rare)

2. Consumer groups resume: acct-sync-processor and transaction-sync-consumer resume from last committed offsets → process accumulated lag

3. DLQ replay: Platform Engineering initiates DLQ replay job (S3 DLQ → Kafka reinjection) for events dropped during producer buffer exhaustion. Consumer groups process replayed events.

4. Replay priority order (ordered by data dependency):
   a. truview-core-account-events (highest priority — balance accuracy)
   b. truview-core-transaction-events (transaction history accuracy)
   c. truview-core-notification-triggers (lowest — notifications; some will be >24h old and discarded by APNs/FCM)

5. Redis cache refresh: acct-sync-processor processes replayed AccountBalanceUpdated events → Redis cache repopulates with current balances
   Expected Redis cache re-warm time: 5-10 minutes at maximum consumer throughput

6. Elasticsearch catch-up: transaction-service processes replayed TransactionCommitted events → Elasticsearch indexed; search accuracy restored
   Expected Elasticsearch index catch-up: up to 30 minutes for a 2-hour outage (140M document index, optimised indexing at 15K docs/sec)

7. Validate all consumer groups caught up:
   kafka-consumer-groups.sh --describe on all consumer group IDs — confirm LAG = 0 for all

8. Declare incident resolved; initiate post-incident review

POST-RECOVERY REQUIREMENTS:
- Transaction replay audit: Finance Operations must reconcile any transactions that occurred during the Kafka blackout against Core Banking (APPID-100034) records to confirm no discrepancies
- Fraud review: Fraud Team reviews all transactions processed during Kafka failure for missed fraud signals (>30s signal delay window)
- Notification review: Customer Notification Hub to confirm no duplicate notifications sent during replay`,
    tags: ['architecture', 'blast-radius', 'kafka', 'msk', 'truview-core', 'incident-response', 'sev1', 'recovery', 'all-apps', 'business-continuity'],
    classification: 'INTERNAL',
    freshness_ts: '2025-01-20T00:00:00Z',
    ingest_ts: '2025-03-04T00:00:00Z',
    ttl_hours: 168,
    meta: { doc_type: 'Blast Radius Analysis', scenario: 'MSK cluster failure', severity: 'CRITICAL / SEV1' }
  },

  {
    id: 'arch_blast_003',
    appid: 'APPID-871198',
    source: 'architecture_ea',
    source_label: 'Architecture/ADR',
    record_id: 'ARCH-BLAST-RADIUS-WEB-BFF-FAILURE',
    title: 'Blast Radius Analysis — TruView Web BFF Complete Failure (all pods down)',
    text: `ARCHITECTURE ARTIFACT: Blast Radius Analysis
Record ID: ARCH-BLAST-RADIUS-WEB-BFF-FAILURE
Title: TruView Web BFF complete failure — all truview-web-bff pods in CrashLoopBackOff or Terminated
Severity Classification: HIGH — would trigger SEV2 (Tier 1 application fully unavailable for 180K users)
Owner: Enterprise Architecture / Platform SRE Team
Last Reviewed: 2025-02-01
EKS Cluster: prod-eks-web-01, namespace truview-web, deployment truview-web-bff

FAILURE SCENARIO:
All 4 truview-web-bff pods become unavailable simultaneously — e.g. a faulty deployment rolls out a broken image that causes all pods to CrashLoopBackOff before readiness probe can pass, or an unhandled exception in startup code causes all pods to fail. HPA minimum is 4 replicas — if the deployment is corrupted, HPA replacement attempts will also deploy broken pods.

---
IMMEDIATE IMPACT (0–60 SECONDS):

1. All API calls from TruView Web SPA → BFF return HTTP 502 Bad Gateway or HTTP 503 Service Unavailable:
   - ALB (Application Load Balancer) detects all targets unhealthy → serves ALB 503 response to all requests
   - All authenticated API calls to /api/v2/* fail immediately
   - Impact: 100% of authenticated TruView Web sessions cannot perform any banking operations

2. TruView Web SPA (static assets): UNAFFECTED
   - index.html, main.[hash].js, and all assets continue to be served correctly from S3 via CloudFront
   - Users CAN load the login page and view the unauthenticated SPA shell
   - Users CANNOT successfully complete any action requiring BFF API call (everything except viewing the login page)

3. Authentication (login): PARTIALLY AFFECTED
   - Auth Service redirect (steps 1-5 in ARCH-AUTH-LOGIN-FLOW) still works — Auth Service is independent
   - BFF OAuth callback step (step 7: POST /api/auth/exchange) fails — HTTP 503
   - Effect: users who are not logged in CANNOT log in (login code exchange requires BFF)
   - Users who ARE already logged in with valid session cookie: all subsequent API calls fail — effectively logged out

4. AFFECTED: 100% of ~180,000 daily active TruView Web sessions (full outage)
5. NOT AFFECTED: TruView Mobile (runs on entirely separate BFF — prod-eks-mobile-01, truview-mobile BFF)
6. NOT AFFECTED: TruView Core microservices (independent, serving Mobile BFF normally)
7. NOT AFFECTED: Push notifications (notification-service on Core)

---
CLOUDFRONT BEHAVIOUR DURING BFF FAILURE:

- /api/* requests: CloudFront forwards to BFF ALB → ALB returns 502/503 (no healthy targets) → CloudFront receives 502 from origin → serves CloudFront 503 to client (with configured error page if set up)
- Static assets (S3-backed): COMPLETELY UNAFFECTED — CloudFront serves from S3 edge cache; S3 is not involved in BFF failure
- /index.html (no-cache): CloudFront re-fetches from S3 on each request (no-cache) → users can always load the SPA shell
- Custom error page: if configured (currently NOT configured for /api/* paths) — opportunity: configure a custom 502/503 page for /api/*, informing users "Banking services are temporarily unavailable"

---
SELF-HEALING VS MANUAL RECOVERY:

Self-healing case (1-3 pods fail, 1+ pod healthy):
  - HPA detects available replicas < minReplicas (4) → schedules replacement pods
  - Pod disruption budget (minAvailable: 2 during restarts — note this is lower than current PDB spec for Web BFF)
  - Recovery time: 45-90 seconds (pod scheduling + image pull + readiness probe)
  - This case does NOT cause complete outage (some pods remain healthy)

Manual recovery required (all pods failed / broken deployment):
  - HPA replacement pods will ALSO fail if deployment config is broken (deploying same broken image)
  - Required action: kubectl rollout undo deployment/truview-web-bff -n truview-web
    This rolls back to the last known-good Kubernetes ReplicaSet (previous deployment)
  - Rollback command restores the previous pod spec (image tag) immediately
  - Rolling update replaces broken pods with previous-version pods
  - First healthy pod available: ~45 seconds after rollback initiation
  - All 4 pods healthy and serving: ~3-5 minutes from rollback initiation

RECOVERY COMMANDS:
  # Step 1: Confirm all pods are in bad state
  kubectl get pods -n truview-web -l app=truview-web-bff

  # Step 2: Rollback deployment to previous ReplicaSet
  kubectl rollout undo deployment/truview-web-bff -n truview-web

  # Step 3: Monitor rollback progress
  kubectl rollout status deployment/truview-web-bff -n truview-web --timeout=10m

  # Step 4: Confirm pods are healthy
  kubectl get pods -n truview-web -l app=truview-web-bff
  kubectl top pods -n truview-web -l app=truview-web-bff

  # Step 5: Validate from Dynatrace Synthetic test — TruView Web BFF Account Summary Synthetic Check
  # Confirm: HTTP 200, response time <1,000ms

  # Step 6: Update ServiceNow incident and notify stakeholders

---
COMMUNICATION TEMPLATE (SEV2 all-pods failure):

Slack #truview-incidents:
  "@here SEV2: TruView Web BFF is completely unavailable — all pods in CrashLoopBackOff. TruView Web is not functional for all users. TruView Mobile is unaffected. Rollback in progress. ETA to recovery: 15 minutes. INC[X] open — bridge: [bridge link]"

Business stakeholder notification (James Blackwood → Sarah Kimberley):
  "TruView Web is experiencing a complete service outage due to a failed deployment. Engineering is executing a rollback. Expected recovery: 15-20 minutes. TruView Mobile is unaffected. Updates every 10 minutes."

---
RECOVERY OBJECTIVES:
  RTO: 2 hours (Tier 1 SLA — "maximum allowable downtime per incident")
  Typical actual recovery: <15 minutes with rollback
  If rollback fails (e.g. previous image also broken): escalate to Web Platform Team for emergency rebuild; RTO extends to 2 hours for image rebuild + deployment

ROOT CAUSE PREVENTION:
  - Canary deployment (currently Standard Changes use rolling deploy, not canary): consider implementing canary for BFF deployments (1 pod canary → validate → full rollout) — reduces blast radius of bad deploys from 100% to 25%
  - Readiness probe on /admin/health with dependency checks (currently checks Redis and BFF process — consider also checking auth-adapter connectivity before pod declared ready)
  - Pre-deployment smoke test gate in pipeline: if smoke test fails → pipeline aborts before rolling update begins`,
    tags: ['architecture', 'blast-radius', 'truview-web', 'bff', 'eks', 'crashloopbackoff', 'incident-response', 'sev2', 'rollback', 'recovery'],
    classification: 'INTERNAL',
    freshness_ts: '2025-02-01T00:00:00Z',
    ingest_ts: '2025-03-04T00:00:00Z',
    ttl_hours: 168,
    meta: { doc_type: 'Blast Radius Analysis', scenario: 'Web BFF all pods failure', severity: 'HIGH / SEV2' }
  },

  {
    id: 'arch_auth_flow_001',
    appid: 'ALL',
    source: 'architecture_ea',
    source_label: 'Architecture/ADR',
    record_id: 'ARCH-AUTH-LOGIN-FLOW',
    title: 'Authentication and Login Flow — TruView Web and Mobile (end-to-end)',
    text: `ARCHITECTURE ARTIFACT: Authentication and Login Flow
Record ID: ARCH-AUTH-LOGIN-FLOW
Title: Authentication and Login Flow — TruView Web and TruView Mobile (end-to-end)
Owner: Enterprise Architecture + Platform Engineering
Last Reviewed: 2025-01-15
Status: Current

OVERVIEW:
All TruView authentication routes through the Customer Identity Platform — Auth Service (APPID-556712). Auth Service implements OAuth 2.0 Authorization Code flow with PKCE (for mobile) and standard Authorization Code (for web), layered over Active Directory credentials with mandatory MFA. Session tokens are never stored in the browser localStorage or unprotected storage — HttpOnly cookies (Web) and platform-secure storage (Mobile Keychain/Keystore) are mandated.

Auth Service: APPID-556712
Auth Service hostname: auth.truebank.com.au
Token endpoint: https://auth.truebank.com.au/oauth/token
Authorization endpoint: https://auth.truebank.com.au/oauth/authorize
Revocation endpoint: https://auth.truebank.com.au/oauth/revoke
JWKS endpoint: https://auth.truebank.com.au/.well-known/jwks.json (JWT signing keys — used by auth-adapter)
JWT signing: RS256 (RSA 2048-bit) — signing key rotated quarterly by Security team
JWT claims: {sub: userId, iss: auth.truebank.com.au, aud: [truview-web, truview-mobile], exp, iat, jti, scope: [accounts, transactions, payments]}

---
TRUVIEW WEB LOGIN FLOW (detailed step-by-step):

Step 1: User navigates to https://web.truebank.com.au
  - CloudFront serves index.html (no-cache → always fresh from S3)
  - React SPA boots, Redux initialises, checks auth slice: no valid session detected

Step 2: React Router ProtectedRoute detects unauthenticated state → redirects to /login
  - SPA generates CSRF state token (crypto.randomUUID()) → stored in sessionStorage (only for CSRF validation, not the session token)
  - SPA renders login prompt with "Sign in with TrueBank" button

Step 3: User clicks "Sign in" → SPA redirects browser to Auth Service authorization endpoint:
  GET https://auth.truebank.com.au/oauth/authorize
    ?response_type=code
    &client_id=truview-web
    &redirect_uri=https://web.truebank.com.au/oauth/callback
    &scope=openid+accounts+transactions+payments
    &state=[CSRF-token-from-sessionStorage]

Step 4: Auth Service presents login UI (hosted at auth.truebank.com.au — separate from TruView Web):
  - User enters username/password → Auth Service validates against Active Directory (LDAP bind)
  - Auth Service prompts for MFA: SMS OTP (via Twilio) or TOTP (Google Authenticator / Authy)
  - If credentials valid + MFA passed: Auth Service generates authorization code (opaque 32-byte random token, 60s TTL)
  - Auth Service redirects browser to: https://web.truebank.com.au/oauth/callback?code=[auth-code]&state=[CSRF-token]

Step 5: SPA /oauth/callback route handler:
  - Validates state parameter matches sessionStorage CSRF token (prevents CSRF attack)
  - POSTs to BFF: POST /api/auth/exchange {code: "[auth-code]", redirect_uri: "https://web.truebank.com.au/oauth/callback"}

Step 6: BFF (server-side token exchange — code never exposed to client directly after this point):
  - BFF calls Auth Service token endpoint (server-to-server, mTLS):
    POST https://auth.truebank.com.au/oauth/token
      {grant_type: authorization_code, code: "[auth-code]", redirect_uri: "...", client_id: truview-web, client_secret: [from env var TRUVIEW_WEB_CLIENT_SECRET]}
  - Auth Service returns: {access_token: "eyJ...", token_type: "Bearer", expires_in: 3600, refresh_token: "rt_...", id_token: "eyJ..."}

Step 7: BFF session establishment:
  - BFF generates sessionId (crypto.randomBytes(32).toString('hex'))
  - BFF stores refresh_token in Redis: SET session:{sessionId} {refresh_token, userId, createdAt} EX 28800 (8 hours)
  - BFF sets HttpOnly session cookie: Set-Cookie: truview-session=[sessionId]; HttpOnly; Secure; SameSite=Strict; Path=/api/; Domain=web.truebank.com.au; Max-Age=28800

Step 8: BFF returns to SPA:
  {access_token: "eyJ...", user: {userId, displayName, email, accountCount}} — (id_token decoded for profile)
  SPA stores access_token in Redux auth slice (in-memory only — evicted on page close)
  SPA stores user profile in Redux auth slice

Step 9: Authenticated API calls:
  - Browser sends: Cookie: truview-session=[sessionId] (automatic, SameSite=Strict prevents CSRF)
  - BFF reads sessionId from cookie → fetches refresh_token from Redis → maintains access_token in-process
  - BFF validates JWT access_token via auth-adapter on EVERY incoming request:
    POST /internal/auth/validate {token: "[access_token]"}
    auth-adapter checks Redis cache: auth:token:{jti} → cached valid result for 15 minutes
    If not cached: auth-adapter fetches JWKS from Auth Service, validates RS256 signature + claims → caches result

Step 10: JWT refresh (transparent — user never sees re-authentication):
  - BFF checks access_token exp claim before forwarding to upstream
  - If exp < (now + 5 minutes): BFF refreshes token using stored refresh_token
    POST https://auth.truebank.com.au/oauth/token {grant_type: refresh_token, refresh_token: "rt_..."}
  - Auth Service returns new access_token (and optionally new refresh_token — refresh token rotation enabled)
  - BFF updates Redis session with new refresh_token; continues request transparently

Step 11: Logout:
  - SPA calls POST /api/auth/logout
  - BFF: DEL session:{sessionId} in Redis; POST /oauth/revoke {token: refresh_token} to Auth Service
  - BFF clears session cookie: Set-Cookie: truview-session=; Max-Age=0; HttpOnly; Secure
  - SPA clears Redux auth slice → React Router redirects to /login
  - auth-adapter Redis JWT cache (auth:token:{jti}): JWT remains "valid" in cache for up to 15 minutes (cannot be immediately invalidated server-side — see Session Invalidation section)

---
TRUVIEW MOBILE LOGIN FLOW (OAuth 2.0 PKCE):

Step 1: App checks Keychain/Keystore for valid access_token — if none or expired: initiate PKCE flow

Step 2: App generates PKCE parameters:
  codeVerifier = crypto.randomBytes(32) → base64url encode (44-char string)
  codeChallenge = base64url(SHA256(codeVerifier))

Step 3: App opens secure in-app browser:
  iOS: ASWebAuthenticationSession (prevents token phishing via custom URL scheme hijacking)
  Android: Chrome Custom Tabs (prevents same)
  URL: GET https://auth.truebank.com.au/oauth/authorize
    ?response_type=code
    &client_id=truview-mobile
    &code_challenge=[SHA256(codeVerifier) — base64url]
    &code_challenge_method=S256
    &redirect_uri=truview://oauth/callback
    &scope=openid+accounts+transactions+payments
    &state=[random nonce stored in app memory]

Step 4: User authenticates in the secure browser (same Auth Service flow as Web — Active Directory + MFA)

Step 5: Auth Service redirects to app deep link: truview://oauth/callback?code=[auth-code]&state=[nonce]
  - iOS: ASWebAuthenticationSession intercepts the custom URL scheme redirect
  - Android: Chrome Custom Tabs closes and app receives the redirect intent

Step 6: App validates state nonce → calls Mobile BFF:
  POST /api/mobile/v2/auth/exchange {code: "[auth-code]", codeVerifier: "[44-char verifier]", deviceId: "[UUID]"}

Step 7: Mobile BFF calls Auth Service token endpoint (server-side, mTLS):
  POST https://auth.truebank.com.au/oauth/token
    {grant_type: authorization_code, code: "[auth-code]", code_verifier: "[codeVerifier]", client_id: truview-mobile}
  Note: Mobile client is a "public" OAuth client (no client_secret) — PKCE provides the code exchange security

Step 8: Mobile BFF session establishment (similar to Web BFF):
  - BFF stores refresh_token in Redis: SET mobile:session:{deviceId} {refresh_token, userId} EX 604800 (7 days)
  - BFF returns to app: {access_token: "eyJ...", expires_in: 3600, user: {...}}
  - App stores access_token in Keychain (iOS) / EncryptedSharedPreferences via Android Keystore (Android)
  - Refresh token remains on server-side (app does not receive the refresh_token — server manages refresh)

Step 9: Biometric re-authentication (for high-value operations):
  - Triggered: transaction amount >$1,000, Pay Anyone initiation, account settings changes (business rule in truview-mobile-shared library)
  - iOS: LAContext.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, localizedReason: "Confirm your identity to authorise this payment")
    Note: PRB0012632 — iOS 16.x silent failure on first attempt (race condition with app foreground transition)
  - Android: BiometricPrompt.authenticate with BiometricPrompt.PromptInfo
  - On biometric success: app includes X-Biometric-Auth: [timestamp]:[HMAC-signature] header in BFF request
  - Mobile BFF validates HMAC signature (shared key between app and BFF, derived from device registration) → forwards biometric context to TruView Core as an elevated-auth flag

---
SESSION INVALIDATION (security consideration):

- Logout is immediate at Redis layer (refresh_token deleted) — new token refresh fails instantly
- JWT access_token is cached valid in auth-adapter Redis for up to 15 minutes after logout
- This means: a logged-out user's access_token can still be used for up to 15 minutes for API calls (if stolen before logout)
- Mitigations: (1) access_token not stored in browser localStorage (in-memory Redux only — not accessible after page close), (2) 1h JWT lifetime is short, (3) HttpOnly cookie prevents JS access to session cookie, (4) mTLS between BFF and auth-adapter prevents token replay from outside the EKS cluster

---
SECURITY CONTROLS:
- mTLS enforced between truview-web-bff ↔ auth-adapter and truview-mobile-bff ↔ auth-adapter (mutual TLS via cert-manager + AWS ACM PCA)
- JWT signed RS256, 2048-bit key, quarterly rotation by Security Team (JWKS endpoint used by auth-adapter for verification — no hard-coded keys)
- All auth events logged to bank-wide SIEM (Splunk): login success, login failure, MFA failure, token refresh, token revocation
- Failed login threshold: 5 failures in 10 minutes → account soft-lock (Auth Service) + alert to Fraud Detection
- Device fingerprinting: mobile app registers device fingerprint on first login → Auth Service tracks unusual device changes`,
    tags: ['architecture', 'authentication', 'oauth2', 'pkce', 'jwt', 'truview-web', 'truview-mobile', 'auth-service', 'session', 'security', 'mfa', 'keychain', 'biometric'],
    classification: 'INTERNAL',
    freshness_ts: '2025-01-15T00:00:00Z',
    ingest_ts: '2025-03-04T00:00:00Z',
    ttl_hours: 168,
    meta: { doc_type: 'Flow Diagram / Architecture', topic: 'Authentication', reviewed: '2025-01-15' }
  },

  {
    id: 'arch_txn_flow_001',
    appid: 'ALL',
    source: 'architecture_ea',
    source_label: 'Architecture/ADR',
    record_id: 'ARCH-TRANSACTION-FLOW',
    title: 'End-to-End Transaction Processing Flow — Pay Anyone (TruView Mobile)',
    text: `ARCHITECTURE ARTIFACT: End-to-End Transaction Processing Flow
Record ID: ARCH-TRANSACTION-FLOW
Title: End-to-End Transaction Processing Flow — Pay Anyone payment via TruView Mobile
Owner: Enterprise Architecture
Last Reviewed: 2025-02-01
Status: Current — reflects NPP (New Payments Platform) integration as of Q4 2024

SCENARIO: Customer initiates a Pay Anyone (Quick Pay) bank transfer from TruView Mobile

This is the most complex transactional flow in the TruView platform — it crosses 11 system boundaries and involves both synchronous and asynchronous processing, real-time fraud evaluation, and NPP (New Payments Platform) settlement.

---
STEP 1: MOBILE APP → MOBILE BFF (synchronous)

Mobile app: User enters payment details (to BSB, to account, amount, description) → taps "Pay"
Biometric re-auth: if amount >$1,000 OR Pay Anyone: app prompts Face ID / Touch ID
  On biometric success: X-Biometric-Auth header generated (HMAC of {timestamp, amount, toAccountNumber, deviceId})

Mobile app sends:
  POST https://api.truebank.com.au/api/mobile/v2/payments/quick-pay
  Headers: Authorization: Bearer [access_token], X-Biometric-Auth: [timestamp:HMAC], X-Idempotency-Key: [UUID]
  Body: {
    fromAccountId: "acc_7810039",
    toAccountBSB: "062-000",
    toAccountNumber: "12345678",
    amount: 1500.00,
    description: "Rent payment March",
    currency: "AUD"
  }

Mobile BFF receives request:
  1. Validates JWT (auth-adapter cache check — 15ms if cached)
  2. Validates X-Biometric-Auth HMAC (confirms biometric was genuinely performed on this device for this transaction)
  3. Validates payload via truview-mobile-shared validation rules (amount >0, BSB format, account number format)
  4. Checks X-Idempotency-Key in Redis: if key exists and <5 minutes old → return original response (prevent duplicate payment)
  5. Stores idempotency key: SET idempotency:{key} {status: "processing"} EX 300

Mobile BFF calls TruView Core (via Mule API Gateway):
  POST https://api-internal.truebank.com.au/v2/payments/initiate
  Headers: Authorization: Bearer [service_account_token], X-Request-ID: [correlation-id], X-Biometric-Verified: true
  Body: {fromAccountId, toAccountBSB, toAccountNumber, amount, description, idempotencyKey}

  Mobile BFF returns HTTP 202 Accepted immediately to mobile app (optimistic response):
  {status: "processing", correlationId: "pmt_uuid_xxx", estimatedCompletionSeconds: 5}
  App displays: "Your payment is being processed..."

---
STEP 2: TRUVIEW CORE ACCOUNT-SERVICE — BALANCE CHECK + FRAUD EVALUATION (synchronous)

account-service receives payment initiation request:
  1. Reads fromAccount balance from PostgreSQL RDS: SELECT balance FROM accounts WHERE id = 'acc_7810039' FOR UPDATE (pessimistic lock during payment processing to prevent concurrent double-spend)
  2. Validates: balance ($12,340.50) >= amount ($1,500.00) → PASS
  3. Validates: daily transfer limit check (customer limit: $10,000/day; today's transfers: $0) → PASS

account-service calls Fraud Detection Service (APPID-445821) — synchronous:
  POST https://fraud.internal.truebank.com.au/fraud/evaluate (SLA: 200ms)
  {accountId, toAccountBSB, toAccountNumber, amount, transactionType: "outgoing_transfer", deviceFingerprint, biometricVerified: true}

Fraud Detection evaluates (machine learning model + rules engine):
  - Account risk score: 12 (low)
  - Recipient BSB/account: previously paid — low risk (recipient in customer's payee history)
  - Amount: within normal transaction pattern (customer's average payment: $890)
  - Fraud score: 0.04 (threshold: 0.70 → PASS)
  Returns: {fraudScore: 0.04, decision: "allow", requireAdditionalVerification: false}

account-service receives fraud decision: ALLOW

---
STEP 3: EVENT PUBLISHING + CORE BANKING SUBMISSION (synchronous + async)

account-service publishes TransactionPending event to truview-core-transaction-events (Kafka):
  {eventType: "TransactionPending", transactionId: "txn_abc123", fromAccountId: "acc_7810039", amount: 1500.00, timestamp: "2025-03-04T10:05:00Z", correlationId: "pmt_uuid_xxx"}
  Note: Kafka publish is best-effort during Kafka availability (falls back to DLQ if Kafka unavailable — see ARCH-BLAST-RADIUS-KAFKA-FAILURE)

account-service calls Core Banking Adapter (APPID-100034) for NPP payment submission:
  POST /cba/payment/npp/submit {fromBSB: "062-000", fromAccountNumber: "1234567890", toBSB: "062-000", toAccountNumber: "12345678", amount: 1500.00, description: "Rent payment March", idempotencyKey: "pmt_uuid_xxx"}

---
STEP 4: CORE BANKING ADAPTER → NPP → CORE BANKING MAINFRAME (async IBM MQ)

Core Banking Adapter receives payment request:
  1. Validates NPP connectivity (checks prod-mq-trueview-01 IBM MQ connection)
  2. Publishes NPP payment message to IBM MQ queue: TRUEBANK.NPP.OUTBOUND.QUEUE
  3. Returns HTTP 202 to account-service: {status: "submitted", nppReference: "NPP_REF_789"}

NPP (New Payments Platform — RBA real-time payment system):
  - IBM MQ message consumed by NPP Gateway adapter → submits to NPP clearing system
  - NPP processes payment: validates BSB/account at receiving bank, clears funds
  - NPP processing time: 400-800ms (real-time, 24/7/365)
  - NPP returns result to IBM MQ reply queue: TRUEBANK.NPP.INBOUND.QUEUE

Core Banking (APPID-100034 — mainframe, z/OS):
  - Core Banking mainframe processes IBM MQ NPP confirmation
  - Updates DDA (Demand Deposit Account) balance in mainframe: debit fromAccount -$1,500
  - Posts confirmation back to Core Banking Adapter via IBM MQ: {status: "settled", nppReference: "NPP_REF_789", settlementTimestamp}

---
STEP 5: BALANCE UPDATE + CACHE REFRESH (async via Kafka)

legacy-dda-adapter receives Core Banking settlement confirmation via IBM MQ:
  - legacy-dda-adapter translates mainframe confirmation format
  - Notifies account-service: POST /internal/account/balance-updated {accountId: "acc_7810039", newBalance: 10840.50, previousBalance: 12340.50, transactionId: "txn_abc123"}

account-service processes balance update:
  1. Updates account balance in PostgreSQL RDS: UPDATE accounts SET balance = 10840.50 WHERE id = 'acc_7810039'
  2. Publishes AccountBalanceUpdated event to truview-core-account-events (Kafka):
     {eventType: "AccountBalanceUpdated", accountId: "acc_7810039", newBalance: 10840.50, transactionId: "txn_abc123", timestamp}

acct-sync-processor (Kafka consumer) consumes AccountBalanceUpdated:
  1. Updates Redis cache: SET accounts:summary:userId:... {balance: 10840.50, lastUpdated: now} EX 600
  2. Updates mobile Redis: SET mobile:accounts:balance:acc_7810039 {balance: 10840.50} EX 120
  Cache refresh complete — next API call from Web or Mobile BFF will see updated balance

---
STEP 6: PUSH NOTIFICATION (async via Kafka)

event-router publishes to truview-core-notification-triggers (Kafka):
  {notificationType: "transaction_confirmation", userId, transactionId: "txn_abc123", amount: 1500.00, recipient: "12345678", status: "settled", timestamp}

notification-service consumes notification trigger:
  1. Looks up user's registered device token(s) from prod-redis-mobile-01
  2. Sends FCM notification:
     POST https://fcm.googleapis.com/v1/projects/truebank-truview/messages:send
     {message: {token: "[deviceToken]", notification: {title: "Payment sent", body: "Payment of $1,500.00 to ●●●● 5678 complete"}, data: {type: "transaction_confirmation", transactionId: "txn_abc123"}}}
  3. FCM delivers to device:
     Android: native FCM → device notification
     iOS: FCM → APNs → iPhone notification

Mobile app receives notification → updates local cache with new balance (background refresh)

---
STEP 7: TRANSACTION HISTORY UPDATE (async via Kafka)

transaction-service consumes TransactionCommitted event (Kafka: truview-core-transaction-events):
  1. Creates transaction record in PostgreSQL: INSERT INTO transactions (id, account_id, amount, ...) VALUES (...)
  2. Indexes transaction in Elasticsearch: POST /transactions_alias/_doc {"accountId": "acc_7810039", "amount": 1500.00, "timestamp": "2025-03-04T10:05:00Z", "merchantCategory": "transfer", ...}
  3. Invalidates Redis cache keys for transaction history: DEL transactions:list:userId:*
  After indexing: GET /api/v2/transactions will return the new transaction in the list

---
END-TO-END LATENCY (HAPPY PATH):

  Mobile app → BFF: 20ms (JWT validation cached)
  BFF → TruView Core (Mule): 15ms
  Core: account balance check (RDS): 25ms
  Core: fraud evaluation (APPID-445821): 180ms (well within 200ms SLA)
  Core: NPP submission (IBM MQ → Core Banking Adapter): 30ms
  NPP processing (external): 400-800ms (dominant factor)
  Core Banking confirmation → balance update: 50ms
  Kafka publish + acct-sync cache refresh: 200ms (async — does not block response)
  Push notification delivery: 500ms-2s (async — does not block payment response)

  Total mobile app → 202 Accepted response: 270-330ms (BFF returns 202 before NPP completes)
  Total payment settlement (end-to-end, including NPP): 800ms-1.5s from user tap
  Balance visible in app: ~1.5-3s (NPP settlement + Kafka event processing + Redis cache update)

---
IDEMPOTENCY HANDLING:

Duplicate payment prevention:
- X-Idempotency-Key (UUID) generated by mobile app before payment initiation
- Mobile BFF stores key in Redis: SET idempotency:{key} {status: "processing", correlationId} EX 300 (5 minutes)
- If same X-Idempotency-Key received within 5 minutes: BFF returns stored response without calling Core
- TruView Core: additional idempotency check in account-service (checks payment transaction log for duplicate idempotencyKey)
- Two-layer idempotency (BFF + Core) protects against both network retries and double-tap submissions

---
FAILURE PATHS:

Fraud reject (fraudScore >= 0.70):
  account-service returns HTTP 402 Payment Required {errorCode: "FRAUD_DECLINED", message: "Payment blocked by security controls"}
  Mobile BFF returns 402 to app → app displays: "We couldn't process this payment. Please contact us if you need help."
  Transaction is NOT submitted to NPP — no funds movement

NPP timeout (>2,000ms):
  account-service submits to IBM MQ (best effort) and returns HTTP 202 "Payment pending"
  Payment held in PENDING state in TruView Core DB
  Notification sent to customer: "Your payment is being processed and may take a few minutes"
  Retry job (scheduled): polls NPP reference every 30s for up to 24h; updates status when NPP confirms

Mainframe unavailable (Core Banking IBM MQ down):
  Core Banking Adapter: IBM MQ unavailable → returns HTTP 503 to account-service
  account-service: payment NOT submitted (do not lose funds by partial processing)
  Returns HTTP 503 to BFF → Mobile BFF returns 503 → app displays: "Payment service temporarily unavailable. Please try again."
  No Kafka events published — transaction not recorded (clean failure)

TruView Core completely down:
  Mobile BFF circuit breaker opens → BFF returns HTTP 503 immediately without calling Core
  App displays: "Banking services are temporarily unavailable."
  No funds movement; no transaction recorded`,
    tags: ['architecture', 'transaction-flow', 'payment', 'npp', 'pay-anyone', 'truview-mobile', 'truview-core', 'kafka', 'ibm-mq', 'fraud', 'idempotency', 'end-to-end'],
    classification: 'INTERNAL',
    freshness_ts: '2025-02-01T00:00:00Z',
    ingest_ts: '2025-03-04T00:00:00Z',
    ttl_hours: 168,
    meta: { doc_type: 'Flow Diagram / Architecture', topic: 'Payment Processing', reviewed: '2025-02-01' }
  },

];
