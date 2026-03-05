import { useEffect, useState } from 'react';

const SOURCE_ORDER = ['ServiceNow', 'Dynatrace', 'CI/CD', 'AWS/CMDB', 'Confluence', 'Architecture/ADR', 'Onboarding'];

function relativeTime(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 2) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const FRESHNESS_CONFIG = {
  LIVE:   { color: 'var(--accent-green)',  label: '',       pulse: true },
  SYNCED: { color: 'var(--accent-teal)',   label: 'SYNCED', pulse: false },
  STALE:  { color: 'var(--accent-amber)',  label: 'STALE',  pulse: false },
};

export default function FreshnessBar({ appid }) {
  const [sources, setSources] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetch(`/api/freshness?appid=${appid || 'ALL'}`)
        .then(r => r.json())
        .then(d => { if (!cancelled) setSources(d.sources || []); })
        .catch(() => {});
    };
    load();
    const interval = setInterval(load, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [appid]);

  const sorted = [...sources].sort((a, b) => {
    return SOURCE_ORDER.indexOf(a.source_label) - SOURCE_ORDER.indexOf(b.source_label);
  });

  return (
    <div className="freshness-bar-inner" style={{
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
      padding: '6px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      flexWrap: 'wrap',
      minHeight: 34,
    }}>
      <span style={{ color: 'var(--text-muted)', fontSize: 11, marginRight: 6, fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap' }}>
        DATA FRESHNESS
      </span>
      {sorted.map(s => {
        const cfg = FRESHNESS_CONFIG[s.freshness] || FRESHNESS_CONFIG.STALE;
        return (
          <span
            key={s.source_label}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: 11,
              background: `${cfg.color}18`,
              border: `1px solid ${cfg.color}40`,
              whiteSpace: 'nowrap',
            }}
            title={`Last synced: ${relativeTime(s.ingest_ts)}`}
          >
            <span
              style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, display: 'inline-block' }}
              className={cfg.pulse ? 'live-dot' : ''}
            />
            <span style={{ color: '#94A3B8', fontWeight: 400 }}>{s.source_label}</span>
            <span style={{ color: cfg.color, fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>
              {cfg.label}
              {s.freshness !== 'LIVE' && ` · ${relativeTime(s.ingest_ts)}`}
            </span>
          </span>
        );
      })}
    </div>
  );
}
