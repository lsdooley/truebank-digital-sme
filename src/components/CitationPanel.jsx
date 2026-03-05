import { useMemo } from 'react';
import { SourceBadge } from './SourceBadge.jsx';

const SOURCE_ICONS = {
  'ServiceNow':      '🔶',
  'Confluence':      '📘',
  'Dynatrace':       '🔵',
  'CI/CD':           '🚀',
  'AWS/CMDB':        '🟠',
  'Architecture/ADR':'🔷',
  'Onboarding':      '🟢',
};

export default function CitationPanel({ messages, activeCitation, onCitationClick }) {
  // Collect all unique citations from all assistant messages in this session
  const sessionCitations = useMemo(() => {
    const seen = new Set();
    const all = [];
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

  // Group by source system
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
                onClick={() => onCitationClick(c.record_id)}
                style={{
                  background: activeCitation === c.record_id ? 'var(--bg-elevated)' : 'var(--bg-card)',
                  border: `1px solid ${activeCitation === c.record_id ? 'var(--accent-teal)' : 'var(--border-subtle)'}`,
                  borderRadius: 6,
                  padding: '7px 10px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
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
      {freshness === 'LIVE' ? '' : freshness}
    </span>
  );
}
