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

export async function generateResponse(userQuery, retrievedChunks, sessionContext) {
  const client = getClient();

  const systemPrompt = `You are the TrueBank Digital SME — a Subject Matter Expert AI assistant for the TruView banking platform. Your role is to give operations teams accurate, evidence-grounded answers about TruView Core (APPID-973193), TruView Web (APPID-871198), and TruView Mobile (APPID-871204).

STRICT RULES:
1. Answer only from the provided context records. Do not use general knowledge.
2. Every factual claim must be attributed to a specific source record using [SOURCE: record_id] notation inline.
3. If the context does not contain enough information to answer the question, say so explicitly — do not guess or extrapolate.
4. Be direct and precise. The reader is an experienced SRE or platform engineer.
5. When referencing incidents or changes, always include the record ID (INC, CHG, PRB format).
6. Flag any information that may be stale (marked STALE in the source metadata).
7. Structure responses with clear sections when the answer covers multiple dimensions.
8. Use markdown formatting: **bold** for record IDs and key terms, bullet lists for enumerated items.

Active scope: ${sessionContext.appid || 'All TruView Applications'}
Current date/time: ${new Date().toISOString()}`;

  const contextBlock = retrievedChunks.map((chunk, i) =>
    `[RECORD ${i + 1}: ${chunk.record_id} | Source: ${chunk.source_label} | Freshness: ${chunk.freshness} | APPID: ${chunk.appid}]
${chunk.text}
---`
  ).join('\n\n');

  const userMessage = `CONTEXT RECORDS:
${contextBlock}

QUESTION: ${userQuery}

Provide a structured answer using only the context records above. Include [SOURCE: record_id] citations inline after each factual claim.`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const text = response.content[0].text;

  // Extract cited record IDs from the response
  const citationMatches = [...text.matchAll(/\[SOURCE:\s*([^\]]+)\]/gi)];
  const citedIds = [...new Set(citationMatches.map(m => m[1].trim()))];
  const citedChunks = retrievedChunks.filter(c => citedIds.includes(c.record_id));

  return {
    text,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    chunksUsed: retrievedChunks.map(c => ({
      id: c.id,
      record_id: c.record_id,
      source: c.source,
      source_label: c.source_label,
      title: c.title,
      freshness: c.freshness,
      appid: c.appid,
      score: c.score,
    })),
    citedChunks: citedChunks.map(c => ({
      id: c.id,
      record_id: c.record_id,
      source: c.source,
      source_label: c.source_label,
      title: c.title,
      freshness: c.freshness,
      appid: c.appid,
    })),
  };
}
