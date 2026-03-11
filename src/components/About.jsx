import { useNavigate } from 'react-router-dom';

// ── Colour constants ──────────────────────────────────────────────────────────
const TEAL   = '#0D9488';
const AMBER  = '#D97706';
const GREEN  = '#16A34A';
const PURPLE = '#7C3AED';
const BLUE   = '#2563EB';

const ACCENT_BG = {
  [TEAL]:   'rgba(13,148,136,0.10)',
  [PURPLE]: 'rgba(124,58,237,0.10)',
  [BLUE]:   'rgba(37,99,235,0.10)',
  [AMBER]:  'rgba(217,119,6,0.10)',
  [GREEN]:  'rgba(22,163,74,0.10)',
};

function Arrow() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px 0' }}>
      <div style={{ width: 2, height: 18, background: TEAL, opacity: 0.7 }} />
      <div style={{
        width: 0, height: 0,
        borderLeft: '6px solid transparent',
        borderRight: '6px solid transparent',
        borderTop: `8px solid ${TEAL}`,
        opacity: 0.7,
      }} />
    </div>
  );
}

function FlowBox({ icon, title, detail, accent = TEAL }) {
  return (
    <div style={{
      border: `1px solid ${accent}`,
      borderRadius: 8,
      padding: '12px 16px',
      background: ACCENT_BG[accent] || ACCENT_BG[TEAL],
      width: '100%',
      boxSizing: 'border-box',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: detail ? 6 : 0 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</span>
      </div>
      {detail && (
        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>{detail}</p>
      )}
    </div>
  );
}

// ── Process Flow Diagram ─────────────────────────────────────────────────────

function ProcessFlow() {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '28px 32px',
    }}>

      <FlowBox
        icon="👤"
        title="Engineer Query"
        detail="Natural-language question scoped to an application (TruView Core, Web, Mobile, or All TruView)."
      />

      <Arrow />

      <FlowBox
        icon="🔍"
        title="Intent Detection"
        detail="Query is tokenised and stemmed. Keyword sets determine which retrieval pools are activated alongside the always-on app-scoped pool."
      />

      <Arrow />

      {/* Retrieval Pools — grouped with dashed border */}
      <div style={{
        border: '1px dashed rgba(13,148,136,0.4)',
        borderRadius: 8,
        padding: '20px 12px 12px',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: -9, left: 14,
          background: 'var(--bg-card)',
          padding: '0 6px',
          fontSize: 10,
          fontFamily: 'JetBrains Mono, monospace',
          color: 'var(--text-muted)',
          letterSpacing: '0.08em',
        }}>
          RETRIEVAL POOLS
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <FlowBox
            icon="📱"
            title="App-Scoped Pool"
            detail="Incidents · Changes · Docs · CMDB · Architecture · Onboarding — always active"
            accent={TEAL}
          />
          <FlowBox
            icon="🔐"
            title="CVE Pool"
            detail="Security advisories · Vulnerability records — cveIntent queries only"
            accent={PURPLE}
          />
          <FlowBox
            icon="📋"
            title="Policy Pool"
            detail="Compliance · Governance · Regulatory — policyIntent queries only"
            accent={BLUE}
          />
        </div>
      </div>

      <Arrow />

      <FlowBox
        icon="⚡"
        title="Retrieval Engine — Score & Rank"
        detail="Chunks scored: title match +3 · tag match +2 · body match +1 · phrase match +5 · scope boost +2 · recency boost +1.5 · severity boost +2. Top-k chunks selected per pool."
      />

      <Arrow />

      <FlowBox
        icon="📝"
        title="Prompt Assembly"
        detail="Top-k chunks formatted with record ID, source label, freshness, and full text. Combined with the system prompt and user query into the final LLM message."
      />

      <Arrow />

      <FlowBox
        icon="🤖"
        title="Claude Haiku 4.5  ·  Anthropic API"
        detail="Streams a grounded response using only the provided context records. Embeds [SOURCE: record_id] citation markers inline — never uses general knowledge."
        accent={AMBER}
      />

      <Arrow />

      <FlowBox
        icon="🔗"
        title="Citation Extraction"
        detail="[SOURCE: id] markers parsed from the raw response. Cited record IDs matched back to retrieved chunks. Markers stripped from the visible response text."
      />

      <Arrow />

      {/* Final outputs side by side */}
      <div style={{ display: 'flex', gap: 10 }}>
        <FlowBox
          icon="💬"
          title="Streamed Response"
          detail="Grounded answer delivered token-by-token to the chat UI via Server-Sent Events."
          accent={GREEN}
        />
        <FlowBox
          icon="📌"
          title="Context Panel"
          detail="Cited source records surfaced, grouped by source system with freshness indicators."
          accent={GREEN}
        />
      </div>

    </div>
  );
}

// ── Changelog ─────────────────────────────────────────────────────────────────
// To add a new release: prepend an entry to CHANGELOG below.
// type options: 'feat' | 'fix' | 'perf' | 'docs' | 'chore'

