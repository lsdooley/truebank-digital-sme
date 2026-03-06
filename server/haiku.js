import Anthropic from '@anthropic-ai/sdk';

let anthropicClient = null;

function getClient() {
  if (!anthropicClient) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropicClient;
}

const MAX_CHUNK_CHARS = 2000;

// Static system prompt — no dynamic values so Claude's prompt caching can apply
const SYSTEM_PROMPT = `You are the TrueBank Digital SME — a Subject Matter Expert AI assistant for the TruView banking platform. Your role is to give operations teams accurate, evidence-grounded answers about TruView Core (APPID-973193), TruView Web (APPID-871198), and TruView Mobile (APPID-871204).

STRICT RULES:
1. Answer only from the provided context records. Do not use general knowledge.
2. Attribute facts by referencing record IDs inline using [SOURCE: record_id] notation — these are stripped from the visible response and used only to build the sources list shown to the user.
3. If the context does not contain enough information to answer the question, say so explicitly — do not guess or extrapolate.
4. Be direct and precise. The reader is an experienced SRE or platform engineer.
5. When referencing incidents or changes, always include the record ID (INC, CHG, PRB format) in the text itself so it reads naturally.
6. Flag any information that may be stale (marked STALE in the source metadata).
7. Structure responses with clear sections when the answer covers multiple dimensions.
8. Use markdown formatting: **bold** for record IDs and key terms, bullet lists for enumerated items.`;

function buildUserMessage(userQuery, retrievedChunks, sessionContext) {
  const contextBlock = retrievedChunks.map((chunk, i) => {
    const text = chunk.text.length > MAX_CHUNK_CHARS
      ? chunk.text.slice(0, MAX_CHUNK_CHARS) + '\n... [truncated]'
      : chunk.text;
    return `[RECORD ${i + 1}: ${chunk.record_id} | Source: ${chunk.source_label} | Freshness: ${chunk.freshness} | APPID: ${chunk.appid}]
${text}
---`;
  }).join('\n\n');

  return `Active scope: ${sessionContext.appid || 'All TruView Applications'}
Current date/time: ${new Date().toISOString()}

CONTEXT RECORDS:
${contextBlock}

QUESTION: ${userQuery}

Provide a structured answer using only the context records above. Include [SOURCE: record_id] markers after facts so the system can identify which records you used — these markers are hidden from the user and replaced by a sources panel.`;
}

function extractCitations(rawText, retrievedChunks) {
  const citationMatches = [...rawText.matchAll(/\[SOURCE:\s*([^\]]+)\]/gi)];
  const citedIds = [...new Set(citationMatches.map(m => m[1].trim()))];
  const citedChunks = retrievedChunks.filter(c => citedIds.includes(c.record_id));
  const text = rawText.replace(/\s*\[SOURCE:\s*[^\]]+\]/gi, '').replace(/\n{3,}/g, '\n\n').trim();

  return {
    text,
    chunksUsed: retrievedChunks.map(c => ({
      id: c.id, record_id: c.record_id, source: c.source, source_label: c.source_label,
      title: c.title, freshness: c.freshness, appid: c.appid, score: c.score,
    })),
    citedChunks: citedChunks.map(c => ({
      id: c.id, record_id: c.record_id, source: c.source, source_label: c.source_label,
      title: c.title, freshness: c.freshness, appid: c.appid,
    })),
  };
}

export async function generateResponse(userQuery, retrievedChunks, sessionContext) {
  const client = getClient();

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserMessage(userQuery, retrievedChunks, sessionContext) }],
  });

  const rawText = response.content[0].text;
  const result = extractCitations(rawText, retrievedChunks);

  return {
    ...result,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}

export async function generateResponseStream(userQuery, retrievedChunks, sessionContext, onDelta) {
  const client = getClient();

  const stream = client.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserMessage(userQuery, retrievedChunks, sessionContext) }],
  });

  stream.on('text', onDelta);

  const finalMessage = await stream.finalMessage();
  const rawText = finalMessage.content[0].text;
  const result = extractCitations(rawText, retrievedChunks);

  return {
    ...result,
    inputTokens: finalMessage.usage.input_tokens,
    outputTokens: finalMessage.usage.output_tokens,
  };
}
