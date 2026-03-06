import { useState, useCallback } from 'react';

export const APP_SCOPES = [
  { id: 'APPID-973193', label: 'TruView Core', short: 'Core' },
  { id: 'APPID-871198', label: 'TruView Web', short: 'Web' },
  { id: 'APPID-871204', label: 'TruView Mobile', short: 'Mobile' },
  { id: 'APPID-7779311', label: 'TrueBank Digital SME', short: 'SME' },
  { id: 'ALL', label: 'All TruView', short: 'All' },
];

export function useAppScope(initialAppid = 'ALL') {
  const [activeAppid, setActiveAppid] = useState(initialAppid);
  const [recentQueries, setRecentQueries] = useState([]);

  const activeScope = APP_SCOPES.find(s => s.id === activeAppid) || APP_SCOPES[3];

  const addRecentQuery = useCallback((query) => {
    setRecentQueries(prev => {
      const filtered = prev.filter(q => q !== query);
      return [query, ...filtered].slice(0, 8);
    });
  }, []);

  return { activeAppid, setActiveAppid, activeScope, recentQueries, addRecentQuery };
}
