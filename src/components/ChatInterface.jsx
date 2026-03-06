import { useState, useRef, useEffect } from 'react';
import { useChat } from '../hooks/useChat.js';
import FreshnessBar from './FreshnessBar.jsx';
import MessageBubble from './MessageBubble.jsx';
import CitationPanel from './CitationPanel.jsx';
import { RobotAvatar } from './Sidebar.jsx';

const WELCOME_CARDS = [
  { icon: '⚡', label: 'Recent Changes',  query: 'What changed in TruView Core in the last 72 hours?' },
  { icon: '🔴', label: 'Active Incidents', query: 'Is there an active incident on TruView Core?' },
  { icon: '💥', label: 'Dependency Map',   query: 'What is the blast radius if account-service goes down?' },
  { icon: '📋', label: 'Onboarding Guide', query: 'Who do I escalate TruView Core incidents to and who is on-call?' },
];

function EmptyState({ appid, onQuery }) {
  const scopeLabel = {
    'APPID-973193': 'TruView Core',
    'APPID-871198': 'TruView Web',
    'APPID-871204': 'TruView Mobile',
    'APPID-7779311': 'TrueBank Digital SME',
    'ALL': 'All TruView Applications',
  }[appid] || appid;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <RobotAvatar size={72} loading={false} />
      <h2 style={{ marginTop: 20, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
        TrueBank Digital SME
      </h2>
      <p style={{ marginTop: 4, fontSize: 13, color: 'var(--text-secondary)' }}>
        Scoped to: <span style={{ color: 'var(--accent-teal)' }}>{scopeLabel}</span>
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 28, width: '100%', maxWidth: 480 }}>
        {WELCOME_CARDS.map(card => (
          <button
            key={card.label}
            onClick={() => onQuery(card.query)}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '14px 16px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s',
              color: 'var(--text-primary)',
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
        Scope: TruView Platform — TruView Core, Web, Mobile, Digital SME.
      </p>
    </div>
  );
}

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

export default function ChatInterface({ activeAppid, onQuerySubmit }) {
  const { messages, loading, loadingStage, sendMessage, clearMessages } = useChat();
  const [inputValue, setInputValue] = useState('');
  const [activeCitation, setActiveCitation] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Return focus to input whenever loading finishes
  useEffect(() => {
    if (!loading) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [loading]);

  const handleSubmit = (query) => {
    const q = (query || inputValue).trim();
    if (!q || loading) return;
    setInputValue('');
    setActiveCitation(null);
    if (onQuerySubmit) onQuerySubmit(q);
    sendMessage(q, activeAppid);
    // Maintain focus on the input field
    inputRef.current?.focus();
  };

  const handleCitationClick = (recordId) => {
    setActiveCitation(prev => prev === recordId ? null : recordId);
  };

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* Centre: chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Freshness bar */}
        <FreshnessBar appid={activeAppid} />

        {/* Message area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {messages.length === 0 && !loading ? (
            <EmptyState appid={activeAppid} onQuery={handleSubmit} />
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

        {/* Input area */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
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
              placeholder={`Ask about ${activeAppid === 'ALL' ? 'TruView Platform' : activeAppid}...`}
              style={{
                flex: 1,
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                color: 'var(--text-primary)',
                padding: '10px 14px',
                fontSize: 14,
                outline: 'none',
                transition: 'border-color 0.15s',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent-teal)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <button
              onClick={() => handleSubmit()}
              disabled={loading || !inputValue.trim()}
              className="btn-primary"
              style={{ padding: '10px 18px', fontSize: 13, minWidth: 80 }}
            >
              {loading ? (
                <span className="spin" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block' }} />
              ) : 'Ask'}
            </button>
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
            Press Enter to send · Every response is grounded in source records
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
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
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
