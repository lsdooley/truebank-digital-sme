import { useMemo, useState, useEffect } from 'react';
import { SourceBadge } from './SourceBadge.jsx';

const SOURCE_ICONS = {
  'ServiceNow':       '🔶',
  'Confluence':       '📘',
  'Dynatrace':        '🔵',
  'CI/CD':            '🚀',
  'AWS/CMDB':         '🟠',
  'Architecture/ADR': '🔷',
  'Onboarding':       '🟢',
  'CloudWatch':       '📡',
};

const SOURCE_DEEP_LINK = {
  'ServiceNow':       'ServiceNow portal  →  Incident / Change record view',
  'Confluence':       'Confluence wiki  →  Page viewer with full document context',
  'Dynatrace':        'Dynatrace dashboard  →  Problem / SLO / Health detail',
  'CI/CD':            'GitHub Actions  →  Pipeline run or deployment history',
  'AWS/CMDB':         'AWS Console  →  CloudTrail event or Config resource view',
  'Architecture/ADR': 'Confluence  →  Architecture Decision Record full text',
  'Onboarding':       'Confluence  →  Team onboarding and escalation wiki',
  'CloudWatch':       'CloudWatch Logs  →  Log Insights query scoped to this event',
};

// ── Cyberpunk corner bracket ────────────────────────────────────────────────

function Corner({ top, left, right, bottom }) {
  const SIZE = 12;
  const T = 2;
  const C = 'var(--accent-teal)';
  return (
    <div style={{
      position: 'absolute',
      top:    top    !== undefined ? top    : undefined,
      bottom: bottom !== undefined ? bottom : undefined,
      left:   left   !== undefined ? left   : undefined,
      right:  right  !== undefined ? right  : undefined,
      width: SIZE, height: SIZE,
      borderTop:    top    !== undefined ? `${T}px solid ${C}` : undefined,
      borderBottom: bottom !== undefined ? `${T}px solid ${C}` : undefined,
      borderLeft:   left   !== undefined ? `${T}px solid ${C}` : undefined,
      borderRight:  right  !== undefined ? `${T}px solid ${C}` : undefined,
    }} />
  );
}

// ── Scan-line overlay ────────────────────────────────────────────────────────

const SCANLINE_STYLE = {
  position: 'absolute', inset: 0,
  background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px)',
  pointerEvents: 'none',
  borderRadius: 'inherit',
  zIndex: 0,
};

// ── Blinking cursor ──────────────────────────────────────────────────────────

function BlinkCursor() {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const iv = setInterval(() => setOn(v => !v), 530);
    return () => clearInterval(iv);
  }, []);
  return (
    <span style={{ color: 'var(--accent-teal)', opacity: on ? 1 : 0, transition: 'opacity 0.1s' }}>█</span>
  );
}

// ── Source Deep-link Modal ───────────────────────────────────────────────────

