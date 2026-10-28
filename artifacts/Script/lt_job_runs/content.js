const rows = await entities.lt_job_run.find({ order: { createdAt: 'DESC' }, take: 50 });
result.data = rows;
