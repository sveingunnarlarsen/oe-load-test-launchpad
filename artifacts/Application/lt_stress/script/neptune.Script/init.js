function ltPercentile(values, p) {
    if (!values.length) return 0;
    var sorted = values.slice().sort(function (a, b) { return a - b; });
    return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
}
function ltRunStress() {
    var run = modelRun.getData();
    modelRun.setProperty('/running', true);
    var runId = (run.label || 'app') + '-stress-' + Date.now().toString(36);
    var started = Date.now();
    apiStress({ data: { creates: Number(run.creates), reads: Number(run.reads), updates: Number(run.updates), deletes: Number(run.deletes), runId: runId } }).then(function (data) {
        var rows = Object.keys(data.ops || {}).map(function (op) { return Object.assign({ op: op }, data.ops[op]); });
        modelOps.setData(rows);
        modelRun.setProperty('/lastRunId', data.runId);
        modelRun.setProperty('/scriptMs', data.totalMs);
        modelRun.setProperty('/roundTripMs', Date.now() - started);
        modelRun.setProperty('/running', false);
        sap.m.MessageToast.show('Stress run ' + data.runId + ' finished in ' + data.totalMs + ' ms');
    }).catch(function (e) {
        modelRun.setProperty('/running', false);
        sap.m.MessageBox.error('Stress run failed: ' + (e && e.responseText ? e.responseText : e));
    });
}
var ltBurstCalls = {
    orders: function (i) { return apiOrders({ parameters: { limit: 100 + (i % 3) * 100 } }); },
    search: function (i) { return apiSearch({ parameters: { q: ['widget', 'gear', 'pump'][i % 3], size: 50, page: 1 + (i % 4) } }); },
    stats: function () { return apiStats(); },
    report: function () { return apiReport(); },
    create: function (i) { return apiCreateOrder({ data: { customer: 'Burst ' + (i % 10), product: 'AppDesigner', quantity: 1 + (i % 4), amount: 15 + i, status: 'NEW' } }); },
};
function ltRunBurst() {
    var burst = modelBurst.getData();
    var count = Number(burst.count || 50);
    var parallel = Math.max(1, Number(burst.parallel || 8));
    var endpoint = burst.endpoint;
    var runId = (modelRun.getProperty('/label') || 'app') + '-burst-' + endpoint + '-' + Date.now().toString(36);
    var samples = [];
    var next = 0;
    var started = Date.now();
    modelBurst.setProperty('/running', true);
    modelBurst.setProperty('/done', 0);
    function worker() {
        if (next >= count) return Promise.resolve();
        var i = next++;
        var t = Date.now();
        return ltBurstCalls[endpoint](i).then(function () {
            samples.push({ endpoint: '/' + endpoint, method: endpoint === 'create' ? 'POST' : 'GET', ms: Date.now() - t, ok: true, status: 200 });
        }).catch(function () {
            samples.push({ endpoint: '/' + endpoint, method: 'GET', ms: Date.now() - t, ok: false, status: 500 });
        }).then(function () {
            modelBurst.setProperty('/done', samples.length);
            return worker();
        });
    }
    var workers = [];
    for (var w = 0; w < parallel; w++) workers.push(worker());
    Promise.all(workers).then(function () {
        var ms = samples.map(function (s) { return s.ms; });
        var elapsed = Date.now() - started;
        var row = {
            runId: runId, endpoint: endpoint, count: samples.length, parallel: parallel, elapsed: elapsed,
            rps: Math.round((samples.length / elapsed) * 1000),
            avg: Math.round(ms.reduce(function (a, b) { return a + b; }, 0) / Math.max(ms.length, 1)),
            p50: ltPercentile(ms, 50), p95: ltPercentile(ms, 95), max: Math.max.apply(null, ms),
            errors: samples.filter(function (s) { return !s.ok; }).length,
        };
        var rows = modelBurstRows.getData() || [];
        rows.unshift(row);
        modelBurstRows.setData(rows);
        modelBurst.setProperty('/running', false);
        return apiMetrics({ data: { runId: runId, suite: 'appdesigner', samples: samples } });
    }).then(function () {
        sap.m.MessageToast.show('Burst ' + runId + ' stored');
    });
}
sap.ui.getCore().attachInit(function () {
    modelRun.setData({ label: 'dev', creates: 100, reads: 100, updates: 100, deletes: 50, running: false, lastRunId: '', scriptMs: 0, roundTripMs: 0 });
    modelBurst.setData({ endpoint: 'orders', count: 50, parallel: 8, done: 0, running: false });
    modelBurstRows.setData([]);
});
