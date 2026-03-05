import { useState } from 'react';

export default function ReasoningTrace({ reasoning }) {
  const [open, setOpen] = useState(false);

  if (!reasoning) return null;

  const { queryTokens = [], chunksEvaluated, chunksSelected, topResults = [],
          retrievalMs, modelMs, inputTokens, outputTokens, activeScope, citationsFound } = reasoning;

  const topResultsStr = topResults.map(r => `${r.record_id} (score ${r.score})`).join(', ');

  const traceText = `RETRIEVAL  ${retrievalMs}ms
  Query tokens: ${queryTokens.join(', ')}
  Chunks evaluated: ${chunksEvaluated}   Chunks selected: ${chunksSelected}
  Top results: ${topResultsStr || 'none'}

MODEL CALL  ${modelMs}ms
  Input tokens: ${inputTokens?.toLocaleString()}   Output tokens: ${outputTokens?.toLocaleString()}
  Active scope: ${activeScope}
  Citations found: ${citationsFound}`;

  return (
    <div style={{ marginTop: 8 }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          fontSize: 11.5,
          cursor: 'pointer',
          padding: '2px 0',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontFamily: 'JetBrains Mono, monospace',
        }}
      >
        <span style={{ transition: 'transform 0.2s', display: 'inline-block', transform: open ? 'rotate(180deg)' : 'none' }}>▾</span>
        {open ? 'Hide reasoning' : 'Show reasoning'}
      </button>
      {open && (
        <div className="reasoning-panel" style={{ marginTop: 6 }}>
          {traceText}
        </div>
      )}
    </div>
  );
}
