const body = (typeof req !== 'undefined' && req && req.body) || {};
const count = Math.min(Number(body.orders || 200), 5000);
const linesPerOrder = Math.min(Number(body.linesPerOrder || 3), 10);
const products = ['Widget', 'Gadget', 'Sprocket', 'Flange', 'Bracket', 'Gear', 'Valve', 'Pump'];
const statuses = ['NEW', 'APPROVED', 'SHIPPED', 'CLOSED'];
const started = Date.now();
const customers = await entities.lt_customer.find({ take: 50 });
const batch = Date.now().toString(36);
const orders = [];
for (let i = 0; i < count; i++) {
    const customer = customers[i % customers.length];
    const quantity = 1 + (i % 9);
    orders.push({
        orderNo: 'LT-' + batch + '-' + i,
        customer: customer ? customer.name : 'Walk-in',
        product: products[i % products.length],
        quantity,
        amount: Number((quantity * (10 + (i % 7) * 12.5)).toFixed(2)),
        status: statuses[i % statuses.length],
        notes: 'bulk ' + batch,
    });
}
const saved = await entities.lt_order.save(orders, { chunk: 200 });
const ordersMs = Date.now() - started;
const lines = [];
saved.forEach((order, i) => {
    for (let l = 1; l <= linesPerOrder; l++) {
        lines.push({
            orderNo: order.orderNo,
            lineNo: l,
            product: products[(i + l) % products.length],
            quantity: 1 + ((i + l) % 5),
            price: Number((5 + ((i * l) % 40)).toFixed(2)),
        });
    }
});
await entities.lt_order_line.save(lines, { chunk: 500 });
result.data = { batch, orders: saved.length, lines: lines.length, ordersMs, totalMs: Date.now() - started };
