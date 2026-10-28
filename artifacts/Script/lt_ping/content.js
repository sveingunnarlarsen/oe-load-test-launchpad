const started = Date.now();
const busyMs = Math.min(Number((req.query && req.query.busy) || 2), 50);
let x = 0;
while (Date.now() - started < busyMs) x += Math.sqrt(x + 1);
result.data = { pong: true, pid: process.pid, busyMs, at: new Date().toISOString() };