const TYPE_STYLE = {
  feat:  { color: '#0D9488', background: 'rgba(13,148,136,0.12)' },
  fix:   { color: '#DC2626', background: 'rgba(220,38,38,0.12)'  },
  perf:  { color: '#D97706', background: 'rgba(217,119,6,0.12)'  },
  docs:  { color: '#2563EB', background: 'rgba(37,99,235,0.12)'  },
  chore: { color: '#64748B', background: 'rgba(100,116,139,0.12)'},
};

const CHANGELOG = [
  {
    version: 'v2.2',
    date: '2026-03-11',
    current: true,
    changes: [
      { type: 'fix',   text: 'Degraded banner "View in SME" button now navigates to the first SME-enabled degraded app dynamically instead of hardcoding TruView Core.' },
      { type: 'fix',   text: 'Added typeof guard on __BUILD_TIME__ in Sidebar footer to prevent ReferenceError if Vite define is missing.' },
      { type: 'chore', text: 'Removed unused onOpen prop from AppCard component.' },
    ],
  },
  {
    version: 'v2.1',
    date: '2026-03-07',
    current: false,
    changes: [
      { type: 'feat',  text: 'Added About This Application page with app description, RAG process flow diagram, architecture diagram, knowledge sources, and tech stack.' },
      { type: 'feat',  text: 'Added interactive process flow diagram rendered in HTML/CSS matching app theme.' },
      { type: 'feat',  text: 'Added architecture diagram generated via Python Diagrams + Graphviz.' },
      { type: 'feat',  text: 'Added Change Log section to About page with typed, versioned entries.' },
      { type: 'chore', text: 'Cleaned up GitHub — removed hello-world-app and hello-world-frontend repos and associated AWS resources.' },
    ],
  },
  {
    version: 'v2.0',
    date: '2026-03-06',
    current: false,
    changes: [
      { type: 'feat',  text: 'Expanded knowledge base from 42 to 80 chunks across all 7 source systems (ServiceNow, Confluence, Dynatrace, CI/CD, AWS/CMDB, Architecture/ADR, Onboarding).' },
      { type: 'feat',  text: 'Added streaming responses via Server-Sent Events (SSE) for token-by-token output.' },
      { type: 'feat',  text: 'Added easter egg: robot animation triggered at token usage milestones.' },
      { type: 'fix',   text: 'Stripped [SOURCE:] citation markers server-side before sending response to client.' },
      { type: 'fix',   text: 'Fixed response rendering: markdown header sizing, spacing, and table support.' },
      { type: 'feat',  text: 'Added responsive mobile layout for chat view.' },
      { type: 'perf',  text: 'Cleaned up AI system prompt to reduce input token usage.' },
    ],
  },
  {
    version: 'v1.1',
    date: '2026-03-05',
    current: false,
    changes: [
      { type: 'feat',  text: 'Added serverless AWS deployment: Lambda + API Gateway + S3 + CloudFront.' },
      { type: 'feat',  text: 'Added session token counter and per-exchange usage stats in sidebar.' },
      { type: 'fix',   text: 'Polished UI: markdown header rendering, removed redundant source labels.' },
      { type: 'feat',  text: 'Added consolidated sources footer to assistant responses.' },
    ],
  },
  {
    version: 'v1.0',
    date: '2026-03-04',
    current: false,
    changes: [
      { type: 'feat',  text: 'Initial build: TrueBank Digital SME Platform.' },
      { type: 'feat',  text: 'RAG pipeline with intent detection, multi-pool retrieval, and chunk scoring.' },
      { type: 'feat',  text: 'Knowledge base: 42 chunks across ServiceNow, Confluence, Dynatrace, CI/CD, AWS/CMDB, Architecture/ADR, Onboarding.' },
      { type: 'feat',  text: 'Chat interface with app-scope selector, quick queries, and context panel.' },
      { type: 'feat',  text: 'Dashboard with application portfolio and source freshness indicators.' },
      { type: 'feat',  text: 'Claude Haiku 4.5 integration via Anthropic SDK.' },
    ],
  },
];

const SOURCES = [
  { icon: '🔶', label: 'ServiceNow',       desc: 'Active incidents, change records, problem tickets' },
  { icon: '📘', label: 'Confluence',        desc: 'Runbooks, architecture docs, team wikis' },
  { icon: '🔵', label: 'Dynatrace',         desc: 'APM alerts, SLO breaches, anomaly detection' },
  { icon: '🚀', label: 'CI/CD',             desc: 'Deployment history, pipeline runs, release notes' },
  { icon: '🟠', label: 'AWS / CMDB',        desc: 'Infrastructure inventory, service dependencies' },
  { icon: '🔷', label: 'Architecture / ADR',desc: 'Architecture decision records, system diagrams' },
  { icon: '🟢', label: 'Onboarding',        desc: 'Team contacts, escalation paths, on-call guides' },
  { icon: '🔐', label: 'CVE / Policy',      desc: 'Security advisories, compliance policies' },
];


