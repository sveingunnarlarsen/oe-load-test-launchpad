const started = Date.now();
const customers = await entities.lt_customer.find();
const perCustomer = await Promise.all(customers.map(async (customer) => {
    const orders = await entities.lt_order.find({ where: { customer: customer.name } });
    const lineCounts = await Promise.all(orders.map((order) => entities.lt_order_line.count({ where: { orderNo: order.orderNo } })));
    let amount = 0;
    for (const order of orders) amount += Number(order.amount || 0);
    return { customer: customer.name, orders: orders.length, lines: lineCounts.reduce((a, b) => a + b, 0), amount: Number(amount.toFixed(2)) };
}));
perCustomer.sort((a, b) => b.amount - a.amount);
result.data = { customers: perCustomer, queries: 1 + customers.length + perCustomer.reduce((a, c) => a + c.orders, 0), ms: Date.now() - started };
