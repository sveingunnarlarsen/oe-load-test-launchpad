const id = (req.body && req.body.id) || (req.query && req.query.id);
if (!id) {
    result.error = 'id is required';
    return;
}
await entities.lt_order.delete({ id });
result.data = { deleted: id };
