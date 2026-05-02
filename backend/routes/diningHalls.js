const router = require('express').Router();
const pool   = require('../db');

router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
          dh.*,
          COUNT(DISTINCT s.station_id)  AS station_count,
          ROUND(AVG(r.rating)::numeric, 2) AS avg_rating,
          COUNT(DISTINCT r.review_id)   AS review_count
      FROM dininghall dh
      LEFT JOIN station s ON dh.hall_id = s.hall_id
      LEFT JOIN review r  ON dh.hall_id = r.hall_id
      GROUP BY dh.hall_id
      ORDER BY dh.hall_id
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM dininghall WHERE hall_id = $1',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