function SourceModal({ citation, onClose }) {
  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const icon       = SOURCE_ICONS[citation.source_label]      || '📄';
  const deepLink   = SOURCE_DEEP_LINK[citation.source_label]  || `${citation.source_label}  →  Source record detail`;

  const freshnessColor = {
    LIVE:   '#16A34A',
    SYNCED: '#0D9488',
    STALE:  '#D97706',
  }[citation.freshness] || '#64748B';

  return (
    // Backdrop
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      {/* Modal card */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          background: 'rgba(10,15,26,0.97)',
          border: '1px solid rgba(13,148,136,0.5)',
          borderRadius: 10,
          width: '100%', maxWidth: 480,
          boxShadow: '0 0 0 1px rgba(13,148,136,0.15), 0 0 40px rgba(13,148,136,0.2), 0 0 80px rgba(13,148,136,0.08), 0 24px 48px rgba(0,0,0,0.6)',
          overflow: 'hidden',
        }}
      >
        <div style={SCANLINE_STYLE} />

        {/* Corner accents */}
        <Corner top={-1}  left={-1}  />
        <Corner top={-1}  right={-1} />
        <Corner bottom={-1} left={-1}  />
        <Corner bottom={-1} right={-1} />

        {/* Header bar */}
        <div style={{
          position: 'relative', zIndex: 1,
          background: 'rgba(13,148,136,0.08)',
          borderBottom: '1px solid rgba(13,148,136,0.25)',
          padding: '10px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 9, fontFamily: 'JetBrains Mono, monospace',
              letterSpacing: '0.14em', color: 'var(--accent-teal)', fontWeight: 700,
            }}>
              ▸ SOURCE INTEGRATION
            </span>
            <span style={{
              fontSize: 9, fontFamily: 'JetBrains Mono, monospace',
              letterSpacing: '0.1em', color: 'rgba(13,148,136,0.5)',
            }}>
              // PROTOTYPE MODE
            </span>
            <BlinkCursor />
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: '1px solid rgba(13,148,136,0.3)',
              borderRadius: 4, padding: '2px 8px',
              color: 'rgba(13,148,136,0.7)', fontSize: 10,
              fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer',
              letterSpacing: '0.08em',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(13,148,136,0.12)'; e.currentTarget.style.color = 'var(--accent-teal)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(13,148,136,0.7)'; }}
          >
            ESC
          </button>
        </div>

        {/* Body */}
        <div style={{ position: 'relative', zIndex: 1, padding: '20px 20px 24px' }}>

          {/* Record ID + source */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 18 }}>{icon}</span>
            <div>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: 14,
                fontWeight: 700, color: 'var(--accent-teal)', letterSpacing: '0.04em',
              }}>
                {citation.record_id}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                {citation.source_label}
              </div>
            </div>
            <span style={{
              marginLeft: 'auto',
              fontSize: 10, fontFamily: 'JetBrains Mono, monospace',
              color: freshnessColor,
              background: `${freshnessColor}18`,
              border: `1px solid ${freshnessColor}40`,
              padding: '2px 7px', borderRadius: 4,
            }}>
              {citation.freshness}
            </span>
          </div>

          {/* Title */}
          <div style={{
            fontSize: 13, color: 'var(--text-primary)',
            lineHeight: 1.5, marginBottom: 18,
            paddingBottom: 16,
            borderBottom: '1px solid rgba(13,148,136,0.12)',
          }}>
            {citation.title}
          </div>

          {/* Prototype notice */}
          <div style={{
            background: 'rgba(13,148,136,0.06)',
            border: '1px solid rgba(13,148,136,0.2)',
            borderRadius: 7,
            padding: '14px 16px',
            marginBottom: 18,
            position: 'relative',
          }}>
            <Corner top={-1}  left={-1}  />
            <Corner top={-1}  right={-1} />
            <Corner bottom={-1} left={-1}  />
            <Corner bottom={-1} right={-1} />

            <div style={{
              fontSize: 10, fontFamily: 'JetBrains Mono, monospace',
              color: 'var(--accent-teal)', letterSpacing: '0.1em', marginBottom: 8,
            }}>
              ▸ DEEP-LINK TARGET
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              In a production deployment, clicking this record would open it directly in the{' '}
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                {deepLink.split('→')[0].trim()}
              </span>
              {' '}— taking the engineer directly to the source record with full context,
              edit access, and action controls.
            </div>
          </div>

          {/* Metadata grid */}
          <div style={{
            display: 'grid', gridTemplateColumns: '90px 1fr',
            gap: '6px 10px', fontSize: 11,
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            {[
              ['SOURCE SYS', citation.source_label],
              ['RECORD ID',  citation.record_id],
              ['FRESHNESS',  citation.freshness],
              ['APPID',      citation.appid],
              ['DEEP LINK',  deepLink.split('→')[1]?.trim() || '—'],
            ].map(([label, value]) => (
              <>
                <span key={`l-${label}`} style={{ color: 'rgba(13,148,136,0.6)', letterSpacing: '0.08em', fontSize: 10 }}>
                  {label}
                </span>
                <span key={`v-${label}`} style={{ color: 'var(--text-secondary)' }}>
                  {value}
                </span>
              </>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          position: 'relative', zIndex: 1,
          borderTop: '1px solid rgba(13,148,136,0.15)',
          padding: '10px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{
            fontSize: 9, fontFamily: 'JetBrains Mono, monospace',
            color: 'rgba(13,148,136,0.35)', letterSpacing: '0.1em',
          }}>
            TRUEBANK DIGITAL SME // PROTOTYPE
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(13,148,136,0.1)',
              border: '1px solid rgba(13,148,136,0.35)',
              borderRadius: 5, padding: '5px 18px',
              color: 'var(--accent-teal)', fontSize: 11,
              fontFamily: 'JetBrains Mono, monospace',
              cursor: 'pointer', letterSpacing: '0.08em',
              fontWeight: 600,
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(13,148,136,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(13,148,136,0.1)'}
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}

// ── CitationPanel ────────────────────────────────────────────────────────────

export default function CitationPanel({ messages, activeCitation, onCitationClick }) {
  const [modalCitation, setModalCitation] = useState(null);

  const sessionCitations = useMemo(() => {
    const seen = new Set();
    const all  = [];
    for (const msg of messages) {
      if (msg.role !== 'assistant' || !msg.citations) continue;
      for (const c of msg.citations) {
        if (!seen.has(c.record_id)) {
          seen.add(c.record_id);
          all.push(c);
        }
      }
    }
    return all;
  }, [messages]);

  const bySource = useMemo(() => {
    const groups = {};
    for (const c of sessionCitations) {
      if (!groups[c.source_label]) groups[c.source_label] = [];
      groups[c.source_label].push(c);
    }
    return groups;
  }, [sessionCitations]);

  if (sessionCitations.length === 0) {
    return (
      <div style={{ padding: '20px 14px', color: 'var(--text-muted)', fontSize: 12, textAlign: 'center' }}>
        <div style={{ marginBottom: 8, fontSize: 22 }}>📋</div>
        <div>No records surfaced yet</div>
        <div style={{ marginTop: 4, fontSize: 11 }}>Source records cited in responses will appear here</div>
      </div>
    );
  }

  return (
    <>
      <div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em', marginBottom: 10, padding: '0 2px' }}>
          SESSION RECORDS ({sessionCitations.length})
        </div>
        {Object.entries(bySource).map(([src, items]) => (
          <div key={src} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
              {SOURCE_ICONS[src] || '📄'} {src}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {items.map(c => (
                <div
                  key={c.id}
                  onClick={() => { onCitationClick(c.record_id); setModalCitation(c); }}
                  style={{
                    background: activeCitation === c.record_id ? 'var(--bg-elevated)' : 'var(--bg-card)',
                    border: `1px solid ${activeCitation === c.record_id ? 'var(--accent-teal)' : 'var(--border-subtle)'}`,
                    borderRadius: 6,
                    padding: '7px 10px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (activeCitation !== c.record_id) e.currentTarget.style.borderColor = 'rgba(13,148,136,0.4)'; }}
                  onMouseLeave={e => { if (activeCitation !== c.record_id) e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text-code)' }}>
                      {c.record_id}
                    </span>
                    <FreshnessPill freshness={c.freshness} />
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {c.title}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {modalCitation && (
        <SourceModal
          citation={modalCitation}
          onClose={() => setModalCitation(null)}
        />
      )}
    </>
  );
}

function FreshnessPill({ freshness }) {
  const cfg = {
    LIVE:   { color: 'var(--accent-green)', bg: 'rgba(22,163,74,0.12)' },
    SYNCED: { color: 'var(--accent-teal)',  bg: 'rgba(13,148,136,0.12)' },
    STALE:  { color: 'var(--accent-amber)', bg: 'rgba(217,119,6,0.12)' },
  }[freshness] || { color: 'var(--text-muted)', bg: 'transparent' };

  return (
    <span style={{
      fontSize: 10,
      fontFamily: 'JetBrains Mono, monospace',
      color: cfg.color,
      background: cfg.bg,
      padding: '1px 5px',
      borderRadius: 3,
    }}>
      {freshness === 'LIVE' ? '● LIVE' : freshness}
    </span>
  );
}
