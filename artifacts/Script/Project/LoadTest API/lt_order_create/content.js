const body = req.body || {};
if (!body.customer || !body.product) {
    result.error = 'customer and product are required';
    return;
}
const order = await entities.lt_order.save({
    orderNo: body.orderNo || 'LT-' + Date.now().toString(36),
    customer: body.customer,
    product: body.product,
    quantity: Number(body.quantity || 1),
    amount: Number(body.amount || 0),
    status: body.status || 'NEW',
    notes: body.notes || '',
});
result.data = order;
