import { useMemo } from 'react';
import ReasoningTrace from './ReasoningTrace.jsx';

function relativeTime(date) {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

// ─── Inline renderer ──────────────────────────────────────────────────────────

function renderInline(text) {
  const segments = text.split(/(\*\*[^*]+\*\*)/g);
  return segments.map((seg, j) =>
    seg.startsWith('**') && seg.endsWith('**')
      ? <strong key={j} style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{seg.slice(2, -2)}</strong>
      : seg
  );
}

// ─── Block renderers ──────────────────────────────────────────────────────────

function isTableBlock(lines) {
  return lines.length >= 3 &&
    lines[0].includes('|') &&
    /^[\s|:\-]+$/.test(lines[1]);
}

function renderTable(lines, key) {
  const headers = lines[0].split('|').map(h => h.trim()).filter(Boolean);
  const rows = lines.slice(2)
    .filter(l => l.includes('|'))
    .map(row => row.split('|').map(c => c.trim()).filter(Boolean));

  return (
    <div key={key} style={{ overflowX: 'auto', margin: '8px 0 12px' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13, lineHeight: 1.45 }}>
        <thead>
          <tr style={{ background: 'var(--bg-elevated)' }}>
            {headers.map((h, hi) => (
              <th key={hi} style={{
                textAlign: 'left', padding: '6px 12px',
                borderBottom: '2px solid var(--border)',
                color: 'var(--text-primary)', fontWeight: 600,
                whiteSpace: 'nowrap', fontFamily: 'Inter, system-ui, sans-serif',
              }}>
                {renderInline(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              {row.map((cell, ci) => (
                <td key={ci} style={{
                  padding: '5px 12px', color: 'var(--text-secondary)',
                  verticalAlign: 'top',
                }}>
                  {renderInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderBlock(lines, key) {
  if (isTableBlock(lines)) return renderTable(lines, key);

  const elements = lines.map((line, k) => {
    if (line.startsWith('## ')) {
      return (
        <div key={k} style={{
          fontSize: 15, fontWeight: 700, color: 'var(--text-primary)',
          letterSpacing: '-0.01em', marginTop: k > 0 ? 12 : 2, marginBottom: 4,
          paddingBottom: 5, borderBottom: '1px solid var(--border-subtle)',
        }}>
          {renderInline(line.slice(3))}
        </div>
      );
    }
    if (line.startsWith('### ')) {
      return (
        <div key={k} style={{
          fontSize: 11, fontWeight: 700, color: 'var(--accent-teal)',
          fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.07em',
          textTransform: 'uppercase', marginTop: k > 0 ? 10 : 2, marginBottom: 3,
        }}>
          {line.slice(4)}
        </div>
      );
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return (
        <div key={k} style={{ display: 'flex', gap: 7, marginBottom: 2 }}>
          <span style={{ color: 'var(--accent-teal)', flexShrink: 0, lineHeight: '1.5rem' }}>·</span>
          <span style={{ color: 'var(--text-secondary)' }}>{renderInline(line.slice(2))}</span>
        </div>
      );
    }
    if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^(\d+)\.\s(.+)/);
      if (match) return (
        <div key={k} style={{ display: 'flex', gap: 7, marginBottom: 2 }}>
          <span style={{ color: 'var(--accent-teal)', flexShrink: 0, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, lineHeight: '1.5rem', minWidth: 18 }}>{match[1]}.</span>
          <span style={{ color: 'var(--text-secondary)' }}>{renderInline(match[2])}</span>
        </div>
      );
    }
    if (line.trim() === '') return null;
    return (
      <div key={k} style={{ color: 'var(--text-secondary)', marginBottom: 2 }}>
        {renderInline(line)}
      </div>
    );
  });

  return <div key={key} style={{ marginBottom: 6 }}>{elements}</div>;
}

// Strip [SOURCE: ...] markers and split into paragraph blocks for rendering
function parseContent(text) {
  if (!text) return null;
  const clean = text.replace(/\[SOURCE:\s*[^\]]+\]/g, '').replace(/\n{3,}/g, '\n\n').trim();
  return clean
    .split(/\n{2,}/)
    .map(block => block.split('\n'))
    .filter(lines => lines.some(l => l.trim()))
    .map((lines, i) => renderBlock(lines, i));
}

// ─── Sources footer ───────────────────────────────────────────────────────────

const SRC_COLOR = {
  'ServiceNow':       '#FF6B35',
  'Confluence':       '#2684FF',
  'Dynatrace':        '#1496FF',
  'CI/CD':            '#6366F1',
  'AWS/CMDB':         '#FF9900',
  'Architecture/ADR': '#0D9488',
  'Onboarding':       '#16A34A',
};

const FRESHNESS_STYLE = {
  LIVE:   { color: '#16A34A', label: '● LIVE' },
  SYNCED: { color: '#0D9488', label: 'SYNCED' },
  STALE:  { color: '#D97706', label: 'STALE' },
};

function SourcesFooter({ citations, activeCitation, onCitationClick }) {
  if (!citations || citations.length === 0) return null;
  return (
    <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
      <div style={{
        fontSize: 10, fontWeight: 700, color: 'var(--text-muted)',
        letterSpacing: '0.09em', fontFamily: 'JetBrains Mono, monospace',
        marginBottom: 8, textTransform: 'uppercase',
      }}>
        Sources — {citations.length} record{citations.length !== 1 ? 's' : ''} cited
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {citations.map(c => {
          const color = SRC_COLOR[c.source_label] || '#64748B';
          const fresh = FRESHNESS_STYLE[c.freshness] || { color: '#64748B', label: c.freshness };
          const active = activeCitation === c.record_id;
          return (
            <div
              key={c.id}
              onClick={() => onCitationClick(c.record_id)}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '7px 10px', borderRadius: 6, cursor: 'pointer',
                background: active ? `${color}14` : 'transparent',
                border: `1px solid ${active ? color + '55' : 'transparent'}`,
                transition: 'background 0.12s, border-color 0.12s',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-elevated)'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              {/* Source colour dot */}
              <span style={{
                width: 9, height: 9, borderRadius: '50%',
                background: color, flexShrink: 0, marginTop: 4,
              }} />
              {/* Title + meta */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.4, fontWeight: 500 }}>
                  {c.title || c.record_id}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'JetBrains Mono, monospace' }}>
                  {c.source_label}&nbsp;·&nbsp;{c.record_id}
                </div>
              </div>
              {/* Freshness pill */}
              <span style={{
                fontSize: 10, fontFamily: 'JetBrains Mono, monospace',
                color: fresh.color, background: fresh.color + '22',
                padding: '2px 6px', borderRadius: 3,
                flexShrink: 0, marginTop: 2, whiteSpace: 'nowrap',
              }}>
                {fresh.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MessageBubble ─────────────────────────────────────────────────────────────

export default function MessageBubble({ message, activeCitation, onCitationClick, onFollowup }) {
  const { role, content, citations = [], reasoning, error, errorDetail, followups = [], timestamp } = message;

  if (role === 'user') {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <div style={{ maxWidth: '70%' }}>
          <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
            {relativeTime(timestamp)}
          </div>
          <div style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: '8px 8px 2px 8px',
            padding: '10px 14px',
            color: 'var(--text-primary)',
            fontSize: 14,
            lineHeight: 1.5,
          }}>
            {content}
          </div>
        </div>
      </div>
    );
  }

  const citedSources = useMemo(() => citations.filter(c => c.cited !== false), [citations]);

  return (
    <div style={{ marginBottom: 24 }}>
      <div className="msg-assistant" style={{ padding: '14px 16px' }}>

        {/* Timestamp */}
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
          Digital SME · {relativeTime(timestamp)}
        </div>

        {/* Error state */}
        {error && (
          <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 6, padding: '10px 12px', marginBottom: 8 }}>
            <div style={{ color: 'var(--accent-red)', fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
              ⚠ {error}
            </div>
            {errorDetail && (
              <div style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>
                {errorDetail}
              </div>
            )}
          </div>
        )}

        {/* Response body */}
        {content && (
          <div className="prose-response" style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--text-secondary)' }}>
            {parseContent(content)}
          </div>
        )}

        {/* Consolidated sources footer */}
        <SourcesFooter
          citations={citedSources}
          activeCitation={activeCitation}
          onCitationClick={onCitationClick}
        />

        {/* Reasoning trace (collapsible) */}
        {reasoning && <ReasoningTrace reasoning={reasoning} />}

      </div>

      {/* Follow-up suggestions */}
      {followups.length > 0 && (
        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {followups.map((q, i) => (
            <button key={i} className="followup-chip" onClick={() => onFollowup(q)}>
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
