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

const body = (typeof req !== 'undefined' && req && req.body) || {};
const creates = Math.min(Number(body.creates == null ? 50 : body.creates), 2000);
const updates = Math.min(Number(body.updates == null ? 50 : body.updates), 2000);
const reads = Math.min(Number(body.reads == null ? 50 : body.reads), 2000);
const deletes = Math.min(Number(body.deletes == null ? 25 : body.deletes), 2000);
const runId = body.runId || 'srv-' + Date.now().toString(36);
const started = Date.now();
const timings = { create: [], read: [], update: [], delete: [] };
const metrics = [];
const record = (op, ms, ok) => {
    timings[op].push(ms);
    metrics.push({ runId, suite: 'server', endpoint: '/stress#' + op, method: op.toUpperCase(), durationMs: ms, ok, status: ok ? 200 : 500 });
};
const created = [];
for (let i = 0; i < creates; i++) {
    const t = Date.now();
    const row = await entities.lt_order.save({ orderNo: 'ST-' + runId + '-' + i, customer: 'Stress ' + (i % 10), product: 'Stress', quantity: 1 + (i % 5), amount: 10 + i, status: 'NEW', notes: 'stress ' + runId });
    created.push(row);
    record('create', Date.now() - t, true);
}
for (let i = 0; i < reads; i++) {
    const t = Date.now();
    await entities.lt_order.find({ where: { customer: 'Stress ' + (i % 10) }, take: 20, order: { createdAt: 'DESC' } });
    record('read', Date.now() - t, true);
}
for (let i = 0; i < updates; i++) {
    const row = created[i % Math.max(created.length, 1)];
    if (!row) break;
    const t = Date.now();
    row.status = i % 2 ? 'APPROVED' : 'SHIPPED';
    await entities.lt_order.save(row);
    record('update', Date.now() - t, true);
}
for (let i = 0; i < deletes; i++) {
    const row = created[i];
    if (!row) break;
    const t = Date.now();
    await entities.lt_order.delete({ id: row.id });
    record('delete', Date.now() - t, true);
}
await entities.lt_metric.save(metrics, { chunk: 500 });
result.data = {
    runId,
    totalMs: Date.now() - started,
    ops: { create: summarize(timings.create), read: summarize(timings.read), update: summarize(timings.update), delete: summarize(timings.delete) },
    leftover: created.length - Math.min(deletes, created.length),
};
