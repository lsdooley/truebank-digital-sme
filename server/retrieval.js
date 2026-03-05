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
  // Basic suffix stripping — order matters: longest suffixes first
  if (word.endsWith('ing') && word.length > 6) return word.slice(0, -3);
  if (word.endsWith('tion') && word.length > 6) return word.slice(0, -4);
  if (word.endsWith('ed') && word.length > 5)  return word.slice(0, -2);
  if (word.endsWith('er') && word.length > 4)  return word.slice(0, -2);
  if (word.endsWith('ly') && word.length > 4)  return word.slice(0, -2);
  if (word.endsWith('es') && word.length > 4)  return word.slice(0, -2);
  if (word.endsWith('s')  && word.length > 3)  return word.slice(0, -1);
  // Strip trailing silent 'e' to unify "change"→"chang", "upgrade"→"upgrad"
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

function extractPhrases(text, minLen = 2) {
  const words = text.toLowerCase().split(/\s+/);
  const phrases = [];
  for (let len = 2; len <= 4; len++) {
    for (let i = 0; i <= words.length - len; i++) {
      phrases.push(words.slice(i, i + len).join(' '));
    }
  }
  return phrases;
}

export function retrieveChunks(query, options = {}) {
  const { appid, maxChunks = 6, minScore = 0.5 } = options;

  const queryTokens = tokenize(query);
  const queryPhrases = extractPhrases(query, 2);
  const queryLower = query.toLowerCase();

  if (queryTokens.length === 0) return [];

  // APPID scope filter
  let candidates = knowledgeBase;
  if (appid && appid !== 'ALL') {
    candidates = knowledgeBase.filter(c => c.appid === appid || c.appid === 'ALL');
  }

  const scored = candidates.map(chunk => {
    const titleLower = chunk.title.toLowerCase();
    const textLower = chunk.text.toLowerCase();
    const tagsLower = chunk.tags.map(t => t.toLowerCase());
    const titleTokens = tokenize(chunk.title);
    const textTokens = new Set(tokenize(chunk.text));

    let score = 0;

    // Title match: +3.0 per matching token
    for (const qt of queryTokens) {
      if (titleTokens.includes(qt)) score += 3.0;
    }

    // Tag match: +2.0 per matching token
    for (const qt of queryTokens) {
      if (tagsLower.some(tag => tag.includes(qt))) score += 2.0;
    }

    // Text match: +1.0 per unique matching token
    for (const qt of queryTokens) {
      if (textTokens.has(qt)) score += 1.0;
    }

    // Exact phrase bonus: +5.0 per matching 2+ word phrase
    for (const phrase of queryPhrases) {
      if (phrase.length > 3 && textLower.includes(phrase)) score += 5.0;
      if (phrase.length > 3 && titleLower.includes(phrase)) score += 3.0;
    }

    // APPID match bonus
    if (appid && chunk.appid === appid) score += 2.0;

    // Recency bonus
    const ingestAge = (Date.now() - new Date(chunk.ingest_ts)) / 3600000;
    if (ingestAge < 6) score += 1.5;
    else if (ingestAge < 24) score += 0.8;

    // Severity bonus
    if (chunk.meta?.severity === 'SEV1' || chunk.meta?.severity === 'SEV2') score += 2.0;
    else if (chunk.meta?.severity === 'SEV3') score += 1.0;

    const freshness = chunkFreshness(chunk);
    return { ...chunk, score, freshness };
  });

  return scored
    .filter(c => c.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxChunks);
}

export function getQueryTokens(query) {
  return tokenize(query);
}
