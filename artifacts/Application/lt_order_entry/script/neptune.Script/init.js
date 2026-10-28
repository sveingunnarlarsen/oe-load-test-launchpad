function ltReset() {
    modelOrder.setData({ customer: 'Customer 001', product: 'Widget', quantity: 1, amount: 10, status: 'NEW', notes: '' });
}
function ltSubmit() {
    apiCreateOrder({ data: modelOrder.getData() }).then(function (data) {
        modelResult.setData(data);
        sap.m.MessageToast.show('Order ' + data.orderNo + ' created');
        ltReset();
    });
}
sap.ui.getCore().attachInit(function () { ltReset(); });
