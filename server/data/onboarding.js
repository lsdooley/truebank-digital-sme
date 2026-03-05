// Onboarding and team knowledge synthetic data

export const onboardingChunks = [

  {
    id: 'onboard_guide_001',
    appid: 'ALL',
    source: 'confluence_onboarding',
    source_label: 'Onboarding',
    record_id: 'ONBOARD-TRUVIEW-001',
    title: 'TruView Platform — New Engineer Onboarding Guide',
    text: `ONBOARDING GUIDE: TruView Platform
Document: /wiki/spaces/TRUVIEW/pages/New-Engineer-Onboarding
Last Updated: 2025-02-10
Owner: Platform Engineering

WELCOME TO TRUVIEW PLATFORM
The TruView Platform is TrueBank's primary digital banking channel, serving ~600,000 daily active sessions across Web and Mobile. This guide is for engineers joining any of the three TruView product teams: Core, Web, or Mobile.

TEAM STRUCTURE:
TruView Platform consists of four squads:

1. Platform Engineering (Core Infrastructure)
   Engineering Manager: David Nguyen (david.nguyen@truebank.com.au)
   Slack: #truview-platform-eng
   Responsibilities: TruView Core microservices, Kafka infrastructure, EKS clusters, shared database layers
   On-call: truview-core-oncall (PagerDuty)

2. Web Platform Team
   Engineering Manager: James Blackwood (j.blackwood@truebank.com.au)
   Slack: #truview-web-eng
   Responsibilities: TruView Web SPA, truview-web-bff, CloudFront CDN
   On-call: truview-web-oncall (PagerDuty)

3. Mobile Platform Team
   Engineering Manager: Thomas Vance (t.vance@truebank.com.au)
   Slack: #truview-mobile-eng
   Responsibilities: TruView Mobile (iOS + Android), truview-mobile-bff, push notifications
   On-call: truview-mobile-oncall (PagerDuty)

4. Platform SRE Team
   SRE Lead: Marcus Okonkwo (m.okonkwo@truebank.com.au)
   Secondary SRE: Priya Sharma (p.sharma@truebank.com.au)
   Slack: #truview-sre-oncall
   Responsibilities: Observability (Dynatrace), incident response, runbooks, SLO management

BUSINESS STAKEHOLDERS:
- Head of Platform (TruView): Sarah Kimberley (sarah.kimberley@truebank.com.au)
- Head of Digital: Rachel Torres (r.torres@truebank.com.au)
- Head of Mobile: Lena Okafor (l.okafor@truebank.com.au)

ACCESS REQUEST PROCESS:
New engineers must request access through the Internal Developer Portal (APPID-812345) → Access Requests:
1. AWS Console access: request role truview-dev-readonly (read-only for first 30 days)
2. EKS kubectl access: request kubeconfig via IDP → TruView → Environments → dev, staging, prod (prod requires SRE lead approval)
3. PagerDuty: request schedule assignment from SRE lead
4. GitLab: auto-provisioned on Active Directory onboarding; request TruView group access from EM
5. Dynatrace: request viewer access from SRE team (#truview-sre-oncall)
6. ServiceNow: auto-provisioned; request ITIL role from IT Service Management

DEVELOPMENT ENVIRONMENT SETUP:
Prerequisites: Docker Desktop, kubectl (1.29+), AWS CLI v2, Node.js 20+, Java 17
1. Clone truview-core: git clone git@gitlab.truebank.com.au:truview/truview-core.git
2. Configure kubectl: aws eks update-kubeconfig --name prod-eks-trueview-01 --region us-east-1 (requires kubeconfig access)
3. Run local stack: cd truview-core && docker-compose up (spins up Kafka, PostgreSQL, Redis locally)
4. Run tests: ./mvnw test (Java services), npm test (Node.js services)

FIRST-WEEK READING LIST:
- ADR-047: Kafka as event backbone (foundational — read first)
- ADR-052: BFF pattern for Web and Mobile
- ADR-061: Mule API Gateway mandate
- TruView Core Service Catalog (SVCCATALOG-TRUVIEW-CORE)
- TruView Incident Management Procedure (IM-PROC-014 in ServiceNow)
- SLO definitions and error budget policy (Confluence: /wiki/spaces/SRE/SLO-Policy)

INCIDENT RESPONSE:
- SEV1/SEV2: Page on-call SRE immediately. Bridge: #truview-incident-bridge (Slack auto-created)
- SEV3/SEV4: Create ServiceNow incident, assign to relevant team queue
- All incidents: post in #truview-incident-bridge; update ServiceNow within 15 minutes of opening
- War room: Zoom link auto-generated for all SEV1/SEV2 via PagerDuty`,
    tags: ['onboarding', 'team', 'contacts', 'access', 'setup', 'truview', 'escalation', 'incident', 'first-week'],
    classification: 'INTERNAL',
    freshness_ts: '2025-02-10T10:00:00Z',
    ingest_ts: '2025-03-04T00:00:00Z',
    ttl_hours: 168,
    meta: { doc_type: 'Onboarding Guide', owner: 'Platform Engineering' }
  },

  {
    id: 'onboard_escalation_001',
    appid: 'ALL',
    source: 'confluence_onboarding',
    source_label: 'Onboarding',
    record_id: 'ONBOARD-ESCALATION-002',
    title: 'TruView escalation matrix and on-call contacts',
    text: `ESCALATION MATRIX: TruView Platform
Document: /wiki/spaces/TRUVIEW/pages/Escalation-Matrix
Last Updated: 2025-02-28

INCIDENT ESCALATION BY APPLICATION:

TruView Core (APPID-973193) — Tier 1:
  L1 On-Call SRE: Marcus Okonkwo — PagerDuty truview-core-oncall — m.okonkwo@truebank.com.au — Mobile: +61 400 XXX 001
  L2 Secondary SRE: Priya Sharma — p.sharma@truebank.com.au — Mobile: +61 400 XXX 002
  L3 Engineering Manager: David Nguyen — d.nguyen@truebank.com.au — Mobile: +61 400 XXX 003
  L4 Head of Platform: Sarah Kimberley — s.kimberley@truebank.com.au
  Escalation trigger: L1 → L2 if no resolution in 30 min (SEV1) / 2 hours (SEV2)
  Executive escalation: L4 notified automatically for SEV1 by PagerDuty

TruView Web (APPID-871198) — Tier 1:
  L1 On-Call SRE: Platform SRE Team (shared rotation) — truview-web-oncall
  L2: James Blackwood (Web EM) — j.blackwood@truebank.com.au
  L3: Sarah Kimberley
  Same escalation timings as TruView Core

TruView Mobile (APPID-871204) — Tier 1:
  L1 On-Call: Platform SRE Team — truview-mobile-oncall
  L2: Thomas Vance (Mobile EM) — t.vance@truebank.com.au
  L3: Lena Okafor (Head of Mobile) — l.okafor@truebank.com.au
  L4: Sarah Kimberley

DATABASE ESCALATION (RDS, MSK):
  Primary: Platform Engineering on-call
  Secondary: AWS Managed Services (if MSK/RDS platform issue) — support case via AWS Console
  DBA team: db-support@truebank.com.au (business hours only; on-call coverage via Platform Engineering)

MAINFRAME / CORE BANKING ESCALATION:
  If legacy-dda-adapter errors indicate mainframe issues: escalate to Core Banking team
  Core Banking on-call: Refer to ServiceNow CMDB-APPID-100034 for current on-call contact
  IBM MQ issues: IBM Australia support (contract: IBM-2024-TRUEBANK-MQ)

VENDOR ESCALATION:
  AWS: Support case via Console (Business Support, <1 hour response for Sev1)
  Dynatrace: support.dynatrace.com (Enterprise Support, SLA 4h)
  Mule: MuleSoft support portal (Platinum Support)
  Apple APNs: developer.apple.com/support (no SLA — best effort)

CHANGE ADVISORY BOARD:
  Standard CAB: meets Tuesday and Thursday 10:00 EST
  Emergency CAB: Slack #cab-emergency; requires CTO approval
  CAB chair: IT Change Management — change.management@truebank.com.au`,
    tags: ['escalation', 'on-call', 'contacts', 'truview', 'incident', 'pagerduty', 'sre', 'team'],
    classification: 'INTERNAL',
    freshness_ts: '2025-02-28T10:00:00Z',
    ingest_ts: '2025-03-04T00:00:00Z',
    ttl_hours: 168,
    meta: { doc_type: 'Escalation Matrix', owner: 'Platform Engineering' }
  },

];