export default function About() {
  const navigate = useNavigate();

  return (
    <div style={{ height: '100vh', overflowY: 'auto', background: 'var(--bg-primary)' }}>

      {/* Top nav */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        padding: '0 28px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        height: 52,
        flexShrink: 0,
      }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: 13, padding: 0,
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          ← Dashboard
        </button>
        <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
        <div>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>TrueBank</span>
          <span style={{ fontSize: 11, color: 'var(--accent-teal)', letterSpacing: '0.06em', fontFamily: 'JetBrains Mono, monospace', marginLeft: 8 }}>DIGITAL SME</span>
        </div>
        <span style={{
          fontSize: 10, fontFamily: 'JetBrains Mono, monospace',
          color: 'var(--accent-amber)', background: 'rgba(217,119,6,0.12)',
          border: '1px solid rgba(217,119,6,0.3)', padding: '2px 8px', borderRadius: 4,
        }}>
          PROTOTYPE
        </span>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '36px 28px 60px' }}>

        {/* Title */}
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 6 }}>
          About This Application
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 36 }}>
          TrueBank Digital SME · v2.2 · Prototype
        </p>

        {/* What it is */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>What is the Digital SME?</h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 12 }}>
            The <strong style={{ color: 'var(--text-primary)' }}>TrueBank Digital SME</strong> is an AI-assisted incident and knowledge companion
            for the TruView Platform engineering team. It combines a curated, multi-source knowledge base with
            a large language model to answer operational questions in real time — grounded entirely in source records,
            with no hallucination.
          </p>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            Engineers can ask natural-language questions about active incidents, recent deployments, architecture,
            on-call contacts, security vulnerabilities, and compliance policies — and receive cited, traceable answers
            drawn directly from connected data sources.
          </p>
        </section>

        {/* Process flow */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Request / Response Flow</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            End-to-end RAG pipeline — from engineer query to grounded, cited response
          </p>
          <ProcessFlow />
        </section>

        {/* Knowledge sources */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Knowledge Sources</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
            {SOURCES.map(s => (
              <div key={s.label} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '12px 14px',
                display: 'flex', gap: 10, alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Architecture diagram */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Architecture</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            Serverless deployment on AWS free tier — CloudFront · API Gateway · Lambda · S3
          </p>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 10, padding: 16, textAlign: 'center',
          }}>
            <img
              src="/architecture.png"
              alt="TrueBank Digital SME Architecture Diagram"
              style={{ maxWidth: '100%', borderRadius: 6 }}
            />
          </div>
        </section>

        {/* Tech stack */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>Tech Stack</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[
              'React 18', 'Vite', 'React Router', 'Node.js 20', 'Express.js',
              'Claude Haiku 4.5', 'Anthropic SDK', 'AWS Lambda', 'API Gateway (HTTP)',
              'CloudFront', 'S3', 'AWS SAM', 'Server-Sent Events',
            ].map(t => (
              <span key={t} style={{
                fontSize: 12, fontFamily: 'JetBrains Mono, monospace',
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                borderRadius: 5, padding: '4px 10px', color: 'var(--text-secondary)',
              }}>
                {t}
              </span>
            ))}
          </div>
        </section>

        {/* Changelog */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Change Log</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            Release history — most recent first
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {CHANGELOG.map(release => (
              <div key={release.version} style={{
                background: 'var(--bg-card)',
                border: `1px solid ${release.current ? 'var(--accent-teal)' : 'var(--border)'}`,
                borderRadius: 8,
                overflow: 'hidden',
              }}>
                {/* Release header */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 16px',
                  background: release.current ? 'rgba(13,148,136,0.08)' : 'var(--bg-elevated)',
                  borderBottom: '1px solid var(--border)',
                }}>
                  <span style={{
                    fontFamily: 'JetBrains Mono, monospace', fontSize: 13,
                    fontWeight: 700, color: release.current ? 'var(--accent-teal)' : 'var(--text-primary)',
                  }}>
                    {release.version}
                  </span>
                  {release.current && (
                    <span style={{
                      fontSize: 9, fontFamily: 'JetBrains Mono, monospace',
                      color: 'var(--accent-teal)', background: 'rgba(13,148,136,0.15)',
                      border: '1px solid rgba(13,148,136,0.4)', padding: '1px 6px', borderRadius: 3,
                      letterSpacing: '0.06em',
                    }}>
                      CURRENT
                    </span>
                  )}
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                    {release.date}
                  </span>
                </div>
                {/* Changes list */}
                <div style={{ padding: '10px 16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {release.changes.map((change, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <span style={{
                          fontSize: 10, fontFamily: 'JetBrains Mono, monospace',
                          padding: '1px 5px', borderRadius: 3, flexShrink: 0, marginTop: 1,
                          ...TYPE_STYLE[change.type],
                        }}>
                          {change.type}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                          {change.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 20, fontSize: 11, color: 'var(--text-muted)' }}>
          TrueBank Digital SME · Prototype · Built for internal engineering use only ·
          Knowledge scope: TruView Core, TruView Web, TruView Mobile, Digital SME Platform
        </div>
      </div>
    </div>
  );
}
