// Knowledge base loader — adjusts all ingest_ts to be relative to server start
// so freshness states (LIVE/SYNCED/STALE) work correctly at runtime

import { servicenowChunks } from './servicenow.js';
import { confluenceChunks } from './confluence.js';
import { dynatraceChunks } from './dynatrace.js';
import { cicdChunks } from './cicd.js';
import { awsCmdbChunks } from './aws_cmdb.js';
import { architectureChunks } from './architecture.js';
import { onboardingChunks } from './onboarding.js';

// Offset minutes per source system — how old the "ingest" should appear at startup
// This ensures the freshness bar shows correct states regardless of when the app is run
const SOURCE_INGEST_OFFSETS = {
  servicenow_incidents:  5,    // 5 min ago  → LIVE  (ttl 1h)
  servicenow_changes:    10,   // 10 min ago → LIVE  (ttl 8h)
  servicenow_cmdb:       20,   // 20 min ago → LIVE  (ttl 24h)
  servicenow_problems:   30,   // 30 min ago → LIVE  (ttl 72h)
  dynatrace_problems:    3,    // 3 min ago  → LIVE  (ttl 1h)
  dynatrace_slo:         8,    // 8 min ago  → LIVE  (ttl 2h)
  dynatrace_health:      2,    // 2 min ago  → LIVE  (ttl 1h)
  cicd_pipelines:        15,   // 15 min ago → LIVE  (ttl 48h)
  aws_infrastructure:    15,   // 15 min ago → SYNCED (ttl 2h — 15min < 2h = LIVE actually)
  aws_cloudtrail:        20,   // 20 min ago → LIVE  (ttl 2h)
  aws_config:            18,   // 18 min ago → LIVE  (ttl 4h)
  confluence_adr:        125,  // ~2h ago    → SYNCED (ttl 168h — well within)
  confluence_runbooks:   130,  // ~2h ago    → SYNCED
  confluence_service_catalog: 120,
  confluence_onboarding: 135,
  architecture_ea:       480,  // 8h ago     → SYNCED (ttl 168h)
};

// Default offset if source not listed (3h)
const DEFAULT_OFFSET_MINUTES = 180;

function adjustTimestamps(chunks) {
  const now = Date.now();
  return chunks.map(chunk => {
    const offsetMinutes = SOURCE_INGEST_OFFSETS[chunk.source] ?? DEFAULT_OFFSET_MINUTES;
    const ingestTs = new Date(now - offsetMinutes * 60 * 1000).toISOString();
    return { ...chunk, ingest_ts: ingestTs };
  });
}

const allRaw = [
  ...servicenowChunks,
  ...confluenceChunks,
  ...dynatraceChunks,
  ...cicdChunks,
  ...awsCmdbChunks,
  ...architectureChunks,
  ...onboardingChunks,
];

export const knowledgeBase = adjustTimestamps(allRaw);

// Freshness computation
export function chunkFreshness(chunk) {
  const hoursSinceIngest = (Date.now() - new Date(chunk.ingest_ts)) / 3600000;
  if (hoursSinceIngest < chunk.ttl_hours) return 'LIVE';
  if (hoursSinceIngest < chunk.ttl_hours * 3) return 'SYNCED';
  return 'STALE';
}

// Freshness summary per source system — for the FreshnessBar
export function getSourceFreshness(appid) {
  const scope = appid === 'ALL' ? null : appid;
  const relevantChunks = scope
    ? knowledgeBase.filter(c => c.appid === scope || c.appid === 'ALL')
    : knowledgeBase;

  const sourceMap = {};
  for (const chunk of relevantChunks) {
    const f = chunkFreshness(chunk);
    const existing = sourceMap[chunk.source_label];
    // Keep the worst freshness state per source
    const rank = { LIVE: 0, SYNCED: 1, STALE: 2 };
    if (!existing || rank[f] > rank[existing.freshness]) {
      sourceMap[chunk.source_label] = {
        source_label: chunk.source_label,
        source: chunk.source,
        freshness: f,
        ingest_ts: chunk.ingest_ts,
      };
    }
  }
  return Object.values(sourceMap);
}

console.log(`[knowledge-base] Loaded ${knowledgeBase.length} chunks from ${new Set(knowledgeBase.map(c => c.source_label)).size} source systems`);
