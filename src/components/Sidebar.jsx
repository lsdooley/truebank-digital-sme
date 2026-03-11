import { useNavigate } from 'react-router-dom';
import AppSelector from './AppSelector.jsx';
import IncidentTimer from './IncidentTimer.jsx';
import { useEffect, useState } from 'react';

export function RobotAvatar({ size = 48, loading = false }) {
  const s = size;
  const eyeClass = loading ? 'eye-pulse-active' : '';

  return (
    <svg width={s} height={s * 1.1} viewBox="0 0 48 54" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="24" y1="2" x2="24" y2="10" stroke="#0D9488" strokeWidth="2" strokeLinecap="round" />
      <circle cx="24" cy="2" r="2.5" fill="#0D9488" />
      <rect x="6" y="10" width="36" height="28" rx="5" ry="5" fill="#1E293B" stroke="#2D3D5A" strokeWidth="1.5" />
      <circle cx="17" cy="22" r="5" fill="#0F172A" />
      <circle cx="31" cy="22" r="5" fill="#0F172A" />
      <circle cx="17" cy="22" r="3.5" fill="#0D9488" className={eyeClass} />
      <circle cx="31" cy="22" r="3.5" fill="#0D9488" className={eyeClass} />
      <circle cx="18" cy="21" r="1" fill="white" opacity="0.6" />
      <circle cx="32" cy="21" r="1" fill="white" opacity="0.6" />
      <rect x="12" y="31" width="24" height="4" rx="2" fill="#0F172A" />
      {[14, 18, 22, 26, 30].map(x => (
        <line key={x} x1={x} y1="31" x2={x} y2="35" stroke="#0D9488" strokeWidth="1" opacity="0.6" />
      ))}
      <rect x="19" y="38" width="10" height="4" rx="2" fill="#1E293B" stroke="#2D3D5A" strokeWidth="1" />
      <rect x="10" y="42" width="28" height="10" rx="3" fill="#1E293B" stroke="#2D3D5A" strokeWidth="1" />
    </svg>
  );
}

// Quick queries scoped to the active application
function getQuickQueries(activeAppid) {
  const appLabel = {
    'APPID-973193': 'TruView Core',
    'APPID-871198': 'TruView Web',
    'APPID-871204': 'TruView Mobile',
    'APPID-7779311': 'TrueBank Digital SME',
    'ALL': 'TruView',
  }[activeAppid] || activeAppid;

  if (activeAppid === 'APPID-7779311') {
    return [
      { label: '🔴 Active Incidents', query: 'Are there any active incidents on the Digital SME platform?' },
      { label: '⚡ Recent Changes',   query: 'What changes have been deployed to the Digital SME recently?' },
      { label: '🏗 Architecture',     query: 'Explain the Digital SME RAG architecture and how it works' },
      { label: '💰 Token Cost',       query: 'What was done to reduce token cost on the Digital SME?' },
      { label: '🔐 Vulnerabilities',  query: 'Are there any open security vulnerabilities affecting the Digital SME?' },
    ];
  }

  if (activeAppid === 'ALL') {
    return [
      { label: '🔴 Active Incidents', query: 'What active incidents are there across all TruView applications?' },
      { label: '⚡ Recent Changes',   query: 'What changed across TruView applications in the last 72 hours?' },
      { label: '💥 Blast Radius',     query: 'What is the blast radius if TruView Core account-service goes down?' },
      { label: '📋 Escalation',       query: 'Who are the on-call contacts across TruView applications?' },
      { label: '🔐 CVEs',             query: 'Are there any open security vulnerabilities across TruView services?' },
    ];
  }

  return [
    { label: '🔴 Active Incidents', query: `Are there any active incidents on ${appLabel}?` },
    { label: '⚡ Recent Changes',   query: `What changed in ${appLabel} in the last 72 hours?` },
    { label: '💥 Blast Radius',     query: `What is the blast radius if ${appLabel} goes down?` },
    { label: '📞 On-Call Now',      query: `Who is the current on-call for ${appLabel} incidents?` },
    { label: '📋 Runbook',          query: `What runbooks are available for ${appLabel}?` },
  ];
}

function SessionTimer() {
  const [start] = useState(Date.now());
  const [, forceRender] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => forceRender(n => n + 1), 60000);
    return () => clearInterval(iv);
  }, []);
  const mins = Math.floor((Date.now() - start) / 60000);
  return (
    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
      {mins < 1 ? 'Session started just now' : `Session started ${mins}m ago`}
    </span>
  );
}

function SessionStats({ stats }) {
  if (!stats || stats.exchanges === 0) return null;
  const rows = [
    { label: 'Exchanges',     value: stats.exchanges },
    { label: 'Input tokens',  value: stats.inputTokens.toLocaleString() },
    { label: 'Output tokens', value: stats.outputTokens.toLocaleString() },
    { label: 'Total tokens',  value: stats.totalTokens.toLocaleString() },
    { label: 'Chunks used',   value: stats.chunksRetrieved },
  ];
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em', marginBottom: 6 }}>
        SESSION CONTEXT
      </div>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {rows.map(r => (
          <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.label}</span>
            <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-code)' }}>{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Sidebar({ activeAppid, onAppChange, onQuery, loading, freshnessSources, sessionStats }) {
  const navigate = useNavigate();
  const quickQueries = getQuickQueries(activeAppid);

  return (
    <div style={{
      width: 240,
      minWidth: 240,
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid var(--border)' }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', width: '100%' }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            TrueBank
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--accent-teal)', letterSpacing: '0.06em', fontFamily: 'JetBrains Mono, monospace' }}>
              DIGITAL SME
            </span>
            <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.04em' }}>
              v2.1
            </span>
          </div>
        </button>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Robot avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <RobotAvatar size={36} loading={loading} />
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>SME Assistant</div>
            <SessionTimer />
          </div>
        </div>

        {/* App scope selector */}
        <AppSelector activeAppid={activeAppid} onChange={onAppChange} loading={loading} />

        {/* Quick queries — scoped to active app */}
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em', marginBottom: 6 }}>
            QUICK QUERIES
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {quickQueries.map(q => (
              <button key={q.label} className="quick-chip" onClick={() => onQuery(q.query)} disabled={loading}>
                {q.label}
              </button>
            ))}
          </div>
        </div>

        {/* Incident timer */}
        <IncidentTimer />

        {/* Session context stats */}
        <SessionStats stats={sessionStats} />
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.7 }}>
        Scope: TruView Platform POC<br />
        RAG · No tool-calling<br />
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9 }}>
          Built {typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 'unknown'} EST
        </span>
      </div>
    </div>
  );
}
