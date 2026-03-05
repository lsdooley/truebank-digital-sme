import { useState, useEffect, useRef } from 'react';

function formatTime(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

export default function IncidentTimer() {
  const [state, setState] = useState('stopped'); // stopped | running | paused
  const [elapsed, setElapsed] = useState(0);
  const [laps, setLaps] = useState([]);
  const intervalRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    if (state === 'running') {
      startRef.current = Date.now() - elapsed;
      intervalRef.current = setInterval(() => {
        setElapsed(Date.now() - startRef.current);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [state]);

  const start = () => setState('running');
  const stop = () => setState('paused');
  const reset = () => { setState('stopped'); setElapsed(0); setLaps([]); };
  const restart = () => { setElapsed(0); setLaps([]); setState('running'); };
  const lap = () => setLaps(prev => [...prev, elapsed]);

  const isStopped = state === 'stopped';
  const isRunning = state === 'running';
  const isPaused = state === 'paused';

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em', marginBottom: 8 }}>
        INCIDENT TIMER
      </div>

      <div
        style={{
          fontSize: 22,
          fontFamily: 'JetBrains Mono, monospace',
          fontWeight: 500,
          textAlign: 'center',
          marginBottom: 10,
          letterSpacing: '0.05em',
          color: isRunning ? 'var(--accent-red)' : isPaused ? 'var(--accent-amber)' : 'var(--text-secondary)',
          animation: isRunning ? 'timer-pulse 1s step-end infinite' : 'none',
        }}
      >
        {formatTime(elapsed)}
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        {isStopped && (
          <button onClick={start} className="btn-primary" style={{ flex: 1, fontSize: 12, padding: '5px 0', background: 'var(--accent-green)' }}>
            ▶ START
          </button>
        )}
        {isRunning && (
          <>
            <button onClick={stop} style={{ flex: 1, fontSize: 12, padding: '5px 0', background: 'var(--accent-red)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
              ■ STOP
            </button>
            <button onClick={lap} className="btn-ghost" style={{ fontSize: 12, padding: '5px 8px' }}>
              LAP
            </button>
          </>
        )}
        {isPaused && (
          <>
            <button onClick={restart} className="btn-primary" style={{ flex: 1, fontSize: 12, padding: '5px 0', background: 'var(--accent-green)' }}>
              ▶ RESTART
            </button>
            <button onClick={reset} className="btn-ghost" style={{ fontSize: 12, padding: '5px 8px' }}>
              RESET
            </button>
          </>
        )}
      </div>

      {laps.length > 0 && (
        <div style={{ marginTop: 8, maxHeight: 60, overflowY: 'auto' }}>
          {laps.map((t, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', padding: '1px 0' }}>
              <span>LAP {i + 1}</span>
              <span>{formatTime(t)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
