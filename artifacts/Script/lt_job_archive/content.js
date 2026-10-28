const started = Date.now();
const cutoff = Date.now() - 10 * 60 * 1000;
const closed = await entities.lt_order.createQueryBuilder('o').where('o.status = :s', { s: 'CLOSED' }).andWhere('o.createdAt < :cutoff', { cutoff }).take(500).getMany();
if (closed.length) {
    await entities.lt_order_archive.save(closed.map((o) => ({ orderNo: o.orderNo, customer: o.customer, product: o.product, quantity: o.quantity, amount: o.amount, status: o.status, notes: o.notes, archivedFrom: o.id })), { chunk: 200 });
    const orderNos = closed.map((o) => o.orderNo);
    await entities.lt_order_line.createQueryBuilder().delete().where('orderNo IN (:...orderNos)', { orderNos }).execute();
    await entities.lt_order.delete(closed.map((o) => o.id));
}
await entities.lt_job_run.save({ job: 'lt_job_archive', processed: closed.length, durationMs: Date.now() - started, details: 'archived ' + closed.length + ' closed orders older than ' + new Date(cutoff).toISOString() });
if (typeof result !== 'undefined') result.data = { archived: closed.length, ms: Date.now() - started };
