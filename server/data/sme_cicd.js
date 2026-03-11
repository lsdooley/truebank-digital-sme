// TrueBank Digital SME (APPID-7779311) — CI/CD pipeline synthetic data

export const smeCicdChunks = [

  {
    id: 'sme_pipe_001',
    appid: 'APPID-7779311',
    source: 'cicd_pipelines',
    source_label: 'CI/CD',
    record_id: 'PIPE-SME-5021-PROD',
    title: 'Pipeline run — SME token optimisation deployment CHG0105021 (SUCCESS)',
    text: `CI/CD PIPELINE RUN: PIPE-SME-5021-PROD
Application: TrueBank Digital SME (APPID-7779311)
Pipeline: truebank-sme-prod-deploy
Status: SUCCESS
Triggered: 2025-03-02T10:15:00Z
Completed: 2025-03-02T10:28:00Z
Duration: 13 minutes
Change record: CHG0105021
Author: l.dooley@truebank.com.au
Commit: f4a9b2c8d1e7f3a5b9c2d6e8f1a4b7c3d9e2f5a8
Commit message: "fix: move timestamp to user message, add chunk truncation, reduce maxChunks 6->4"

PIPELINE STAGES:
1. Install dependencies (npm ci) — 1m 22s — PASSED
2. Lint (ESLint) — 0m 28s — PASSED
3. Unit tests — 0m 44s — PASSED (12 tests)
4. SAM build (Lambda + frontend) — 4m 10s — PASSED
   Lambda package: truebank-sme-api.zip (18.4MB including node_modules)
   Frontend bundle: dist/ (Vite production build, 342KB gzipped)
5. Frontend deploy to S3 — 0m 55s — PASSED
   Bucket: truebank-sme-frontend-prod
   Files synced: 14 changed, 0 deleted
6. CloudFront invalidation — 0m 30s — PASSED
   Distribution: prod-cf-sme — paths: /*
7. SAM deploy (Lambda + API Gateway) — 4m 51s — PASSED
   Stack: truebank-digital-sme (us-east-1)
   Lambda alias: live — no traffic shift required (non-critical Tier 3)

POST-DEPLOY VALIDATION:
- Lambda health: GET /api/health → HTTP 200 {"status":"ok","chunks":80} ✓
- Token test query: input tokens 2,089 (prev avg 6,200) ✓
- Frontend load: HTTP 200 from CloudFront ✓

ROLLBACK: sam deploy --config-env prod --parameter-overrides LambdaAlias=previous`,
    tags: ['pipeline', 'deployment', 'sme', 'lambda', 'sam', 'success', 'chg0105021', 'token-optimisation'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-02T10:28:00Z',
    ingest_ts: '2025-03-02T10:35:00Z',
    ttl_hours: 72,
    meta: { status: 'SUCCESS', duration_min: 13, change_record: 'CHG0105021', author: 'l.dooley@truebank.com.au' }
  },

  {
    id: 'sme_pipe_002',
    appid: 'APPID-7779311',
    source: 'cicd_pipelines',
    source_label: 'CI/CD',
    record_id: 'PIPE-SME-4998-PROD-FAIL',
    title: 'Pipeline run — SME initial deployment FAILED — missing ANTHROPIC_API_KEY in SSM',
    text: `CI/CD PIPELINE RUN: PIPE-SME-4998-PROD-FAIL
Application: TrueBank Digital SME (APPID-7779311)
Pipeline: truebank-sme-prod-deploy
Status: FAILED
Triggered: 2025-02-28T22:44:00Z
Failed: 2025-02-28T22:58:00Z
Duration: 14 minutes (to failure)
Author: l.dooley@truebank.com.au
Commit message: "feat: initial Lambda deployment with RAG knowledge base"

FAILURE DETAILS:
Stage: SAM Deploy — FAILED at 14m 02s
Error: CloudFormation stack CREATE_FAILED
  Resource: TruebankSmeApiFunction (AWS::Lambda::Function)
  Reason: Lambda execution role (truebank-sme-execution-role) lacks ssm:GetParameter permission for /truebank/sme/anthropic-api-key

The Lambda function startup code attempts to load ANTHROPIC_API_KEY from SSM Parameter Store at cold start. The IAM execution role was created with a policy template that did not include ssm:GetParameter for the specific parameter path.

RESOLUTION:
2025-02-28T23:15:00Z: Added ssm:GetParameter permission to truebank-sme-execution-role for resource arn:aws:ssm:us-east-1:512492730598:parameter/truebank/sme/*
2025-02-28T23:22:00Z: Re-run PIPE-SME-4999-PROD — SUCCESS

LESSON LEARNED:
Lambda functions reading from SSM Parameter Store must have explicit ssm:GetParameter permissions scoped to the parameter path. Added to SAM template.yaml as an explicit policy statement.`,
    tags: ['pipeline', 'deployment', 'sme', 'lambda', 'failed', 'ssm', 'iam', 'initial-deployment'],
    classification: 'INTERNAL',
    freshness_ts: '2025-02-28T22:58:00Z',
    ingest_ts: '2025-03-01T00:00:00Z',
    ttl_hours: 72,
    meta: { status: 'FAILED', duration_min: 14, failure_stage: 'SAM Deploy', author: 'l.dooley@truebank.com.au' }
  },

  {
    id: 'sme_pipe_004',
    appid: 'APPID-7779311',
    source: 'cicd_pipelines',
    source_label: 'CI/CD',
    record_id: 'PIPE-SME-6101-PROD',
    title: 'Pipeline run — v2.1 About page + diagrams deployment (SUCCESS)',
    text: `CI/CD PIPELINE RUN: PIPE-SME-6101-PROD
Application: TrueBank Digital SME (APPID-7779311)
Pipeline: truebank-sme-prod-deploy
Status: SUCCESS
Triggered: 2026-03-07T23:37:00Z
Completed: 2026-03-07T23:52:00Z
Duration: 15 minutes
Version: v2.1
Author: l.dooley@truebank.com.au
Commit: 2728cef

CHANGES DEPLOYED:
- Added About This Application page (/about route)
- Added inline HTML/CSS RAG process flow diagram
- Added Python Diagrams architecture diagram (architecture.py)
- Added Python Graphviz process flow generator (process_flow.py)
- Added versioned changelog to About page
- Added About page link to Dashboard footer
- Bumped version to v2.1 across Sidebar, Dashboard, About

PIPELINE STAGES:
1. npm run build (Vite) — 2m 27s — PASSED
2. S3 sync (frontend only, no Lambda changes) — 0m 55s — PASSED
3. CloudFront invalidation — 0m 30s — PASSED

POST-DEPLOY VALIDATION:
- Frontend load: HTTP 200 from CloudFront ✓
- /about route renders correctly ✓`,
    tags: ['pipeline', 'deployment', 'sme', 'v2.1', 'about-page', 'frontend', 'success'],
    classification: 'INTERNAL',
    freshness_ts: '2026-03-07T23:52:00Z',
    ingest_ts: '2026-03-07T23:52:00Z',
    ttl_hours: 72,
    meta: { status: 'SUCCESS', duration_min: 15, version: 'v2.1', author: 'l.dooley@truebank.com.au' }
  },

  {
    id: 'sme_pipe_005',
    appid: 'APPID-7779311',
    source: 'cicd_pipelines',
    source_label: 'CI/CD',
    record_id: 'PIPE-SME-6115-PROD',
    title: 'Pipeline run — v2.2 bug fixes deployment (SUCCESS)',
    text: `CI/CD PIPELINE RUN: PIPE-SME-6115-PROD
Application: TrueBank Digital SME (APPID-7779311)
Pipeline: truebank-sme-prod-deploy
Status: SUCCESS
Triggered: 2026-03-11T06:10:00Z
Completed: 2026-03-11T06:14:00Z
Duration: 4 minutes
Version: v2.2
Author: l.dooley@truebank.com.au
Commit: d66f68e

CHANGES DEPLOYED (code review fixes):
- FIX: Degraded banner "View in SME" button now navigates to first SME-enabled
  degraded app dynamically — previously hardcoded to APPID-973193 (TruView Core)
- FIX: Added typeof guard on __BUILD_TIME__ in Sidebar footer to prevent
  ReferenceError if Vite define config is missing — falls back to 'unknown'
- CHORE: Removed unused onOpen prop from AppCard component

PIPELINE STAGES:
1. npm run build (Vite) — 1m 18s — PASSED
2. S3 sync (frontend only) — 0m 46s — PASSED
3. CloudFront invalidation — 0m 30s — PASSED

POST-DEPLOY VALIDATION:
- Dashboard degraded banner routes correctly ✓
- Sidebar build time displays correctly ✓`,
    tags: ['pipeline', 'deployed', 'changes-deployed', 'recent-changes', 'sme', 'v2.2', 'bug-fix', 'frontend', 'success', 'code-review'],
    classification: 'INTERNAL',
    freshness_ts: '2026-03-11T06:14:00Z',
    ingest_ts: '2026-03-11T06:14:00Z',
    ttl_hours: 72,
    meta: { status: 'SUCCESS', duration_min: 4, version: 'v2.2', author: 'l.dooley@truebank.com.au' }
  },

  {
    id: 'sme_pipe_006',
    appid: 'APPID-7779311',
    source: 'cicd_pipelines',
    source_label: 'CI/CD',
    record_id: 'PIPE-SME-6122-PROD',
    title: 'Pipeline run — v2.3 CloudWatch live log sync deployment (SUCCESS)',
    text: `CI/CD PIPELINE RUN: PIPE-SME-6122-PROD
Application: TrueBank Digital SME (APPID-7779311)
Pipeline: truebank-sme-prod-deploy
Status: SUCCESS
Triggered: 2026-03-11T06:38:00Z
Completed: 2026-03-11T07:05:00Z
Duration: 27 minutes
Version: v2.3
Author: l.dooley@truebank.com.au
Commit: 010fa6d

CHANGES DEPLOYED:
- NEW: sync-lambda/index.mjs — CloudWatch Logs Insights → DynamoDB sync Lambda
  Runs every 15 minutes via EventBridge. Queries REPORT lines (performance),
  ERROR lines, and 6-hour invocation trend. Writes 3 knowledge chunks to DynamoDB.
- NEW: server/dynamo.js — DynamoDB live chunk reader with 5-minute in-memory cache.
  Gracefully returns empty array if TABLE_NAME env var not set (local dev).
- CHANGE: server/retrieval.js — retrieveChunks() made async. Merges static
  knowledge base with live DynamoDB chunks at query time.
- CHANGE: server/app.js — await added to retrieveChunks() in chat and stream endpoints.
- CHANGE: template.yaml — added LiveChunksTable (DynamoDB PAY_PER_REQUEST with TTL),
  LogSyncFunction (EventBridge rate 15 min), DynamoDBReadPolicy on ApiFunction.

NEW AWS RESOURCES CREATED:
- DynamoDB table: truebank-sme-live-chunks (PAY_PER_REQUEST, 24h TTL)
- Lambda function: truebank-sme-log-sync (256MB, 120s timeout)
- EventBridge rule: rate(15 minutes) → truebank-sme-log-sync

INCIDENT DURING DEPLOY:
PIPE-SME-6122 triggered two earlier failed SAM deploys that passed the literal
string "UsePreviousValue" as the ANTHROPIC_API_KEY parameter, overwriting the
real key. App was unavailable for ~20 minutes. Resolved by:
1. Restoring key directly via aws lambda update-function-configuration
2. Storing key in SSM Parameter Store at /truebank-sme/anthropic-api-key
3. Creating deploy.sh that reads key from SSM at deploy time
4. Adding liveIntent pool (Pool D) to retrieval so CloudWatch chunks surface

POST-DEPLOY VALIDATION:
- Lambda health: GET /api/health → HTTP 200 ✓
- DynamoDB sync: 3 chunks written within 15 min of deploy ✓
- Live query test: "how many requests today" → returns CW-TREND-6H chunk ✓`,
    tags: ['pipeline', 'deployed', 'changes-deployed', 'recent-changes', 'sme', 'v2.3', 'cloudwatch', 'dynamodb', 'live-sync', 'success', 'incident'],
    classification: 'INTERNAL',
    freshness_ts: '2026-03-11T07:05:00Z',
    ingest_ts: '2026-03-11T07:05:00Z',
    ttl_hours: 72,
    meta: { status: 'SUCCESS', duration_min: 27, version: 'v2.3', author: 'l.dooley@truebank.com.au' }
  },

  {
    id: 'sme_pipe_003',
    appid: 'APPID-7779311',
    source: 'cicd_pipelines',
    source_label: 'CI/CD',
    record_id: 'DEPLOY-HISTORY-SME',
    title: 'TrueBank Digital SME deployment history — all production deployments',
    text: `DEPLOYMENT HISTORY: TrueBank Digital SME (APPID-7779311)
Source: GitHub (lsdooley/truebank-digital-sme) + AWS SAM CLI
Last Updated: 2026-03-11T07:10:00Z

Production Deployments (newest first):

1. PIPE-SME-6122-PROD | 2026-03-11 07:05 UTC | SUCCESS | v2.3 | CloudWatch→DynamoDB live log sync; async retrieval; liveIntent pool; SSM key fix | l.dooley
2. PIPE-SME-6115-PROD | 2026-03-11 06:14 UTC | SUCCESS | v2.2 | Bug fixes: degraded banner routing, __BUILD_TIME__ guard, dead prop removal | l.dooley
3. PIPE-SME-6101-PROD | 2026-03-07 23:52 UTC | SUCCESS | v2.1 | About page, process flow diagram, architecture diagram, changelog | l.dooley
4. PIPE-SME-5890-PROD | 2025-03-04 08:00 UTC | SUCCESS | v2.0 | KB expansion: policy, CVE, process flow, SME self-data (80→115 chunks) | l.dooley
5. PIPE-SME-5021-PROD | 2025-03-02 10:28 UTC | SUCCESS | v1.1 | Token optimisation: static prompt, chunk truncation, maxChunks 6→4 | l.dooley
6. PIPE-SME-5001-PROD | 2025-03-01 18:00 UTC | SUCCESS | v1.0 | Added architecture_extra and confluence_extra knowledge base files | l.dooley
7. PIPE-SME-4999-PROD | 2025-02-28 23:22 UTC | SUCCESS | v1.0 | Initial production deployment (re-run after 4998 fail) | l.dooley
8. PIPE-SME-4998-PROD | 2025-02-28 22:58 UTC | FAILED   | v1.0 | Initial deployment — IAM SSM permission missing | l.dooley

DEPLOYMENT TOOLCHAIN:
- Source: GitHub repo lsdooley/truebank-digital-sme (main branch)
- Build: npx esbuild (Lambda bundle) + Vite (frontend) + sam build
- Deploy: ./deploy.sh — reads ANTHROPIC_API_KEY from SSM, runs sam deploy + S3 sync + CF invalidation
- Lambda runtime: nodejs20.x | Architecture: x86_64
- API Gateway: HTTP API (auto-created by SAM)

DEPLOYMENT CADENCE: ~1–2 deployments per active development day
FAILURE RATE: 1 hard failure in 8 deployments (12.5%); 1 incident during v2.3 (API key overwrite, resolved in 20 min)`,
    tags: ['deployment-history', 'deployed', 'changes-deployed', 'recent-changes', 'latest-deployment', 'what-changed', 'sme', 'pipeline', 'sam', 'github', 'lambda', 'poc'],
    classification: 'INTERNAL',
    freshness_ts: '2026-03-11T07:10:00Z',
    ingest_ts: '2026-03-11T07:10:00Z',
    ttl_hours: 24,
    meta: { deployment_count: 8, failure_rate: '12.5%', stack: 'truebank-sme', current_version: 'v2.3' }
  },

];
