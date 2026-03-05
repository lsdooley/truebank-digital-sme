const SOURCE_COLORS = {
  'ServiceNow':      '#FF6B35',
  'Confluence':      '#0052CC',
  'Dynatrace':       '#1496FF',
  'CI/CD':           '#6366F1',
  'AWS/CMDB':        '#FF9900',
  'Architecture/ADR':'#0D9488',
  'Onboarding':      '#16A34A',
};

const FRESHNESS_COLORS = {
  LIVE:   '#16A34A',
  SYNCED: '#0D9488',
  STALE:  '#D97706',
};

export function SourceBadge({ source_label, record_id, freshness, onClick, active }) {
  const color = SOURCE_COLORS[source_label] || '#64748B';
  const freshnessColor = FRESHNESS_COLORS[freshness] || '#64748B';

  return (
    <span
      className="source-badge"
      style={{
        background: `${color}18`,
        borderColor: `${color}40`,
        cursor: onClick ? 'pointer' : 'default',
        outline: active ? `1px solid ${color}` : 'none',
      }}
      onClick={onClick}
      title={`${source_label} — ${freshness}`}
    >
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0, display: 'inline-block' }} />
      <span style={{ color: '#94A3B8', fontWeight: 400 }}>{source_label}</span>
      <span style={{ color, fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5 }}>{record_id}</span>
      <span
        style={{ width: 6, height: 6, borderRadius: '50%', background: freshnessColor, flexShrink: 0, display: 'inline-block' }}
        title={`Data freshness: ${freshness}`}
      />
    </span>
  );
}

export function FreshnessDot({ freshness, pulse }) {
  const color = FRESHNESS_COLORS[freshness] || '#64748B';
  return (
    <span
      style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }}
      className={pulse && freshness === 'LIVE' ? 'live-dot' : ''}
    />
  );
}
