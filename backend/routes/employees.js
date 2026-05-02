const router = require('express').Router();
const pool   = require('../db');

router.get('/', async (req, res) => {
  const { role } = req.query;
  const params = [];
  const where  = role ? `WHERE role = $${params.push(role)}` : '';
  try {
    const { rows } = await pool.query(`
      SELECT e.*, dh.hall_name
      FROM employee e
      LEFT JOIN dininghall dh ON e.hall_id = dh.hall_id
      ${where}
      ORDER BY e.role, e.last_name
    `, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
