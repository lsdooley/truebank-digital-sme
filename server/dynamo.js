/**
 * DynamoDB live chunk reader
 *
 * Reads knowledge chunks written by the log-sync Lambda.
 * Results are cached in-memory for 5 minutes to avoid a DynamoDB call
 * on every chat request. Falls back to an empty array if TABLE_NAME is
 * not set (local dev) or if DynamoDB is unreachable.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const TABLE_NAME  = process.env.TABLE_NAME;
const CACHE_TTL   = 5 * 60 * 1000; // 5 minutes

let client      = null;
let cachedChunks = [];
let cacheTs      = 0;

function getClient() {
  if (!client) {
    client = DynamoDBDocumentClient.from(
      new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' })
    );
  }
  return client;
}

export async function getLiveChunks() {
  if (!TABLE_NAME) return []; // local dev — no DynamoDB configured

  const now = Date.now();
  if (now - cacheTs < CACHE_TTL) return cachedChunks;

  try {
    const result = await getClient().send(new ScanCommand({ TableName: TABLE_NAME }));
    cachedChunks = (result.Items || []).map(item => ({
      ...item,
      ingest_ts: item.ingest_ts || new Date().toISOString(),
    }));
    cacheTs = now;
    console.log(`[dynamo] Refreshed live chunk cache — ${cachedChunks.length} chunk(s)`);
    return cachedChunks;
  } catch (err) {
    console.error('[dynamo] Failed to load live chunks:', err.message);
    return cachedChunks; // serve stale cache rather than crash
  }
}
