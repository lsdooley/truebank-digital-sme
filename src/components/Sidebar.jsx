import { useNavigate } from 'react-router-dom';
import AppSelector from './AppSelector.jsx';
import IncidentTimer from './IncidentTimer.jsx';
import { FreshnessDot } from './SourceBadge.jsx';
import { useEffect, useState } from 'react';

export function RobotAvatar({ size = 48, loading = false }) {
  const s = size;
  const eyeClass = loading ? 'eye-pulse-active' : '';

  return (
    <svg width={s} height={s * 1.1} viewBox="0 0 48 54" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Antenna */}
      <line x1="24" y1="2" x2="24" y2="10" stroke="#0D9488" strokeWidth="2" strokeLinecap="round" />
      <circle cx="24" cy="2" r="2.5" fill="#0D9488" />
      {/* Head */}
      <rect x="6" y="10" width="36" height="28" rx="5" ry="5" fill="#1E293B" stroke="#2D3D5A" strokeWidth="1.5" />
      {/* Eyes */}
      <circle cx="17" cy="22" r="5" fill="#0F172A" />
      <circle cx="31" cy="22" r="5" fill="#0F172A" />
      <circle cx="17" cy="22" r="3.5" fill="#0D9488" className={eyeClass} />
      <circle cx="31" cy="22" r="3.5" fill="#0D9488" className={eyeClass} />
      <circle cx="18" cy="21" r="1" fill="white" opacity="0.6" />
      <circle cx="32" cy="21" r="1" fill="white" opacity="0.6" />
      {/* Mouth grid */}
      <rect x="12" y="31" width="24" height="4" rx="2" fill="#0F172A" />
      {[14, 18, 22, 26, 30].map(x => (
        <line key={x} x1={x} y1="31" x2={x} y2="35" stroke="#0D9488" strokeWidth="1" opacity="0.6" />
      ))}
      {/* Neck */}
      <rect x="19" y="38" width="10" height="4" rx="2" fill="#1E293B" stroke="#2D3D5A" strokeWidth="1" />
      {/* Body hint */}
      <rect x="10" y="42" width="28" height="10" rx="3" fill="#1E293B" stroke="#2D3D5A" strokeWidth="1" />
    </svg>
  );
}

const SOURCE_FRESHNESS_DEFAULTS = [
  { label: 'ServiceNow',       source: 'servicenow_incidents' },
  { label: 'Dynatrace',        source: 'dynatrace_problems' },
  { label: 'CI/CD',            source: 'cicd_pipelines' },
  { label: 'AWS/CMDB',         source: 'aws_infrastructure' },
  { label: 'Confluence',       source: 'confluence_adr' },
  { label: 'Architecture/ADR', source: 'architecture_ea' },
];

const QUICK_QUERIES = [
  { label: '⚡ Recent Changes',   query: 'What changed in TruView Core in the last 72 hours?' },
  { label: '🔴 Active Incidents', query: 'Are there any active incidents on TruView Core?' },
  { label: '💥 Blast Radius',     query: 'What is the blast radius if TruView Core account-service goes down?' },
  { label: '📞 On-Call Now',      query: 'Who is the current on-call for TruView Core incidents?' },
  { label: '📋 Runbook',          query: 'Show me the runbook for Kafka consumer lag issues' },
];

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

export default function Sidebar({ activeAppid, onAppChange, onQuery, loading, freshnessSources }) {
  const navigate = useNavigate();

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
          <div style={{ fontSize: 11, color: 'var(--accent-teal)', letterSpacing: '0.06em', fontFamily: 'JetBrains Mono, monospace' }}>
            DIGITAL SME
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

        {/* Quick queries */}
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em', marginBottom: 6 }}>
            QUICK QUERIES
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {QUICK_QUERIES.map(q => (
              <button key={q.label} className="quick-chip" onClick={() => onQuery(q.query)} disabled={loading}>
                {q.label}
              </button>
            ))}
          </div>
        </div>

        {/* Incident timer */}
        <IncidentTimer />

        {/* Source freshness */}
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em', marginBottom: 6 }}>
            SOURCE STATUS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {(freshnessSources || SOURCE_FRESHNESS_DEFAULTS.map(s => ({ source_label: s.label, freshness: 'LIVE' }))).map(s => (
              <div key={s.source_label} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5 }}>
                <FreshnessDot freshness={s.freshness} pulse />
                <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{s.source_label}</span>
                <span style={{
                  fontSize: 10,
                  fontFamily: 'JetBrains Mono, monospace',
                  color: s.freshness === 'LIVE' ? 'var(--accent-green)' : s.freshness === 'SYNCED' ? 'var(--accent-teal)' : 'var(--accent-amber)',
                }}>
                  {s.freshness}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', fontSize: 10, color: 'var(--text-muted)' }}>
        Scope: TruView Platform POC<br />
        RAG · No tool-calling
      </div>
    </div>
  );
}
