function ltRefresh() {
    apiStats().then(function (data) { modelStats.setData(data); });
    apiOrders({ parameters: { limit: 200 } }).then(function (data) { modelOrders.setData(data); });
}
sap.ui.getCore().attachInit(function () { ltRefresh(); });
