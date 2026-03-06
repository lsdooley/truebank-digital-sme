import { useState, useCallback, useRef } from 'react';

let sessionId = crypto.randomUUID();

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [error, setError] = useState(null);
  const stageTimerRef = useRef(null);

  const sendMessage = useCallback(async (query, appid) => {
    if (!query.trim() || loading) return;

    const userMsg = { role: 'user', content: query, id: crypto.randomUUID(), timestamp: new Date() };
    const assistantId = crypto.randomUUID();

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    setStreaming(false);
    setError(null);
    setLoadingStage('Retrieving from knowledge base...');

    stageTimerRef.current = setTimeout(() => {
      setLoadingStage('Generating response...');
    }, 500);

    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, appid, sessionId }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedRaw = '';
      let streamingStarted = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          let data;
          try { data = JSON.parse(line.slice(6)); } catch { continue; }

          if (data.delta !== undefined) {
            accumulatedRaw += data.delta;
            // Strip complete [SOURCE: ...] markers so they never flash in the UI
            const displayText = accumulatedRaw.replace(/\[SOURCE:\s*[^\]]+\]/g, '');

            if (!streamingStarted) {
              streamingStarted = true;
              clearTimeout(stageTimerRef.current);
              setLoadingStage('');
              setStreaming(true);
              setMessages(prev => [...prev, {
                role: 'assistant', id: assistantId, timestamp: new Date(),
                content: displayText, citations: [], reasoning: null,
                error: null, followups: [], inputTokens: 0, outputTokens: 0,
                chunksUsed: 0, streaming: true,
              }]);
            } else {
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: displayText } : m
              ));
            }
          }

          if (data.done) {
            const finalMsg = {
              role: 'assistant', id: assistantId, timestamp: new Date(),
              content: data.response,
              citations: data.citations || [],
              reasoning: data.reasoning || null,
              error: data.error || null,
              errorDetail: data.errorDetail || null,
              followups: deriveFollowups(data.citations || []),
              inputTokens: data.reasoning?.inputTokens || 0,
              outputTokens: data.reasoning?.outputTokens || 0,
              chunksUsed: data.reasoning?.chunksSelected || 0,
              streaming: false,
            };

            if (streamingStarted) {
              setMessages(prev => prev.map(m => m.id === assistantId ? finalMsg : m));
            } else {
              setMessages(prev => [...prev, finalMsg]);
            }
          }
        }
      }
    } catch (err) {
      const errMsg = {
        role: 'assistant', id: assistantId, timestamp: new Date(),
        content: null, citations: [], reasoning: null,
        error: 'Service temporarily unavailable. Please check server connection.',
        errorDetail: err.message, followups: [], streaming: false,
      };
      setMessages(prev => {
        const hasPartial = prev.some(m => m.id === assistantId);
        return hasPartial ? prev.map(m => m.id === assistantId ? errMsg : m) : [...prev, errMsg];
      });
      setError(err.message);
    } finally {
      clearTimeout(stageTimerRef.current);
      setLoading(false);
      setStreaming(false);
      setLoadingStage('');
    }
  }, [loading]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    sessionId = crypto.randomUUID();
  }, []);

  return { messages, loading, streaming, loadingStage, error, sendMessage, clearMessages };
}

// Derive follow-up suggestions based on which source systems were cited
function deriveFollowups(citations) {
  if (!citations.length) return [];

  const sources = new Set(citations.map(c => c.source));
  const recordIds = citations.map(c => c.record_id || '');

  const hasIncident = sources.has('servicenow_incidents') || recordIds.some(id => id.startsWith('INC'));
  const hasChange = sources.has('servicenow_changes') || recordIds.some(id => id.startsWith('CHG'));
  const hasRunbook = sources.has('confluence_runbooks') || recordIds.some(id => id.startsWith('KB'));
  const hasArch = sources.has('architecture_ea');
  const hasSlo = sources.has('dynatrace_slo');
  const hasKafka = citations.some(c => (c.title || '').toLowerCase().includes('kafka'));

  if (hasIncident && !hasChange) {
    return [
      'What changes were deployed before this incident?',
      'Show the runbook for this issue',
      'What is the blast radius?',
    ];
  }
  if (hasChange && !hasIncident) {
    return [
      'Are there any incidents correlated with this change?',
      'What is the rollback procedure?',
      'What SLOs are currently at risk?',
    ];
  }
  if (hasRunbook) {
    return [
      'Is there an active incident related to this?',
      'Who is the current on-call for TruView Core?',
      'What changed in the last 72 hours?',
    ];
  }
  if (hasArch) {
    return [
      'What is the current health of these services?',
      'Are there active incidents affecting these dependencies?',
      'What SLOs cover these components?',
    ];
  }
  if (hasSlo) {
    return [
      'What incidents are currently active?',
      'What changes were deployed this week?',
      'Show the runbook for the breached SLO',
    ];
  }
  if (hasKafka) {
    return [
      'Show me the Kafka consumer lag runbook',
      'What is the blast radius if account-service goes down?',
      'What changed in TruView Core this week?',
    ];
  }
  return [
    'What changed in the last 72 hours?',
    'Are there active incidents on TruView Core?',
    'Who do I escalate to?',
  ];
}
