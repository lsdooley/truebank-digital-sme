import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { retrieveChunks, getQueryTokens } from './retrieval.js';
import { generateResponse } from './haiku.js';
import { getSourceFreshness, knowledgeBase } from './data/index.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', chunks: knowledgeBase.length, timestamp: new Date().toISOString() });
});

// Source freshness endpoint
app.get('/api/freshness', (req, res) => {
  const { appid } = req.query;
  const freshness = getSourceFreshness(appid || 'ALL');
  res.json({ sources: freshness, timestamp: new Date().toISOString() });
});

// Main chat endpoint
app.post('/api/chat', async (req, res) => {
  const { query, appid, sessionId } = req.body;

  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({ error: 'query is required' });
  }

  const retrievalStart = Date.now();
  const queryTokens = getQueryTokens(query);
  const chunks = retrieveChunks(query, { appid: appid || 'ALL', maxChunks: 6 });
  const retrievalMs = Date.now() - retrievalStart;

  const topResults = chunks.slice(0, 5).map(c => ({
    record_id: c.record_id,
    score: Math.round(c.score * 10) / 10,
  }));

  if (chunks.length === 0) {
    return res.json({
      response: 'No relevant knowledge base records found for this query in the current scope. Try broadening your query or switching to "All TruView" scope.',
      citations: [],
      reasoning: {
        queryTokens,
        chunksEvaluated: knowledgeBase.length,
        chunksSelected: 0,
        topResults: [],
        retrievalMs,
        modelMs: 0,
        inputTokens: 0,
        outputTokens: 0,
        activeScope: appid || 'ALL',
        citationsFound: 0,
      },
    });
  }

  let modelResult;
  let modelMs = 0;
  let modelError = null;

  try {
    const modelStart = Date.now();
    modelResult = await generateResponse(query, chunks, { appid: appid || 'ALL', sessionId });
    modelMs = Date.now() - modelStart;
  } catch (err) {
    modelError = err.message;
    console.error('[haiku] Error:', err.message);
  }

  if (modelError) {
    // Graceful degradation — return retrieved chunks without AI response
    return res.json({
      response: null,
      error: 'AI model temporarily unavailable. Knowledge base records were retrieved successfully.',
      errorDetail: modelError,
      citations: chunks.map(c => ({
        id: c.id,
        record_id: c.record_id,
        source: c.source,
        source_label: c.source_label,
        title: c.title,
        freshness: c.freshness,
        appid: c.appid,
      })),
      reasoning: {
        queryTokens,
        chunksEvaluated: knowledgeBase.length,
        chunksSelected: chunks.length,
        topResults,
        retrievalMs,
        modelMs: 0,
        inputTokens: 0,
        outputTokens: 0,
        activeScope: appid || 'ALL',
        citationsFound: 0,
      },
    });
  }

  const citedIds = new Set(modelResult.citedChunks.map(c => c.record_id));

  res.json({
    response: modelResult.text,
    citations: modelResult.chunksUsed.map(c => ({
      ...c,
      cited: citedIds.has(c.record_id),
    })),
    reasoning: {
      queryTokens,
      chunksEvaluated: knowledgeBase.length,
      chunksSelected: chunks.length,
      topResults,
      retrievalMs,
      modelMs,
      inputTokens: modelResult.inputTokens,
      outputTokens: modelResult.outputTokens,
      activeScope: appid || 'ALL',
      citationsFound: citedIds.size,
    },
  });
});

app.listen(PORT, () => {
  console.log(`[server] TrueBank Digital SME API running on http://localhost:${PORT}`);
});
