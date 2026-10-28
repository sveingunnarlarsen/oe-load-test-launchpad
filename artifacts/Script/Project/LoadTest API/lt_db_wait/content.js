const query = (typeof req !== 'undefined' && req && req.query) || {};
const ms = Math.min(Number(query.ms || 2000), 30000);
const parallel = Math.min(Math.max(Number(query.parallel || 5), 1), 50);
const started = Date.now();
await Promise.all(Array.from({ length: parallel }, () => entities.lt_order.query('select pg_sleep($1)', [ms / 1000])));
result.data = { ms, parallel, elapsed: Date.now() - started, pid: process.pid };
