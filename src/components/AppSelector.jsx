import { APP_SCOPES } from '../hooks/useAppScope.js';

const STATUS_MAP = {
  'APPID-973193': { status: 'DEGRADED',   color: 'var(--accent-amber)' },
  'APPID-871198': { status: 'MONITORING', color: '#EAB308' },
  'APPID-871204': { status: 'DEGRADED',   color: 'var(--accent-amber)' },
  'APPID-7779311':{ status: 'HEALTHY',    color: 'var(--accent-green)' },
  'ALL':          { status: 'MIXED',      color: 'var(--accent-amber)' },
};

export default function AppSelector({ activeAppid, onChange, loading }) {
  const statusInfo = STATUS_MAP[activeAppid] || { status: 'HEALTHY', color: 'var(--accent-green)' };

  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 4, letterSpacing: '0.08em' }}>
        ACTIVE SCOPE
      </div>
      <div style={{ position: 'relative' }}>
        <select
          value={activeAppid}
          onChange={e => onChange(e.target.value)}
          disabled={loading}
          style={{
            width: '100%',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            color: 'var(--text-primary)',
            padding: '7px 32px 7px 10px',
            fontSize: 13,
            fontFamily: 'Inter, system-ui, sans-serif',
            cursor: 'pointer',
            appearance: 'none',
            WebkitAppearance: 'none',
            outline: 'none',
          }}
        >
          {APP_SCOPES.map(s => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)', fontSize: 10 }}>▾</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusInfo.color, display: 'inline-block' }} />
        <span style={{ fontSize: 11, color: statusInfo.color, fontFamily: 'JetBrains Mono, monospace' }}>{statusInfo.status}</span>
        {loading && (
          <span className="spin" style={{ marginLeft: 'auto', width: 10, height: 10, border: '2px solid var(--border)', borderTopColor: 'var(--accent-teal)', borderRadius: '50%', display: 'inline-block' }} />
        )}
      </div>
    </div>
  );
}
