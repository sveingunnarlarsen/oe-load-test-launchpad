const count = Number((req.body && req.body.count) || 200);
const products = ['Widget', 'Gadget', 'Sprocket', 'Flange', 'Bracket', 'Gear', 'Valve', 'Pump'];
const statuses = ['NEW', 'APPROVED', 'SHIPPED', 'CLOSED'];
const countries = ['NO', 'SE', 'DK', 'DE', 'US', 'GB'];

const existing = await entities.lt_customer.count();
let customers = [];
if (existing < 20) {
    for (let i = 0; i < 20; i++) {
        customers.push({
            name: 'Customer ' + String(existing + i + 1).padStart(3, '0'),
            email: 'customer' + (existing + i + 1) + '@example.com',
            country: countries[i % countries.length],
            segment: i % 3 === 0 ? 'ENTERPRISE' : 'SMB',
        });
    }
    customers = await entities.lt_customer.save(customers);
} else {
    customers = await entities.lt_customer.find({ take: 20 });
}

const orders = [];
for (let i = 0; i < count; i++) {
    const customer = customers[i % customers.length];
    orders.push({
        orderNo: 'LT-' + Date.now().toString(36) + '-' + i,
        customer: customer.name,
        product: products[i % products.length],
        quantity: 1 + (i % 9),
        amount: Number(((1 + (i % 9)) * (10 + (i % 7) * 12.5)).toFixed(2)),
        status: statuses[i % statuses.length],
        notes: 'Seeded by lt_seed',
    });
}
await entities.lt_order.save(orders, { chunk: 100 });

result.data = { customers: customers.length, ordersCreated: orders.length, ordersTotal: await entities.lt_order.count() };
