const started = Date.now();
const orders = await entities.lt_order.find({ select: ['customer', 'amount', 'createdAt'] });
const stats = {};
for (const order of orders) {
    const s = (stats[order.customer] = stats[order.customer] || { customer: order.customer, orderCount: 0, totalAmount: 0, lastOrderAt: null });
    s.orderCount++;
    s.totalAmount = Number((s.totalAmount + Number(order.amount || 0)).toFixed(2));
    const createdAt = /^\d+$/.test(String(order.createdAt)) ? Number(order.createdAt) : order.createdAt;
    const ts = new Date(createdAt).getTime();
    if (!Number.isNaN(ts) && (!s.lastOrderAt || ts > s.lastOrderAt)) s.lastOrderAt = ts;
}
const existing = await entities.lt_customer_stats.find();
const byCustomer = {};
for (const row of existing) byCustomer[row.customer] = row;
const toSave = Object.values(stats).map((s) => Object.assign(byCustomer[s.customer] || {}, s, { lastOrderAt: s.lastOrderAt ? new Date(s.lastOrderAt).toISOString() : null }));
await entities.lt_customer_stats.save(toSave, { chunk: 200 });
await entities.lt_job_run.save({ job: 'lt_job_recalc', processed: toSave.length, durationMs: Date.now() - started, details: 'aggregated ' + orders.length + ' orders into ' + toSave.length + ' customer rows' });
if (typeof result !== 'undefined') result.data = { customers: toSave.length, orders: orders.length, ms: Date.now() - started };
