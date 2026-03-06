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
    id: 'sme_pipe_003',
    appid: 'APPID-7779311',
    source: 'cicd_pipelines',
    source_label: 'CI/CD',
    record_id: 'DEPLOY-HISTORY-SME',
    title: 'TrueBank Digital SME deployment history — all production deployments',
    text: `DEPLOYMENT HISTORY: TrueBank Digital SME (APPID-7779311)
Source: GitHub (lsdooley/truebank-digital-sme) + AWS SAM CLI
Last Updated: 2025-03-04T10:00:00Z

Production Deployments (newest first):

1. PIPE-SME-5890-PROD | 2025-03-04 08:00 UTC | SUCCESS | CHG0104890 | KB expansion: policy, CVE, process flow, SME self-data (80→152 chunks) | l.dooley
2. PIPE-SME-5021-PROD | 2025-03-02 10:28 UTC | SUCCESS | CHG0105021 | Token optimisation: static prompt, chunk truncation, maxChunks 6→4 | l.dooley
3. PIPE-SME-5001-PROD | 2025-03-01 18:00 UTC | SUCCESS | CHG0104950 | Added architecture_extra and confluence_extra knowledge base files | l.dooley
4. PIPE-SME-4999-PROD | 2025-02-28 23:22 UTC | SUCCESS | (re-run after 4998 fail) | Initial production deployment | l.dooley
5. PIPE-SME-4998-PROD | 2025-02-28 22:58 UTC | FAILED   | Initial deployment — IAM SSM permission missing | l.dooley

DEPLOYMENT TOOLCHAIN:
- Source: GitHub repo lsdooley/truebank-digital-sme (main branch)
- Build: npm ci + Vite production build + AWS SAM build
- Deploy: sam deploy --config-env prod (samconfig.toml in repo root)
- Lambda runtime: nodejs20.x | Architecture: x86_64
- API Gateway: HTTP API (auto-created by SAM)

DEPLOYMENT CADENCE: ~1 deployment per 2 days (POC active development)
FAILURE RATE: 1 failure in 5 deployments (20%) — all recovered within 30 minutes`,
    tags: ['deployment-history', 'sme', 'pipeline', 'sam', 'github', 'lambda', 'poc'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-04T10:00:00Z',
    ingest_ts: '2025-03-04T10:00:00Z',
    ttl_hours: 24,
    meta: { deployment_count: 5, failure_rate: '20%', stack: 'truebank-digital-sme' }
  },

];
