const router = require('express').Router();
const pool   = require('../db');

// POST /api/students — register a new student
router.post('/', async (req, res) => {
  const { sbu_id, first_name, last_name, email, class_year, major, plan_id, wolfie_wallet_balance } = req.body;
  if (!sbu_id || !first_name || !last_name || !email || !class_year) {
    return res.status(400).json({ error: 'sbu_id, first_name, last_name, email, class_year are required' });
  }
  try {
    const { rows } = await pool.query(`
      INSERT INTO student (student_id, sbu_id, first_name, last_name, email, class_year, major, plan_id, wolfie_wallet_balance)
      SELECT COALESCE(MAX(student_id), 0) + 1, $1, $2, $3, $4, $5, $6, $7, $8
      FROM student
      RETURNING *
    `, [sbu_id, first_name, last_name, email, class_year,
        major || null, plan_id || null, wolfie_wallet_balance || 0]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
          s.student_id,
          s.sbu_id,
          s.first_name,
          s.last_name,
          s.first_name || ' ' || s.last_name AS full_name,
          s.email,
          s.class_year,
          s.major,
          s.wolfie_wallet_balance,
          mp.plan_name,
          mp.price AS plan_price,
          mp.meal_swipes_per_week,
          mp.dining_dollars,
          COUNT(t.transaction_id) AS transaction_count,
          ROUND(COALESCE(SUM(t.amount), 0)::numeric, 2) AS total_spent
      FROM student s
      LEFT JOIN mealplan mp         ON s.plan_id    = mp.plan_id
      LEFT JOIN diningtransaction t ON s.student_id = t.student_id
      GROUP BY s.student_id, mp.plan_name, mp.price, mp.meal_swipes_per_week, mp.dining_dollars
      ORDER BY s.last_name, s.first_name
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT s.*, mp.plan_name, mp.price AS plan_price
      FROM student s
      LEFT JOIN mealplan mp ON s.plan_id = mp.plan_id
      WHERE s.student_id = $1
    `, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
