// TrueBank Digital SME (APPID-7779311) — Onboarding and setup documentation

export const smeOnboardingChunks = [

  {
    id: 'sme_onboard_001',
    appid: 'APPID-7779311',
    source: 'confluence_onboarding',
    source_label: 'Onboarding',
    record_id: 'ONBOARD-SME-001',
    title: 'TrueBank Digital SME — Developer Setup and Local Development Guide',
    text: `ONBOARDING GUIDE: TrueBank Digital SME (APPID-7779311)
Document: /wiki/spaces/PLATFORMAI/pages/SME-Developer-Setup
Last Updated: 2025-03-04
Owner: Platform AI Team — l.dooley@truebank.com.au

PREREQUISITES:
- Node.js v20+ (project uses v24.x — install via nvm or direct download)
- npm v10+
- AWS CLI v2 configured with IAM user credentials (cluade-deploy, us-east-1)
- ANTHROPIC_API_KEY — request from Platform AI Team (#platform-ai Slack)
- GitHub access: repo lsdooley/truebank-digital-sme (SSH auth)

LOCAL SETUP:
1. Clone repo:
   git clone git@github.com:lsdooley/truebank-digital-sme.git
   cd truebank-digital-sme

2. Install dependencies:
   npm install

3. Configure environment:
   cp .env.example .env
   # Edit .env — set ANTHROPIC_API_KEY=sk-ant-...

4. Start backend server (port 3001):
   node server/index.js

5. Start frontend dev server (port 5173, proxies /api to :3001):
   npm run dev

6. Open browser: http://localhost:5173

COMMON ISSUES:
- "ANTHROPIC_API_KEY not configured": check .env file is present and sourced
- Knowledge base not loading: check console for [knowledge-base] log line — should show chunk count
- CORS errors: frontend must be served via Vite dev server (port 5173), not opened as a file

DEPLOYMENT (AWS):
sam build && sam deploy --config-env prod
Frontend sync: aws s3 sync dist/ s3://truebank-sme-frontend-prod --delete
Invalidate CDN: aws cloudfront create-invalidation --distribution-id [id] --paths "/*"
(Full deployment handled automatically by GitHub Actions pipeline on push to main)`,
    tags: ['onboarding', 'setup', 'local-dev', 'sme', 'node', 'sam', 'env', 'developer'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-04T08:00:00Z',
    ingest_ts: '2025-03-04T08:05:00Z',
    ttl_hours: 168,
    meta: { doc_type: 'Onboarding Guide', owner: 'Platform AI Team' }
  },

  {
    id: 'sme_onboard_002',
    appid: 'APPID-7779311',
    source: 'confluence_onboarding',
    source_label: 'Onboarding',
    record_id: 'ONBOARD-SME-002',
    title: 'TrueBank Digital SME — How to add and update knowledge base chunks',
    text: `KNOWLEDGE BASE MANAGEMENT GUIDE: TrueBank Digital SME
Document: /wiki/spaces/PLATFORMAI/pages/SME-KB-Management
Last Updated: 2025-03-04
Owner: Platform AI Team

KNOWLEDGE BASE STRUCTURE:
All knowledge base data lives in server/data/. Each file exports an array of chunk objects. The index file (server/data/index.js) imports and combines them all into a single knowledgeBase array loaded at server startup.

CHUNK SCHEMA (required fields):
  id: string          — unique ID (e.g. 'sn_inc_042')
  appid: string       — 'APPID-973193' | 'APPID-871198' | 'APPID-871204' | 'APPID-7779311' | 'POLICY' | 'CVE' | 'ALL'
  source: string      — source system key (e.g. 'servicenow_incidents')
  source_label: string — display label (e.g. 'ServiceNow')
  record_id: string   — source system record ID (e.g. 'INC0089341')
  title: string       — short descriptive title (used in retrieval scoring)
  text: string        — full record content (first 2,000 chars sent to Claude)
  tags: string[]      — keywords for retrieval scoring (+2.0 per tag match)
  ttl_hours: number   — how long until STALE (1=incidents, 8=changes, 168=docs)
  meta: object        — optional structured metadata (severity, state, etc.)

ADDING A NEW CHUNK:
1. Identify the correct data file (or create a new one following the naming pattern)
2. Add the chunk object following the schema above
3. If creating a new file, import it in server/data/index.js and spread into allRaw[]
4. If the source is new, add it to SOURCE_INGEST_OFFSETS in index.js
5. Restart the server (local) or deploy (production) — chunks load at startup

GLOBAL POOLS (Policy and CVE):
  - Use appid: 'POLICY' for bank-wide policy records
  - Use appid: 'CVE' for vulnerability records
  - These are NOT retrieved on normal queries — only when policy/CVE intent is detected
  - Policy intent keywords: policy, compliance, regulation, gdpr, pci, requirement, permitted, standard, mandate, audit
  - CVE intent keywords: cve, vulnerability, security, exploit, patch, exposure, risk, zero-day, dependency

TIPS:
  - Keep record_id consistent with the source system (INC, CHG, PRB, KB, CVE-YYYY-NNNNN)
  - Put the most important information in the first 2,000 characters of text (truncation limit)
  - Use descriptive tags — they carry +2.0 score weight per match`,
    tags: ['onboarding', 'knowledge-base', 'chunks', 'schema', 'how-to', 'sme', 'data-management', 'developer'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-04T08:00:00Z',
    ingest_ts: '2025-03-04T08:05:00Z',
    ttl_hours: 168,
    meta: { doc_type: 'Knowledge Base Management Guide', owner: 'Platform AI Team' }
  },

];
