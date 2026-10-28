const body = (typeof req !== 'undefined' && req && req.body) || {};
const samples = Array.isArray(body.samples) ? body.samples : [];
const runId = body.runId || 'cli-' + Date.now().toString(36);
const rows = samples.slice(0, 5000).map((s) => ({
    runId,
    suite: body.suite || 'client',
    endpoint: String(s.endpoint || '').slice(0, 200),
    method: String(s.method || 'GET').slice(0, 10),
    durationMs: Math.round(Number(s.ms || 0)),
    ok: s.ok !== false,
    status: Number(s.status || 0),
}));
await entities.lt_metric.save(rows, { chunk: 500 });
result.data = { runId, stored: rows.length };
