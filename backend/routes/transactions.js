const router = require('express').Router();
const pool   = require('../db');

// POST /api/transactions — record a new transaction with items
router.post('/', async (req, res) => {
  const { student_id, hall_id, employee_id, payment_method, transaction_time, items } = req.body;
  if (!student_id || !hall_id || !payment_method || !items?.length) {
    return res.status(400).json({ error: 'student_id, hall_id, payment_method, and items[] are required' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Compute total amount from items
    const amount = items.reduce((sum, it) => sum + it.item_price * it.quantity, 0);
    // Get next transaction_id
    const { rows } = await client.query(`
      INSERT INTO diningtransaction (transaction_id, student_id, hall_id, employee_id, amount, payment_method, transaction_time)
      SELECT COALESCE(MAX(transaction_id), 0) + 1, $1, $2, $3, $4, $5, $6
      FROM diningtransaction
      RETURNING *
    `, [student_id, hall_id, employee_id || null,
        parseFloat(amount.toFixed(2)), payment_method,
        transaction_time || new Date().toISOString()]);
    const txn = rows[0];
    // Insert transaction items
    for (const it of items) {
      await client.query(
        `INSERT INTO transactionitem (transaction_id, item_id, quantity, item_price)
         VALUES ($1, $2, $3, $4)`,
        [txn.transaction_id, it.item_id, it.quantity, it.item_price]
      );
    }
    await client.query('COMMIT');
    res.status(201).json(txn);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.get('/', async (req, res) => {
  const { hall_id, payment_method } = req.query;
  const conditions = [];
  const params = [];

  if (hall_id)        { params.push(hall_id);        conditions.push(`t.hall_id = $${params.length}`); }
  if (payment_method) { params.push(payment_method); conditions.push(`t.payment_method = $${params.length}`); }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  try {
    const result = await pool.query(`
      SELECT
          t.transaction_id,
          t.transaction_time,
          t.amount,
          t.payment_method,
          s.first_name || ' ' || s.last_name AS student_name,
          dh.hall_name,
          e.first_name || ' ' || e.last_name AS cashier_name,
          COUNT(ti.item_id) AS item_count
      FROM diningtransaction t
      JOIN student s        ON t.student_id  = s.student_id
      JOIN dininghall dh    ON t.hall_id     = dh.hall_id
      LEFT JOIN employee e  ON t.employee_id = e.employee_id
      LEFT JOIN transactionitem ti ON t.transaction_id = ti.transaction_id
      ${where}
      GROUP BY t.transaction_id, s.first_name, s.last_name, dh.hall_name, e.first_name, e.last_name
      ORDER BY t.transaction_time DESC
    `, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
