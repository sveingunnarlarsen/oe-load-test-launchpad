function ltLoadReport() {
    var started = Date.now();
    modelReport.setProperty('/loading', true);
    apiReport().then(function (data) {
        modelCustomers.setData(data.customers || []);
        modelProducts.setData(data.products || []);
        modelReport.setData({ loading: false, orders: data.orders, queries: data.queries, scriptMs: data.ms, roundTripMs: Date.now() - started });
    });
    apiJobs().then(function (rows) {
        modelJobs.setData((rows || []).map(function (r) { return Object.assign({}, r, { at: new Date(Number(r.createdAt)).toLocaleTimeString() }); }));
    });
}
sap.ui.getCore().attachInit(function () { ltLoadReport(); });
