const started = Date.now();
const customers = await entities.lt_customer.find();
const perCustomer = [];
for (const customer of customers) {
    const orders = await entities.lt_order.find({ where: { customer: customer.name } });
    let amount = 0;
    const byStatus = {};
    for (const order of orders) {
        amount += Number(order.amount || 0);
        byStatus[order.status] = (byStatus[order.status] || 0) + 1;
    }
    let lineCount = 0;
    for (const order of orders) {
        lineCount += await entities.lt_order_line.count({ where: { orderNo: order.orderNo } });
    }
    perCustomer.push({ customer: customer.name, country: customer.country, segment: customer.segment, orders: orders.length, lines: lineCount, amount: Number(amount.toFixed(2)), byStatus });
}
perCustomer.sort((a, b) => b.amount - a.amount);
const allOrders = await entities.lt_order.find({ select: ['product', 'amount', 'quantity', 'status'] });
const byProduct = {};
const byStatus = {};
for (const order of allOrders) {
    const p = (byProduct[order.product] = byProduct[order.product] || { product: order.product, orders: 0, quantity: 0, amount: 0 });
    p.orders++;
    p.quantity += Number(order.quantity || 0);
    p.amount = Number((p.amount + Number(order.amount || 0)).toFixed(2));
    byStatus[order.status] = (byStatus[order.status] || 0) + 1;
}
result.data = {
    customers: perCustomer,
    products: Object.values(byProduct).sort((a, b) => b.amount - a.amount),
    byStatus,
    orders: allOrders.length,
    queries: 1 + customers.length + allOrders.length + 1,
    ms: Date.now() - started,
};
