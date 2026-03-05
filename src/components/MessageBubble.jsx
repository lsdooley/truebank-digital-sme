import { useState, useMemo } from 'react';
import { SourceBadge } from './SourceBadge.jsx';
import ReasoningTrace from './ReasoningTrace.jsx';

function relativeTime(date) {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

// Render inline text with **bold** support
function renderInline(text) {
  const segments = text.split(/(\*\*[^*]+\*\*)/g);
  return segments.map((seg, j) =>
    seg.startsWith('**') && seg.endsWith('**')
      ? <strong key={j}>{seg.slice(2, -2)}</strong>
      : seg
  );
}

// Detect markdown table: needs a separator row (---|---|---)
function isTableBlock(lines) {
  return lines.length >= 2 &&
    lines[0].includes('|') &&
    /^[\s|:\-]+$/.test(lines[1]);
}

function renderTable(lines, key) {
  const headers = lines[0].split('|').map(h => h.trim()).filter(Boolean);
  const rows = lines.slice(2).map(row => row.split('|').map(c => c.trim()).filter(Boolean));
  return (
    <div key={key} style={{ overflowX: 'auto', margin: '6px 0 10px' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>
        <thead>
          <tr>
            {headers.map((h, hi) => (
              <th key={hi} style={{
                textAlign: 'left', padding: '5px 10px',
                borderBottom: '2px solid var(--border)',
                color: 'var(--text-primary)', fontWeight: 600, whiteSpace: 'nowrap',
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
                <td key={ci} style={{ padding: '5px 10px', color: 'var(--text-secondary)', verticalAlign: 'top' }}>
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
  // Table?
  if (isTableBlock(lines)) return renderTable(lines, key);

  return (
    <div key={key} style={{ marginBottom: 8 }}>
      {lines.map((line, k) => {
        if (line.startsWith('## ')) {
          return (
            <div key={k} style={{
              fontSize: 15, fontWeight: 700, color: 'var(--text-primary)',
              letterSpacing: '-0.01em', marginTop: k > 0 ? 10 : 4, marginBottom: 3,
              paddingBottom: 4, borderBottom: '1px solid var(--border-subtle)',
            }}>
              {renderInline(line.slice(3))}
            </div>
          );
        }
        if (line.startsWith('### ')) {
          return (
            <div key={k} style={{
              fontSize: 14, fontWeight: 600, color: 'var(--accent-teal)',
              fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.04em',
              textTransform: 'uppercase', marginTop: k > 0 ? 8 : 2, marginBottom: 2,
            }}>
              {renderInline(line.slice(4))}
            </div>
          );
        }
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <div key={k} style={{ display: 'flex', gap: 6, marginBottom: 1 }}>
              <span style={{ color: 'var(--accent-teal)', flexShrink: 0, marginTop: 1 }}>·</span>
              <span style={{ color: 'var(--text-secondary)' }}>{renderInline(line.slice(2))}</span>
            </div>
          );
        }
        if (/^\d+\.\s/.test(line)) {
          const [num, ...rest] = line.split(/\.\s(.+)/);
          return (
            <div key={k} style={{ display: 'flex', gap: 6, marginBottom: 1 }}>
              <span style={{ color: 'var(--accent-teal)', flexShrink: 0, minWidth: 16, fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{num}.</span>
              <span style={{ color: 'var(--text-secondary)' }}>{renderInline(rest[0] || '')}</span>
            </div>
          );
        }
        if (line.trim() === '') return null;
        return (
          <div key={k} style={{ color: 'var(--text-secondary)', marginBottom: 1 }}>
            {renderInline(line)}
          </div>
        );
      })}
    </div>
  );
}

// Parse [SOURCE: record_id] markers and render markdown content
function parseContent(text, activeCitation, onCitationClick) {
  if (!text) return null;
  const parts = [];
  const regex = /\[SOURCE:\s*([^\]]+)\]/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'citation', recordId: match[1].trim() });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return parts.flatMap((part, i) => {
    if (part.type === 'citation') {
      return [(
        <span
          key={`cite-${i}`}
          className={`citation-chip${activeCitation === part.recordId ? ' active' : ''}`}
          onClick={() => onCitationClick(part.recordId)}
        >
          {part.recordId}
        </span>
      )];
    }
    // Split into paragraph blocks on blank lines, render each block
    const rawBlocks = part.content.split(/\n{2,}/);
    return rawBlocks
      .map(block => block.split('\n'))
      .filter(lines => lines.some(l => l.trim()))
      .map((lines, bi) => renderBlock(lines, `${i}-${bi}`));
  });
}

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

  // Assistant message
  const citedBadges = useMemo(() => citations.filter(c => c.cited !== false), [citations]);

  return (
    <div style={{ marginBottom: 24 }}>
      <div className="msg-assistant" style={{ padding: '14px 16px' }}>
        {/* Timestamp */}
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
          Digital SME · {relativeTime(timestamp)}
        </div>

        {/* Error state */}
        {error && (
          <div style={{ background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.3)', borderRadius: 6, padding: '10px 12px', marginBottom: 8 }}>
            <div style={{ color: 'var(--accent-red)', fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
              ⚠ {error}
            </div>
            {errorDetail && (
              <div style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>
                {errorDetail}
              </div>
            )}
            {citations.length > 0 && (
              <div style={{ marginTop: 8, color: 'var(--text-secondary)', fontSize: 12 }}>
                Knowledge base records retrieved ({citations.length}):
              </div>
            )}
          </div>
        )}

        {/* Response text */}
        {content && (
          <div className="prose-response" style={{ color: 'var(--text-primary)', lineHeight: 1.5, fontSize: 14 }}>
            {parseContent(content, activeCitation, onCitationClick)}
          </div>
        )}

        {/* Citation badge row */}
        {citedBadges.length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 5, paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
            {citedBadges.map(c => (
              <SourceBadge
                key={c.id}
                source_label={c.source_label}
                record_id={c.record_id}
                freshness={c.freshness}
                active={activeCitation === c.record_id}
                onClick={() => onCitationClick(c.record_id)}
              />
            ))}
          </div>
        )}

        {/* Reasoning trace */}
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
