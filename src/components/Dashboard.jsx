import { useNavigate, Link } from 'react-router-dom';

const APPS = [
  // TruView apps — have SME coverage
  {
    id: 'APPID-973193', name: 'TruView Core', appid: 'APPID-973193', tier: 1,
    status: 'DEGRADED', statusColor: '#D97706',
    sources: [
      { label: 'ServiceNow', freshness: 'LIVE' },
      { label: 'Confluence', freshness: 'SYNCED' },
      { label: 'Dynatrace',  freshness: 'LIVE' },
      { label: 'CI/CD',      freshness: 'LIVE' },
      { label: 'AWS/CMDB',   freshness: 'LIVE' },
    ],
    smeEnabled: true,
    activeIncidents: ['INC0089341 SEV2'],
  },
  {
    id: 'APPID-871198', name: 'TruView Web', appid: 'APPID-871198', tier: 1,
    status: 'MONITORING', statusColor: '#EAB308',
    sources: [
      { label: 'ServiceNow', freshness: 'LIVE' },
      { label: 'Confluence', freshness: 'SYNCED' },
      { label: 'Dynatrace',  freshness: 'LIVE' },
      { label: 'CI/CD',      freshness: 'LIVE' },
    ],
    smeEnabled: true,
    activeIncidents: ['INC0088719 SEV3'],
  },
  {
    id: 'APPID-871204', name: 'TruView Mobile', appid: 'APPID-871204', tier: 1,
    status: 'DEGRADED', statusColor: '#D97706',
    sources: [
      { label: 'ServiceNow', freshness: 'LIVE' },
      { label: 'Confluence', freshness: 'SYNCED' },
      { label: 'Dynatrace',  freshness: 'LIVE' },
      { label: 'CI/CD',      freshness: 'LIVE' },
    ],
    smeEnabled: true,
    activeIncidents: ['INC0091205 SEV3'],
  },
  // TrueBank Digital SME — self-referential
  {
    id: 'APPID-7779311', name: 'TrueBank Digital SME', appid: 'APPID-7779311', tier: 3,
    status: 'HEALTHY', statusColor: '#16A34A',
    sources: [
      { label: 'ServiceNow',  freshness: 'LIVE' },
      { label: 'CI/CD',       freshness: 'LIVE' },
      { label: 'AWS/CMDB',    freshness: 'LIVE' },
      { label: 'Architecture',freshness: 'SYNCED' },
      { label: 'Process Flow', freshness: 'SYNCED' },
    ],
    smeEnabled: true,
    activeIncidents: [],
  },
  // Other bank apps — no SME coverage
  { id: 'APPID-445821', name: 'Fraud Detection Engine',   appid: 'APPID-445821', tier: 1, status: 'HEALTHY', statusColor: '#16A34A', sources: [], smeEnabled: false },
  { id: 'APPID-100034', name: 'Core Banking Adapter',     appid: 'APPID-100034', tier: 1, status: 'HEALTHY', statusColor: '#16A34A', sources: [], smeEnabled: false },
  { id: 'APPID-556712', name: 'Customer Identity Platform', appid: 'APPID-556712', tier: 1, status: 'HEALTHY', statusColor: '#16A34A', sources: [], smeEnabled: false },
  { id: 'APPID-334490', name: 'Card Management System',   appid: 'APPID-334490', tier: 1, status: 'HEALTHY', statusColor: '#16A34A', sources: [], smeEnabled: false },
  { id: 'APPID-221088', name: 'Payment Gateway',          appid: 'APPID-221088', tier: 1, status: 'HEALTHY', statusColor: '#16A34A', sources: [], smeEnabled: false },
  { id: 'APPID-678234', name: 'Customer Notification Hub', appid: 'APPID-678234', tier: 2, status: 'HEALTHY', statusColor: '#16A34A', sources: [], smeEnabled: false },
  { id: 'APPID-789012', name: 'Analytics Platform',       appid: 'APPID-789012', tier: 2, status: 'HEALTHY', statusColor: '#16A34A', sources: [], smeEnabled: false },
  { id: 'APPID-812345', name: 'Internal Developer Portal', appid: 'APPID-812345', tier: 2, status: 'HEALTHY', statusColor: '#16A34A', sources: [], smeEnabled: false },
  { id: 'APPID-923456', name: 'API Catalogue',            appid: 'APPID-923456', tier: 2, status: 'HEALTHY', statusColor: '#16A34A', sources: [], smeEnabled: false },
  { id: 'APPID-901234', name: 'Workforce Identity',       appid: 'APPID-901234', tier: 2, status: 'HEALTHY', statusColor: '#16A34A', sources: [], smeEnabled: false },
];

