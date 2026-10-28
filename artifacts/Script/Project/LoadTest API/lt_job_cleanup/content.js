const started = Date.now();
const metricCutoff = Date.now() - 24 * 60 * 60 * 1000;
const metricResult = await entities.lt_metric.createQueryBuilder().delete().where('createdAt < :cutoff', { cutoff: metricCutoff }).execute();
const total = await entities.lt_order.count();
const cap = 20000;
let trimmed = 0;
if (total > cap) {
    const victims = await entities.lt_order.find({ select: ['id', 'orderNo'], order: { createdAt: 'ASC' }, take: Math.min(total - cap, 2000) });
    const orderNos = victims.map((v) => v.orderNo);
    await entities.lt_order_line.createQueryBuilder().delete().where('orderNo IN (:...orderNos)', { orderNos }).execute();
    await entities.lt_order.delete(victims.map((v) => v.id));
    trimmed = victims.length;
}
const summary = 'metrics removed ' + (metricResult.affected || 0) + ', orders trimmed ' + trimmed + ' of ' + total;
await entities.lt_job_run.save({ job: 'lt_job_cleanup', processed: trimmed + (metricResult.affected || 0), durationMs: Date.now() - started, details: summary });
if (typeof result !== 'undefined') result.data = { metricsRemoved: metricResult.affected || 0, trimmed, total, ms: Date.now() - started };
