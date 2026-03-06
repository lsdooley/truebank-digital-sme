// TrueBank Digital SME (APPID-7779311) — AWS infrastructure and CMDB synthetic data

export const smeAwsChunks = [

  {
    id: 'sme_aws_001',
    appid: 'APPID-7779311',
    source: 'aws_infrastructure',
    source_label: 'AWS/CMDB',
    record_id: 'AWS-SME-LAMBDA',
    title: 'AWS infrastructure — TrueBank Digital SME Lambda and API Gateway configuration',
    text: `AWS INFRASTRUCTURE RECORD: TrueBank Digital SME — Compute
APPID: APPID-7779311
SAM Stack: truebank-digital-sme (us-east-1)
Last Updated: 2025-03-04T08:00:00Z

LAMBDA FUNCTION: truebank-sme-api
  Runtime: nodejs20.x
  Architecture: x86_64
  Memory: 512MB
  Timeout: 29 seconds
  Handler: server/lambda.js (ESM, wrapped with aws-serverless-express)
  Environment variables:
    ANTHROPIC_API_KEY: resolved from SSM Parameter Store (/truebank/sme/anthropic-api-key) at cold start
    NODE_ENV: production
  IAM Execution Role: truebank-sme-execution-role
    Policies: AWSLambdaBasicExecutionRole, ssm:GetParameter (/truebank/sme/*)
  Concurrency: unreserved (uses account-level concurrency pool)
  Cold start behaviour: ~1.8s (knowledge base loads 152 chunks into memory at cold start)
  Warm invocation p95: 2.1s (including Claude API call)

API GATEWAY: TruebankSmeHttpApi
  Type: HTTP API (v2)
  Endpoint: https://[api-id].execute-api.us-east-1.amazonaws.com
  Routes:
    POST /api/chat → Lambda integration (truebank-sme-api)
    GET  /api/health → Lambda integration
    GET  /api/freshness → Lambda integration
  CORS: allowed origins: * (POC — restrict before production)
  Throttling: 1,000 RPS burst, 500 RPS steady (account default — no custom throttle set)
  Logging: CloudWatch log group /aws/apigateway/truebank-sme (retention: 7 days)

CLOUDWATCH ALARMS:
  - LambdaDurationP95 >10,000ms → SNS → #platform-ai Slack
  - LambdaErrors >5% → SNS → #platform-ai Slack
  - LambdaThrottles >0 → SNS → #platform-ai Slack`,
    tags: ['aws', 'lambda', 'api-gateway', 'sme', 'infrastructure', 'nodejs', 'serverless', 'sam'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-04T08:00:00Z',
    ingest_ts: '2025-03-04T08:05:00Z',
    ttl_hours: 168,
    meta: { resource_type: 'Lambda + API Gateway', region: 'us-east-1', stack: 'truebank-digital-sme' }
  },

  {
    id: 'sme_aws_002',
    appid: 'APPID-7779311',
    source: 'aws_infrastructure',
    source_label: 'AWS/CMDB',
    record_id: 'AWS-SME-FRONTEND',
    title: 'AWS infrastructure — TrueBank Digital SME S3 and CloudFront frontend configuration',
    text: `AWS INFRASTRUCTURE RECORD: TrueBank Digital SME — Frontend
APPID: APPID-7779311
SAM Stack: truebank-digital-sme (us-east-1)
Last Updated: 2025-03-04T08:00:00Z

S3 BUCKET: truebank-sme-frontend-prod
  Region: us-east-1
  Contents: React/Vite production build (dist/)
  Public access: BLOCKED (served via CloudFront only)
  Versioning: disabled (overwritten on each deploy)
  Estimated size: 1.2MB (well within 5GB free tier)
  Bucket policy: CloudFront OAC (Origin Access Control) read-only

CLOUDFRONT DISTRIBUTION: prod-cf-sme
  Origins:
    - S3: truebank-sme-frontend-prod (static frontend — default origin)
    - API Gateway: [api-id].execute-api.us-east-1.amazonaws.com (path: /api/*)
  Behaviours:
    - /api/* → API Gateway origin (no cache, forward all headers)
    - /* → S3 origin (cache: 1 day default, 0 for index.html)
  Price class: PriceClass_100 (US/Europe/Asia — lowest cost)
  HTTPS: enforced (redirect HTTP → HTTPS)
  Custom error pages: 404 → /index.html (SPA routing support)
  Invalidations: triggered on each frontend deploy (paths: /*)

FREE TIER STATUS (as of 2025-03-04):
  S3: 1.2MB used of 5GB free — 0% consumed
  CloudFront: ~8GB data transfer used of 1TB free this month — negligible
  Lambda: ~45,000 invocations of 1M free this month
  API Gateway: ~45,000 calls of 1M free this month
  Overall AWS cost: $0.00 (within free tier)`,
    tags: ['aws', 's3', 'cloudfront', 'frontend', 'sme', 'infrastructure', 'free-tier', 'react', 'vite'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-04T08:00:00Z',
    ingest_ts: '2025-03-04T08:05:00Z',
    ttl_hours: 168,
    meta: { resource_type: 'S3 + CloudFront', region: 'us-east-1', stack: 'truebank-digital-sme' }
  },

  {
    id: 'sme_aws_003',
    appid: 'APPID-7779311',
    source: 'aws_cloudtrail',
    source_label: 'AWS/CMDB',
    record_id: 'CLOUDTRAIL-SME-2025-03-04',
    title: 'AWS CloudTrail — TrueBank Digital SME significant events (last 48h)',
    text: `AWS CLOUDTRAIL RECORD: TrueBank Digital SME significant events
APPID: APPID-7779311
Period: 2025-03-02T10:00:00Z to 2025-03-04T10:00:00Z
Generated: 2025-03-04T10:00:00Z

SIGNIFICANT EVENTS:

2025-03-04T08:05:00Z | UpdateFunctionCode | truebank-sme-api | l.dooley (IAM) | KB expansion deployment — 152 chunks
2025-03-04T08:04:00Z | CreateInvalidation | prod-cf-sme | l.dooley (IAM) | Frontend cache invalidation (CHG0104890)
2025-03-04T08:03:00Z | PutObject (x14) | truebank-sme-frontend-prod | l.dooley (IAM) | Frontend asset sync

2025-03-02T10:28:00Z | UpdateFunctionCode | truebank-sme-api | l.dooley (IAM) | Token optimisation deployment (CHG0105021)
2025-03-02T10:27:00Z | CreateInvalidation | prod-cf-sme | l.dooley (IAM) | Frontend cache invalidation

2025-03-01T18:05:00Z | UpdateFunctionCode | truebank-sme-api | l.dooley (IAM) | KB extra data files added
2025-03-01T18:04:00Z | PutParameter | /truebank/sme/anthropic-api-key | l.dooley (IAM) | API key rotation (scheduled 90-day rotation)

2025-02-28T23:25:00Z | PutRolePolicy | truebank-sme-execution-role | l.dooley (IAM) | Added ssm:GetParameter — fix for PIPE-SME-4998 failure
2025-02-28T23:22:00Z | CreateStack | truebank-digital-sme | l.dooley (IAM) | Initial SAM stack creation

ANOMALIES: None detected. All events consistent with deployment activity.
FAILED EVENTS: 0 AccessDenied events in period (post-IAM fix).`,
    tags: ['cloudtrail', 'aws', 'sme', 'audit', 'events', 'deployment', 'iam', 'lambda'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-04T10:00:00Z',
    ingest_ts: '2025-03-04T10:00:00Z',
    ttl_hours: 24,
    meta: { resource_type: 'CloudTrail', region: 'us-east-1', period_hours: 48 }
  },

];
