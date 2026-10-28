function percentile(values, p) {
    if (!values.length) return 0;
    const sorted = values.slice().sort((a, b) => a - b);
    const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
    return sorted[idx];
}
function summarize(values) {
    const total = values.reduce((a, b) => a + b, 0);
    return {
        count: values.length,
        avg: values.length ? Number((total / values.length).toFixed(2)) : 0,
        p50: percentile(values, 50),
        p95: percentile(values, 95),
        max: values.length ? Math.max.apply(null, values) : 0,
    };
}

const query = (typeof req !== 'undefined' && req && req.query) || {};
const started = Date.now();
if (!query.runId) {
    const all = await entities.lt_metric.find({ select: ['runId', 'suite', 'createdAt'], order: { createdAt: 'DESC' }, take: 20000 });
    const runs = {};
    for (const row of all) {
        const key = row.runId + '|' + row.suite;
        const r = (runs[key] = runs[key] || { runId: row.runId, suite: row.suite, samples: 0, startedAt: Number(row.createdAt) });
        r.samples++;
        r.startedAt = Math.min(r.startedAt, Number(row.createdAt));
    }
    result.data = Object.values(runs).sort((a, b) => b.startedAt - a.startedAt).slice(0, 30);
    result.ms = Date.now() - started;
} else {
    const rows = await entities.lt_metric.find({ where: { runId: query.runId } });
    const groups = {};
    for (const row of rows) {
        const key = row.method + ' ' + row.endpoint;
        const g = (groups[key] = groups[key] || { key, endpoint: row.endpoint, method: row.method, values: [], errors: 0 });
        g.values.push(Number(row.durationMs));
        if (!row.ok) g.errors++;
    }
    result.data = Object.values(groups).map((g) => Object.assign({ endpoint: g.endpoint, method: g.method, errors: g.errors }, summarize(g.values))).sort((a, b) => b.p95 - a.p95);
    result.samples = rows.length;
    result.runId = query.runId;
    result.ms = Date.now() - started;
}
