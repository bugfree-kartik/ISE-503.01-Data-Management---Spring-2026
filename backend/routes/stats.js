const router = require('express').Router();
const pool   = require('../db');

router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM student)             AS students,
        (SELECT COUNT(*) FROM dininghall)          AS halls,
        (SELECT COUNT(*) FROM menuitem)            AS menu_items,
        (SELECT COUNT(*) FROM diningtransaction)   AS transactions,
        (SELECT COUNT(*) FROM review)              AS reviews,
        (SELECT ROUND(SUM(amount)::numeric, 2)
           FROM diningtransaction)                 AS total_revenue,
        (SELECT ROUND(AVG(rating)::numeric, 2)
           FROM review)                            AS avg_rating,
        (SELECT COUNT(*) FROM employee)            AS employees
    `);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
