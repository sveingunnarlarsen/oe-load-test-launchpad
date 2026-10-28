const rows = await entities.lt_order.find({ select: ['status', 'amount', 'quantity'] });
const byStatus = {};
let total = 0;
let quantity = 0;
for (const row of rows) {
    byStatus[row.status] = (byStatus[row.status] || 0) + 1;
    total += Number(row.amount || 0);
    quantity += Number(row.quantity || 0);
}
result.data = {
    count: rows.length,
    totalAmount: Number(total.toFixed(2)),
    totalQuantity: quantity,
    byStatus,
    customers: await entities.lt_customer.count(),
    generatedAt: new Date().toISOString(),
};
