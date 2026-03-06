// Process flow documentation for TruView Core, Web, and Mobile
// App-scoped — retrieved via normal keyword scoring

export const processflowChunks = [

  // ─── TRUVIEW CORE ──────────────────────────────────────────────────────────

  {
    id: 'flow_core_001',
    appid: 'APPID-973193',
    source: 'process_flow',
    source_label: 'Process Flow',
    record_id: 'FLOW-CORE-BALANCE-001',
    title: 'TruView Core — Account balance update end-to-end process flow',
    text: `PROCESS FLOW: TruView Core — Account Balance Update
Document: FLOW-CORE-BALANCE-001
Owner: Platform Engineering
Last Updated: 2025-02-15

TRIGGER: A financial transaction is committed (e.g. direct deposit, debit card purchase, transfer)

STEP 1 — TRANSACTION COMMITTED
  Core Banking System (APPID-100034) posts transaction event via IBM MQ to legacy-dda-adapter.
  legacy-dda-adapter translates IBM MQ message → REST call to transaction-service.
  transaction-service persists transaction to prod-rds-truview-core-01 (PostgreSQL).
  transaction-service produces TransactionCommitted event → truview-core-transaction-events (Kafka, 24 partitions).

STEP 2 — ACCOUNT BALANCE CALCULATION
  account-service consumes TransactionCommitted from Kafka (consumer group: acct-sync-processor-upstream).
  account-service fetches current balance from PostgreSQL and applies transaction delta.
  account-service updates balance record in PostgreSQL (ACID transaction).
  account-service produces AccountBalanceUpdated event → truview-core-account-events (Kafka, 12 partitions).

STEP 3 — CACHE REFRESH (async)
  acct-sync-processor consumer group picks up AccountBalanceUpdated event from truview-core-account-events.
  Processor calls Redis SET on key account:{accountId}:balance (TTL: 300 seconds).
  Redis cache (prod-redis-truview-01) is now updated — subsequent reads from TruView Web and Mobile BFFs are served from cache.
  NOTE: If acct-sync-processor is lagging (INC0089341), this step is delayed by the lag duration.

STEP 4 — FRAUD EVALUATION (synchronous, parallel to Step 3)
  account-service synchronously calls POST /fraud/evaluate on Fraud Detection Service (APPID-445821).
  Fraud Detection evaluates the transaction using real-time balance context.
  If /fraud/evaluate times out (>200ms): account-service falls back to local rules engine.

STEP 5 — USER READS BALANCE (TruView Web / Mobile)
  BFF receives GET /v2/accounts/{id}/balance request.
  BFF checks Redis cache: HIT → returns cached balance (p95 <50ms). MISS → calls account-service directly (p95 <500ms).
  Balance displayed in TruView Web account summary or TruView Mobile home screen.

END-TO-END LATENCY (healthy system):
  Transaction committed → balance visible to user: ~3–8 seconds
  Bottleneck: Kafka consumer processing time (Step 3), not synchronous path`,
    tags: ['process-flow', 'truview-core', 'balance-update', 'kafka', 'transaction', 'account-service', 'redis', 'fraud', 'end-to-end'],
    classification: 'INTERNAL',
    freshness_ts: '2025-02-15T10:00:00Z',
    ingest_ts: '2025-03-04T08:05:00Z',
    ttl_hours: 168,
    meta: { doc_type: 'Process Flow', owner: 'Platform Engineering' }
  },

  {
    id: 'flow_core_002',
    appid: 'APPID-973193',
    source: 'process_flow',
    source_label: 'Process Flow',
    record_id: 'FLOW-CORE-AUTH-001',
    title: 'TruView Core — Authentication and JWT validation flow',
    text: `PROCESS FLOW: TruView Core — Authentication and JWT Token Validation
Document: FLOW-CORE-AUTH-001
Owner: Platform Engineering
Last Updated: 2025-02-01

TRIGGER: User logs in via TruView Web or Mobile app

STEP 1 — LOGIN REQUEST
  User submits credentials (username + password or biometric).
  TruView Web BFF / Mobile BFF sends POST /auth/login to auth-adapter.
  auth-adapter proxies credentials to Customer Identity Platform (CIP, APPID-556712) via POST /identity/authenticate.

STEP 2 — TOKEN ISSUANCE
  CIP validates credentials against the identity store.
  On success: CIP returns { access_token (JWT, 15min TTL), refresh_token (opaque, 30 days) }.
  auth-adapter passes tokens to BFF.
  BFF sets secure HttpOnly cookie (Web) or stores in secure enclave (Mobile) with access_token.

STEP 3 — AUTHENTICATED API REQUEST
  User navigates to account summary. BFF sends request to account-service with Authorization: Bearer {jwt}.
  account-service calls auth-adapter POST /internal/auth/validate with the JWT.
  auth-adapter checks Redis cache (prod-redis-truview-01, key: jwt:{hash}, TTL 15min):
    - CACHE HIT: returns validated user context (sub, roles, tenantId) — <5ms
    - CACHE MISS: calls CIP POST /identity/token/validate — ~50ms p95; caches result in Redis on success

STEP 4 — TOKEN REFRESH
  When access_token expires (15min), BFF detects 401 response from any upstream service.
  BFF calls auth-adapter POST /auth/refresh with refresh_token.
  auth-adapter calls CIP POST /identity/token/refresh.
  CIP issues new access_token; refresh_token rotated (sliding window, 30 days).
  BFF updates cookie/storage and retries original request transparently.

FAILURE MODES:
  - CIP outage: auth-adapter serves cached valid tokens for up to 15 minutes from Redis
  - Redis outage: auth-adapter calls CIP directly on every request (higher latency, ~50ms per request)
  - Both CIP + Redis down: all authenticated requests fail; login unavailable`,
    tags: ['process-flow', 'truview-core', 'authentication', 'jwt', 'auth-adapter', 'cip', 'redis', 'login', 'token'],
    classification: 'INTERNAL',
    freshness_ts: '2025-02-01T10:00:00Z',
    ingest_ts: '2025-03-04T08:05:00Z',
    ttl_hours: 168,
    meta: { doc_type: 'Process Flow', owner: 'Platform Engineering' }
  },

  // ─── TRUVIEW WEB ───────────────────────────────────────────────────────────

  {
    id: 'flow_web_001',
    appid: 'APPID-871198',
    source: 'process_flow',
    source_label: 'Process Flow',
    record_id: 'FLOW-WEB-REQUEST-001',
    title: 'TruView Web — BFF request handling and caching flow',
    text: `PROCESS FLOW: TruView Web — BFF Request Handling
Document: FLOW-WEB-REQUEST-001
Owner: Web Platform Team
Last Updated: 2025-02-10

TRIGGER: Authenticated user loads TruView Web account summary page

STEP 1 — BROWSER REQUEST
  Browser loads React SPA from CloudFront (prod-cf-truview-web).
  SPA makes GET /api/v2/accounts/summary from BFF (also via CloudFront /api/* behaviour → BFF on EKS).
  Request includes HttpOnly session cookie with JWT.

STEP 2 — BFF RECEIVES REQUEST (truview-web-bff, prod-eks-web-01)
  BFF middleware validates JWT: calls auth-adapter POST /internal/auth/validate.
  On valid JWT: BFF proceeds to data fetch. On invalid: returns HTTP 401 to browser.

STEP 3 — DATA AGGREGATION (BFF fan-out)
  BFF makes parallel upstream calls:
    a) GET /v2/accounts/summary → account-service [via Mule API Gateway]
    b) GET /v2/transactions/recent → transaction-service [via Mule API Gateway]
  Timeout per upstream call: 3,000ms (circuit breaker trips at >50% errors over 10s).

STEP 4 — CACHE STRATEGY
  BFF caches /v2/accounts/summary response in Redis (prod-redis-truview-01):
    Key: web-bff:accounts-summary:{userId} | TTL: 30 seconds
  On cache HIT: returns cached response immediately — no upstream calls.
  On cache MISS: fetches from upstream (Steps 3) and populates cache.
  Cache invalidation: explicit POST /admin/cache/invalidate/{userId} (called by account-service on balance update events).

STEP 5 — RESPONSE
  BFF aggregates account + transaction data into a single JSON response.
  CloudFront serves response to browser.
  Browser renders account summary page (target LCP: <2.5s).

CIRCUIT BREAKER BEHAVIOUR (account-service failure):
  If account-service circuit breaker is OPEN: BFF returns HTTP 503 with degraded payload.
  Degraded payload: last cached balance (from Redis) with a "data may be stale" flag.
  After cache TTL expires (30s): BFF returns empty balance fields with error indicator.`,
    tags: ['process-flow', 'truview-web', 'bff', 'request-handling', 'caching', 'redis', 'cloudfront', 'circuit-breaker'],
    classification: 'INTERNAL',
    freshness_ts: '2025-02-10T10:00:00Z',
    ingest_ts: '2025-03-04T08:05:00Z',
    ttl_hours: 168,
    meta: { doc_type: 'Process Flow', owner: 'Web Platform Team' }
  },

  // ─── TRUVIEW MOBILE ────────────────────────────────────────────────────────

  {
    id: 'flow_mobile_001',
    appid: 'APPID-871204',
    source: 'process_flow',
    source_label: 'Process Flow',
    record_id: 'FLOW-MOBILE-PUSH-001',
    title: 'TruView Mobile — Push notification delivery flow (iOS and Android)',
    text: `PROCESS FLOW: TruView Mobile — Push Notification Delivery
Document: FLOW-MOBILE-PUSH-001
Owner: Mobile Platform Team
Last Updated: 2025-02-20

TRIGGER: Account balance threshold crossed (e.g. balance drops below $100) or transaction alert

STEP 1 — TRIGGER EVENT
  account-service produces AccountBalanceUpdated event to truview-core-account-events (Kafka).
  event-router consumes event and evaluates notification rules (balance threshold config per user).
  event-router produces NotificationTrigger event to truview-core-notification-triggers (Kafka).

STEP 2 — NOTIFICATION SERVICE PICKS UP TRIGGER
  notification-service consumer group picks up NotificationTrigger from Kafka.
  notification-service looks up user's registered device tokens from the device registry (PostgreSQL table: device_tokens).
  Notification service selects delivery channel per device: FCM (Android + iOS relay) or direct APNs (iOS).

STEP 3a — ANDROID DELIVERY (via Firebase Cloud Messaging)
  notification-service calls Firebase Admin SDK: POST to FCM API with device token and payload.
  FCM routes message to Android device via Google's infrastructure.
  Delivery SLA: typically <5 seconds end-to-end.
  notification-service produces NotificationDispatched event to notifications-outbound (Kafka).

STEP 3b — iOS DELIVERY (via APNs)
  notification-service calls Apple APNs HTTP/2 API with device push token.
  APNs routes to iOS device. Apple does not confirm delivery to sender (fire-and-forget).
  Apple allows max 1,000 concurrent APNs connections per certificate.
  NOTE: firebase-messaging 9.3.2 (CHG0104756) caused connection pool exhaustion — INC0091205 active.
  Rollback to 9.1.0 via PIPE-HOTFIX-4756 pending CAB approval.

STEP 4 — DEVICE RECEIVES NOTIFICATION
  iOS: APNs delivers to iOS notification centre. App must be registered for background push.
  Android: FCM delivers to device. App processes payload in background service.

FAILURE HANDLING:
  Failed delivery: notification-service retries up to 3 times (exponential backoff: 5s, 30s, 5min).
  After 3 failures: message moves to truview-core-notification-dlq (Kafka DLQ).
  DLQ monitoring: Dynatrace alert if DLQ depth >100 messages.`,
    tags: ['process-flow', 'truview-mobile', 'push-notification', 'apns', 'ios', 'android', 'firebase', 'fcm', 'kafka', 'delivery'],
    classification: 'INTERNAL',
    freshness_ts: '2025-02-20T10:00:00Z',
    ingest_ts: '2025-03-04T08:05:00Z',
    ttl_hours: 168,
    meta: { doc_type: 'Process Flow', owner: 'Mobile Platform Team' }
  },

];
