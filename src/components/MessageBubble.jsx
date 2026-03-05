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

// Parse [SOURCE: record_id] and render as clickable chips
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

  return parts.map((part, i) => {
    if (part.type === 'citation') {
      return (
        <span
          key={i}
          className={`citation-chip${activeCitation === part.recordId ? ' active' : ''}`}
          onClick={() => onCitationClick(part.recordId)}
        >
          {part.recordId}
        </span>
      );
    }
    // Render text with basic markdown: **bold**
    const segments = part.content.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={i}>
        {segments.map((seg, j) => {
          if (seg.startsWith('**') && seg.endsWith('**')) {
            return <strong key={j}>{seg.slice(2, -2)}</strong>;
          }
          // Split on newlines
          return seg.split('\n').map((line, k, arr) => (
            <span key={k}>{line}{k < arr.length - 1 && <br />}</span>
          ));
        })}
      </span>
    );
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
          <div className="prose-response" style={{ color: 'var(--text-primary)', lineHeight: 1.65, fontSize: 14 }}>
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
