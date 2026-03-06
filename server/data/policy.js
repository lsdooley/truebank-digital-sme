// TrueBank bank-wide policy records — appid: 'POLICY'
// These are NOT retrieved on normal queries.
// Only included when policy/compliance intent is detected in the query.

export const policyChunks = [

  {
    id: 'pol_001',
    appid: 'POLICY',
    source: 'policy',
    source_label: 'Policy',
    record_id: 'POL-PCI-DSS-001',
    title: 'TrueBank Policy — PCI-DSS compliance requirements for application teams',
    text: `BANK POLICY: PCI-DSS Compliance Requirements
Policy ID: POL-PCI-DSS-001
Owner: Information Security — Chief Information Security Officer
Effective: 2024-01-01 | Last Reviewed: 2025-01-15 | Next Review: 2026-01-15
Applies To: All applications handling payment card data or connected to the card data environment (CDE)

SCOPE:
TruView Core (APPID-973193), TruView Web (APPID-871198), and TruView Mobile (APPID-871204) are in-scope for PCI-DSS as they process and display payment account data. TrueBank Digital SME (APPID-7779311) is OUT OF SCOPE (no card data, no CDE connectivity).

KEY REQUIREMENTS FOR APPLICATION TEAMS:

1. DATA STORAGE (PCI-DSS Req 3):
   - Primary Account Numbers (PANs) must never be stored in application logs, databases, or caches in plaintext
   - Sensitive Authentication Data (CVV, PIN) must never be stored post-authorisation
   - PANs in storage must be masked (show only last 4 digits) or encrypted (AES-256)
   - TruView Core stores account identifiers only — not PANs. Card numbers held by Card Management System (APPID-334490)

2. TRANSMISSION SECURITY (PCI-DSS Req 4):
   - All cardholder data transmitted over public networks must use TLS 1.2 or higher
   - TLS 1.0 and 1.1 are prohibited — deprecated in TrueBank infrastructure as of 2023
   - Internal service-to-service communication: TLS required for all in-scope services

3. ACCESS CONTROL (PCI-DSS Req 7 & 8):
   - Least privilege: application service accounts must only have permissions required for their function
   - No shared credentials: service accounts are unique per application and rotated every 90 days
   - Multi-factor authentication required for all administrative access to CDE systems
   - Logs must capture all access to system components and cardholder data (Req 10)

4. VULNERABILITY MANAGEMENT (PCI-DSS Req 6):
   - High and critical vulnerabilities (CVSS ≥7.0) must be patched within 30 days of disclosure
   - Critical vulnerabilities (CVSS ≥9.0) must be patched within 7 days
   - Container images must be scanned before deployment (Trivy in CI/CD pipeline)
   - Penetration testing: annual external + internal pen test required for all in-scope applications

5. INCIDENT RESPONSE (PCI-DSS Req 12.10):
   - Suspected cardholder data breach must be reported to CISO within 1 hour of discovery
   - Payment card brands must be notified within 24 hours of confirmed breach
   - Incident response plan must be tested annually

AUDIT: TrueBank undergoes annual PCI-DSS QSA assessment. Last assessment: November 2024. Status: Compliant.`,
    tags: ['policy', 'pci-dss', 'compliance', 'security', 'payment', 'card-data', 'requirement', 'audit', 'tls', 'encryption'],
    classification: 'RESTRICTED',
    freshness_ts: '2025-01-15T10:00:00Z',
    ingest_ts: '2025-03-04T08:05:00Z',
    ttl_hours: 2160,
    meta: { policy_type: 'Compliance', standard: 'PCI-DSS v4.0', owner: 'Information Security' }
  },

  {
    id: 'pol_002',
    appid: 'POLICY',
    source: 'policy',
    source_label: 'Policy',
    record_id: 'POL-GDPR-001',
    title: 'TrueBank Policy — Privacy and GDPR data handling requirements',
    text: `BANK POLICY: Privacy and GDPR Data Handling
Policy ID: POL-GDPR-001
Owner: Privacy Office — Chief Privacy Officer
Effective: 2023-05-01 | Last Reviewed: 2025-02-01 | Next Review: 2026-02-01
Applies To: All applications processing personal data of individuals in the EU/EEA or subject to Australian Privacy Act

KEY REQUIREMENTS FOR APPLICATION TEAMS:

1. LAWFUL BASIS FOR PROCESSING:
   - Personal data must only be processed with a valid lawful basis (contract, legitimate interest, consent, legal obligation)
   - Application teams must document the lawful basis for each personal data processing activity in the data register
   - TruView Core processes account and transaction data under contract (banking services agreement)

2. DATA MINIMISATION:
   - Collect and retain only the personal data necessary for the stated purpose
   - API responses must not include unnecessary PII fields (e.g. full DOB not required for account summary display)
   - Logs must not contain PII unless explicitly required for audit — apply log masking for email, mobile number, account number

3. RETENTION AND DELETION:
   - Financial transaction records: 7 years (regulatory requirement — Australian Banking Act)
   - Behavioural analytics data: 24 months maximum
   - Application log data containing PII: 90 days maximum
   - On customer account closure: initiate data deletion workflow within 30 days (except legally required records)

4. DATA SUBJECT RIGHTS:
   - Right of access (data export): must be fulfilled within 30 days of request via Privacy Office portal
   - Right to erasure: fulfilled within 30 days, subject to legal retention obligations
   - Application teams must ensure data stores support targeted deletion by customer ID

5. DATA BREACH NOTIFICATION:
   - Personal data breach must be reported to Privacy Office within 1 hour of discovery
   - Regulatory notification (OAIC / relevant EU DPA) required within 72 hours if breach is likely to result in risk to individuals
   - Application team lead must be available during breach assessment window

6. CROSS-BORDER TRANSFERS:
   - Personal data must not be stored or processed outside Australia/approved regions without Privacy Office approval
   - AWS us-east-1 is approved for TruView data (covered by AWS Data Processing Agreement)
   - Third-party API providers (e.g. Anthropic for Digital SME) must have approved DPA in place`,
    tags: ['policy', 'gdpr', 'privacy', 'compliance', 'personal-data', 'pii', 'retention', 'data-breach', 'requirement', 'deletion'],
    classification: 'RESTRICTED',
    freshness_ts: '2025-02-01T10:00:00Z',
    ingest_ts: '2025-03-04T08:05:00Z',
    ttl_hours: 2160,
    meta: { policy_type: 'Compliance', standard: 'GDPR / Australian Privacy Act', owner: 'Privacy Office' }
  },

  {
    id: 'pol_003',
    appid: 'POLICY',
    source: 'policy',
    source_label: 'Policy',
    record_id: 'POL-DATA-RETENTION-001',
    title: 'TrueBank Policy — Data retention and classification standards',
    text: `BANK POLICY: Data Retention and Classification Standards
Policy ID: POL-DATA-RETENTION-001
Owner: Data Governance Office
Effective: 2024-03-01 | Last Reviewed: 2025-01-01 | Next Review: 2026-01-01

DATA CLASSIFICATION TIERS:
  RESTRICTED — Highest sensitivity. Regulatory or contractual confidentiality obligation.
    Examples: PAN, CVV, government ID, credit decisions, AML investigation records
    Access: Need-to-know, MFA required, no external transmission without encryption
  CONFIDENTIAL — Internal business sensitive.
    Examples: financial account data, personal banking details, employee records, system architecture
    Access: TrueBank employees with business need
  INTERNAL — General internal use.
    Examples: operational records, incident tickets, runbooks, system health data
    Access: All TrueBank staff
  PUBLIC — Approved for external distribution.
    Examples: product brochures, public API documentation

RETENTION SCHEDULE:
  Financial transaction records: 7 years (Banking Act 1959 — mandatory)
  Account opening/KYC records: 7 years post account closure
  Audit logs (security events): 5 years
  Application operational logs (non-PII): 1 year
  Application operational logs (containing PII): 90 days
  Incident and change records (ServiceNow): 3 years
  Dynatrace monitoring data: 35 days (Dynatrace SaaS retention)
  Kafka topic data: 7 days (default) / 30 days (audit topics)
  Backup data (RDS automated backups): 35 days

DELETION PROCESS:
  All deletion of RESTRICTED or CONFIDENTIAL data requires Data Governance Office sign-off.
  Application teams must log deletion events to the data audit trail.
  Deletion of records subject to legal hold is prohibited — Legal team manages holds in ServiceNow.

DATA RESIDENCY:
  All RESTRICTED and CONFIDENTIAL data must remain in Australia (AWS ap-southeast-2 preferred) or approved regions.
  Exception: AWS us-east-1 is approved for TruView compute where no customer PII is stored at rest.`,
    tags: ['policy', 'data-retention', 'classification', 'compliance', 'restricted', 'confidential', 'gdpr', 'deletion', 'requirement'],
    classification: 'INTERNAL',
    freshness_ts: '2025-01-01T10:00:00Z',
    ingest_ts: '2025-03-04T08:05:00Z',
    ttl_hours: 2160,
    meta: { policy_type: 'Data Governance', owner: 'Data Governance Office' }
  },

  {
    id: 'pol_004',
    appid: 'POLICY',
    source: 'policy',
    source_label: 'Policy',
    record_id: 'POL-INCIDENT-MGMT-001',
    title: 'TrueBank Policy — Incident management and severity classification',
    text: `BANK POLICY: Incident Management and Severity Classification
Policy ID: POL-INCIDENT-MGMT-001 (also: IM-POL-004)
Owner: IT Service Management
Effective: 2023-01-01 | Last Reviewed: 2025-01-15

SEVERITY DEFINITIONS:
  SEV1 — Critical Business Impact
    Definition: Complete loss of service for a Tier 1 application, or significant financial/reputational risk
    Examples: TruView Core completely unavailable, customer data breach, payment processing down
    Response: Immediate page to on-call SRE + Engineering Manager + Head of Platform
    Resolution target: 4 hours (RTO for Tier 1 applications)
    Executive notification: Automatic (CTO + CEO for extended SEV1)

  SEV2 — Major Business Impact
    Definition: Significant degradation of a Tier 1 service affecting >10% of users or a core function
    Examples: Kafka consumer lag >30 minutes, mobile push delivery failure >10%, BFF error rate >5%
    Response: Page on-call SRE; Engineering Manager notified
    Resolution target: 8 hours
    Escalation: To SEV1 if not contained within 2 hours

  SEV3 — Moderate Impact
    Definition: Partial degradation, workaround available, <10% user impact
    Examples: Intermittent 504 errors (3%), non-critical feature unavailable
    Response: ServiceNow ticket, assigned to relevant team queue; no 24/7 page
    Resolution target: 3 business days

  SEV4 — Minor / Informational
    Definition: Low user impact, cosmetic issues, internal tooling
    Response: ServiceNow ticket, normal queue
    Resolution target: 10 business days

INCIDENT LIFECYCLE:
  New → In Progress → Monitoring → Resolved → Post-Incident Review (PIR)
  PIR required for: all SEV1, all SEV2 with >2h resolution, any SEV3 recurring >3 times in 30 days
  PIR SLA: completed within 5 business days of resolution

RTO BREACH ESCALATION:
  If RTO exceeded for Tier 1 app (4 hours): automatic escalation to CTO
  TrueBank Incident Management Procedure: IM-PROC-014 (ServiceNow Knowledge Base)`,
    tags: ['policy', 'incident-management', 'severity', 'sev1', 'sev2', 'sev3', 'rto', 'escalation', 'pir', 'requirement'],
    classification: 'INTERNAL',
    freshness_ts: '2025-01-15T10:00:00Z',
    ingest_ts: '2025-03-04T08:05:00Z',
    ttl_hours: 2160,
    meta: { policy_type: 'ITSM', owner: 'IT Service Management' }
  },

  {
    id: 'pol_005',
    appid: 'POLICY',
    source: 'policy',
    source_label: 'Policy',
    record_id: 'POL-CHANGE-MGMT-001',
    title: 'TrueBank Policy — Change management and CAB requirements',
    text: `BANK POLICY: Change Management
Policy ID: POL-CHANGE-MGMT-001
Owner: IT Change Management
Effective: 2022-06-01 | Last Reviewed: 2025-01-01

CHANGE TYPES:
  Standard Change — Pre-approved, low-risk, repeatable procedure
    Approval: Pre-approved via Change Template (no individual CAB approval required)
    Examples: Container memory limit adjustments, certificate renewals, library patch upgrades
    Lead time: Can be deployed in next scheduled maintenance window
    Templates managed in ServiceNow Change Template Library

  Normal Change — Requires individual CAB approval
    Approval: Change Advisory Board (CAB) — meets Tuesday and Thursday 10:00 EST
    Lead time: Minimum 5 business days before CAB meeting submission
    Risk levels: Low, Medium, High — risk assessment required
    Examples: New service deployments, major version upgrades, infrastructure changes

  Emergency Change — Urgent, post-incident or critical fix
    Approval: Emergency CAB (eCАB) — Slack #cab-emergency; requires CTO approval
    Lead time: None — can be deployed within hours of approval
    Must be used sparingly — abuse tracked and reviewed by Change Management

  Routine Change — Scheduled infrastructure maintenance
    Approval: Auto-approved within defined maintenance windows
    Maintenance windows: Tuesday 05:00–07:00 AEDT, Saturday 02:00–06:00 AEDT

TIER 1 APPLICATION CHANGE REQUIREMENTS:
  All production changes to Tier 1 applications (TruView Core, Web, Mobile) require:
  - Impact assessment including blast radius analysis
  - Rollback procedure documented and tested
  - Post-implementation review (PIR) for Medium/High risk changes
  - Communication to business stakeholders for changes affecting customer-facing features

PROHIBITED CHANGES:
  No changes to Tier 1 production systems during:
  - Business day peak hours: 09:00–11:00 EST and 14:00–16:00 EST
  - Month-end processing window: last business day 16:00 – first business day 10:00
  - Announced major events (AFL Grand Final, etc.) — published in change freeze calendar`,
    tags: ['policy', 'change-management', 'cab', 'standard-change', 'normal-change', 'emergency-change', 'requirement', 'tier1', 'approval'],
    classification: 'INTERNAL',
    freshness_ts: '2025-01-01T10:00:00Z',
    ingest_ts: '2025-03-04T08:05:00Z',
    ttl_hours: 2160,
    meta: { policy_type: 'ITSM', owner: 'IT Change Management' }
  },

  {
    id: 'pol_006',
    appid: 'POLICY',
    source: 'policy',
    source_label: 'Policy',
    record_id: 'POL-ACCESS-CONTROL-001',
    title: 'TrueBank Policy — Access control and least privilege standards',
    text: `BANK POLICY: Access Control and Least Privilege
Policy ID: POL-ACCESS-CONTROL-001
Owner: Information Security
Effective: 2024-01-01 | Last Reviewed: 2025-01-15

CORE PRINCIPLES:
  1. Least Privilege: All accounts (human and service) must have only the minimum permissions required for their function
  2. Separation of Duties: No single person can both initiate and approve a high-risk action (e.g. production deployment)
  3. Need to Know: Access to RESTRICTED and CONFIDENTIAL data requires demonstrated business need

IAM STANDARDS (AWS):
  No IAM users with long-lived credentials for production access — use IAM roles with assumed session credentials
  Service accounts (Lambda execution roles, CI/CD deploy roles): scoped to specific resources and actions
  Wildcard resource ARNs (e.g. "*") are prohibited in production IAM policies without Security exception approval
  IAM roles reviewed quarterly — unused roles removed within 30 days of review
  TrueBank deploy IAM user (cluade-deploy): approved for POC/development use only — not for Tier 1 production

PRODUCTION ACCESS:
  Production console access: requires MFA + approval from Engineering Manager
  Production kubectl access: requires SRE lead approval; sessions logged to CloudTrail
  Production database access: no direct access — all queries via application layer or approved DBA tooling
  Break-glass accounts: available for emergencies; usage logged and reviewed within 24 hours

CREDENTIAL MANAGEMENT:
  API keys and secrets: stored in AWS SSM Parameter Store (SecureString) or Secrets Manager — never in code or environment variables committed to git
  Secret rotation: 90-day mandatory rotation for all API keys
  Shared credentials: prohibited — each service has its own credential set

AI/ML TOOLS:
  Third-party AI API keys (e.g. Anthropic): approved for internal tooling (Tier 3 non-production data only)
  No PII or RESTRICTED data may be sent to external AI APIs without Data Governance and Privacy Office approval
  AI tool usage must be documented in the AI Tool Register (maintained by Digital team)`,
    tags: ['policy', 'access-control', 'least-privilege', 'iam', 'aws', 'credentials', 'security', 'mfa', 'requirement', 'secrets'],
    classification: 'INTERNAL',
    freshness_ts: '2025-01-15T10:00:00Z',
    ingest_ts: '2025-03-04T08:05:00Z',
    ttl_hours: 2160,
    meta: { policy_type: 'Security', owner: 'Information Security' }
  },

  {
    id: 'pol_007',
    appid: 'POLICY',
    source: 'policy',
    source_label: 'Policy',
    record_id: 'POL-VULNERABILITY-MGMT-001',
    title: 'TrueBank Policy — Vulnerability management and patching standards',
    text: `BANK POLICY: Vulnerability Management and Patching
Policy ID: POL-VULNERABILITY-MGMT-001
Owner: Information Security
Effective: 2024-01-01 | Last Reviewed: 2025-01-15

PATCHING SLAs BY CVSS SCORE:
  Critical (CVSS 9.0–10.0): Patch within 7 calendar days of vendor disclosure or public PoC availability
  High (CVSS 7.0–8.9):      Patch within 30 calendar days
  Medium (CVSS 4.0–6.9):    Patch within 90 calendar days
  Low (CVSS 0.1–3.9):       Patch within 180 calendar days or at next scheduled maintenance

SCOPE:
  All production applications, operating systems, container base images, and third-party libraries.
  Scanning tools: Trivy (container images — integrated in CI/CD pipeline), AWS Inspector (EC2/Lambda), Snyk (code dependencies).

PROCESS:
  1. Vulnerability identified via scan or CVE advisory
  2. Security team assesses CVSS and applicability — raises ServiceNow security vulnerability ticket
  3. Application team triages: confirm exploitability in TrueBank context, classify as Accept/Remediate/Transfer
  4. Remediation: patch deployed as Emergency Change (Critical) or Normal Change (High/Medium)
  5. Re-scan to confirm fix; close ServiceNow ticket
  6. Accepted vulnerabilities: require CISO sign-off and documented compensating controls

CI/CD INTEGRATION:
  Trivy scan is a required stage in all application pipelines. Critical findings MUST block deployment.
  Medium findings: flagged and logged; deployment proceeds with accepted findings recorded.
  Teams must not skip security scan stage — pipeline bypass requires Security exception.

THIRD-PARTY LIBRARY UPGRADES:
  Library upgrades addressing a known CVE are treated as Standard Changes (pre-approved template)
  Teams are expected to monitor GitHub Advisory Database and vendor security bulletins for their dependency stack`,
    tags: ['policy', 'vulnerability-management', 'patching', 'cvss', 'cve', 'security', 'trivy', 'sla', 'requirement', 'compliance'],
    classification: 'INTERNAL',
    freshness_ts: '2025-01-15T10:00:00Z',
    ingest_ts: '2025-03-04T08:05:00Z',
    ttl_hours: 2160,
    meta: { policy_type: 'Security', owner: 'Information Security' }
  },

];
