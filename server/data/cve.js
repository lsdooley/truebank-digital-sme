// CVE / vulnerability records — appid: 'CVE'
// These are NOT retrieved on normal queries.
// Only included when security/vulnerability intent is detected in the query.
// Records cover libraries used across TruView platform applications.

export const cveChunks = [

  {
    id: 'cve_001',
    appid: 'CVE',
    source: 'cve',
    source_label: 'CVE/Security',
    record_id: 'CVE-2024-39338',
    title: 'CVE-2024-39338 — axios SSRF via redirect following (HIGH, CVSS 8.6) — affects TruView BFF services',
    text: `CVE RECORD: CVE-2024-39338
Severity: HIGH | CVSS: 8.6
Library: axios <1.7.4
Vulnerability Type: Server-Side Request Forgery (SSRF) via automatic redirect following
Published: 2024-08-12
Status in TrueBank: REMEDIATED

DESCRIPTION:
axios versions prior to 1.7.4 follow HTTP redirects without validating the destination URL. An attacker who can influence the target URL of an axios request (e.g. via a user-controlled parameter passed to an axios.get() call) may redirect requests to internal network resources (SSRF). In a BFF context, this could expose internal Kubernetes service endpoints, instance metadata, or internal API Gateway routes.

AFFECTED TRUBANK COMPONENTS:
- truview-web-bff (APPID-871198): axios 1.6.2 → upgraded to 1.7.4 (CHG0103744, deployed 2025-02-10)
- truview-mobile-bff (APPID-871204): axios 1.6.5 → upgraded to 1.7.4 (CHG0103745, deployed 2025-02-10)
- truebank-sme-api (APPID-7779311): axios not used (uses node-fetch) — NOT AFFECTED

REMEDIATION:
Upgrade axios to ≥1.7.4. Both BFF services patched via Standard Change (pre-approved template for security patches). Deployed during Tuesday maintenance window 2025-02-10.

CVSS VECTOR: CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:N/A:N
CISA KEV: Not listed.
Internal ticket: SRVULN-2024-1892 (ServiceNow Security Vulnerability)`,
    tags: ['cve', 'cve-2024-39338', 'axios', 'ssrf', 'high', 'bff', 'truview-web', 'truview-mobile', 'vulnerability', 'security', 'remediated'],
    classification: 'INTERNAL',
    freshness_ts: '2025-02-10T10:00:00Z',
    ingest_ts: '2025-03-04T08:05:00Z',
    ttl_hours: 2160,
    meta: { cvss: 8.6, severity: 'HIGH', status: 'REMEDIATED', library: 'axios', affected_apps: ['APPID-871198', 'APPID-871204'] }
  },

  {
    id: 'cve_002',
    appid: 'CVE',
    source: 'cve',
    source_label: 'CVE/Security',
    record_id: 'CVE-2024-4067',
    title: 'CVE-2024-4067 — micromatch ReDoS (MEDIUM, CVSS 5.3) — Node.js toolchain dependency',
    text: `CVE RECORD: CVE-2024-4067
Severity: MEDIUM | CVSS: 5.3
Library: micromatch <4.0.8
Vulnerability Type: Regular Expression Denial of Service (ReDoS)
Published: 2024-05-14
Status in TrueBank: REMEDIATED

DESCRIPTION:
micromatch versions before 4.0.8 are vulnerable to ReDoS via crafted glob patterns passed to micromatch() functions. An attacker providing malicious input to a glob pattern evaluation could cause excessive CPU consumption. In practice, micromatch is typically used in build tooling rather than request-handling code, limiting runtime exploitability.

AFFECTED TRUBANK COMPONENTS:
- Build tooling (Vite, rollup, fast-glob) across all Node.js applications — micromatch is a transitive dependency
- Not present in Lambda runtime bundles (dev dependency only after tree-shaking)
- Applications: truview-web-bff, truebank-sme-api frontend build toolchain

EXPLOITABILITY ASSESSMENT:
Low runtime risk — micromatch is not invoked on user-supplied input in TrueBank application code. Risk is limited to build-time toolchain. Patching still required to meet POL-VULNERABILITY-MGMT-001 Medium SLA (90 days).

REMEDIATION:
npm audit fix applied across all Node.js projects during scheduled dependency update cycle.
Resolved by upgrading micromatch to 4.0.8 via transitive dependency resolution.
Deployment: 2025-01-28. Internal ticket: SRVULN-2025-0234.`,
    tags: ['cve', 'cve-2024-4067', 'micromatch', 'redos', 'medium', 'nodejs', 'build-toolchain', 'vulnerability', 'security', 'remediated'],
    classification: 'INTERNAL',
    freshness_ts: '2025-01-28T10:00:00Z',
    ingest_ts: '2025-03-04T08:05:00Z',
    ttl_hours: 2160,
    meta: { cvss: 5.3, severity: 'MEDIUM', status: 'REMEDIATED', library: 'micromatch' }
  },

  {
    id: 'cve_003',
    appid: 'CVE',
    source: 'cve',
    source_label: 'CVE/Security',
    record_id: 'CVE-2024-45296',
    title: 'CVE-2024-45296 — path-to-regexp ReDoS (HIGH, CVSS 7.5) — affects Express routing',
    text: `CVE RECORD: CVE-2024-45296
Severity: HIGH | CVSS: 7.5
Library: path-to-regexp <0.1.10, <6.3.0 (also >=8.0.0 <8.0.0)
Vulnerability Type: Regular Expression Denial of Service (ReDoS)
Published: 2024-09-09
Status in TrueBank: REMEDIATED

DESCRIPTION:
path-to-regexp (used by Express.js for route matching) is vulnerable to ReDoS when processing routes with certain patterns. An attacker sending crafted HTTP requests with malicious URL paths to an Express.js server could cause the route matching to hang, consuming CPU and rendering the server unresponsive.

AFFECTED TRUBANK COMPONENTS:
- truview-web-bff (APPID-871198): Express 4.18.2 with path-to-regexp 0.1.7 → VULNERABLE
- truview-mobile-bff (APPID-871204): Express 4.18.2 with path-to-regexp 0.1.7 → VULNERABLE
- truebank-sme-api (APPID-7779311): Express 4.18.2 → VULNERABLE (server/app.js)

REMEDIATION STATUS:
Upgrade to Express 4.21.1+ (which includes path-to-regexp 0.1.10) OR upgrade path-to-regexp directly.
Status: IN PROGRESS — Change record CHG0105100 approved, deployment scheduled for 2025-03-06 maintenance window.

INTERIM MITIGATIONS:
- API Gateway throttling limits request rate (1,000 RPS burst) — reduces DoS amplification risk
- CloudFront WAF rules (for Web and SME) provide basic request pattern filtering
- No public exploit code confirmed in the wild targeting financial services as of 2025-03-04

CVSS VECTOR: CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H
Internal ticket: SRVULN-2024-2891`,
    tags: ['cve', 'cve-2024-45296', 'path-to-regexp', 'express', 'redos', 'high', 'nodejs', 'vulnerability', 'security', 'in-progress'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-04T08:00:00Z',
    ingest_ts: '2025-03-04T08:05:00Z',
    ttl_hours: 720,
    meta: { cvss: 7.5, severity: 'HIGH', status: 'IN PROGRESS', library: 'path-to-regexp', affected_apps: ['APPID-871198', 'APPID-871204', 'APPID-7779311'] }
  },

  {
    id: 'cve_004',
    appid: 'CVE',
    source: 'cve',
    source_label: 'CVE/Security',
    record_id: 'CVE-2024-21536',
    title: 'CVE-2024-21536 — http-proxy-middleware DoS (HIGH, CVSS 7.5) — TruView BFF proxy layer',
    text: `CVE RECORD: CVE-2024-21536
Severity: HIGH | CVSS: 7.5
Library: http-proxy-middleware <2.0.7, <3.0.3
Vulnerability Type: Denial of Service via unhandled exception
Published: 2024-10-19
Status in TrueBank: REMEDIATED

DESCRIPTION:
http-proxy-middleware versions before 2.0.7 and 3.0.3 are vulnerable to DoS. When the proxy target is unreachable and the error event is not properly handled, an unhandled exception can crash the Node.js process. In a BFF service without proper process management (e.g. PM2 restart), this could take down the BFF instance.

AFFECTED TRUBANK COMPONENTS:
- truview-web-bff (APPID-871198): http-proxy-middleware 2.0.4 → VULNERABLE (used for upstream API proxying)
- truview-mobile-bff (APPID-871204): http-proxy-middleware 2.0.4 → VULNERABLE

REMEDIATION:
Upgraded to http-proxy-middleware 2.0.7 via CHG0104200 (Standard Change). Deployed 2025-02-20.
Both BFF services now on patched version. EKS pod restart policy (Always) and Kubernetes liveness probes provide additional resilience even in pre-patch state.

NOTE: Vite dev server also uses http-proxy-middleware for local /api proxy in truebank-sme frontend — upgraded as part of npm dependency update. Dev-only — no production risk for SME.

Internal ticket: SRVULN-2024-2344`,
    tags: ['cve', 'cve-2024-21536', 'http-proxy-middleware', 'dos', 'high', 'bff', 'nodejs', 'truview-web', 'truview-mobile', 'vulnerability', 'security', 'remediated'],
    classification: 'INTERNAL',
    freshness_ts: '2025-02-20T10:00:00Z',
    ingest_ts: '2025-03-04T08:05:00Z',
    ttl_hours: 2160,
    meta: { cvss: 7.5, severity: 'HIGH', status: 'REMEDIATED', library: 'http-proxy-middleware', affected_apps: ['APPID-871198', 'APPID-871204'] }
  },

  {
    id: 'cve_005',
    appid: 'CVE',
    source: 'cve',
    source_label: 'CVE/Security',
    record_id: 'CVE-2024-55565',
    title: 'CVE-2024-55565 — nanoid predictable ID generation (MEDIUM, CVSS 5.3) — session ID entropy risk',
    text: `CVE RECORD: CVE-2024-55565
Severity: MEDIUM | CVSS: 5.3
Library: nanoid <3.3.8
Vulnerability Type: Predictable ID generation (insufficient entropy in certain environments)
Published: 2024-12-17
Status in TrueBank: UNDER ASSESSMENT

DESCRIPTION:
nanoid versions before 3.3.8 may generate predictable IDs in environments where Math.random() is used as the entropy source (e.g. certain React Server-Side Rendering contexts). This could theoretically allow an attacker to predict session or token IDs generated by nanoid.

AFFECTED TRUBANK COMPONENTS:
- nanoid is a transitive dependency of Vite and React in frontend builds
- In TrueBank's deployment: nanoid is used in build tooling only — NOT used to generate session IDs, tokens, or security-sensitive values at runtime
- Session IDs: generated by auth-adapter using Node.js crypto.randomUUID() — NOT affected

EXPLOITABILITY ASSESSMENT:
No direct exploitability identified in TrueBank context. nanoid is not used in runtime session or security token generation. Patching still required per POL-VULNERABILITY-MGMT-001 Medium SLA (90 days from 2024-12-17 = 2025-03-17).

REMEDIATION:
npm audit fix will resolve via transitive dependency upgrade. Scheduled for next dependency update cycle (2025-03-10 maintenance window). On track to meet SLA.
Internal ticket: SRVULN-2025-0412`,
    tags: ['cve', 'cve-2024-55565', 'nanoid', 'medium', 'entropy', 'session', 'nodejs', 'vulnerability', 'security', 'under-assessment'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-04T08:00:00Z',
    ingest_ts: '2025-03-04T08:05:00Z',
    ttl_hours: 720,
    meta: { cvss: 5.3, severity: 'MEDIUM', status: 'UNDER ASSESSMENT', library: 'nanoid', sla_deadline: '2025-03-17' }
  },

  {
    id: 'cve_006',
    appid: 'CVE',
    source: 'cve',
    source_label: 'CVE/Security',
    record_id: 'CVE-2024-29415',
    title: 'CVE-2024-29415 — ip package SSRF bypass (HIGH, CVSS 8.1) — internal network exposure risk',
    text: `CVE RECORD: CVE-2024-29415
Severity: HIGH | CVSS: 8.1
Library: ip <=2.0.1
Vulnerability Type: SSRF filter bypass — private IP range misclassification
Published: 2024-05-27
Status in TrueBank: REMEDIATED

DESCRIPTION:
The ip npm package misclassifies some IPv6-mapped IPv4 addresses as public (non-private). Applications using ip.isPrivate() to validate or block SSRF requests could be bypassed. An attacker controlling a URL parameter could bypass SSRF protections and access internal services (e.g. EC2 instance metadata at 169.254.169.254).

AFFECTED TRUBANK COMPONENTS:
- ip is a transitive dependency in several Node.js services via node-forge and mocha
- Direct SSRF filter usage of ip.isPrivate() not detected in TrueBank application code (confirmed via code scan)
- Risk: LOW in current context — ip not used as a security control in TrueBank code

REMEDIATION:
Removed direct ip dependency where present; transitive dependency pinned to >=2.0.1 via npm overrides.
Applied across all Node.js services in maintenance window 2025-01-15. Internal ticket: SRVULN-2024-1455.`,
    tags: ['cve', 'cve-2024-29415', 'ip', 'ssrf', 'high', 'nodejs', 'vulnerability', 'security', 'remediated', 'network'],
    classification: 'INTERNAL',
    freshness_ts: '2025-01-15T10:00:00Z',
    ingest_ts: '2025-03-04T08:05:00Z',
    ttl_hours: 2160,
    meta: { cvss: 8.1, severity: 'HIGH', status: 'REMEDIATED', library: 'ip' }
  },

];
