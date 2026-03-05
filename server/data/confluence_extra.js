// Confluence synthetic data — additional runbooks, ADRs, service catalog entries
// These records are supplemental to confluence.js (confluenceChunks)

export const confluenceExtra = [

  // ─── ADDITIONAL RUNBOOKS ────────────────────────────────────────────────────

  {
    id: 'conf_kb_005',
    appid: 'APPID-871198',
    source: 'confluence_kb',
    source_label: 'Confluence',
    record_id: 'KB0041033',
    title: 'Runbook: TruView Web BFF Complete Performance Triage Playbook',
    text: `RUNBOOK: KB0041033
Title: TruView Web BFF Complete Performance Triage Playbook
Application: TruView Web (APPID-871198)
Confluence Page: /wiki/spaces/TRUVIEW/pages/KB0041033
Owner: Web Platform Team / Platform SRE Team
Last Updated: 2025-02-28
Version: 3.2

WHEN TO USE THIS RUNBOOK:
Use this playbook when any of the following Dynatrace alerts fire for truview-web-bff or when manually investigating TruView Web performance issues:
- BFF p95 response time >2,000ms (SLO threshold)
- BFF HTTP error rate >1% (5xx)
- Redis cache miss rate >40% (baseline: <10%)
- BFF pod CPU >85% sustained for >5 minutes
- BFF pod memory >90%
- Account-service circuit breaker OPEN on BFF
- CloudFront origin error rate >5%
- Incoming alert from ServiceNow incident or Dynatrace P-series problem

Active incidents using this runbook: INC0092301 (cache invalidation race), PRB0012589 (cache stampede).

---
STEP 1: ASSESS BFF HEALTH (ETA: 5 minutes)

1.1 Check pod status and resource utilisation:
    kubectl get pods -n truview-web -l app=truview-web-bff
    kubectl top pods -n truview-web -l app=truview-web-bff

    Expected output (healthy): 4/4 Running, CPU <300m per pod, Memory <1.2Gi per pod
    Warning signs: CrashLoopBackOff, OOMKilled, CPU >500m, Memory >1.5Gi

1.2 Check BFF admin health endpoint (run from any bastion or EKS pod):
    POD=$(kubectl get pods -n truview-web -l app=truview-web-bff -o jsonpath='{.items[0].metadata.name}')
    kubectl exec -n truview-web $POD -- curl -s http://localhost:4000/admin/health | jq .

    Expected response (healthy):
    {
      "status": "ok",
      "redis": "connected",
      "upstreamServices": {
        "account-service": "ok",
        "transaction-service": "ok",
        "auth-adapter": "ok"
      },
      "circuitBreakers": {
        "account-service": "CLOSED",
        "transaction-service": "CLOSED",
        "auth-adapter": "CLOSED"
      }
    }
    Warning signs: any service "degraded" or "unreachable", any circuit breaker "OPEN" or "HALF-OPEN"

1.3 Check Dynatrace BFF service dashboard:
    Navigate: Dynatrace → Services → truview-web-bff (prod)
    Review: Response time (p50, p95, p99), Failure rate, Request rate (current vs baseline 340 RPS)
    Review: Service flow — which downstream call is slowest (account-service, transaction-service, Redis)

1.4 Check error rates per endpoint:
    kubectl exec -n truview-web $POD -- curl -s http://localhost:4000/admin/metrics | jq '.endpoints'
    Look for: high error counts on /api/v2/accounts/summary, /api/v2/transactions, /api/v2/payments/initiate

---
STEP 2: REDIS CACHE TRIAGE (ETA: 5 minutes)

2.1 Check BFF Redis cache hit rate:
    kubectl exec -n truview-web $POD -- curl -s http://localhost:4000/admin/metrics | jq '.redis'

    Expected output:
    {
      "hitRate": 0.93,       // >90% is healthy; <75% is degraded; <50% is critical
      "missRate": 0.07,
      "connectionPool": { "active": 8, "idle": 12, "waiting": 0 },
      "keyspaceHits": 284719,
      "keyspaceMisses": 22048
    }
    Warning signs: hitRate <0.75, connectionPool.waiting >0, connectionPool.active near pool max (20)

2.2 Check Redis ElastiCache memory and connection stats:
    aws elasticache describe-cache-clusters --cache-cluster-id prod-redis-web-01 --show-cache-node-info
    Key metrics to check: FreeableMemory (alert if <200MB), CurrConnections (alert if >800)

    Direct Redis CLI check (from BFF pod):
    kubectl exec -n truview-web $POD -- redis-cli -h prod-redis-web-01.xxxxxx.cache.amazonaws.com INFO memory
    kubectl exec -n truview-web $POD -- redis-cli -h prod-redis-web-01.xxxxxx.cache.amazonaws.com INFO clients

2.3 Check Redis connection pool in BFF application config:
    kubectl exec -n truview-web $POD -- curl -s http://localhost:4000/admin/metrics | jq '.redis.connectionPool'
    If connectionPool.waiting > 0: BFF is waiting for Redis connections — pool exhaustion risk

2.4 Check for Redis key evictions (may indicate memory pressure):
    kubectl exec -n truview-web $POD -- redis-cli -h prod-redis-web-01.xxxxxx.cache.amazonaws.com INFO stats | grep evicted_keys
    Expected: evicted_keys:0. Any evictions indicate memory pressure — Redis evicting cache keys prematurely.

---
STEP 3: UPSTREAM DEPENDENCY CHECK (ETA: 5 minutes)

3.1 Check account-service health (via Mule API Gateway):
    curl -s -H "Authorization: Bearer $INTERNAL_TOKEN" \
      https://api-internal.truebank.com.au/v2/internal/account-service/health
    Expected: HTTP 200 {"status": "ok"}

3.2 Check circuit breaker states on BFF:
    kubectl exec -n truview-web $POD -- curl -s http://localhost:4000/admin/circuits | jq .
    Circuit breaker thresholds:
    - account-service: OPENS at >50% error rate over 10s window, timeout 30s, half-open after 60s
    - transaction-service: OPENS at >50% error rate over 10s window
    - auth-adapter: OPENS at >30% error rate (tighter — auth failures are more critical)

3.3 Check Mule API Gateway status (prod-mule-apigw-01):
    - Mule Admin Console: https://mule-admin.internal.truebank.com.au (requires VPN + MFA)
    - Check: API Manager → truview-web-api → Analytics → Current throughput and error rate
    - If Mule is degraded: contact Platform Engineering (#truview-platform-eng Slack)

3.4 Check if TruView Core INC0089341 (Kafka lag) is active — if yes, account-service response times will be elevated due to connection pool pressure (PRB0012441). This is a known compounding factor.

---
STEP 4: SCALE OUT BFF IF CPU/MEMORY BOUND (ETA: 3 minutes)

4.1 If CPU or memory is the bottleneck (from Step 1):
    Check current replica count:
    kubectl get deployment truview-web-bff -n truview-web

    Scale out (max 10 per HPA config):
    kubectl scale deployment/truview-web-bff --replicas=8 -n truview-web

    Wait for pods to reach Running state:
    kubectl rollout status deployment/truview-web-bff -n truview-web

    Validate new pods are serving traffic:
    kubectl get pods -n truview-web -l app=truview-web-bff
    kubectl top pods -n truview-web -l app=truview-web-bff

4.2 HPA limits: HPA is configured with min=4, max=10. Manual scale beyond HPA max requires temporary HPA patch:
    kubectl patch hpa truview-web-bff-hpa -n truview-web -p '{"spec":{"maxReplicas":12}}'
    IMPORTANT: Revert HPA max after incident: kubectl patch hpa truview-web-bff-hpa -n truview-web -p '{"spec":{"maxReplicas":10}}'

---
STEP 5: ROLLING RESTART IF CACHE STATE CORRUPTED (ETA: 8 minutes)

5.1 If Redis cache state is corrupted or BFF pods have stale in-process state (e.g. INC0092301):
    kubectl rollout restart deployment/truview-web-bff -n truview-web

    This performs a zero-downtime rolling restart — pods are replaced one at a time, existing connections drained.
    Watch progress:
    kubectl rollout status deployment/truview-web-bff -n truview-web --timeout=5m

    Note: Rolling restart will temporarily reduce serving capacity (1 pod terminating at a time with 4-replica deployment). During peak load, scale to 6 replicas before restarting to maintain capacity.

5.2 If rolling restart does not resolve (or pods are in CrashLoopBackOff):
    Check previous pod logs for crash reason:
    kubectl logs deployment/truview-web-bff -n truview-web --previous

    If deployment is broken: rollback to previous image:
    kubectl rollout undo deployment/truview-web-bff -n truview-web
    kubectl rollout status deployment/truview-web-bff -n truview-web

---
STEP 6: CLOUDFRONT CDN CACHE INVALIDATION (if static assets are stale) (ETA: 5 minutes)

6.1 Use this step ONLY if users are reporting stale JavaScript/CSS (e.g. old UI after a deployment, missing new feature), NOT for BFF API performance issues.

6.2 Check if CloudFront is serving stale content:
    curl -I https://web.truebank.com.au/assets/main.abc123.js | grep -E "(X-Cache|ETag|Age)"
    X-Cache: Hit from cloudfront — being served from edge cache
    Age: 86400 — seconds the object has been cached (if very high after new deploy, suspect stale)

6.3 Create CloudFront invalidation (invalidates ALL cached objects):
    aws cloudfront create-invalidation \
      --distribution-id E1K9ABCDEF \
      --paths "/*"
    Note: "/*" invalidation counts as 1 invalidation path (not per-file). First 1,000 invalidation paths/month are free.

6.4 Check invalidation status:
    INVALIDATION_ID=$(aws cloudfront list-invalidations --distribution-id E1K9ABCDEF --query 'InvalidationList.Items[0].Id' --output text)
    aws cloudfront get-invalidation --distribution-id E1K9ABCDEF --id $INVALIDATION_ID

    Wait for Status: Completed (typically 30-60 seconds for 12 edge locations).

6.5 Validate propagation:
    For each major edge location, check X-Cache header returns Miss from cloudfront on first request (then Hit on subsequent).
    Use Dynatrace Synthetic tests to validate from multiple geolocations.

6.6 Browser cache note: Users may still see old content if their browser has cached the old index.html or assets. index.html is served with Cache-Control: no-cache so browsers should re-validate, but some aggressive proxies may cache regardless. Advise users to hard refresh (Cmd+Shift+R / Ctrl+Shift+F5) if still seeing stale UI after invalidation.

CloudFront Distribution ID reference: prod-cf-truview-web = E1K9ABCDEF
Full runbook for CDN invalidation: KB0044112

---
STEP 7: POST-TRIAGE VALIDATION (ETA: 5 minutes)

7.1 Validate BFF recovery:
    kubectl exec -n truview-web $POD -- curl -s http://localhost:4000/admin/health | jq .status
    Expected: "ok"

7.2 Check Dynatrace BFF service: Response time returning to baseline (p95 <500ms), error rate <0.5%

7.3 Validate from Synthetic test:
    Dynatrace → Synthetic → TruView Web BFF Account Summary Synthetic Check
    Confirm: HTTP 200, response time <1,000ms, content contains valid JSON with accountId field

7.4 Check Redis cache hit rate recovering: target >85% within 10 minutes of BFF restart

7.5 Update incident in ServiceNow with triage steps taken, findings, and current status

---
ESCALATION PATH:
- Level 1: On-call SRE (Platform SRE Team — #truview-sre-oncall, PagerDuty: truview-web-oncall)
  - Marcus Okonkwo: m.okonkwo@truebank.com.au
  - Priya Sharma: p.sharma@truebank.com.au
- Level 2: Web Platform Team (if BFF code/config issue)
  - Engineering Manager: James Blackwood — j.blackwood@truebank.com.au
- Level 3: Platform Engineering (if upstream TruView Core issue)
  - Engineering Manager: David Nguyen — david.nguyen@truebank.com.au
- Level 4: Head of Platform (if SEV1 or customer-visible outage >15 minutes)
  - Sarah Kimberley — sarah.kimberley@truebank.com.au

RELATED RUNBOOKS: KB0044112 (CloudFront CDN Invalidation), KB0034512 (account-service connection pool)
RELATED PROBLEMS: PRB0012589 (cache stampede), PRB0012441 (account-service connection pool)`,
    tags: ['runbook', 'truview-web', 'bff', 'performance', 'triage', 'redis', 'cache', 'circuit-breaker', 'kubectl', 'cloudfront', 'escalation'],
    classification: 'INTERNAL',
    freshness_ts: '2025-02-28T00:00:00Z',
    ingest_ts: '2025-03-04T00:00:00Z',
    ttl_hours: 168,
    meta: { runbook_type: 'Performance Triage', app: 'TruView Web BFF', version: '3.2' }
  },

  {
    id: 'conf_kb_006',
    appid: 'APPID-871198',
    source: 'confluence_kb',
    source_label: 'Confluence',
    record_id: 'KB0044112',
    title: 'Runbook: TruView Web CloudFront CDN Cache Invalidation',
    text: `RUNBOOK: KB0044112
Title: TruView Web CloudFront CDN Cache Invalidation
Application: TruView Web (APPID-871198)
Confluence Page: /wiki/spaces/TRUVIEW/pages/KB0044112
Owner: Web Platform Team
Last Updated: 2025-02-10
Version: 2.1

WHEN TO USE THIS RUNBOOK:
- After a TruView Web SPA deployment when users report the new version is not appearing (old JS/CSS bundle still loading)
- After an emergency hotfix deployment that must reach all users immediately (cannot wait for natural CDN TTL expiry)
- After an SPA routing fix where old CloudFront error page rules are still serving cached 403/404 responses incorrectly
- After a security hotfix (e.g. Content Security Policy header update) that must propagate immediately
- When Dynatrace RUM shows a split of two app versions running simultaneously (old cached version + new version)
- When X-Cache: Hit from cloudfront is returned for assets that should have changed after a deployment

IMPORTANT: Do NOT use invalidation for BFF API performance issues — CloudFront only caches static assets (S3-backed behaviours), not API calls (/api/* paths are uncached, proxied directly to BFF).

CloudFront Distribution Reference:
  Distribution Name: prod-cf-truview-web
  Distribution ID: E1K9ABCDEF
  Origins: S3 (truebank-truview-web-prod) + BFF (truview-web-bff.truview-web.svc.cluster.local:4000)
  Edge Locations: 12 (ap-southeast-2 [Sydney primary], us-east-1, eu-west-1, and 9 others)

PREREQUISITES:
  AWS CLI configured: aws configure list (confirm profile = truview-ops)
  IAM permissions required: cloudfront:CreateInvalidation, cloudfront:GetInvalidation, cloudfront:ListInvalidations
  Request IAM permissions from: SRE Lead (Marcus Okonkwo) if not already granted

---
STEP 1: CONFIRM CLOUDFRONT IS SERVING STALE CONTENT

1.1 Check the X-Cache header and content fingerprint on a known-changed asset:

    # Check if CloudFront is serving a cached response (should be "Miss" after new deploy)
    curl -I https://web.truebank.com.au/assets/main.abc123.js | grep -E "(X-Cache|ETag|Age|Cache-Control|Last-Modified)"

    X-Cache response values:
    - "Miss from cloudfront" — CloudFront fetched from S3 origin (fresh)
    - "Hit from cloudfront" — CloudFront served from edge cache (potentially stale)
    - "RefreshHit from cloudfront" — CloudFront re-validated with origin (conditional GET)

1.2 Compare ETag with the expected hash from the deployment pipeline:
    # From PIPE-4820-WEB (or current pipeline), get the asset hash from the deploy log
    # Compare with ETag returned by curl — mismatch confirms stale content at edge

1.3 Check the Age header — this shows how many seconds the object has been in the edge cache:
    Age: 3600 means the object was cached 1 hour ago
    If Age >> 0 after a new deployment, CloudFront is serving the pre-deployment version

1.4 Alternative: Load the TruView Web app in a browser with DevTools Network tab
    Check: index.html response — Cache-Control: no-cache means browser should always re-validate
    Check: main.[hash].js — if hash in filename matches deployment pipeline output, content is fresh
    If filename hash does not match expected deployment hash: CDN is serving stale

---
STEP 2: CREATE CLOUDFRONT INVALIDATION

2.1 Invalidate ALL paths (recommended for post-deployment invalidation):

    aws cloudfront create-invalidation \
      --distribution-id E1K9ABCDEF \
      --paths "/*"

    Expected output:
    {
        "Location": "https://cloudfront.amazonaws.com/2020-05-31/distribution/E1K9ABCDEF/invalidation/INVALXXX123",
        "Invalidation": {
            "Id": "INVALXXX123",
            "Status": "InProgress",
            "CreateTime": "2025-03-04T10:05:00Z",
            "InvalidationBatch": {
                "Paths": { "Quantity": 1, "Items": ["/*"] },
                "CallerReference": "..."
            }
        }
    }

    Note: "/*" counts as 1 invalidation path for billing purposes, regardless of how many files exist.

2.2 Targeted invalidation (use if you know exactly which files changed — faster propagation for small changeset):

    # Invalidate only the main bundle and index.html (after minor hotfix)
    aws cloudfront create-invalidation \
      --distribution-id E1K9ABCDEF \
      --paths "/index.html" "/assets/main.*.js" "/assets/vendor.*.js"

    Note: Wildcard (*) is supported in CloudFront invalidation paths.

---
STEP 3: CHECK INVALIDATION STATUS

3.1 Get the invalidation ID from Step 2 output, then poll for completion:

    INVALIDATION_ID="INVALXXX123"  # Replace with actual ID from Step 2

    aws cloudfront get-invalidation \
      --distribution-id E1K9ABCDEF \
      --id $INVALIDATION_ID \
      --query 'Invalidation.Status' \
      --output text

    Poll every 30 seconds until output is "Completed" (typically 30-90 seconds for 12 edge locations).

3.2 Quick status check of most recent invalidation:

    aws cloudfront list-invalidations \
      --distribution-id E1K9ABCDEF \
      --query 'InvalidationList.Items[0]' \
      --output json

---
STEP 4: VALIDATE PROPAGATION

4.1 After invalidation Status = Completed, verify fresh content is being served:

    # First request should be "Miss from cloudfront" (fetching from S3 origin)
    curl -I https://web.truebank.com.au/assets/main.abc123.js | grep X-Cache
    # Expected: X-Cache: Miss from cloudfront

    # Subsequent request should be "Hit from cloudfront" (edge has cached the fresh version)
    curl -I https://web.truebank.com.au/assets/main.abc123.js | grep X-Cache
    # Expected: X-Cache: Hit from cloudfront

4.2 Validate from Dynatrace Synthetic Monitor:
    Dynatrace → Synthetic → TruView Web Availability Check
    Trigger an on-demand execution from the Sydney edge — confirm response contains correct app version hash

4.3 Check Dynatrace RUM: after invalidation, within 5-10 minutes all active browser sessions should be loading the new version. Dynatrace RUM → Web → TruView Web → Application version distribution should show 100% new version.

4.4 Spot-check from multiple browser profiles (incognito windows) to confirm fresh content is being loaded globally.

---
STEP 5: BROWSER CACHE NOTE

CloudFront invalidation purges the CDN edge cache but does NOT affect individual user browser caches. For users who have the old version cached in their browser:
- index.html (Cache-Control: no-cache): Browser will re-validate with CloudFront on next load — automatically gets fresh version.
- Hashed assets (e.g. main.abc123.js with Cache-Control: max-age=31536000): If the hash changed (i.e. new deployment), the browser will request the new filename and load fresh. Old files may remain in browser cache but are no longer referenced.
- Users experiencing browser cache issues: advise hard refresh (Cmd+Shift+R on macOS, Ctrl+Shift+F5 on Windows/Linux) or clearing cache for web.truebank.com.au.

---
COST WARNING:
CloudFront invalidation pricing:
- First 1,000 invalidation paths per month: FREE
- Beyond 1,000 paths: $0.005 per path
- "/*" counts as 1 path regardless of file count — always use "/*" unless you have a specific reason for granular invalidation
- Current month invalidation count: check in AWS Console → CloudFront → Distributions → Invalidations tab
- Budget alert: if >1,000 invalidations are expected (e.g. during an incident with many deployments), contact Cloud FinOps team (#cloud-finops Slack)

Distribution ID quick reference:
- prod-cf-truview-web: E1K9ABCDEF (TruView Web SPA)
- Note: TruView Mobile does not use CloudFront (native app, no CDN)
- TruView Core: no CloudFront (backend microservices, internal only)

ESCALATION:
- Web Platform Team: #truview-web-eng
- If CloudFront API errors: check AWS Service Health Dashboard (status.aws.amazon.com)
- If S3 origin errors: Platform Engineering (#truview-platform-eng)`,
    tags: ['runbook', 'truview-web', 'cloudfront', 'cdn', 'cache-invalidation', 's3', 'deployment', 'aws', 'performance'],
    classification: 'INTERNAL',
    freshness_ts: '2025-02-10T00:00:00Z',
    ingest_ts: '2025-03-04T00:00:00Z',
    ttl_hours: 168,
    meta: { runbook_type: 'Operational', app: 'TruView Web CDN', cloudfront_id: 'E1K9ABCDEF', version: '2.1' }
  },

  {
    id: 'conf_kb_007',
    appid: 'APPID-871204',
    source: 'confluence_kb',
    source_label: 'Confluence',
    record_id: 'KB0052891',
    title: 'Runbook: TruView Mobile iOS Push Notification Service Rollback — APNs Failure Response',
    text: `RUNBOOK: KB0052891
Title: TruView Mobile iOS Push Notification Service Emergency Rollback — APNs Failure Response
Application: TruView Mobile (APPID-871204)
Confluence Page: /wiki/spaces/TRUVIEW/pages/KB0052891
Owner: Mobile Platform Team / Platform SRE Team
Last Updated: 2025-03-04 (updated during INC0091205)
Version: 4.0 (CRITICAL — updated with lessons from INC0091205)

WHEN TO USE THIS RUNBOOK:
- notification-service APNs delivery success rate drops below 95% for >5 minutes
- Dynatrace P-3887 (or equivalent new problem) fires: "notification-service APNs connection reset rate elevated"
- SLO-TRUVIEW-MOBILE-PUSH drops below 98% target
- INC raised for iOS push notification delivery failures
- Engineering confirms root cause is notification-service (not APNs-side outage — check Apple System Status: developer.apple.com/system-status)

CURRENT ACTIVE INCIDENT USING THIS RUNBOOK: INC0091205 (SEV3 — iOS push failures, correlated with CHG0104756)

PREREQUISITES — READ BEFORE PROCEEDING:
1. CAB emergency approval IS required for notification-service rollback (Tier 1 component, change management policy ITMGMT-0044)
2. Mobile EM (Thomas Vance — t.vance@truebank.com.au / mobile: see PagerDuty on-call roster) MUST be notified before rollback initiation
3. SRE Lead (Marcus Okonkwo) must be on the bridge call
4. Confirm the issue is NOT an Apple-side APNs outage before initiating rollback:
   - Check: developer.apple.com/system-status — confirm "Apple Push Notifications" is green
   - If Apple-side: do NOT rollback — escalate to Mobile Platform Team to contact Apple Developer Relations
5. Confirm rollback target version is available in GitLab CI/CD (PIPE-HOTFIX-4756 tag should be pre-created by Mobile Platform Team for rapid rollback)

---
STEP 1: CONFIRM ROLLBACK IS WARRANTED (ETA: 10 minutes)

1.1 Verify APNs delivery failure rate from Dynatrace:
    Dynatrace → Services → notification-service (prod) → Events → APNs connection metrics
    Key metrics (confirm rollback threshold met):
    - APNs delivery success rate: <95% for >5 minutes → ROLLBACK WARRANTED
    - APNs connection reset count: >50 resets/hour (baseline: <5/hour) → investigate
    - notification-service /api/mobile/push/send error rate: >5% HTTP 5xx → investigate

1.2 Confirm APNs SLO breach:
    Dynatrace → SLOs → SLO-TRUVIEW-MOBILE-PUSH
    If current SLO value <98%: ROLLBACK WARRANTED (SLO breach = automatic rollback escalation)

1.3 Confirm Apple-side status (eliminate before rollback):
    curl -s https://www.apple.com/support/systemstatus/data/developer/system_status_en_US.js | python3 -c "
    import sys, json
    data = json.load(sys.stdin)
    for svc in data['services']:
        if 'Push' in svc['serviceName']:
            print(f\"{svc['serviceName']}: {svc['events'][0]['status'] if svc['events'] else 'ok'}\")
    "
    Expected: Apple Push Notifications: ok
    If ANY issue shown: do not rollback — wait for Apple resolution + document in incident

1.4 Review notification-service logs for failure pattern:
    kubectl logs deployment/notification-service -n truview-core --tail=100 | grep -E "(ERROR|APNs|connection)"
    Look for: "APNs connection reset", "Too many connections", "Certificate expired" in log output
    INC0091205 pattern: "APNs connection pool exhausted — creating new connection for each batch" (firebase 9.3.2 regression)

---
STEP 2: INITIATE CAB EMERGENCY APPROVAL (ETA: 15 minutes — can run parallel to Step 3 prep)

2.1 Post to Slack #cab-emergency channel with the following template:

    --- CAB EMERGENCY APPROVAL REQUEST ---
    Requesting: Emergency CAB approval for notification-service rollback
    Incident: [INC NUMBER] SEV[X] — [brief description]
    Application: TruView Mobile (APPID-871204) — notification-service
    Current version: [e.g. v2.4.1 — firebase-messaging 9.3.2]
    Rollback target: [e.g. v2.4.0 — firebase-messaging 9.1.0]
    Reason: APNs delivery success rate [X]%, SLO breached at [X]% (target: 98%)
    Risk of rollback: Low — reverting to known-good version
    Risk of NOT rolling back: Continued iOS push delivery failure, SLO breach widening
    Rollback pipeline: PIPE-HOTFIX-4756 (pre-staged in GitLab CI)
    Estimated duration: 12 minutes
    Mobile EM notified: [Yes/No] Thomas Vance @t.vance
    SRE Lead on bridge: Marcus Okonkwo @m.okonkwo
    ---

2.2 CAB emergency approvals are handled by the on-call CAB reviewer (check #cab-emergency for current reviewer).
    Typical approval time: 5-15 minutes (Business Hours) / 20-30 minutes (After Hours via PagerDuty CAB-ONCALL)
    DO NOT proceed to Step 4 (pipeline trigger) until CAB approval is received in Slack.

---
STEP 3: PREPARE PIPELINE — DO NOT TRIGGER YET (ETA: 5 minutes — parallel to Step 2)

3.1 Navigate to GitLab CI/CD pipeline for notification-service hotfix:
    URL: https://gitlab.truebank.com.au/truview/truview-core/notification-service/-/pipelines
    Filter: Branch/Tag = hotfix-notification-firebase-rollback

3.2 Verify PIPE-HOTFIX-4756 is pre-staged and ready:
    - Pipeline should be in status: "Pending" (blocked on manual trigger)
    - Confirm the pipeline variables:
      ROLLBACK_VERSION: v2.4.0
      FIREBASE_VERSION: 9.1.0 (firebase-admin 10.3.0)
      DEPLOY_ENV: prod
      NAMESPACE: truview-core
    - If pipeline is NOT pre-staged: contact Thomas Vance (Mobile EM) immediately — pipeline must be prepared before proceeding

3.3 Confirm rollback image is available in ECR:
    aws ecr describe-images \
      --repository-name truview/notification-service \
      --image-ids imageTag=v2.4.0 \
      --region ap-southeast-2
    Expected: image metadata returned (confirms image is present). If image not found: escalate to Mobile Platform Team.

---
STEP 4: TRIGGER ROLLBACK PIPELINE (ETA: 1 minute — after CAB approval received)

4.1 In GitLab: PIPE-HOTFIX-4756 → Click "Run pipeline" (manual trigger on the pre-staged pipeline)
    Or via CLI:
    curl --request POST \
      --header "PRIVATE-TOKEN: $GITLAB_BOT_TOKEN" \
      "https://gitlab.truebank.com.au/api/v4/projects/truview-core%2Fnotification-service/pipeline?ref=hotfix-notification-firebase-rollback"

4.2 Note the pipeline run ID from the response — monitor at:
    https://gitlab.truebank.com.au/truview/truview-core/notification-service/-/pipelines/[RUN_ID]

4.3 Announce in incident bridge: "PIPE-HOTFIX-4756 triggered at [time]. Estimated completion: 12 minutes."

---
STEP 5: MONITOR PIPELINE EXECUTION (ETA: 12 minutes)

Expected pipeline stages and durations:
  Stage 1 — Unit Tests: ~2m 30s (47 tests, validates rollback config)
  Stage 2 — Container Image Tag: ~0m 45s (re-tags v2.4.0 image as rollback-[timestamp])
  Stage 3 — Security Scan (Trivy): ~1m 30s (previously scanned image — expected 0 new findings)
  Stage 4 — Kubernetes Rolling Update (prod-eks-trueview-01): ~5m 00s
    kubectl set image deployment/notification-service \
      notification-service=truview/notification-service:v2.4.0 -n truview-core
    Monitors: 3 replicas rolling updated, min 2 available during rollout
  Stage 5 — Post-Deploy Smoke Test: ~2m 00s
    POST /api/mobile/push/send (test payload to Dynatrace synthetic device) — expected HTTP 200
    GET /admin/health — expected HTTP 200 {"status": "ok", "apns": "connected"}
  TOTAL: ~12 minutes

Monitor pipeline for ANY stage failure — if any stage fails, do NOT proceed and alert Mobile Platform Team immediately.

---
STEP 6: VALIDATE APNS RECOVERY (ETA: 10 minutes post-pipeline)

6.1 Check Dynatrace problem P-3887 (or current active problem) — expect it to resolve within 5-10 minutes of rollback completion:
    Dynatrace → Problems → P-3887 (TruView Mobile APNs connection reset rate elevated)
    Expected: Status = Resolved

6.2 Check /api/mobile/push/send endpoint success rate:
    kubectl exec -n truview-core $(kubectl get pods -n truview-core -l app=notification-service -o jsonpath='{.items[0].metadata.name}') \
      -- curl -s http://localhost:3000/admin/metrics | jq '.apns'
    Expected:
    {
      "deliverySuccessRate": 0.99,   // Should recover to >99% within 10 minutes
      "connectionResetRate": 0.2,    // Resets/minute — should drop from hundreds to <1/minute
      "activeConnections": 12,
      "connectionPoolSize": 100
    }

6.3 Check APNs connection reset rate:
    kubectl logs deployment/notification-service -n truview-core --tail=50 | grep -c "connection reset"
    Expected: 0 resets in most recent 50 log lines (compared to high frequency pre-rollback)

6.4 Send test push notification via Mobile Platform admin tool:
    curl -X POST https://api-internal.truebank.com.au/admin/mobile/push/test \
      -H "Authorization: Bearer $INTERNAL_ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"deviceToken": "TEST-DEVICE-TOKEN-IOS-SYNTHETIC", "message": "Rollback validation test"}'
    Expected: {"status": "sent", "apnsMessageId": "..."} — confirm delivery in test device

---
STEP 7: DRAIN NOTIFICATION RETRY QUEUE (ETA: 20-30 minutes)

7.1 Check retry queue depth on truview-core-notification-triggers Kafka topic:
    kubectl exec -n truview-core $(kubectl get pods -n truview-core -l app=event-router -o jsonpath='{.items[0].metadata.name}') \
      -- kafka-consumer-groups.sh \
        --bootstrap-server prod-kafka-trueview.xxxxxx.kafka.ap-southeast-2.amazonaws.com:9092 \
        --group notification-service-consumer \
        --describe
    Check: LAG column for truview-core-notification-triggers topic partitions
    Expected healthy: LAG 0 (no backlog)
    During incident recovery: LAG may be thousands — notification-service will process at ~500 messages/minute

7.2 Monitor retry queue drain:
    Watch LAG column — should reduce at ~500 messages/minute (notification-service rate-limited to prevent APNs flood)
    Full drain of 10,000 notifications: ~20 minutes
    Full drain of 50,000 notifications: ~100 minutes (acceptable — notifications delivered with delay)

7.3 Do NOT force-reset consumer offsets to skip backlogged notifications — all queued notifications should be delivered (balance alerts, transaction confirmations are time-sensitive but must be delivered).
    Exception: if notification age >24 hours, notification-service will automatically discard (APNs rejects notifications older than 24 hours).

---
STEP 8: SLO RECOVERY MONITORING (ETA: 30-60 minutes post-rollback)

8.1 Monitor SLO-TRUVIEW-MOBILE-PUSH (target 98%):
    Dynatrace → SLOs → SLO-TRUVIEW-MOBILE-PUSH
    The SLO calculation is rolling 30-day — breach impact from INC0091205 will reduce over time.
    Expect: SLO to return above 98% within 24-48 hours of incident resolution (depending on breach duration and depth).

8.2 Check Android FCM delivery (should be unaffected throughout — confirm no regression):
    kubectl exec -n truview-core $(kubectl get pods -n truview-core -l app=notification-service -o jsonpath='{.items[0].metadata.name}') \
      -- curl -s http://localhost:3000/admin/metrics | jq '.fcm'
    Expected: deliverySuccessRate >0.99

8.3 Declare incident resolved in ServiceNow when:
    - APNs delivery success rate >98% sustained for 15 minutes
    - Dynatrace P-3887 shows Resolved
    - SLO metric trending towards recovery
    - No new customer complaints in Zendesk

---
STEP 9: POST-ROLLBACK COMMUNICATIONS

9.1 Incident bridge close announcement template:
    "INC[X]: notification-service has been rolled back to v2.4.0. APNs delivery is recovering. Push notifications for iOS users are resuming. Queued notifications from the incident window are being delivered (may arrive with delay). SLO monitoring ongoing. Incident will be moved to Monitoring state."

9.2 Business stakeholder notification (Head of Platform + Head of Mobile):
    To: sarah.kimberley@truebank.com.au, l.okafor@truebank.com.au
    Subject: TruView Mobile Push Notification Service — Recovery Update
    Body template:
    "The iOS push notification issue (INC[X]) has been resolved via rollback of notification-service.
    Root cause: [brief description].
    Recovery: Push notifications for iOS users are resuming. Queued notifications will be delivered within the next [X] hours.
    Action: Mobile Platform Team will conduct post-incident review within 48 hours.
    SLO status: [current %] — monitoring for full recovery to 98% target."

9.3 Update ServiceNow INC: state → Monitoring, add resolution note, assign PIR task to Mobile Platform Team.

---
ROLLBACK VALIDATION CHECKLIST:
[ ] CAB emergency approval received and documented
[ ] Thomas Vance (Mobile EM) notified
[ ] PIPE-HOTFIX-4756 completed successfully (all stages green)
[ ] notification-service pods running v2.4.0 image (confirm: kubectl describe pod -n truview-core -l app=notification-service | grep Image)
[ ] APNs delivery success rate >98%
[ ] Dynatrace P-3887 resolved
[ ] Notification retry queue draining (LAG decreasing)
[ ] Test push notification delivered to synthetic device
[ ] Incident updated in ServiceNow
[ ] Business stakeholders notified`,
    tags: ['runbook', 'truview-mobile', 'push-notification', 'apns', 'ios', 'rollback', 'notification-service', 'cab-emergency', 'critical', 'inc0091205', 'gitlab-ci'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-04T10:00:00Z',
    ingest_ts: '2025-03-04T10:00:00Z',
    ttl_hours: 24,
    meta: { runbook_type: 'Emergency Rollback', app: 'TruView Mobile Push', severity: 'Critical', version: '4.0', pipeline: 'PIPE-HOTFIX-4756' }
  },

  {
    id: 'conf_kb_008',
    appid: 'APPID-871204',
    source: 'confluence_kb',
    source_label: 'Confluence',
    record_id: 'KB0055204',
    title: 'Runbook: TruView Mobile BFF Pod Scaling and Restart Operations',
    text: `RUNBOOK: KB0055204
Title: TruView Mobile BFF Pod Scaling and Restart Operations
Application: TruView Mobile (APPID-871204)
Confluence Page: /wiki/spaces/TRUVIEW/pages/KB0055204
Owner: Mobile Platform Team / Platform SRE Team
Last Updated: 2025-02-20
Version: 2.3

WHEN TO USE THIS RUNBOOK:
- truview-mobile-bff CPU utilisation >85% sustained for >3 minutes
- truview-mobile-bff memory utilisation >90%
- Pod(s) in CrashLoopBackOff or OOMKilled state
- BFF p95 response time >1,500ms (performance degradation before SLO breach)
- Pre-emptive scaling before expected peak traffic events (e.g. pre-RBA announcement, public holiday eve, post-outage surge)
- Rolling restart required to flush stale in-memory state (e.g. after a configuration hot-reload fails)

EKS Cluster: prod-eks-mobile-01
Namespace: truview-mobile
Deployment: truview-mobile-bff
Current Configuration: 5 replicas (HPA min: 5, max: 12)

---
PRE-SCALING CHECKS (Complete before any scaling action)

1. Confirm the bottleneck is BFF-side and not upstream:
   kubectl top pods -n truview-mobile -l app=truview-mobile-bff

   If CPU is the bottleneck: scale out (add replicas)
   If Memory is the bottleneck: scale out OR investigate memory leak before scaling
   If both CPU and Memory normal: check upstream — account-service, Redis, Mule API Gateway

2. Check for pod restarts (indicate OOMKill or crash loop):
   kubectl get pods -n truview-mobile -l app=truview-mobile-bff
   Look at RESTARTS column — >0 in last 30 minutes indicates recent crash

3. Confirm HPA current state:
   kubectl get hpa truview-mobile-bff-hpa -n truview-mobile
   Check: CURRENT vs DESIRED replicas — if HPA has already scaled, additional manual scaling may not be needed
   Check: MAXPODS — confirm 12 is current max

4. Check PodDisruptionBudget — ensure minimum availability is maintained during scaling:
   kubectl get pdb truview-mobile-bff-pdb -n truview-mobile
   PDB spec: minAvailable: 3 (must keep at least 3 pods running during disruption)
   This means: during rolling restart or scale-in, up to 2 pods can be disrupted simultaneously

---
SCALE OUT PROCEDURE (Adding replicas)

Scale to 8 replicas (recommended for sustained peak load):
  kubectl scale deployment/truview-mobile-bff --replicas=8 -n truview-mobile

Scale to 10 replicas (emergency capacity, high CPU/memory pressure):
  kubectl scale deployment/truview-mobile-bff --replicas=10 -n truview-mobile

Scale to 12 replicas (maximum — requires HPA max adjustment if HPA auto-manages):
  # First, temporarily raise HPA max to allow manual override:
  kubectl patch hpa truview-mobile-bff-hpa -n truview-mobile \
    -p '{"spec":{"maxReplicas":12}}'
  kubectl scale deployment/truview-mobile-bff --replicas=12 -n truview-mobile

Monitor rollout:
  kubectl rollout status deployment/truview-mobile-bff -n truview-mobile
  kubectl get pods -n truview-mobile -l app=truview-mobile-bff -w
  kubectl top pods -n truview-mobile -l app=truview-mobile-bff

Expected new pod startup time: 45-90 seconds (image pull from ECR + Node.js warmup + readiness probe pass)
New pods are not added to load balancer until readiness probe passes: GET /admin/health → HTTP 200

---
SCALE IN PROCEDURE (Reducing replicas post-peak)

IMPORTANT: Do NOT scale in during peak traffic. Check Dynatrace RUM: daily active sessions chart — scale in only after sessions drop below 300K concurrent.

Scale back to HPA minimum (5 replicas):
  kubectl scale deployment/truview-mobile-bff --replicas=5 -n truview-mobile
  # Restore HPA max if it was patched:
  kubectl patch hpa truview-mobile-bff-hpa -n truview-mobile \
    -p '{"spec":{"maxReplicas":12}}'

Scale-in is gradual — Kubernetes will terminate pods gracefully (SIGTERM → 30s graceful shutdown → SIGKILL if needed).
Pod termination process: pod removed from load balancer → in-flight requests complete (up to 30s) → pod terminated.
Monitor: no 5xx errors during scale-in (Dynatrace BFF error rate dashboard).

---
ROLLING RESTART PROCEDURE

Use rolling restart to flush stale in-memory state without downtime:

  kubectl rollout restart deployment/truview-mobile-bff -n truview-mobile

Monitor:
  kubectl rollout status deployment/truview-mobile-bff -n truview-mobile --timeout=10m

Rolling restart with 5 replicas + PDB minAvailable=3:
  - Kubernetes will restart pods 2 at a time (5 total - minAvailable 3 = 2 can be disrupted)
  - Total rolling restart time: approximately 4-6 minutes
  - During restart: minimum 3 pods always serving traffic — no outage expected
  - After restart: all 5 new pods serving fresh process state

IMPORTANT: During peak load (>400 RPS), scale to 7+ replicas before restarting to ensure adequate capacity with 2 pods disrupted simultaneously.

Validate post-restart:
  kubectl get pods -n truview-mobile -l app=truview-mobile-bff
  (All pods should show age <5m, RESTARTS column = 0 for new pods)
  kubectl top pods -n truview-mobile -l app=truview-mobile-bff
  (CPU and memory should return to baseline: CPU <200m, Memory <800Mi per pod)

---
PEAK TRAFFIC PREPARATION CHECKLIST

TruView Mobile peak traffic windows:
  Morning peak: 07:00–09:30 EST (highest — 580 RPS BFF, 420K daily active sessions)
  Evening peak: 17:00–19:00 EST (secondary — ~420 RPS)

Pre-emptive scaling checklist (run by on-call SRE before 06:30 EST on high-risk days):
  [ ] Check Dynatrace forecast: predicted morning peak sessions above 450K? → pre-scale to 8 replicas
  [ ] Check upcoming deployments: any BFF deployment in last 12 hours that hasn't been peak-validated?
  [ ] Check active incidents: any degradation that could compound under peak load?
  [ ] Scale to 8 replicas:
        kubectl scale deployment/truview-mobile-bff --replicas=8 -n truview-mobile
  [ ] Verify all 8 pods Running and CPU/Memory healthy
  [ ] Notify #truview-sre-oncall: "truview-mobile-bff pre-scaled to 8 replicas for morning peak"
  [ ] Post-peak (after 10:00 EST): scale back to 5 if metrics stable

High-risk days requiring pre-emptive scaling:
  - RBA interest rate announcement days
  - Public holiday eves (transaction volume spike)
  - End-of-month bank statement periods
  - Post-incident surge (after any prior outage — pent-up user demand)

---
HPA CONFIGURATION REFERENCE

  apiVersion: autoscaling/v2
  kind: HorizontalPodAutoscaler
  metadata:
    name: truview-mobile-bff-hpa
    namespace: truview-mobile
  spec:
    scaleTargetRef:
      apiVersion: apps/v1
      kind: Deployment
      name: truview-mobile-bff
    minReplicas: 5
    maxReplicas: 12
    metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70   # scale out at >70% average CPU across pods
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80   # scale out at >80% average memory

HPA scale-up stabilisation: 30 seconds (rapid scale-up for mobile peak bursts)
HPA scale-down stabilisation: 300 seconds (5 minute cooldown — prevents thrashing)

---
POD DISRUPTION BUDGET REFERENCE

  apiVersion: policy/v1
  kind: PodDisruptionBudget
  metadata:
    name: truview-mobile-bff-pdb
    namespace: truview-mobile
  spec:
    minAvailable: 3
    selector:
      matchLabels:
        app: truview-mobile-bff

Effect: At all times, at least 3 truview-mobile-bff pods must be available. Voluntary disruptions (rolling restart, scale-in) will be throttled to honour this constraint.`,
    tags: ['runbook', 'truview-mobile', 'bff', 'scaling', 'kubectl', 'kubernetes', 'eks', 'hpa', 'pod-disruption-budget', 'peak-traffic', 'operations'],
    classification: 'INTERNAL',
    freshness_ts: '2025-02-20T00:00:00Z',
    ingest_ts: '2025-03-04T00:00:00Z',
    ttl_hours: 168,
    meta: { runbook_type: 'Operational Scaling', app: 'TruView Mobile BFF', cluster: 'prod-eks-mobile-01', version: '2.3' }
  },

  {
    id: 'conf_kb_009',
    appid: 'APPID-973193',
    source: 'confluence_kb',
    source_label: 'Confluence',
    record_id: 'KB0058374',
    title: 'Runbook: TruView Core Transaction Service Elasticsearch Troubleshooting',
    text: `RUNBOOK: KB0058374
Title: TruView Core Transaction Service Elasticsearch / OpenSearch Troubleshooting
Application: TruView Core (APPID-973193) — transaction-service
Confluence Page: /wiki/spaces/TRUVIEW/pages/KB0058374
Owner: Platform Engineering
Last Updated: 2025-03-01
Version: 2.0

WHEN TO USE THIS RUNBOOK:
- transaction-service /v2/transactions p95 latency >500ms (SLO threshold: <400ms)
- Elasticsearch cluster health status YELLOW or RED (alert from AWS OpenSearch Service)
- Dynatrace alert: transaction-service Elasticsearch call latency elevated
- Search result errors: HTTP 500 on /v2/transactions or /v2/transactions/analytics
- transaction-service logs showing "EsRejectedExecutionException" (thread pool saturation) or "circuit_breaking_exception" (JVM heap pressure)
- After a large reindex operation or index migration

Elasticsearch Cluster Reference:
  Cluster: prod-es-truview-01
  Service: AWS OpenSearch Service
  Version: OpenSearch 2.9
  Nodes: 3 data nodes (r6g.xlarge.search — 4 vCPU, 32GB RAM each)
  Index alias: transactions_alias (currently points to truview-transactions-v4, post-CHG0104711)
  Total index size: ~28GB, ~140M documents
  Shard configuration: 3 primary shards, 1 replica each (6 shards total, 1 per node primary + replicas distributed)

---
STEP 1: CHECK ELASTICSEARCH CLUSTER HEALTH

1.1 Cluster health check (run from any truview-core namespace pod or bastion):
    PROD_ES_HOST="https://vpc-prod-es-truview-01.ap-southeast-2.es.amazonaws.com"

    curl -s -u "$ES_ADMIN_USER:$ES_ADMIN_PASS" "$PROD_ES_HOST/_cluster/health?pretty"

    Expected (healthy):
    {
      "cluster_name": "prod-es-truview-01",
      "status": "green",
      "number_of_nodes": 3,
      "number_of_data_nodes": 3,
      "active_primary_shards": 3,
      "active_shards": 6,
      "relocating_shards": 0,
      "initializing_shards": 0,
      "unassigned_shards": 0
    }

    Status meanings:
    - green: all primary and replica shards assigned — healthy
    - yellow: all primary shards assigned, but some replica shards unassigned — degraded (one node failure would cause data loss risk)
    - red: one or more primary shards unassigned — CRITICAL: data unavailable for affected shards

1.2 Check nodes:
    curl -s -u "$ES_ADMIN_USER:$ES_ADMIN_PASS" "$PROD_ES_HOST/_cat/nodes?v"
    Expected: 3 rows (ip, heap.percent, ram.percent, cpu, load_1m, load_5m, load_15m, node.role, name)
    Warning: heap.percent >75% (risk of GC pressure); cpu >80% (search thread pool saturation risk)

1.3 Check for unassigned shards:
    curl -s -u "$ES_ADMIN_USER:$ES_ADMIN_PASS" "$PROD_ES_HOST/_cat/shards?v" | grep UNASSIGNED
    Any UNASSIGNED shards: investigate immediately — see escalation path if cluster-level issue

---
STEP 2: CHECK INDEX STATS (SHARD DISTRIBUTION AND SEGMENT COUNT)

2.1 Check index stats for transactions_alias:
    curl -s -u "$ES_ADMIN_USER:$ES_ADMIN_PASS" "$PROD_ES_HOST/transactions_alias/_stats/indexing,search,segments?pretty"
    Key fields:
    - _all.primaries.search.query_time_in_millis / query_total → average query time (alert if >400ms average)
    - _all.primaries.segments.count → segment count per shard (alert if >100 segments per shard — indicates fragmentation)
    - _all.primaries.store.size_in_bytes → total index size

2.2 Check shard-level stats:
    curl -s -u "$ES_ADMIN_USER:$ES_ADMIN_PASS" "$PROD_ES_HOST/_cat/shards/transactions_alias?v"
    Confirm: all 6 shards in STARTED state, balanced across 3 nodes (2 shards per node)
    Warning: if all shards on one node → unbalanced distribution → performance degradation

2.3 Check segment count per shard (high segment count = slow search due to merge overhead):
    curl -s -u "$ES_ADMIN_USER:$ES_ADMIN_PASS" "$PROD_ES_HOST/_cat/segments/transactions_alias?v"
    Expected: <30 segments per shard for normal operation
    Warning: >100 segments per shard → force merge needed (see Step 4)

---
STEP 3: IDENTIFY SLOW QUERIES IN DYNATRACE

3.1 Navigate to Dynatrace:
    Dynatrace → Services → transaction-service (prod) → Service flow
    Identify: Elasticsearch calls — click on "Call to elasticsearch" boxes
    Review: p50, p95, p99 response times; which queries are slow

3.2 Check slow query log in Elasticsearch:
    curl -s -u "$ES_ADMIN_USER:$ES_ADMIN_PASS" "$PROD_ES_HOST/_settings?pretty" | grep -A5 "slowlog"
    Slow log threshold should be set to 500ms for queries. If not configured:
    curl -X PUT -u "$ES_ADMIN_USER:$ES_ADMIN_PASS" "$PROD_ES_HOST/transactions_alias/_settings" \
      -H "Content-Type: application/json" \
      -d '{
        "index.search.slowlog.threshold.query.warn": "500ms",
        "index.search.slowlog.threshold.query.info": "200ms"
      }'

3.3 Check transaction-service logs for slow query patterns:
    kubectl logs deployment/transaction-service -n truview-core --tail=100 | grep -E "(slow|ES_LATENCY|elasticsearch)"
    Look for: "ES query exceeded 400ms threshold" log entries (transaction-service logs ES calls at WARN level above 400ms)

3.4 Common slow query patterns and causes:
    - Account transaction list (GET /v2/transactions?accountId=X): should use composite index (accountId, timestamp) — if slow, check CHG0104711 index is present
    - Analytics query (GET /v2/transactions/analytics?merchantCategory=X): should use (merchantCategory, timestamp) index
    - Date-range queries without accountId filter: full index scan — investigate calling pattern if present

---
STEP 4: FORCE SEGMENT MERGE IF FRAGMENTED

Use ONLY if Step 2.3 shows >100 segments per shard. Force merge consolidates small segments for faster search.

WARNING: Force merge is CPU and I/O intensive. Run only during low-traffic windows (e.g. 02:00-05:00 AEDT). Monitor cluster health during merge — if cluster turns YELLOW during merge, stop immediately.

4.1 Force merge to 1 segment per shard (appropriate for mostly-static historical data):
    curl -X POST -u "$ES_ADMIN_USER:$ES_ADMIN_PASS" \
      "$PROD_ES_HOST/transactions_alias/_forcemerge?max_num_segments=1&wait_for_completion=false"

    Note: wait_for_completion=false returns immediately with a task ID — use Tasks API to monitor.

4.2 Monitor force merge progress:
    curl -s -u "$ES_ADMIN_USER:$ES_ADMIN_PASS" "$PROD_ES_HOST/_tasks?actions=*forcemerge&detailed&pretty"
    Monitor until no active forcemerge tasks remain.

4.3 Re-check segment count after merge:
    curl -s -u "$ES_ADMIN_USER:$ES_ADMIN_PASS" "$PROD_ES_HOST/_cat/segments/transactions_alias?v"
    Expected: 1 segment per shard post-merge.

---
STEP 5: INDEX ALIAS SWAP PROCEDURE FOR EMERGENCY RE-INDEXING

Use this ONLY if the index itself is corrupted, missing mappings, or requires a schema change. This is the same procedure used in CHG0104711 (Elasticsearch index optimisation).

5.1 Create new index with desired mappings:
    curl -X PUT -u "$ES_ADMIN_USER:$ES_ADMIN_PASS" "$PROD_ES_HOST/truview-transactions-v5" \
      -H "Content-Type: application/json" \
      -d @/tmp/truview-transactions-v5-mappings.json
    (Mappings file should be prepared by Platform Engineering before initiating this step)

5.2 Start reindex (background):
    curl -X POST -u "$ES_ADMIN_USER:$ES_ADMIN_PASS" "$PROD_ES_HOST/_reindex?wait_for_completion=false" \
      -H "Content-Type: application/json" \
      -d '{
        "source": { "index": "transactions_alias" },
        "dest": { "index": "truview-transactions-v5" }
      }'
    Note reindex task ID. Monitor with:
    curl -s -u "$ES_ADMIN_USER:$ES_ADMIN_PASS" "$PROD_ES_HOST/_tasks/[TASK_ID]?pretty"
    Expected reindex duration: 2-3 hours for 140M documents.

5.3 After reindex complete — validate document count:
    curl -s -u "$ES_ADMIN_USER:$ES_ADMIN_PASS" "$PROD_ES_HOST/truview-transactions-v5/_count"
    Must match: source index count ± 0 documents before proceeding.

5.4 Atomic alias swap (zero-downtime):
    curl -X POST -u "$ES_ADMIN_USER:$ES_ADMIN_PASS" "$PROD_ES_HOST/_aliases" \
      -H "Content-Type: application/json" \
      -d '{
        "actions": [
          {"remove": {"index": "truview-transactions-v4", "alias": "transactions_alias"}},
          {"add":    {"index": "truview-transactions-v5", "alias": "transactions_alias"}}
        ]
      }'
    Note: add and remove in same request = atomic swap. transaction-service continues serving queries via alias with zero interruption.

5.5 Validate: transaction-service /v2/transactions returns results from new index.

---
STEP 6: CIRCUIT BREAKER CHECK FOR TRANSACTION-SERVICE → ELASTICSEARCH

6.1 Check transaction-service circuit breaker state for Elasticsearch:
    kubectl exec -n truview-core $(kubectl get pods -n truview-core -l app=transaction-service -o jsonpath='{.items[0].metadata.name}') \
      -- curl -s http://localhost:3001/admin/circuits | jq '.elasticsearch'

    Expected (healthy):
    {
      "state": "CLOSED",
      "requestCount": 12450,
      "errorRate": 0.002,
      "lastFailure": null
    }
    Warning: state = "OPEN" means transaction-service is not querying Elasticsearch at all — callers will receive 503.
    If OPEN: check if Elasticsearch cluster is healthy (Step 1) before resetting circuit breaker.

6.2 If circuit breaker is stuck OPEN after Elasticsearch recovery:
    kubectl exec -n truview-core [POD_NAME] -- curl -X POST http://localhost:3001/admin/circuits/elasticsearch/reset
    This resets the breaker to HALF-OPEN — it will send probe requests to test Elasticsearch recovery.

---
ESCALATION PATH:
- Level 1: On-call SRE — #truview-sre-oncall (#truview-platform-eng for Platform Engineering)
  - If Elasticsearch query latency issue: Platform Engineering (David Nguyen's team)
  - If cluster-level issue (YELLOW/RED): escalate immediately to AWS Support (if MSK/OpenSearch service event) and Platform Engineering
- Level 2: Database Team (DBA team) for cluster-level Elasticsearch/OpenSearch issues
  - Slack: #platform-dba
  - DBA Lead: Andrea Yuen (a.yuen@truebank.com.au)
- Level 3: AWS Support — Open P1 Support Case (Severity: Production System Impaired) if OpenSearch cluster is unresponsive
  - Account ID: 512492730598 (confirm in AWS console before opening case)
  - Case URL: console.aws.amazon.com → Support → Create Case

RELATED CHANGES: CHG0104711 (index optimisation — composite indexes added 2025-02-25)
RELATED RUNBOOKS: KB0034512 (account-service connection pool), KB0041033 (Web BFF performance triage)`,
    tags: ['runbook', 'truview-core', 'transaction-service', 'elasticsearch', 'opensearch', 'index', 'performance', 'kubectl', 'triage', 'segment-merge'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-01T00:00:00Z',
    ingest_ts: '2025-03-04T00:00:00Z',
    ttl_hours: 168,
    meta: { runbook_type: 'Troubleshooting', app: 'TruView Core transaction-service', cluster: 'prod-es-truview-01', version: '2.0' }
  },

  // ─── ADDITIONAL ARCHITECTURE DECISION RECORDS ──────────────────────────────

  {
    id: 'conf_adr_004',
    appid: 'APPID-871204',
    source: 'confluence_adr',
    source_label: 'Confluence',
    record_id: 'ADR-071',
    title: 'ADR-071 — TruView Mobile: Native Swift/Kotlin vs Cross-Platform Framework',
    text: `ARCHITECTURE DECISION RECORD: ADR-071
Title: TruView Mobile Native (Swift/Kotlin) vs Cross-Platform Framework (React Native / Flutter)
Status: Accepted
Date: 2023-08-15
Decision Makers: Mobile Platform Team, Platform Engineering, Enterprise Architecture, Chief Technology Officer
Confluence Page: /wiki/spaces/TRUVIEW/pages/ADR-071

CONTEXT:
TruView Mobile v4.x required a strategic decision on the development approach for the iOS and Android banking applications. Three paths were evaluated:
1. Continue with separate Native apps (Swift for iOS, Kotlin for Android) — existing approach
2. Migrate to React Native (JavaScript/TypeScript — cross-platform)
3. Migrate to Flutter (Dart — cross-platform)

The evaluation was conducted over 8 weeks (June–August 2023) with input from the iOS squad, Android squad, Mobile EM (Thomas Vance), Platform Engineering, and an external mobile banking consultancy (Thoughtworks AU).

DECISION:
ACCEPTED: Continue with fully native development.
- iOS: Swift 5.x (UIKit + SwiftUI hybrid, SwiftUI mandatory for all new screens)
- Android: Kotlin (MVVM + Jetpack Compose, Compose mandatory for all new features)
- Shared business logic: truview-mobile-shared — Kotlin Multiplatform Mobile (KMM) library (see Consequences)

REASONS FOR REJECTING REACT NATIVE:
1. Biometric authentication performance: React Native's bridge architecture introduces measurable latency (15-30ms) in LocalAuthentication (iOS) and BiometricPrompt (Android) integrations. Native apps achieve <5ms for the authentication prompt initiation — critical for user experience on high-value transaction re-auth.
2. Secure Enclave and Android Keystore access: React Native does not have first-class, well-maintained bindings for iOS Secure Enclave key operations and Android Keystore attestation. Banking-grade cryptographic key management requires direct native API access. Community libraries (react-native-keychain) had known security issues at time of evaluation.
3. Screen recording prevention: React Native's view hierarchy is rendered through RN's bridge — FLAG_SECURE (Android) and UIScreen.isCaptured (iOS) integration is unreliable due to the bridge abstraction. AUSTRAC regulatory compliance requires reliable screen recording prevention for account data display.
4. iOS/Android regulatory features: Banking apps require deep integration with platform features (iOS Contact Picker for Pay Anyone, Android in-app review API, Siri Shortcuts for balance inquiry, Google Assistant integration). React Native support for these APIs is partial and often lags behind native API releases by 6-12 months.
5. NPE/crash rate: React Native apps in production at comparable banks (cited in Thoughtworks AU benchmarking) showed 1.8x higher crash rates than equivalent native apps, primarily due to JavaScript bridge failures and OOM on lower-end Android devices.

REASONS FOR REJECTING FLUTTER:
1. Dart ecosystem maturity: limited third-party library ecosystem for banking-specific requirements at time of evaluation (Aug 2023). Key libraries (analytics, compliance screen capture) not available.
2. Rendering model: Flutter renders all UI via its own Skia/Impeller rendering engine, bypassing native UIKit/Android View system. This means: accessibility services (VoiceOver, TalkBack) integration requires additional work; platform-native UI components (iOS action sheets, Android bottom sheets) must be custom-implemented.
3. Bank-wide standardisation: TrueBank's mobile engineering guild has existing expertise in Swift and Kotlin but zero Dart expertise — onboarding and cross-team mobility would be significantly impacted.

CONSEQUENCES:
1. Separate iOS and Android codebases maintained in parallel (truview-ios, truview-android GitLab repositories).
2. Feature parity between iOS and Android requires coordinated sprints — features typically shipped within 1-2 sprint delta between platforms.
3. Kotlin Multiplatform Mobile (KMM) library (truview-mobile-shared) introduced to share:
   - Business logic (account validation, payment validation rules)
   - Data models (Account, Transaction, PaymentRecipient structs)
   - Formatting utilities (currency, date, account number masking)
   - API response parsers (JSON deserialization, shared DTOs)
   This reduces code duplication while preserving native rendering and platform API access.
4. Longer feature development cycle for net-new features (estimate: +20% vs single cross-platform codebase) — accepted trade-off for performance and security posture.
5. App store release cycles remain independent — iOS app store review (1-3 days) and Android Play Store review (hours to 2 days) managed separately.

REVIEW DATE: August 2025 — re-evaluate if Flutter ecosystem maturity has addressed banking-specific gaps.`,
    tags: ['adr', 'truview-mobile', 'architecture', 'native', 'swift', 'kotlin', 'react-native', 'flutter', 'kmm', 'accepted', 'mobile'],
    classification: 'INTERNAL',
    freshness_ts: '2023-08-15T00:00:00Z',
    ingest_ts: '2025-03-04T00:00:00Z',
    ttl_hours: 720,
    meta: { adr_status: 'Accepted', decision_date: '2023-08-15', review_date: '2025-08-15' }
  },

  {
    id: 'conf_adr_005',
    appid: 'APPID-871198',
    source: 'confluence_adr',
    source_label: 'Confluence',
    record_id: 'ADR-078',
    title: 'ADR-078 — TruView Web: SPA (React) vs Server-Side Rendering (Next.js)',
    text: `ARCHITECTURE DECISION RECORD: ADR-078
Title: TruView Web Application Rendering: Single-Page Application (React SPA) vs Server-Side Rendering (Next.js SSR)
Status: Accepted
Date: 2023-11-20
Decision Makers: Web Platform Team, Platform Engineering, Enterprise Architecture
Confluence Page: /wiki/spaces/TRUVIEW/pages/ADR-078

CONTEXT:
As TruView Web approached its v5.0 major release (January 2024), the team evaluated whether to migrate from the existing React SPA architecture to Next.js with Server-Side Rendering (SSR). The primary drivers for evaluating SSR were: (1) improving Time to First Byte (TTFB) for initial page load, (2) potential SEO improvements, and (3) alignment with broader industry movement toward SSR-first frameworks in the React ecosystem.

DECISION:
ACCEPTED: Retain the SPA (React) architecture served from S3/CloudFront. Do NOT migrate to Next.js SSR.

REASON 1 — SEO IS IRRELEVANT FOR AUTHENTICATED BANKING APPLICATION:
TruView Web is entirely behind authentication. Every meaningful page (account overview, transactions, payments) requires a valid authenticated session. There is no crawlable public content — the login page is a simple static form with no banking data. SEO improvements from SSR would provide zero business value. The primary SSR benefit for public-facing marketing sites does not apply.

REASON 2 — SSR INCOMPATIBLE WITH STATELESS BFF ARCHITECTURE:
SSR requires server-side rendering at request time, meaning a persistent server process must handle HTML rendering. TruView Web's current architecture uses a stateless Node.js BFF (truview-web-bff) that aggregates data from TruView Core microservices. Introducing Next.js SSR would:
- Require the Next.js SSR server to have access to auth tokens on the server side (complicating the auth flow significantly)
- Create a stateful rendering server that must scale independently of the BFF
- Duplicate data-fetching logic between SSR (React Server Components) and client-side (for subsequent navigation)
- Significantly increase deployment complexity (cannot deploy as static files to S3/CloudFront — requires a running server)

REASON 3 — CLOUDFRONT CDN WITH SPA PROVIDES ADEQUATE TTFB FOR AUTHENTICATED USERS:
TruView Web's current CloudFront setup (prod-cf-truview-web, 12 edge locations) serves the initial HTML (index.html) from edge in <10ms globally. The perceived page load time for authenticated users is dominated by API call latency (account data from BFF), not HTML delivery. SSR would not improve this — the authenticated API calls would still be required regardless of rendering strategy.

REASON 4 — LCP SLO IS MET WITH CURRENT ARCHITECTURE + BUNDLE OPTIMISATION:
LCP SLO target: <2.5s. Current LCP: 1.71s (post-CHG0104980 bundle optimisation). The LCP SLO is achievable and currently met with the SPA + CloudFront approach. SSR migration would require 6+ months of engineering investment for no meaningful LCP improvement.

CONSEQUENCES:
1. SPA bundle size management is CRITICAL and is enforced by ADR-078. Performance budget: initial bundle <200KB gzipped. CI/CD bundle-analyzer step MUST fail builds that exceed this threshold. (Implemented in CHG0104980 with current compliance at 198KB.)
2. Code splitting and lazy loading are MANDATORY for all route modules that are not on the critical render path. Transaction History, Payments, Settings modules MUST use React.lazy() with dynamic import.
3. LCP SLO requires ongoing CloudFront optimisation — pre-connect hints, resource hints (preload/prefetch), and efficient chunk loading strategies.
4. No crawlable public content is a permanent constraint — any public-facing marketing content for TrueBank digital products must be served from a separate public-facing site (managed by Marketing team, out of scope for TruView Web).
5. Authentication flow requires: index.html (client-side render) → Auth Service redirect → JWT return → SPA renders authenticated state. This "flash of unauthenticated content" is managed by an initial loading skeleton (implemented in v5.0).

ADR-078 WILL BE REVISITED IF:
- TruView Web is extended to include public-facing content (e.g. landing pages, product comparison) — at that point SSR/ISR becomes relevant
- Next.js React Server Components maturity reaches a point where the stateless BFF model can be maintained (currently incompatible)
- LCP SLO cannot be met with SPA approach (currently well within target)`,
    tags: ['adr', 'truview-web', 'architecture', 'spa', 'react', 'nextjs', 'ssr', 'cloudfront', 'performance', 'bundle-size', 'accepted'],
    classification: 'INTERNAL',
    freshness_ts: '2023-11-20T00:00:00Z',
    ingest_ts: '2025-03-04T00:00:00Z',
    ttl_hours: 720,
    meta: { adr_status: 'Accepted', decision_date: '2023-11-20' }
  },

  // ─── SERVICE CATALOG ENTRIES ────────────────────────────────────────────────

  {
    id: 'conf_svc_002',
    appid: 'APPID-871198',
    source: 'confluence_kb',
    source_label: 'Confluence',
    record_id: 'SVCCATALOG-TRUVIEW-WEB-BFF',
    title: 'Service Catalog — TruView Web BFF (truview-web-bff)',
    text: `SERVICE CATALOG ENTRY: TruView Web BFF
Service ID: SVCCATALOG-TRUVIEW-WEB-BFF
Application: TruView Web (APPID-871198)
Confluence Page: /wiki/spaces/TRUVIEW/pages/service-catalog/truview-web-bff
Owner: Web Platform Team (Engineering Manager: James Blackwood — j.blackwood@truebank.com.au)
Last Updated: 2025-03-03
Current Version: v3.9.0 (deployed 2025-03-03T08:00:00Z — CHG0104601)

TECHNOLOGY STACK:
- Runtime: Node.js 20 (LTS)
- Framework: Express 4.18.x
- Redis client: ioredis 5.3.x (connection pool, auto-reconnect)
- HTTP client: Axios 1.6.x (with retry interceptor, up to 2 retries on 5xx/network error)
- Circuit breakers: opossum 8.1.x (Hystrix-compatible pattern)
- Authentication: JWT validation via auth-adapter HTTP calls (internal)
- Observability: Dynatrace OneAgent (auto-instrumented), structured JSON logging (pino)
- Testing: Jest 29, Supertest (integration), Playwright (E2E — separate test project)
- Build: Webpack 5 (BFF bundling for container)
- Container base image: node:20-alpine (SHA pinned in Dockerfile)

ENDPOINTS:
  Public (authenticated — requires valid JWT in Cookie: truview-session):
  GET  /api/v2/accounts/summary      — Multi-account summary (balances + account metadata)
  GET  /api/v2/accounts/{id}         — Single account detail
  GET  /api/v2/accounts/{id}/balance — Current balance for account (lighter payload)
  GET  /api/v2/transactions          — Paginated transaction list (?accountId&limit&offset&sort)
  GET  /api/v2/transactions/recent   — Last 10 transactions (all accounts)
  GET  /api/v2/transactions/analytics — Spend analytics by merchant category (?dateFrom&dateTo)
  POST /api/v2/payments/initiate     — Initiate a payment (calls TruView Core via Mule)
  GET  /api/v2/payments/history      — Payment history

  Internal (no auth — internal pod-to-pod only, not exposed via Mule):
  GET  /admin/health                 — Health check endpoint (Redis + upstream status)
  GET  /admin/metrics                — Prometheus-style metrics (cache hit rate, circuit breaker states)
  GET  /admin/circuits               — Circuit breaker states and statistics
  POST /admin/consumer/reset-offset  — Internal only — used by SRE runbooks

REDIS INTEGRATION:
  Instance: prod-redis-web-01 (AWS ElastiCache for Redis, r6g.large — 13.07GB RAM)
  Connection pool: min 5, max 20 connections (ioredis)
  Cache key patterns:
    accounts:summary:{userId}            → TTL: 600s (increased from 300s — PRB0012589 workaround)
    accounts:detail:{accountId}          → TTL: 600s
    accounts:balance:{accountId}         → TTL: 120s (balance — shorter TTL, more frequent refresh)
    transactions:recent:{userId}         → TTL: 60s
    transactions:list:{userId}:{params_hash} → TTL: 60s
    transactions:analytics:{userId}:{params_hash} → TTL: 300s
    auth:token:{jti}                     → TTL: 900s (15 min — JWT validation cache)
  Cache-aside pattern: check cache → if miss, call upstream → populate cache → return

CIRCUIT BREAKERS (opossum library):
  account-service:
    threshold: 50% error rate over 10-second rolling window
    timeout: 30,000ms (30 seconds — slow mainframe calls tolerated)
    resetTimeout: 60,000ms (60 seconds in OPEN state before HALF-OPEN test)
    fallback: return cached data from Redis with staleness warning header X-Cache-Age
  transaction-service:
    threshold: 50% error rate
    timeout: 20,000ms
    resetTimeout: 60,000ms
    fallback: empty transaction list with X-Degraded: true header
  auth-adapter:
    threshold: 30% error rate (tighter — auth failures are critical)
    timeout: 5,000ms
    resetTimeout: 30,000ms
    fallback: reject request with HTTP 503 (cannot serve unauthenticated data)

DEPLOYMENT:
  EKS Cluster: prod-eks-web-01
  Namespace: truview-web
  Deployment: truview-web-bff
  Replicas: 4 (HPA min: 4, max: 10)
  Resource limits: CPU: 1000m / Memory: 1.5Gi
  Resource requests: CPU: 250m / Memory: 512Mi
  Node group: web-bff-general (t3.large, 4 nodes)
  Image registry: ECR — 512492730598.dkr.ecr.ap-southeast-2.amazonaws.com/truview/web-bff
  Rolling update strategy: maxSurge: 1, maxUnavailable: 0

KNOWN ISSUES (active):
  INC0092301 (SEV3 — Redis session cache invalidation race condition post CHG0104601 — In Progress)
  PRB0012589 (Known Error — Redis cache stampede under peak load >340 RPS — workaround: TTL 600s)

RUNBOOKS:
  KB0041033 — TruView Web BFF Complete Performance Triage Playbook
  KB0044112 — TruView Web CloudFront CDN Cache Invalidation`,
    tags: ['service-catalog', 'truview-web', 'bff', 'nodejs', 'redis', 'circuit-breaker', 'opossum', 'ioredis', 'eks', 'endpoints', 'deployment'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-03T08:00:00Z',
    ingest_ts: '2025-03-04T00:00:00Z',
    ttl_hours: 48,
    meta: { service: 'truview-web-bff', version: 'v3.9.0', cluster: 'prod-eks-web-01', namespace: 'truview-web' }
  },

  {
    id: 'conf_svc_003',
    appid: 'APPID-871204',
    source: 'confluence_kb',
    source_label: 'Confluence',
    record_id: 'SVCCATALOG-TRUVIEW-MOBILE-BFF',
    title: 'Service Catalog — TruView Mobile BFF (truview-mobile-bff)',
    text: `SERVICE CATALOG ENTRY: TruView Mobile BFF
Service ID: SVCCATALOG-TRUVIEW-MOBILE-BFF
Application: TruView Mobile (APPID-871204)
Confluence Page: /wiki/spaces/TRUVIEW/pages/service-catalog/truview-mobile-bff
Owner: Mobile Platform Team (Engineering Manager: Thomas Vance — t.vance@truebank.com.au)
Last Updated: 2025-03-04
Current Version: v2.8.4

TECHNOLOGY STACK:
- Runtime: Node.js 20 (LTS)
- Framework: Express 4.18.x
- Redis client: ioredis 5.3.x (same as Web BFF)
- HTTP client: Axios 1.6.x (with retry interceptor)
- Circuit breakers: opossum 8.1.x
- Authentication: JWT validation via auth-adapter (same auth-adapter as Web BFF — shared TruView Core component)
- Observability: Dynatrace OneAgent, structured JSON logging (pino)
- Testing: Jest 29, Supertest, Detox (mobile E2E — separate project)
- Container base image: node:20-alpine

MOBILE-SPECIFIC DESIGN PRINCIPLES:
1. Payload optimisation: all Mobile BFF responses are stripped to contain only fields rendered by the mobile UI. Account summary response is ~60% smaller than the equivalent Web BFF response (e.g. Web includes 24 account fields; Mobile includes 11 — removes reconciliation metadata, legacy DDA flags, web-only display fields).
2. Shorter cache TTLs than Web: mobile users expect fresher data. Account data TTL: 120s (vs 600s on Web). Transaction TTL: 30s (vs 60s on Web). Rationale: mobile users refresh frequently; slightly stale data causes more negative UX impact on mobile vs desktop.
3. Pagination for infinite scroll: all list endpoints use cursor-based pagination (cursor: base64-encoded {lastTimestamp, lastId}) rather than offset pagination — prevents page drift as new transactions are added during scroll sessions.
4. Optimistic updates: payment initiation endpoint (/api/mobile/v2/payments/quick-pay) returns immediate HTTP 202 Accepted with a correlationId — mobile app shows "Payment in progress" immediately; push notification delivers final result asynchronously.

ENDPOINTS:
  Public (authenticated — JWT via Authorization: Bearer header, not cookie like Web BFF):
  GET  /api/mobile/v2/accounts/summary             — Mobile-optimised account summary (11 fields, 60% smaller payload)
  GET  /api/mobile/v2/accounts/{id}                — Account detail (mobile-optimised)
  GET  /api/mobile/v2/accounts/{id}/balance        — Balance only (lightest endpoint — used for balance widget refresh)
  GET  /api/mobile/v2/transactions/recent          — Last 5 transactions (mobile home screen widget)
  GET  /api/mobile/v2/transactions                 — Cursor-paginated transaction list (infinite scroll)
  POST /api/mobile/v2/payments/quick-pay           — Pay Anyone (Quick Pay feature) — async, returns 202
  GET  /api/mobile/v2/payments/status/{correlationId} — Poll payment status (for quick-pay correlationId)
  POST /api/mobile/push/register                   — Register device for push notifications (on app install/login)
  POST /api/mobile/devices/token-refresh           — FCM/APNs token refresh (on every app resume) [NOTE: currently rate-limited due to INC0092418]
  POST /api/mobile/devices/deregister              — Remove device on logout
  GET  /api/mobile/devices/preferences             — Push notification preferences
  PUT  /api/mobile/devices/preferences             — Update push notification preferences (enable/disable types)

  Internal (not exposed via Mule):
  GET  /admin/health                               — Health check
  GET  /admin/metrics                              — Metrics (cache hit rate, circuit breaker states, endpoint response times)
  GET  /admin/circuits                             — Circuit breaker states

REDIS INTEGRATION:
  Instance: prod-redis-mobile-01 (AWS ElastiCache for Redis, r6g.large — separate from Web BFF Redis)
  Connection pool: min 5, max 25 connections (higher max than Web due to higher request volume)
  Cache key patterns (shorter TTLs than Web BFF):
    mobile:accounts:summary:{userId}               → TTL: 120s
    mobile:accounts:detail:{accountId}             → TTL: 120s
    mobile:accounts:balance:{accountId}            → TTL: 60s
    mobile:transactions:recent:{userId}            → TTL: 30s
    mobile:transactions:list:{userId}:{cursor}     → TTL: 30s
    mobile:auth:token:{jti}                        → TTL: 900s (same 15-min JWT cache as Web BFF)
    mobile:devices:{deviceId}:token               → TTL: 86400s (24h — device token cache)

CIRCUIT BREAKERS:
  account-service: threshold 50%, timeout 20,000ms, fallback: stale cache with X-Cache-Age header
  transaction-service: threshold 50%, timeout 15,000ms, fallback: empty list with X-Degraded: true
  notification-service: threshold 50%, timeout 5,000ms, fallback: log failure, return 200 (non-blocking for main BFF response)
  notification-service circuit breaker: currently HALF-OPEN (testing recovery post INC0091205)

DEPLOYMENT:
  EKS Cluster: prod-eks-mobile-01
  Namespace: truview-mobile
  Deployment: truview-mobile-bff
  Replicas: 5 (HPA min: 5, max: 12 — higher than Web due to 420K daily sessions vs 180K)
  Resource limits: CPU: 1000m / Memory: 1.5Gi
  Resource requests: CPU: 300m / Memory: 512Mi
  Node group: mobile-bff-general (t3.large, 5 nodes)
  Image registry: ECR — 512492730598.dkr.ecr.ap-southeast-2.amazonaws.com/truview/mobile-bff

TRAFFIC PROFILE:
  Daily Active Sessions: ~420,000 (largest TruView channel — 2.3x Web traffic)
  Peak RPS: 580 RPS (morning peak 07:00-09:00 EST)
  Current RPS (2025-03-04 10:00 UTC): 520 RPS (morning peak subsiding)
  iOS/Android split: 58% iOS / 42% Android

KNOWN ISSUES (active):
  INC0092418 (SEV3 — Android FCM token registration failures — 429 rate limiting — In Progress)
  INC0091205 (SEV3 — iOS push notification APNs failures — correlated notification-service, separate path from BFF)
  PRB0012632 (Known Error — iOS biometric silent failure on iOS 16.x)

RUNBOOKS:
  KB0052891 — TruView Mobile iOS Push Notification Service Emergency Rollback
  KB0055204 — TruView Mobile BFF Pod Scaling and Restart Operations`,
    tags: ['service-catalog', 'truview-mobile', 'bff', 'nodejs', 'redis', 'circuit-breaker', 'opossum', 'ioredis', 'eks', 'endpoints', 'deployment', 'fcm', 'push'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-04T00:00:00Z',
    ingest_ts: '2025-03-04T00:00:00Z',
    ttl_hours: 48,
    meta: { service: 'truview-mobile-bff', version: 'v2.8.4', cluster: 'prod-eks-mobile-01', namespace: 'truview-mobile' }
  },

];
