function ltRunPings() {
    var run = modelRun.getData();
    var count = Number(run.count || 50);
    var started = Date.now();
    var done = 0;
    var calls = [];
    for (var i = 0; i < count; i++) {
        calls.push(apiPing({ parameters: { busy: run.busy || 2 } }).then(function () {
            done++;
            modelRun.setProperty('/done', done);
        }));
    }
    Promise.all(calls).then(function () {
        modelRun.setProperty('/elapsed', Date.now() - started);
        modelRun.setProperty('/running', false);
    });
    modelRun.setProperty('/running', true);
    modelRun.setProperty('/done', 0);
}
sap.ui.getCore().attachInit(function () {
    modelRun.setData({ count: 50, busy: 2, done: 0, elapsed: 0, running: false });
});
