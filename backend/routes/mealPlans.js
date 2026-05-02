const router = require('express').Router();
const pool   = require('../db');

router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM mealplan ORDER BY price DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
