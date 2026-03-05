// Architecture / EA artifact synthetic data — interaction diagrams, blast radius

export const architectureChunks = [

  {
    id: 'arch_interact_001',
    appid: 'APPID-973193',
    source: 'architecture_ea',
    source_label: 'Architecture/ADR',
    record_id: 'ARCH-TRUVIEW-CORE-INTERACTIONS',
    title: 'TruView Core microservices interaction diagram — synchronous and event-driven flows',
    text: `ARCHITECTURE ARTIFACT: TruView Core Microservices Interaction Diagram
Type: Service Interaction Map
Owner: Enterprise Architecture
Last Reviewed: 2025-02-01
Status: Current (reflects production state as of Q1 2025)

SYNCHRONOUS CALL FLOWS (REST over HTTPS via Mule API Gateway):

External consumers → api-gateway-bridge → Mule (prod-mule-apigw-01) → TruView Core services:

TruView Web BFF → [via Mule] → account-service:
  GET /v2/accounts/{id} — account profile and status
  GET /v2/accounts/{id}/balance — current balance
  GET /v2/accounts/summary — multi-account summary (accounts/summary)
  SLA: p95 < 500ms (internal)

TruView Web BFF → [via Mule] → transaction-service:
  GET /v2/transactions — transaction list (paginated)
  GET /v2/transactions/recent — last 10 transactions
  SLA: p95 < 400ms

TruView Mobile BFF → [via Mule] → account-service: (same endpoints, optimised payload)
TruView Mobile BFF → [via Mule] → transaction-service: (same endpoints)
TruView Mobile BFF → [via Mule] → notification-service:
  POST /api/mobile/push/send — dispatch push notification
  SLA: p95 < 300ms (synchronous dispatch returns acknowledgement only)

account-service → legacy-dda-adapter:
  GET /internal/dda/account/{id} — mainframe DDA record lookup
  GET /internal/dda/balance/{id} — mainframe real-time balance
  SLA: p95 < 800ms (mainframe-backed — slowest synchronous path)
  Protocol: Internal REST; legacy-dda-adapter translates to IBM MQ for mainframe

account-service → auth-adapter:
  POST /internal/auth/validate — JWT token validation for account access
  p95 < 15ms (cached via Redis)

External API consumers → api-gateway-bridge → Mule → Fraud Detection (APPID-445821):
  POST /fraud/evaluate — real-time fraud evaluation (called synchronously by account-service on transaction events)
  SLA: 200ms (fraud team commitment)
  Fallback: If /fraud/evaluate times out, account-service uses local rules engine (conservative block)

account-service → Core Banking Adapter (APPID-100034):
  GET /cba/account-query — mainframe account data via Core Banking
  SLA: 800ms (mainframe-backed)
  Circuit breaker: tripped at >50% error rate over 10s window

ASYNCHRONOUS / EVENT-DRIVEN FLOWS (Kafka topics on prod-kafka-trueview):

account-service PRODUCES → truview-core-account-events (12 partitions):
  Events: AccountBalanceUpdated, AccountStatusChanged, AccountOpened, AccountClosed
  Schema: truview.core.AccountEvent.v3 (AWS Glue Schema Registry: trueview-schema-registry)
  Consumers: acct-sync-processor (TruView Core), Fraud Detection (APPID-445821), Core Banking Adapter (APPID-100034)

transaction-service PRODUCES → truview-core-transaction-events (24 partitions):
  Events: TransactionCommitted, TransactionReversed, TransactionPending
  Schema: truview.core.TransactionEvent.v2
  Consumers: transaction-sync-consumer (TruView Core), Customer Notification Hub (APPID-678234)

event-router ROUTES: truview-core-notification-triggers (6 partitions):
  Sourced from: account-service and transaction-service events
  Consumers: notification-service (TruView Core)

notification-service PRODUCES → notifications-outbound (6 partitions):
  Events: NotificationDispatched, NotificationFailed
  Consumers: Customer Notification Hub (APPID-678234)

acct-sync-processor (CONSUMER):
  Consumes: truview-core-account-events
  Purpose: Updates Redis cache (prod-redis-truview-01) with latest account balances for low-latency reads
  Consumer group: acct-sync-processor
  Currently: DEGRADED — 47,000 message lag (INC0089341)

SCHEMA REGISTRY:
All Kafka topic schemas are registered in AWS Glue Schema Registry (truebank-schema-registry).
Schema compatibility mode: FORWARD (producers can add optional fields; required field additions require migration).
Schema registry is in the critical path for all new deployments that modify Kafka message schemas.`,
    tags: ['architecture', 'microservices', 'interaction-diagram', 'truview-core', 'kafka', 'synchronous', 'async', 'event-driven', 'mule', 'schema-registry'],
    classification: 'INTERNAL',
    freshness_ts: '2025-02-01T10:00:00Z',
    ingest_ts: '2025-03-04T00:00:00Z',
    ttl_hours: 168,
    meta: { doc_type: 'Architecture Diagram', owner: 'Enterprise Architecture' }
  },

  {
    id: 'arch_blast_001',
    appid: 'APPID-973193',
    source: 'architecture_ea',
    source_label: 'Architecture/ADR',
    record_id: 'ARCH-BLAST-RADIUS-ACCOUNT-SERVICE',
    title: 'Blast radius analysis — TruView Core account-service failure',
    text: `ARCHITECTURE ARTIFACT: Blast Radius Analysis
Scenario: TruView Core account-service complete failure (service unavailable / all pods down)
Type: Failure Impact Analysis
Owner: Enterprise Architecture + Platform Engineering
Last Reviewed: 2025-02-15
Risk Level: CRITICAL (Tier 1 dependency chain)

DIRECT IMPACTS (immediate — within seconds):

1. TruView Web — account balance display UNAVAILABLE
   - Affected pages: Account Overview, Account Summary, Balance Enquiry
   - User experience: Blank balance fields or "Service unavailable" error cards
   - Affected users: ~180,000 daily active sessions; 100% impact on balance display
   - BFF behaviour: truview-web-bff circuit breaker trips for account-service calls after 50% error rate over 10s
   - Degraded mode: BFF returns cached balance from Redis (prod-redis-truview-01) — cache TTL 5 minutes
   - After cache expiry (5 min): Stale or empty balance shown; no live data available

2. TruView Mobile — account summary UNAVAILABLE
   - Affected screens: Account Summary, Home Dashboard, Balance tile
   - Affected users: ~420,000 daily active sessions; 100% impact on account balance
   - BFF behaviour: truview-mobile-bff circuit breaker trips (same pattern as Web BFF)
   - Degraded mode: Redis cache (5-minute TTL); after expiry, empty/stale balance
   - Push notifications for balance thresholds: DELAYED (acct-sync-processor lag persists)

3. Fraud Detection Service (APPID-445821) — transaction screening DEGRADED
   - account-service is called synchronously by transaction-service to provide account balance context for fraud evaluation (POST /fraud/evaluate)
   - With account-service down: fraud evaluation falls back to local rules engine (no real-time balance context)
   - Risk: fraud detection sensitivity reduced; some fraud scenarios (balance-context-dependent) may be missed
   - Fallback SLA: rules engine provides response in <50ms but with lower accuracy
   - Fraud team notification: automatic PagerDuty alert fired when account-service circuit breaker opens

4. Core Banking Adapter (APPID-100034) — real-time balance sync PAUSED
   - Core Banking polls account-service every 4 minutes for reconciliation data
   - With account-service down: polling returns 503; Core Banking falls back to reconciliation batch
   - Reconciliation batch runs every 4 hours — balance discrepancies may persist up to 4 hours post-recovery
   - Risk: LOW for customers (transactions still process); MEDIUM for internal reconciliation reports

INDIRECT IMPACTS (downstream cascade):

5. Customer Notification Hub (APPID-678234) — balance alert notifications DELAYED
   - Notification triggers depend on account balance events from acct-sync-processor
   - With account-service down, no new account events produced
   - Balance threshold alerts (e.g., "balance below $100") will not fire during outage
   - Notifications in the queue will be delivered on recovery (Kafka durability)

6. Analytics Platform (APPID-789012) — account activity metrics STALE
   - Analytics consumes truview-core-account-events for real-time dashboards
   - With no new events: dashboards show stale data; batch reports unaffected (nightly ETL)

NOT IMPACTED:
- Transaction history (transaction-service is independent of account-service for reads)
- Authentication/login (auth-adapter operates independently)
- Card transactions (processed by Card Management System APPID-334490, separate path)
- Payment processing (Payment Gateway APPID-221088 calls Core Banking directly)

RECOVERY SEQUENCE (priority order):
1. Restore account-service pods (kubectl rollout restart deployment/account-service -n truview-core)
2. Verify Redis cache priming (acct-sync-processor must process backlog)
3. Notify Fraud Detection team — manual review of any blocked transactions during outage window
4. Verify Core Banking reconciliation batch or trigger manual reconciliation
5. Close incident, document blast radius impact in PIR

RTO IMPLICATION: account-service RTO is 4 hours (Tier 1). Exceeding this triggers executive escalation per TrueBank Incident Management Policy IM-POL-004.`,
    tags: ['blast-radius', 'account-service', 'truview-core', 'failure-impact', 'architecture', 'fraud-detection', 'core-banking', 'truview-web', 'truview-mobile', 'recovery'],
    classification: 'INTERNAL',
    freshness_ts: '2025-02-15T10:00:00Z',
    ingest_ts: '2025-03-04T00:00:00Z',
    ttl_hours: 168,
    meta: { doc_type: 'Blast Radius Analysis', scenario: 'account-service failure', risk_level: 'CRITICAL' }
  },

  {
    id: 'arch_dep_001',
    appid: 'ALL',
    source: 'architecture_ea',
    source_label: 'Architecture/ADR',
    record_id: 'ARCH-TRUVIEW-DOWNSTREAM-MAP',
    title: 'TruView platform downstream dependency map',
    text: `ARCHITECTURE ARTIFACT: TruView Platform Downstream Dependency Map
Type: Dependency Map
Owner: Enterprise Architecture
Last Reviewed: 2025-02-15

This document maps TruView Core's downstream dependencies — services that TruView Core calls or that consume TruView Core data.

SYNCHRONOUS DOWNSTREAM DEPENDENCIES:

1. Fraud Detection Service (APPID-445821) — TIER 1
   Direction: TruView Core → Fraud Detection (TruView calls Fraud)
   Call pattern: Synchronous REST, invoked by account-service during transaction processing
   Endpoint: POST /fraud/evaluate
   SLA: 200ms p95 (Fraud Detection team commitment)
   Protocol: HTTPS via Mule API Gateway
   Failure handling: account-service circuit breaker; fallback to local rules engine
   Data sent: AccountID, TransactionAmount, TransactionType, DeviceFingerprint

2. Core Banking Adapter (APPID-100034) — TIER 1
   Direction: Bidirectional
     a) TruView Core → Core Banking: legacy-dda-adapter calls Core Banking for mainframe DDA data
        Endpoint: GET /cba/account-query
        SLA: 800ms p95 (mainframe-backed)
        Protocol: IBM MQ (legacy-dda-adapter translates to REST for internal consumption)
     b) Core Banking → TruView Core: Core Banking polls account-service for reconciliation
        Endpoint: GET /v2/accounts/{id}/balance (polled every 4 minutes)
   Failure handling: Both directions have circuit breakers; reconciliation falls back to 4-hour batch

3. Customer Identity Platform (APPID-556712) — TIER 1
   Direction: TruView Core → Customer Identity (auth-adapter calls CIP for token validation)
   Call pattern: Synchronous REST
   Endpoint: POST /identity/token/validate
   SLA: 50ms p95 (cached via Redis)
   Notes: auth-adapter caches valid tokens in Redis for 15 minutes; CIP downtime has minimal impact up to 15min

ASYNCHRONOUS DOWNSTREAM DEPENDENCIES (Kafka consumers of TruView Core topics):

4. Customer Notification Hub (APPID-678234) — TIER 2
   Consumes: notifications-outbound (Kafka topic)
   Data: NotificationDispatched events with push/email payload metadata
   Failure handling: Kafka durability; notifications queued for replay on recovery

5. Analytics Platform (APPID-789012) — TIER 2
   Consumes: truview-core-account-events, truview-core-transaction-events
   Data: Account and transaction events for real-time dashboards and batch ETL
   Failure handling: Kafka durability; analytics accepts eventual consistency

UPSTREAM DEPENDENCIES (services TruView Core depends on):
- prod-rds-truview-core-01 (PostgreSQL): Critical — account-service, transaction-service
- prod-kafka-trueview (MSK): Critical — event backbone (ADR-047)
- prod-redis-truview-01 (ElastiCache): High — caching layer
- prod-mule-apigw-01 (Mule): High — all external API traffic (ADR-061)
- Customer Identity Platform (APPID-556712): High — authentication
- IBM MQ / Core Banking: Medium — mainframe bridge (fallback available)`,
    tags: ['dependency-map', 'truview-core', 'architecture', 'downstream', 'upstream', 'fraud-detection', 'core-banking', 'customer-notification', 'analytics'],
    classification: 'INTERNAL',
    freshness_ts: '2025-02-15T10:00:00Z',
    ingest_ts: '2025-03-04T00:00:00Z',
    ttl_hours: 168,
    meta: { doc_type: 'Dependency Map', owner: 'Enterprise Architecture' }
  },

  {
    id: 'arch_kafka_001',
    appid: 'APPID-973193',
    source: 'architecture_ea',
    source_label: 'Architecture/ADR',
    record_id: 'ARCH-KAFKA-TOPOLOGY',
    title: 'TruView Core Kafka cluster topology and topic catalogue',
    text: `ARCHITECTURE ARTIFACT: Kafka Cluster Topology
Cluster: prod-kafka-trueview (AWS MSK)
Type: Topic Catalogue and Consumer Map
Last Reviewed: 2025-02-20

CLUSTER CONFIGURATION:
- Provider: AWS MSK (Managed Streaming for Apache Kafka)
- Kafka version: 3.5.1
- Brokers: 6 (msk.m5.xlarge each) across us-east-1a, us-east-1b, us-east-1c
- Replication factor: 3 (default for all topics)
- Min ISR: 2
- Retention: 7 days (default); 30 days for audit topics
- Schema Registry: AWS Glue Schema Registry (truebank-schema-registry)

TOPIC CATALOGUE:

Topic: truview-core-account-events
  Partitions: 12 | Replication: 3 | Retention: 7 days
  Produced by: account-service (AccountBalanceUpdated, AccountStatusChanged, AccountOpened, AccountClosed)
  Schema: truview.core.AccountEvent.v3 (registered in Glue Schema Registry)
  Consumer groups:
    - acct-sync-processor (TruView Core) — Redis cache refresh — CURRENTLY LAGGING 47,000 messages (INC0089341)
    - fraud-detection-consumer (APPID-445821) — fraud signal enrichment
    - core-banking-reconcile (APPID-100034) — balance reconciliation
  Current lag: 47,000 messages on acct-sync-processor (all others: <100 messages — unaffected)

Topic: truview-core-transaction-events
  Partitions: 24 | Replication: 3 | Retention: 7 days
  Produced by: transaction-service (TransactionCommitted, TransactionReversed, TransactionPending)
  Schema: truview.core.TransactionEvent.v2
  Consumer groups:
    - transaction-sync-consumer (TruView Core) — transaction cache refresh
    - notification-hub-consumer (APPID-678234) — customer notifications
  Current lag: all consumer groups <200 messages (healthy)

Topic: truview-core-notification-triggers
  Partitions: 6 | Replication: 3 | Retention: 24 hours
  Produced by: event-router (derived from account and transaction events)
  Schema: truview.core.NotificationTrigger.v1
  Consumer groups:
    - notification-service-consumer (TruView Core notification-service)
  Current lag: <50 messages (healthy)

Topic: notifications-outbound
  Partitions: 6 | Replication: 3 | Retention: 48 hours
  Produced by: notification-service
  Schema: truview.core.NotificationDispatched.v1
  Consumer groups:
    - notification-hub-inbound (APPID-678234)
  Current lag: 14,200 messages (INC0091205 — retry queue depth)

DEAD LETTER TOPICS:
  truview-core-account-events-dlq — failed messages from acct-sync-processor
  truview-core-notification-dlq — failed notification dispatch messages
  Monitoring: Dynatrace alert if DLQ depth >100 messages`,
    tags: ['kafka', 'topology', 'truview-core', 'topics', 'msk', 'consumer-groups', 'schema-registry', 'architecture'],
    classification: 'INTERNAL',
    freshness_ts: '2025-02-20T10:00:00Z',
    ingest_ts: '2025-03-04T00:00:00Z',
    ttl_hours: 168,
    meta: { doc_type: 'Kafka Topology', cluster: 'prod-kafka-trueview' }
  },

];
