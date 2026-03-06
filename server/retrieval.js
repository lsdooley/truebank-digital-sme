import { knowledgeBase, chunkFreshness } from './data/index.js';

const STOP_WORDS = new Set([
  'a','an','the','is','are','was','were','be','been','being','have','has','had',
  'do','does','did','will','would','could','should','may','might','shall','can',
  'to','of','in','on','at','by','for','with','about','into','through','during',
  'before','after','above','below','from','up','down','out','off','over','under',
  'and','but','or','nor','so','yet','both','either','neither','not','no',
  'i','me','my','we','our','you','your','he','his','she','her','they','their',
  'it','its','this','that','these','those','what','which','who','whom','when',
  'where','why','how','all','any','each','every','few','more','most','other',
  'some','such','than','then','there','too','very','just','also','now','here',
  'if','as','at','us',
]);

function stem(word) {
  if (word.endsWith('ing') && word.length > 6) return word.slice(0, -3);
  if (word.endsWith('tion') && word.length > 6) return word.slice(0, -4);
  if (word.endsWith('ed') && word.length > 5)  return word.slice(0, -2);
  if (word.endsWith('er') && word.length > 4)  return word.slice(0, -2);
  if (word.endsWith('ly') && word.length > 4)  return word.slice(0, -2);
  if (word.endsWith('es') && word.length > 4)  return word.slice(0, -2);
  if (word.endsWith('s')  && word.length > 3)  return word.slice(0, -1);
  if (word.endsWith('e') && word.length > 3)   return word.slice(0, -1);
  return word;
}

function tokenize(text) {
  return text
    .toLowerCase()
    .split(/[\s\.,;:!?'"()\[\]{}\-\/\\]+/)
    .filter(t => t.length > 1 && !STOP_WORDS.has(t))
    .map(stem);
}

function extractPhrases(text) {
  const words = text.toLowerCase().split(/\s+/);
  const phrases = [];
  for (let len = 2; len <= 4; len++) {
    for (let i = 0; i <= words.length - len; i++) {
      phrases.push(words.slice(i, i + len).join(' '));
    }
  }
  return phrases;
}

// ─── INTENT DETECTION ───────────────────────────────────────────────────────
// Determines which global retrieval pools should be activated for this query.

const POLICY_KEYWORDS = new Set([
  'policy', 'policies', 'compliance', 'regulation', 'regulatory', 'gdpr', 'privacy',
  'pci', 'pcidss', 'requirement', 'required', 'permitted', 'allowed', 'standard',
  'mandate', 'mandatory', 'audit', 'obligation', 'govern', 'governance', 'legal',
  'retention', 'classification', 'restricted', 'breach', 'incident-policy',
]);

const CVE_KEYWORDS = new Set([
  'cve', 'vulnerability', 'vulnerabilities', 'vulnerable', 'security', 'exploit',
  'patch', 'patching', 'exposure', 'risk', 'zero-day', 'zeroday', 'dependency',
  'dependencies', 'cvss', 'critical', 'high-severity', 'ssrf', 'injection',
  'redos', 'dos', 'supply-chain', 'advisory', 'disclosure', 'remediat',
]);

export function detectIntent(query) {
  const words = query.toLowerCase().split(/[\s\.,;:!?()\[\]{}\-\/\\]+/);
  const stemmed = words.map(stem);

  const policyIntent = stemmed.some(w => POLICY_KEYWORDS.has(w) || [...POLICY_KEYWORDS].some(k => w.startsWith(k)));
  const cveIntent = stemmed.some(w => CVE_KEYWORDS.has(w) || [...CVE_KEYWORDS].some(k => w.startsWith(k)));

  return { policyIntent, cveIntent };
}

// ─── CHUNK SCORING ───────────────────────────────────────────────────────────

function scoreChunk(chunk, queryTokens, queryPhrases, queryLower, appid) {
  const titleLower = chunk.title.toLowerCase();
  const textLower = chunk.text.toLowerCase();
  const tagsLower = chunk.tags.map(t => t.toLowerCase());
  const titleTokens = tokenize(chunk.title);
  const textTokens = new Set(tokenize(chunk.text));

  let score = 0;

  for (const qt of queryTokens) {
    if (titleTokens.includes(qt)) score += 3.0;
  }
  for (const qt of queryTokens) {
    if (tagsLower.some(tag => tag.includes(qt))) score += 2.0;
  }
  for (const qt of queryTokens) {
    if (textTokens.has(qt)) score += 1.0;
  }
  for (const phrase of queryPhrases) {
    if (phrase.length > 3 && textLower.includes(phrase)) score += 5.0;
    if (phrase.length > 3 && titleLower.includes(phrase)) score += 3.0;
  }

  if (appid && chunk.appid === appid) score += 2.0;

  const ingestAge = (Date.now() - new Date(chunk.ingest_ts)) / 3600000;
  if (ingestAge < 6) score += 1.5;
  else if (ingestAge < 24) score += 0.8;

  if (chunk.meta?.severity === 'SEV1' || chunk.meta?.severity === 'SEV2') score += 2.0;
  else if (chunk.meta?.severity === 'SEV3') score += 1.0;

  const freshness = chunkFreshness(chunk);
  return { ...chunk, score, freshness };
}

// ─── RETRIEVAL ───────────────────────────────────────────────────────────────

export function retrieveChunks(query, options = {}) {
  const {
    appid,
    maxChunks = 4,       // Pool A: app-scoped chunks
    maxPolicyChunks = 2, // Pool B: policy chunks (only if policyIntent)
    maxCveChunks = 2,    // Pool C: CVE chunks (only if cveIntent)
    minScore = 0.5,
  } = options;

  const queryTokens = tokenize(query);
  const queryPhrases = extractPhrases(query);
  const queryLower = query.toLowerCase();

  if (queryTokens.length === 0) return { chunks: [], intent: { policyIntent: false, cveIntent: false } };

  const intent = detectIntent(query);

  // ── Pool A: app-scoped chunks (always) ──────────────────────────────────
  let appCandidates = knowledgeBase.filter(c => c.appid !== 'POLICY' && c.appid !== 'CVE');
  if (appid && appid !== 'ALL') {
    appCandidates = appCandidates.filter(c => c.appid === appid || c.appid === 'ALL');
  }

  const appChunks = appCandidates
    .map(chunk => scoreChunk(chunk, queryTokens, queryPhrases, queryLower, appid))
    .filter(c => c.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxChunks);

  // ── Pool B: policy chunks (conditional on policyIntent) ─────────────────
  let policyChunks = [];
  if (intent.policyIntent) {
    policyChunks = knowledgeBase
      .filter(c => c.appid === 'POLICY')
      .map(chunk => scoreChunk(chunk, queryTokens, queryPhrases, queryLower, null))
      .filter(c => c.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxPolicyChunks);
  }

  // ── Pool C: CVE chunks (conditional on cveIntent) ───────────────────────
  let cveChunks = [];
  if (intent.cveIntent) {
    cveChunks = knowledgeBase
      .filter(c => c.appid === 'CVE')
      .map(chunk => scoreChunk(chunk, queryTokens, queryPhrases, queryLower, null))
      .filter(c => c.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxCveChunks);
  }

  const chunks = [...appChunks, ...policyChunks, ...cveChunks];

  return { chunks, intent };
}

export function getQueryTokens(query) {
  return tokenize(query);
}