const FRESHNESS_COLORS = {
  LIVE:   '#16A34A',
  SYNCED: '#0D9488',
  STALE:  '#D97706',
};

const TIER_STYLES = {
  1: { bg: 'rgba(220,38,38,0.12)',  color: '#DC2626', border: 'rgba(220,38,38,0.3)',  label: 'TIER 1' },
  2: { bg: 'rgba(37,99,235,0.12)',  color: '#3B82F6', border: 'rgba(37,99,235,0.3)',  label: 'TIER 2' },
  3: { bg: 'rgba(13,148,136,0.12)', color: '#0D9488', border: 'rgba(13,148,136,0.3)', label: 'TIER 3' },
};

function AppCard({ app }) {
  const tierStyle = TIER_STYLES[app.tier];
  const navigate = useNavigate();

  const handleOpen = () => {
    if (!app.smeEnabled) {
      alert('No knowledge source connected for this application.\nContact the Digital SME team to onboard this application.');
      return;
    }
    navigate(`/chat/${app.appid}`);
  };

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      transition: 'border-color 0.15s',
      position: 'relative',
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = app.smeEnabled ? 'var(--accent-teal)' : 'var(--border)'}
    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: 2 }}>
            {app.name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
            {app.appid}
          </div>
        </div>
        <span style={{
          fontSize: 10,
          fontWeight: 600,
          padding: '2px 7px',
          borderRadius: 4,
          background: tierStyle.bg,
          color: tierStyle.color,
          border: `1px solid ${tierStyle.border}`,
          letterSpacing: '0.04em',
          flexShrink: 0,
          fontFamily: 'JetBrains Mono, monospace',
        }}>
          {tierStyle.label}
        </span>
      </div>

      {/* Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: app.statusColor, display: 'inline-block', flexShrink: 0 }}
          className={app.status === 'HEALTHY' ? 'live-dot' : ''} />
        <span style={{ fontSize: 12, color: app.statusColor, fontWeight: 500, fontFamily: 'JetBrains Mono, monospace' }}>
          {app.status}
        </span>
        {app.activeIncidents && app.activeIncidents.map(inc => (
          <span key={inc} style={{
            fontSize: 10, padding: '1px 5px', borderRadius: 3,
            background: 'rgba(220,38,38,0.12)', color: '#DC2626',
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            {inc}
          </span>
        ))}
      </div>

      {/* Source freshness pills */}
      {app.sources.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {app.sources.map(s => {
            const color = FRESHNESS_COLORS[s.freshness] || '#64748B';
            return (
              <span key={s.label} style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 10, padding: '2px 6px', borderRadius: 4,
                background: `${color}18`, border: `1px solid ${color}40`,
                color: '#94A3B8',
              }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, display: 'inline-block' }}
                  className={s.freshness === 'LIVE' ? 'live-dot' : ''} />
                {s.label}
              </span>
            );
          })}
        </div>
      ) : (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
          No knowledge source connected
        </div>
      )}

      {/* Open button */}
      <button
        onClick={handleOpen}
        style={{
          marginTop: 4,
          padding: '7px 0',
          borderRadius: 6,
          border: `1px solid ${app.smeEnabled ? 'var(--accent-teal)' : 'var(--border)'}`,
          background: app.smeEnabled ? 'rgba(13,148,136,0.1)' : 'var(--bg-elevated)',
          color: app.smeEnabled ? 'var(--accent-teal)' : 'var(--text-muted)',
          fontSize: 12,
          fontWeight: 500,
          cursor: app.smeEnabled ? 'pointer' : 'not-allowed',
          transition: 'all 0.15s',
          width: '100%',
        }}
        onMouseEnter={e => app.smeEnabled && (e.currentTarget.style.background = 'rgba(13,148,136,0.2)')}
        onMouseLeave={e => app.smeEnabled && (e.currentTarget.style.background = 'rgba(13,148,136,0.1)')}
      >
        {app.smeEnabled ? 'Open in SME →' : 'Not onboarded'}
      </button>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const degradedApps = APPS.filter(a => a.status === 'DEGRADED');
  const degradedCount = degradedApps.length;
  const monitoringCount = APPS.filter(a => a.status === 'MONITORING').length;
  const healthyCount = APPS.filter(a => a.status === 'HEALTHY').length;
  const firstDegradedSme = degradedApps.find(a => a.smeEnabled);

  return (
    <div style={{ height: '100vh', overflowY: 'auto', background: 'var(--bg-primary)' }}>
      {/* Top nav */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        padding: '0 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 52,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>TrueBank</span>
            <span style={{ fontSize: 11, color: 'var(--accent-teal)', letterSpacing: '0.06em', fontFamily: 'JetBrains Mono, monospace', marginLeft: 8 }}>DIGITAL SME</span>
            <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginLeft: 6 }}>v2.1</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
          <span style={{ color: 'var(--accent-red)' }}>● {degradedCount} Degraded</span>
          <span style={{ color: '#EAB308' }}>● {monitoringCount} Monitoring</span>
          <span style={{ color: 'var(--accent-green)' }}>● {healthyCount} Healthy</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '28px 28px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>
            Application Portfolio
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {APPS.length} applications · Digital SME coverage: TruView Core, Web, Mobile, Digital SME
          </p>
        </div>

        {/* Status summary banner if degraded */}
        {degradedCount > 0 && (
          <div style={{
            background: 'rgba(217,119,6,0.08)',
            border: '1px solid rgba(217,119,6,0.3)',
            borderRadius: 8,
            padding: '10px 16px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <span style={{ color: 'var(--accent-amber)', fontSize: 16 }}>⚠</span>
            <span style={{ fontSize: 13, color: 'var(--accent-amber)', fontWeight: 500 }}>
              {degradedCount} application{degradedCount > 1 ? 's' : ''} degraded — active incidents in progress
            </span>
            {firstDegradedSme && (
              <button
                onClick={() => navigate(`/chat/${firstDegradedSme.appid}`)}
                style={{
                  marginLeft: 'auto', fontSize: 12, padding: '4px 12px',
                  background: 'rgba(217,119,6,0.15)', border: '1px solid rgba(217,119,6,0.4)',
                  borderRadius: 5, color: 'var(--accent-amber)', cursor: 'pointer',
                }}
              >
                View in SME →
              </button>
            )}
          </div>
        )}

        {/* App grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
          gap: 14,
        }}>
          {APPS.map(app => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>

        {/* Footer note */}
        <div style={{ marginTop: 32, fontSize: 11, color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <span>
            TrueBank Digital SME Platform v2.1 · Prototype · Knowledge scope: TruView Platform + Digital SME ·
            Non-TruView applications require Digital SME team onboarding
          </span>
          <Link
            to="/about"
            style={{
              fontSize: 11, color: 'var(--accent-teal)',
              textDecoration: 'none', whiteSpace: 'nowrap',
              fontFamily: 'JetBrains Mono, monospace',
            }}
            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
          >
            About this application →
          </Link>
        </div>
      </div>
    </div>
  );
}
