/**
 * truebank-sme-log-sync
 *
 * Runs every 15 minutes via EventBridge. Queries CloudWatch Logs Insights
 * for the truebank-sme-api Lambda log group and writes structured knowledge
 * chunks to DynamoDB so the RAG retrieval layer can answer live operational
 * questions about the Digital SME platform itself.
 */

import { CloudWatchLogsClient, StartQueryCommand, GetQueryResultsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const REGION      = process.env.AWS_REGION || 'us-east-1';
const TABLE_NAME  = process.env.TABLE_NAME;
const LOG_GROUP   = process.env.LOG_GROUP || '/aws/lambda/truebank-sme-api';
const WINDOW_MIN  = 15;

const logsClient = new CloudWatchLogsClient({ region: REGION });
const ddb        = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));

// ── CloudWatch Logs Insights helper ─────────────────────────────────────────

async function runQuery(queryString, startMs, endMs) {
  const { queryId } = await logsClient.send(new StartQueryCommand({
    logGroupName: LOG_GROUP,
    startTime: Math.floor(startMs / 1000),
    endTime:   Math.floor(endMs   / 1000),
    queryString,
    limit: 20,
  }));

  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const result = await logsClient.send(new GetQueryResultsCommand({ queryId }));
    if (result.status === 'Complete')  return result.results || [];
    if (result.status === 'Failed' || result.status === 'Cancelled') return [];
  }
  return [];
}

function field(row, name) {
  return row.find(f => f.field === name)?.value ?? null;
}

// ── DynamoDB upsert ──────────────────────────────────────────────────────────

async function upsertChunk(chunk) {
  const ttlEpoch = Math.floor(Date.now() / 1000) + 86400; // auto-expire after 24h
  await ddb.send(new PutCommand({ TableName: TABLE_NAME, Item: { ...chunk, ttl: ttlEpoch } }));
}

// ── Handler ──────────────────────────────────────────────────────────────────

