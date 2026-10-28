const body = (typeof req !== 'undefined' && req && req.body) || {};
const count = Math.min(Number(body.count || 100), 2000);
const from = body.from || 'NEW';
const to = body.to || 'APPROVED';
const started = Date.now();
const rows = await entities.lt_order.find({ where: { status: from }, take: count, order: { createdAt: 'ASC' } });
for (const row of rows) {
    row.status = to;
    row.notes = (row.notes || '') + ' | ' + from + '>' + to;
}
await entities.lt_order.save(rows, { chunk: 200 });
result.data = { updated: rows.length, from, to, ms: Date.now() - started };
