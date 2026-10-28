const query = (typeof req !== 'undefined' && req && req.query) || {};
const n = Math.min(Number(query.n || 2000000), 20000000);
const started = Date.now();
const sieve = new Uint8Array(n + 1);
let primes = 0;
for (let i = 2; i <= n; i++) {
    if (sieve[i]) continue;
    primes++;
    for (let j = i * 2; j <= n; j += i) sieve[j] = 1;
}
let hash = 0;
const payload = JSON.stringify(Array.from({ length: 20000 }, (_, i) => ({ i, v: i * 31 % 977 })));
for (let i = 0; i < payload.length; i++) hash = (hash * 31 + payload.charCodeAt(i)) >>> 0;
result.data = { n, primes, hash, pid: process.pid, ms: Date.now() - started };
