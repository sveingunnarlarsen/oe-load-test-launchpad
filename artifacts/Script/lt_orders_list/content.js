const query = req.query || {};
const take = Math.min(Number(query.limit || 100), 1000);
const where = {};
if (query.status) where.status = query.status;
if (query.customer) where.customer = query.customer;
const rows = await entities.lt_order.find({ where, take, order: { createdAt: 'DESC' } });
result.data = rows;
result.count = rows.length;
