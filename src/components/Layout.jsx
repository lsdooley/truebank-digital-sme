import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAppScope } from '../hooks/useAppScope.js';
import { useChat } from '../hooks/useChat.js';
import Sidebar from './Sidebar.jsx';
import FreshnessBar from './FreshnessBar.jsx';
import MessageBubble from './MessageBubble.jsx';
import CitationPanel from './CitationPanel.jsx';
import { RobotAvatar } from './Sidebar.jsx';

const WELCOME_CARDS = [
  { icon: '⚡', label: 'Recent Changes',   query: 'What changed in TruView Core in the last 72 hours?' },
  { icon: '🔴', label: 'Active Incidents',  query: 'Is there an active incident on TruView Core?' },
  { icon: '💥', label: 'Dependency Map',    query: 'What is the blast radius if account-service goes down?' },
  { icon: '📞', label: 'Escalation Guide',  query: 'Who do I escalate TruView Core incidents to and who is on-call?' },
];

const SCOPE_LABELS = {
  'APPID-973193': 'TruView Core',
  'APPID-871198': 'TruView Web',
  'APPID-871204': 'TruView Mobile',
  'ALL': 'All TruView Applications',
};

function LoadingBubble({ stage }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div className="msg-assistant" style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <RobotAvatar size={28} loading={true} />
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Digital SME · thinking...</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{stage}</div>
          </div>
        </div>
        <div className="dot-loader" style={{ marginTop: 12 }}>
          <span /><span /><span />
        </div>
      </div>
    </div>
  );
}

export default function Layout() {
  const { appid: urlAppid } = useParams();
  const navigate = useNavigate();
  const { activeAppid, setActiveAppid, addRecentQuery } = useAppScope(urlAppid || 'ALL');
  const { messages, loading, loadingStage, sendMessage, clearMessages } = useChat();
  const [inputValue, setInputValue] = useState('');
  const [activeCitation, setActiveCitation] = useState(null);
  const [freshnessSources, setFreshnessSources] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Sync URL to active scope
  useEffect(() => {
    navigate(`/chat/${activeAppid}`, { replace: true });
  }, [activeAppid]);

  // Reload freshness when scope changes
  useEffect(() => {
    let cancelled = false;
    const load = () => fetch(`/api/freshness?appid=${activeAppid}`)
      .then(r => r.json())
      .then(d => { if (!cancelled) setFreshnessSources(d.sources || []); })
      .catch(() => {});
    load();
    const iv = setInterval(load, 30000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [activeAppid]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSubmit = (query) => {
    const q = (query || inputValue).trim();
    if (!q || loading) return;
    setInputValue('');
    setActiveCitation(null);
    addRecentQuery(q);
    sendMessage(q, activeAppid);
  };

  const handleCitationClick = (recordId) => {
    setActiveCitation(prev => prev === recordId ? null : recordId);
  };

  const scopeLabel = SCOPE_LABELS[activeAppid] || activeAppid;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      {/* Left sidebar */}
      <Sidebar
        activeAppid={activeAppid}
        onAppChange={setActiveAppid}
        onQuery={handleSubmit}
        loading={loading}
        freshnessSources={freshnessSources}
      />

      {/* Centre: chat */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Freshness bar */}
        <FreshnessBar appid={activeAppid} />

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {messages.length === 0 && !loading ? (
            /* Empty / welcome state */
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
              <RobotAvatar size={72} loading={false} />
              <h2 style={{ marginTop: 20, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                TrueBank Digital SME
              </h2>
              <p style={{ marginTop: 4, fontSize: 13, color: 'var(--text-secondary)' }}>
                Scoped to: <span style={{ color: 'var(--accent-teal)' }}>{scopeLabel}</span>
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 28, width: '100%', maxWidth: 500 }}>
                {WELCOME_CARDS.map(card => (
                  <button
                    key={card.label}
                    onClick={() => handleSubmit(card.query)}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      padding: '14px 16px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      color: 'var(--text-primary)',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-teal)'; e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-card)'; }}
                  >
                    <div style={{ fontSize: 20, marginBottom: 6 }}>{card.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{card.label}</div>
                  </button>
                ))}
              </div>
              <p style={{ marginTop: 24, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 400 }}>
                Every answer is grounded in a source record.<br />
                Scope: TruView Platform — TruView Core, Web, Mobile.
              </p>
            </div>
          ) : (
            <>
              {messages.map(msg => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  activeCitation={activeCitation}
                  onCitationClick={handleCitationClick}
                  onFollowup={handleSubmit}
                />
              ))}
              {loading && <LoadingBubble stage={loadingStage} />}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)', flexShrink: 0 }}>
          {messages.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
              <button onClick={clearMessages} className="btn-ghost" style={{ fontSize: 11 }}>
                Clear session
              </button>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              ref={inputRef}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
              placeholder={`Ask about ${scopeLabel}...`}
              disabled={loading}
              style={{
                flex: 1,
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                color: 'var(--text-primary)',
                padding: '10px 14px',
                fontSize: 14,
                outline: 'none',
                fontFamily: 'Inter, system-ui, sans-serif',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent-teal)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <button
              onClick={() => handleSubmit()}
              disabled={loading || !inputValue.trim()}
              className="btn-primary"
              style={{ padding: '10px 18px', minWidth: 80 }}
            >
              {loading ? (
                <span className="spin" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block' }} />
              ) : 'Ask'}
            </button>
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
            Enter to send · Grounded in source records · No hallucination policy
          </div>
        </div>
      </div>

      {/* Right: context panel */}
      <div style={{
        width: 260,
        minWidth: 260,
        background: 'var(--bg-secondary)',
        borderLeft: '1px solid var(--border)',
        padding: '14px 12px',
        overflowY: 'auto',
        flexShrink: 0,
      }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 12, fontFamily: 'JetBrains Mono, monospace' }}>
          CONTEXT PANEL
        </div>
        <CitationPanel
          messages={messages}
          activeCitation={activeCitation}
          onCitationClick={handleCitationClick}
        />
      </div>
    </div>
  );
}