export async function handler() {
  const now         = Date.now();
  const windowStart = now - WINDOW_MIN * 60 * 1000;
  const isoNow      = new Date(now).toISOString();

  let synced = 0;

  // ── 1. Lambda performance summary (last 15 min) ──────────────────────────
  const perfRows = await runQuery(
    `filter @type = "REPORT"
     | stats count()                as invocations,
             avg(@duration)         as avgDuration,
             max(@duration)         as maxDuration,
             count(@initDuration)   as coldStarts,
             avg(@initDuration)     as avgInitDuration,
             avg(@maxMemoryUsed)    as avgMemoryMB,
             max(@maxMemoryUsed)    as maxMemoryMB`,
    windowStart, now,
  );

  if (perfRows.length > 0) {
    const r            = perfRows[0];
    const invocations  = parseInt(field(r, 'invocations')    || '0');
    const avgDuration  = parseFloat(field(r, 'avgDuration')  || '0').toFixed(0);
    const maxDuration  = parseFloat(field(r, 'maxDuration')  || '0').toFixed(0);
    const coldStarts   = parseInt(field(r, 'coldStarts')     || '0');
    const avgInit      = parseFloat(field(r, 'avgInitDuration') || '0').toFixed(0);
    const avgMemMB     = parseFloat(field(r, 'avgMemoryMB')  || '0').toFixed(0);
    const maxMemMB     = parseFloat(field(r, 'maxMemoryMB')  || '0').toFixed(0);

    await upsertChunk({
      id:           'cw_perf_current',
      record_id:    'CW-PERF-CURRENT',
      source:       'cloudwatch_logs',
      source_label: 'CloudWatch',
      appid:        'APPID-7779311',
      title:        `Digital SME Lambda Performance — Last ${WINDOW_MIN} min`,
      text: [
        `**Lambda Performance Summary — Last ${WINDOW_MIN} Minutes**`,
        ``,
        `- **Invocations:** ${invocations}`,
        `- **Average Duration:** ${avgDuration}ms`,
        `- **Max Duration:** ${maxDuration}ms`,
        `- **Cold Starts:** ${coldStarts}${coldStarts > 0 ? ` (avg init: ${avgInit}ms)` : ''}`,
        `- **Average Memory Used:** ${avgMemMB}MB`,
        `- **Peak Memory Used:** ${maxMemMB}MB`,
        `- **Log Group:** ${LOG_GROUP}`,
        `- **Period:** ${new Date(windowStart).toISOString()} → ${isoNow}`,
      ].join('\n'),
      tags:           ['performance', 'lambda', 'cloudwatch', 'latency', 'cold-start', 'memory', 'duration'],
      classification: 'INTERNAL',
      freshness_ts:   isoNow,
      ingest_ts:      isoNow,
      ttl_hours:      0.5,
      meta: { invocations, avgDuration: Number(avgDuration), maxDuration: Number(maxDuration), coldStarts },
    });
    synced++;
  }

  // ── 2. Recent errors (last 15 min) ───────────────────────────────────────
  const errorRows = await runQuery(
    `fields @timestamp, @message, @requestId
     | filter @message like /ERROR/
     | sort @timestamp desc
     | limit 10`,
    windowStart, now,
  );

  const errorCount = errorRows.length;
  const errorLines = errorRows.map(r => {
    const ts  = field(r, '@timestamp') || '';
    const msg = (field(r, '@message')  || '').replace(/\n/g, ' ').slice(0, 200);
    return `- [${ts}] ${msg}`;
  }).join('\n');

  await upsertChunk({
    id:           'cw_errors_current',
    record_id:    'CW-ERRORS-CURRENT',
    source:       'cloudwatch_logs',
    source_label: 'CloudWatch',
    appid:        'APPID-7779311',
    title:        `Digital SME Lambda Errors — Last ${WINDOW_MIN} min (${errorCount} error${errorCount !== 1 ? 's' : ''})`,
    text: errorCount > 0
      ? [`**Lambda Error Log — Last ${WINDOW_MIN} Minutes**`, ``, `${errorCount} error(s) detected:`, ``, errorLines, ``, `Log Group: ${LOG_GROUP}`].join('\n')
      : `**Lambda Error Log — Last ${WINDOW_MIN} Minutes**\n\nNo errors detected in ${LOG_GROUP} in the last ${WINDOW_MIN} minutes.`,
    tags:           ['error', 'lambda', 'cloudwatch', 'exception', errorCount > 0 ? 'errors-present' : 'healthy'],
    classification: 'INTERNAL',
    freshness_ts:   isoNow,
    ingest_ts:      isoNow,
    ttl_hours:      0.5,
    meta: { errorCount, severity: errorCount > 5 ? 'SEV2' : errorCount > 0 ? 'SEV3' : null },
  });
  synced++;

  // ── 3. Invocation trend — last 6 hours by hour ───────────────────────────
  const trendRows = await runQuery(
    `filter @type = "REPORT"
     | stats count()        as requests,
             avg(@duration) as avgMs
       by bin(1h)
     | sort @timestamp asc`,
    now - 6 * 3600 * 1000, now,
  );

  if (trendRows.length > 0) {
    const trendLines = trendRows.map(r => {
      const bin   = field(r, 'bin(1h)') || field(r, '@timestamp') || '?';
      const reqs  = field(r, 'requests') || '0';
      const avgMs = parseFloat(field(r, 'avgMs') || '0').toFixed(0);
      return `- ${bin}: ${reqs} request${reqs !== '1' ? 's' : ''}, avg ${avgMs}ms`;
    }).join('\n');

    await upsertChunk({
      id:           'cw_trend_6h',
      record_id:    'CW-TREND-6H',
      source:       'cloudwatch_logs',
      source_label: 'CloudWatch',
      appid:        'APPID-7779311',
      title:        `Digital SME Lambda Invocation Trend — Last 6 hours`,
      text: [`**Digital SME Lambda Invocation Trend — Last 6 Hours**`, ``, trendLines, ``, `Log Group: ${LOG_GROUP}`].join('\n'),
      tags:           ['trend', 'lambda', 'cloudwatch', 'requests', 'traffic', 'usage', 'volume'],
      classification: 'INTERNAL',
      freshness_ts:   isoNow,
      ingest_ts:      isoNow,
      ttl_hours:      1,
      meta: {},
    });
    synced++;
  }

  console.log(`[log-sync] Done — ${synced} chunk(s) written to ${TABLE_NAME}`);
}
