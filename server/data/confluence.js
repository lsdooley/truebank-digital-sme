// Confluence synthetic data — ADRs, runbooks, service catalog, onboarding

export const confluenceChunks = [

  // ─── ARCHITECTURE DECISION RECORDS ────────────────────────────────────────

  {
    id: 'conf_adr_001',
    appid: 'APPID-973193',
    source: 'confluence_adr',
    source_label: 'Confluence',
    record_id: 'ADR-047',
    title: 'ADR-047 — Adopt Kafka as event backbone for TruView Core',
    text: `ARCHITECTURE DECISION RECORD: ADR-047
Title: Adopt Apache Kafka as the Event Backbone for TruView Core
Status: Accepted
Date: 2024-01-08
Decision Makers: Platform Engineering, Enterprise Architecture
Confluence Page: /wiki/spaces/TRUVIEW/pages/ADR-047

CONTEXT:
TruView Core previously used point-to-point REST synchronisation between microservices. As the number of consuming services grew (TruView Web, TruView Mobile, Fraud Detection, Core Banking Adapter), the REST synchronisation model created tight coupling and cascading failure risks. A new event-driven backbone was required to decouple producers from consumers and support independent scaling.

DECISION:
Adopt Apache Kafka (AWS MSK) as the primary event backbone for TruView Core. All account balance update events, transaction events, and notification trigger events will be published to Kafka topics rather than pushed via REST to consumers.

Kafka cluster: prod-kafka-trueview (MSK)
Cluster configuration: 6 brokers, replication factor 3, minimum ISR 2

KEY KAFKA TOPICS:
- truview-core-account-events: Account balance updates, account state changes. Partitions: 12. Consumed by: acct-sync-processor, Fraud Detection, Core Banking Adapter.
- truview-core-transaction-events: Transaction committed events. Partitions: 24. Consumed by: transaction-sync-consumer, Customer Notification Hub.
- truview-core-notification-triggers: Notification trigger events (balance alerts, transaction alerts). Partitions: 6. Consumed by: notification-service.
- notifications-outbound: Notification dispatch events. Partitions: 6. Consumed by: Customer Notification Hub.

CONSEQUENCES:
1. All downstream consumers MUST implement idempotent message handling (duplicate delivery is possible under Kafka at-least-once semantics).
2. Consumer offset management is a team responsibility — incorrect offset commits can cause duplicate processing or message loss.
3. Consumer group lag monitoring is mandatory. Dynatrace dashboards must be configured for all consumer groups.
4. Schema registry (AWS Glue Schema Registry) is required for all topic schemas. Breaking schema changes require a schema migration procedure.
5. Kafka is now a Tier 1 dependency of TruView Core — its availability directly impacts Core availability.

ALTERNATIVES CONSIDERED:
- AWS SQS/SNS: Rejected — insufficient support for consumer group semantics and replay capability.
- RabbitMQ: Rejected — operational complexity and lack of bank-wide standardisation.
- REST callbacks (current state): Rejected — tight coupling and cascading failure risk.

STATUS NOTES: This ADR is foundational for understanding INC0089341 (consumer lag) and CHG0104892 (consumer memory configuration).`,
    tags: ['adr', 'kafka', 'event-driven', 'truview-core', 'architecture', 'msk', 'event-backbone', 'accepted'],
    classification: 'INTERNAL',
    freshness_ts: '2025-02-15T10:00:00Z',
    ingest_ts: '2025-03-04T00:00:00Z',
    ttl_hours: 168,
    meta: { adr_status: 'Accepted', decision_date: '2024-01-08' }
  },

  {
    id: 'conf_adr_002',
    appid: 'ALL',
    source: 'confluence_adr',
    source_label: 'Confluence',
    record_id: 'ADR-052',
    title: 'ADR-052 — Backend for Frontend (BFF) pattern for TruView Web and Mobile',
    text: `ARCHITECTURE DECISION RECORD: ADR-052
Title: Adopt Backend for Frontend (BFF) Pattern for TruView Web and TruView Mobile
Status: Accepted
Date: 2024-03-12
Decision Makers: Platform Engineering, Web Platform Team, Mobile Platform Team

CONTEXT:
As TruView Web and TruView Mobile matured as distinct products with different data shaping requirements, directly coupling both frontends to TruView Core's microservice APIs created two problems: (1) API contracts in TruView Core were constrained by the most demanding client's requirements, and (2) each frontend received more data than it needed, increasing payload sizes and latency.

DECISION:
Adopt the BFF pattern. Each frontend (Web and Mobile) owns a dedicated Node.js BFF service that:
1. Aggregates and composes data from TruView Core microservices
2. Shapes responses for the specific frontend's data requirements
3. Manages its own caching layer (Redis, per-BFF)
4. Owns its deployment lifecycle independently of TruView Core

BFF Services:
- truview-web-bff: serves TruView Web SPA. Hosted on prod-eks-web-01.
- truview-mobile-bff: serves TruView Mobile apps. Hosted on prod-eks-mobile-01.

CONSEQUENCES:
1. BFF services are independently deployable — a TruView Web BFF deployment does not require a TruView Core deployment.
2. BFF services must not contain business logic — they are data transformation and aggregation layers only.
3. Each BFF owns its own API contract with its frontend. TruView Core API contracts are internal-facing only.
4. BFF teams are responsible for monitoring their own BFF services (separate Dynatrace dashboards).
5. In the event of a TruView Core outage, BFFs should implement circuit breaker patterns and return graceful degraded responses.

RELATED ADR: ADR-061 (Mule API Gateway for internal service mesh — BFF services call TruView Core through Mule)`,
    tags: ['adr', 'bff', 'backend-for-frontend', 'truview-web', 'truview-mobile', 'architecture', 'accepted', 'pattern'],
    classification: 'INTERNAL',
    freshness_ts: '2025-02-15T10:00:00Z',
    ingest_ts: '2025-03-04T00:00:00Z',
    ttl_hours: 168,
    meta: { adr_status: 'Accepted', decision_date: '2024-03-12' }
  },

  {
    id: 'conf_adr_003',
    appid: 'APPID-973193',
    source: 'confluence_adr',
    source_label: 'Confluence',
    record_id: 'ADR-061',
    title: 'ADR-061 — Mule API Gateway for TruView Core internal service mesh',
    text: `ARCHITECTURE DECISION RECORD: ADR-061
Title: Adopt Mule API Gateway over AWS API Gateway for TruView Core Internal Service Mesh
Status: Accepted
Date: 2024-06-20
Decision Makers: Enterprise Architecture, Platform Engineering, Bank-Wide API Governance

CONTEXT:
TruView Core's 7 microservices expose internal APIs consumed by TruView Web BFF, TruView Mobile BFF, Fraud Detection, and Core Banking Adapter. A consistent API policy enforcement layer was required for: rate limiting, authentication, request logging, and API versioning. TrueBank has a bank-wide mandate for consistent API policy enforcement across all Tier 1 applications.

DECISION:
Route all TruView Core internal API traffic through the bank-wide Mule API Gateway deployment (prod-mule-apigw-01). This satisfies the bank-wide API governance mandate and provides consistent policy enforcement.

Policies enforced by Mule on TruView Core:
- Rate limiting: 200 RPS per consumer (increased to 500 RPS for approved consumers via CHG0104333)
- mTLS authentication for service-to-service calls
- Request/response logging to bank-wide audit log
- API versioning enforcement (/v1/, /v2/ path management)

CONSEQUENCES:
1. All TruView Core API configuration changes that affect rate limits or policy must go through Mule API Gateway — not directly to the microservice.
2. The Mule team must be involved in TruView Core capacity planning for API traffic increases.
3. Mule API Gateway is now in the critical path for all TruView Core external API calls. Mule downtime = TruView Core external API unavailability.
4. Internal service-to-service calls within TruView Core (within the same EKS cluster) bypass Mule for performance reasons.
5. ADR-061 overrides any team-level decision to use AWS API Gateway for TruView Core internal APIs.`,
    tags: ['adr', 'mule', 'api-gateway', 'truview-core', 'architecture', 'accepted', 'policy', 'rate-limiting', 'bank-mandate'],
    classification: 'INTERNAL',
    freshness_ts: '2025-02-15T10:00:00Z',
    ingest_ts: '2025-03-04T00:00:00Z',
    ttl_hours: 168,
    meta: { adr_status: 'Accepted', decision_date: '2024-06-20' }
  },

  // ─── RUNBOOKS ─────────────────────────────────────────────────────────────

  {
    id: 'conf_kb_001a',
    appid: 'APPID-973193',
    source: 'confluence_runbooks',
    source_label: 'Confluence',
    record_id: 'KB0031022',
    title: 'Runbook — TruView Core EKS Node Restart Procedure',
    text: `RUNBOOK: KB0031022
Title: TruView Core — EKS Node Restart Procedure
Last Updated: 2025-02-20
Owner: Platform SRE Team
Confluence: /wiki/spaces/TRUVIEW/runbooks/KB0031022

WHEN TO USE:
- A node in prod-eks-trueview-01 is in NotReady state for >5 minutes
- A node is showing disk pressure, memory pressure, or PID pressure
- Directed by a Dynatrace alert for node-level anomaly
- Escalation path from INC with node-level symptoms

PREREQUISITE SAFETY CHECKS (complete ALL before proceeding):
1. Confirm at least 2 healthy nodes remain in the target node group after the restart:
   kubectl get nodes -l nodegroup=truview-core-processing
   Minimum healthy: 4 of 5 nodes must be Ready before draining any single node.
2. Check PodDisruptionBudgets are satisfied:
   kubectl get pdb -n truview-core
   All PDBs must show ALLOWED DISRUPTIONS >= 1.
3. Confirm no active SEV1 or SEV2 incidents where this node group is implicated. Check INC status in ServiceNow.
4. Notify Platform SRE channel in Slack (#truview-sre-oncall) before starting.

STEP-BY-STEP PROCEDURE:
Step 1 — Identify the target node:
  kubectl get nodes -l nodegroup=truview-core-processing
  Note the NODE_NAME of the NotReady or degraded node.

Step 2 — Cordon the node (prevent new pod scheduling):
  kubectl cordon <NODE_NAME>
  Verify: kubectl get node <NODE_NAME> — should show SchedulingDisabled.

Step 3 — Drain the node (evict all pods gracefully):
  kubectl drain <NODE_NAME> --ignore-daemonsets --delete-emptydir-data --grace-period=60
  Expected duration: 2–5 minutes. Watch for pod eviction events.
  If drain hangs: check for pods with custom finalizers — do not force-delete without SRE lead approval.

Step 4 — Terminate and replace the EC2 instance via AWS Console or CLI:
  aws ec2 terminate-instances --instance-ids <INSTANCE_ID> --region us-east-1
  The EKS node group auto-scaling will provision a replacement node automatically within 3–5 minutes.

Step 5 — Validate new node joins the cluster:
  kubectl get nodes -l nodegroup=truview-core-processing --watch
  Wait for new node to reach Ready state. Expected: <5 minutes.

Step 6 — Validate pod health on the new node:
  kubectl get pods -n truview-core -o wide | grep <NEW_NODE_NAME>
  All pods should reach Running state within 3 minutes of node readiness.

Step 7 — Dynatrace validation:
  Open Dynatrace > Hosts > prod-eks-trueview-01 nodes.
  Confirm the new node appears healthy. Confirm all TruView Core microservice health checks are green.
  Check: Services > TruView Core > account-service > Health — should show Available.

Step 8 — Post-restart validation queries:
  Test account-service endpoint: curl -H "Authorization: Bearer $TEST_TOKEN" https://internal-api.truebank.com/v2/accounts/health
  Expected: HTTP 200 {"status": "healthy"}
  Test Kafka consumer lag: kubectl exec -n truview-core -it <kafka-admin-pod> -- kafka-consumer-groups.sh --bootstrap-server prod-kafka-trueview:9092 --describe --group acct-sync-processor
  Expected: LAG = 0 or decreasing.

ROLLBACK / ESCALATION:
- If new node does not reach Ready within 10 minutes: escalate to Platform Engineering on-call.
- If pods do not recover: check events with kubectl describe pod <POD_NAME> -n truview-core.
- If account-service health check fails: escalate to Platform Engineering. Do not attempt further restarts without SRE lead approval.`,
    tags: ['runbook', 'eks', 'node-restart', 'truview-core', 'kubernetes', 'procedure', 'sre', 'kubectl'],
    classification: 'INTERNAL',
    freshness_ts: '2025-02-20T10:00:00Z',
    ingest_ts: '2025-03-04T00:00:00Z',
    ttl_hours: 168,
    meta: { kb_type: 'Runbook', owner: 'Platform SRE Team' }
  },

  {
    id: 'conf_kb_002',
    appid: 'APPID-973193',
    source: 'confluence_runbooks',
    source_label: 'Confluence',
    record_id: 'KB0034512',
    title: 'Runbook — TruView Core Account Service Connection Pool Exhaustion',
    text: `RUNBOOK: KB0034512
Title: TruView Core — Account Service Connection Pool Exhaustion Response
Last Updated: 2025-02-28
Owner: Platform SRE Team
Related Problem: PRB0012441

SYMPTOMS:
- Dynatrace alert: "account-service — PostgreSQL connection pool saturation" (>95% pool utilisation)
- HTTP 503 errors from account-service endpoints
- Clients (TruView Web, TruView Mobile, Fraud Detection) reporting account data unavailability
- Log pattern in account-service pods: "HikariPool-1 - Connection is not available, request timed out after 30000ms"

TRIAGE:
1. Confirm connection pool is the issue (not a broader RDS outage):
   kubectl logs -n truview-core -l app=account-service --tail=100 | grep "HikariPool"
   If you see "Connection is not available" — proceed with this runbook.
   If you see "Connection refused" or RDS-level errors — escalate to DB team (not a pool exhaustion issue).

2. Check current RPS on account-service:
   Dynatrace > Services > account-service > Throughput. If >350 RPS, the pool is likely saturated.

IMMEDIATE MITIGATION:
Step 1 — Reduce consumer concurrency to lower account-service RPS:
  kubectl set env deployment/acct-sync-processor -n truview-core CONSUMER_CONCURRENCY=5
  This reduces Kafka consumer throughput, which reduces the processing load on account-service.
  Expected: account-service RPS drops within 2–3 minutes.

Step 2 — Restart affected account-service pods to clear pool state:
  kubectl rollout restart deployment/account-service -n truview-core
  Monitor: kubectl rollout status deployment/account-service -n truview-core
  Expected: 2–3 minutes for rolling restart of 3 replicas.

Step 3 — Validate recovery:
  Dynatrace > Services > account-service > PostgreSQL connection pool utilisation
  Target: <70% pool utilisation.
  Test endpoint: curl -H "Authorization: Bearer $TEST_TOKEN" https://internal-api.truebank.com/v2/accounts/health

INVESTIGATION:
After immediate mitigation, investigate sustained load cause:
- Is there an upstream load spike? (Check TruView Web and Mobile BFF traffic)
- Is there a runaway consumer? (Check kafka-consumer-groups for unusual throughput)
- Is there a new deployment that increased concurrency? (Check recent changes in ServiceNow)

ESCALATION:
- If connection pool does not recover within 10 minutes of pod restart: escalate to Platform Engineering lead (David Nguyen).
- Long-term fix tracked in PRB0012441 (HikariCP pool size increase to 50, pending deployment).`,
    tags: ['runbook', 'account-service', 'connection-pool', 'postgresql', 'hikaricp', 'truview-core', 'procedure', 'mitigation', 'prb0012441'],
    classification: 'INTERNAL',
    freshness_ts: '2025-02-28T10:00:00Z',
    ingest_ts: '2025-03-04T00:00:00Z',
    ttl_hours: 168,
    meta: { kb_type: 'Runbook', related_problem: 'PRB0012441' }
  },

  {
    id: 'conf_kb_003',
    appid: 'APPID-973193',
    source: 'confluence_runbooks',
    source_label: 'Confluence',
    record_id: 'KB0036891',
    title: 'Runbook — TruView Core Kafka Consumer Lag Response Playbook',
    text: `RUNBOOK: KB0036891
Title: TruView Core — Kafka Consumer Lag Response Playbook
Last Updated: 2025-03-01
Owner: Platform SRE Team
Related ADR: ADR-047

WHEN TO USE:
- Dynatrace alert "Kafka consumer throughput degraded" fires (e.g., P-3891)
- Consumer lag on truview-core-account-events or truview-core-transaction-events is growing rather than stable
- INC opened for account balance or transaction data delays

STEP 1 — ASSESS LAG SEVERITY:
Connect to a Kafka admin pod in the truview-core namespace:
  kubectl exec -n truview-core -it <kafka-admin-pod> -- /bin/bash

Check consumer group lag:
  kafka-consumer-groups.sh --bootstrap-server prod-kafka-trueview:9092 --describe --group acct-sync-processor

Interpret lag levels:
  - LAG 0–500: Normal. No action required.
  - LAG 500–5,000: Elevated. Monitor every 5 minutes. Check consumer pod health.
  - LAG 5,000–20,000: High. Begin investigation. Check pod memory and CPU.
  - LAG >20,000: Critical. Begin this playbook immediately. Open INC if not already open.

STEP 2 — IDENTIFY LAG CAUSE:
Check consumer pod memory and CPU:
  kubectl top pods -n truview-core -l app=acct-sync-processor
  If memory >85%: likely memory pressure causing GC pauses. See Step 3a.
  If CPU >80%: likely processing bottleneck. See Step 3b.
  If pod is crashing/restarting: check events and logs:
    kubectl describe pod <pod-name> -n truview-core
    kubectl logs <pod-name> -n truview-core --previous

STEP 3a — MEMORY PRESSURE RESPONSE:
Option 1 — Scale out replicas (preferred):
  kubectl scale deployment/acct-sync-processor --replicas=5 -n truview-core
  Additional replicas will join the consumer group and share partition assignments.
  Expected lag reduction: 10–15 minutes.

Option 2 — Restart leaking pod:
  kubectl rollout restart deployment/acct-sync-processor -n truview-core
  This clears the memory leak but causes a brief consumer pause (15–30 seconds).
  Consumer group will rebalance automatically after restart.

STEP 3b — PROCESSING BOTTLENECK RESPONSE:
Increase consumer concurrency (if current CONSUMER_CONCURRENCY < 10):
  kubectl set env deployment/acct-sync-processor -n truview-core CONSUMER_CONCURRENCY=10
  Monitor lag reduction over 5 minutes.

STEP 4 — SAFE OFFSET RESET (use only if consumer is stuck, not just slow):
WARNING: Only perform offset reset if consumer group is completely stuck (lag growing with 0 throughput).
Do NOT reset offsets if consumer is making progress (lag decreasing or stable).

  kafka-consumer-groups.sh --bootstrap-server prod-kafka-trueview:9092 \
    --group acct-sync-processor --topic truview-core-account-events \
    --reset-offsets --to-latest --execute

After reset, monitor that consumers resume processing:
  kafka-consumer-groups.sh --bootstrap-server prod-kafka-trueview:9092 --describe --group acct-sync-processor
  Throughput should appear within 30 seconds.

STEP 5 — VALIDATE RECOVERY:
- Consumer lag returns to <1,000 and is decreasing
- Dynatrace P-3891 auto-resolves (or manually resolve)
- TruView Web account balance refresh delays resolve (<1 minute latency)
- Account balance alerts in Dynatrace return to green

STEP 6 — POST-INCIDENT:
- Document lag peak value, duration, and resolution actions in INC record
- Check if restart correlated with a recent deployment — if yes, file Change correlation in CHG record
- Update PRB0012441 if connection pool was also involved`,
    tags: ['runbook', 'kafka', 'consumer-lag', 'truview-core', 'playbook', 'offset-reset', 'acct-sync-processor', 'procedure', 'adr-047'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-01T10:00:00Z',
    ingest_ts: '2025-03-04T00:00:00Z',
    ttl_hours: 168,
    meta: { kb_type: 'Runbook', owner: 'Platform SRE Team', related_adr: 'ADR-047' }
  },

  {
    id: 'conf_kb_004',
    appid: 'ALL',
    source: 'confluence_runbooks',
    source_label: 'Confluence',
    record_id: 'KB0039204',
    title: 'Runbook — TruView Web/Mobile BFF Circuit Breaker Trip Response',
    text: `RUNBOOK: KB0039204
Title: TruView Web and Mobile — BFF Circuit Breaker Trip Response
Last Updated: 2025-02-10
Owner: Platform SRE Team
Related ADR: ADR-052

WHEN TO USE:
- Dynatrace alert: "truview-web-bff — circuit breaker open for account-service"
- TruView Web showing degraded mode (partial data or error cards)
- TruView Mobile showing "Service unavailable" for account or transaction features

BACKGROUND:
The TruView BFF services (truview-web-bff, truview-mobile-bff) implement Hystrix-style circuit breakers for all TruView Core microservice calls. Circuit breakers trip to OPEN state when error rate on a downstream call exceeds 50% over a 10-second rolling window. When open, the BFF returns a cached or degraded response instead of calling the failing service.

Circuit breaker states:
- CLOSED: Normal operation. Calls pass through.
- OPEN: Failing fast. No calls to downstream. Returns cached/degraded response.
- HALF-OPEN: Testing recovery. One probe call every 30 seconds.

IDENTIFY TRIPPED CIRCUITS:
Check BFF circuit breaker status endpoint:
  curl https://internal-bff-web.truebank.com/admin/circuits
  curl https://internal-bff-mobile.truebank.com/admin/circuits
Look for "state": "OPEN" entries.

Or check Dynatrace: Services > truview-web-bff > Dependencies — red connections indicate open circuits.

SAFE RESTART SEQUENCE:
WARNING: Do not restart BFF pods until TruView Core is confirmed healthy. Restarting BFFs while Core is down will immediately re-trip circuit breakers.

Step 1 — Confirm TruView Core health before BFF restart:
  curl https://internal-api.truebank.com/v2/health
  All microservices should return HTTP 200. If not, resolve TruView Core issues first.

Step 2 — Allow circuit breakers to self-heal (preferred):
  Circuit breakers enter HALF-OPEN after 30 seconds and will auto-close if Core is healthy.
  Wait 60–90 seconds and check /admin/circuits again.

Step 3 — If circuits do not auto-close, force BFF restart:
  For Web BFF: kubectl rollout restart deployment/truview-web-bff -n truview-web
  For Mobile BFF: kubectl rollout restart deployment/truview-mobile-bff -n truview-mobile
  Restart initialises circuits in CLOSED state.

Step 4 — Dynatrace validation:
  Dynatrace > Services > truview-web-bff and truview-mobile-bff
  Confirm: Error rate <1%, response time normal, no circuit breaker events.

ESCALATION:
If circuits continue to trip after TruView Core is confirmed healthy, escalate to Platform Engineering — there may be a configuration issue in the BFF circuit breaker thresholds.`,
    tags: ['runbook', 'bff', 'circuit-breaker', 'truview-web', 'truview-mobile', 'procedure', 'hystrix', 'degraded-mode'],
    classification: 'INTERNAL',
    freshness_ts: '2025-02-10T10:00:00Z',
    ingest_ts: '2025-03-04T00:00:00Z',
    ttl_hours: 168,
    meta: { kb_type: 'Runbook', owner: 'Platform SRE Team', related_adr: 'ADR-052' }
  },

  // ─── SERVICE CATALOG ──────────────────────────────────────────────────────

  {
    id: 'conf_svc_001',
    appid: 'APPID-973193',
    source: 'confluence_service_catalog',
    source_label: 'Confluence',
    record_id: 'SVCCATALOG-TRUVIEW-CORE',
    title: 'TruView Core Service Catalog — all 7 microservices',
    text: `SERVICE CATALOG: TruView Core (APPID-973193)
Document: /wiki/spaces/TRUVIEW/pages/TruView-Core-Service-Catalog
Last Updated: 2025-02-28

This catalog documents all 7 TruView Core microservices, their responsibilities, Kafka topics, and ownership.

──────────────────────────────────────────
1. account-service
Purpose: Core account data management. Provides account balance, account status, and account profile APIs. Source of truth for account state.
Tech stack: Java 17, Spring Boot 3.1, HikariCP (PostgreSQL), Redis (cache)
Owned endpoints: GET /v2/accounts/{id}, GET /v2/accounts/{id}/balance, GET /v2/accounts/summary, POST /internal/account-events/refresh
Kafka topics produced: truview-core-account-events (balance updates, status changes)
Kafka topics consumed: none (source of truth)
Dependencies: prod-rds-truview-core-01 (PostgreSQL), prod-redis-truview-01 (Redis), legacy-dda-adapter (mainframe DDA data)
Pod count: 3 replicas (HPA configured, max 8)
On-call contact: Platform SRE — Marcus Okonkwo
Known issues: PRB0012441 (HikariCP connection pool exhaustion >350 RPS)

──────────────────────────────────────────
2. transaction-service
Purpose: Transaction history, transaction search, and real-time transaction event processing.
Tech stack: Java 17, Spring Boot 3.1, Elasticsearch (search), PostgreSQL (ledger)
Owned endpoints: GET /v2/transactions, GET /v2/transactions/{id}, GET /v2/transactions/recent
Kafka topics produced: truview-core-transaction-events
Kafka topics consumed: none (receives via sync API from Core Banking Adapter)
Dependencies: prod-rds-truview-core-01, Elasticsearch cluster prod-es-truview-01
Pod count: 3 replicas (HPA, max 6)
On-call contact: Platform SRE — Priya Sharma

──────────────────────────────────────────
3. notification-service
Purpose: Notification orchestration — dispatches push notifications, email alerts, and in-app notifications based on trigger events.
Tech stack: Node.js 20, Firebase Admin SDK v11 (includes firebase-messaging 9.3.2 post CHG0104756), AWS SES (email)
Owned endpoints: POST /internal/notifications/send, POST /api/mobile/push/send
Kafka topics produced: notifications-outbound
Kafka topics consumed: truview-core-notification-triggers
Dependencies: Firebase/FCM, Apple APNs (certificate: com.truebank.truview.push), AWS SES
Pod count: 2 replicas
On-call contact: Mobile Platform Team — Thomas Vance
Known issues: INC0091205 (APNs connection resets after v2.4.1 deploy)

──────────────────────────────────────────
4. auth-adapter
Purpose: Authentication token validation and SSO bridge between TruView applications and the bank-wide Customer Identity Platform (APPID-556712).
Tech stack: Node.js 20, Passport.js, JWT validation
Owned endpoints: POST /internal/auth/validate, POST /internal/auth/refresh
Kafka topics: none (synchronous only)
Dependencies: Customer Identity Platform (APPID-556712), Redis (token cache)
Pod count: 2 replicas (HPA, max 4)
On-call contact: Platform SRE

──────────────────────────────────────────
5. legacy-dda-adapter
Purpose: Mainframe bridge for Demand Deposit Account (DDA) data. Translates COBOL-originated DDA data into REST-accessible account records. Critical path for account balance accuracy.
Tech stack: Java 11, Spring Boot 2.7, IBM MQ client, COBOL data parsing layer
Owned endpoints: GET /internal/dda/account/{id}, GET /internal/dda/balance/{id}
Kafka topics: none
Dependencies: Core Banking Adapter (APPID-100034) via IBM MQ, IBM MQ broker prod-ibmmq-01
Pod count: 2 replicas (not horizontally scalable — limited by IBM MQ connection licenses)
SLA: 800ms p95 (mainframe-backed; slower than other services)
On-call contact: Platform Engineering — escalate to Core Banking team if mainframe errors
Known issues: Implicated in INC0088719 (504 timeouts on accounts/summary)

──────────────────────────────────────────
6. event-router
Purpose: Kafka topic routing and event fan-out. Receives raw events from account-service and transaction-service and routes them to appropriate downstream topics with enrichment.
Tech stack: Java 17, Spring Kafka, Confluent Schema Registry client (AWS Glue)
Kafka topics consumed: internal-event-raw
Kafka topics produced: truview-core-account-events, truview-core-transaction-events, truview-core-notification-triggers
Dependencies: AWS Glue Schema Registry
Pod count: 2 replicas
On-call contact: Platform Engineering

──────────────────────────────────────────
7. api-gateway-bridge
Purpose: Integration layer between TruView Core microservices and the Mule API Gateway (prod-mule-apigw-01). Handles API versioning, request transformation, and response mapping.
Tech stack: Node.js 20, Express
Kafka topics: none
Dependencies: prod-mule-apigw-01 (Mule API Gateway — ADR-061)
Pod count: 2 replicas
On-call contact: Platform Engineering`,
    tags: ['service-catalog', 'truview-core', 'microservices', 'account-service', 'transaction-service', 'notification-service', 'auth-adapter', 'legacy-dda-adapter', 'event-router', 'api-gateway-bridge', 'kafka', 'on-call'],
    classification: 'INTERNAL',
    freshness_ts: '2025-02-28T10:00:00Z',
    ingest_ts: '2025-03-04T00:00:00Z',
    ttl_hours: 168,
    meta: { doc_type: 'Service Catalog', service_count: 7 }
  },

];
