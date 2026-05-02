const router = require('express').Router();
const pool   = require('../db');

// POST /api/reviews — add a new review
router.post('/', async (req, res) => {
  const { student_id, hall_id, item_id, rating, review_text, review_date } = req.body;
  if (!student_id || !rating) {
    return res.status(400).json({ error: 'student_id and rating are required' });
  }
  if (!hall_id && !item_id) {
    return res.status(400).json({ error: 'Either hall_id or item_id is required' });
  }
  try {
    const { rows } = await pool.query(`
      INSERT INTO review (review_id, student_id, hall_id, item_id, rating, review_text, review_date)
      SELECT COALESCE(MAX(review_id), 0) + 1, $1, $2, $3, $4, $5, $6
      FROM review
      RETURNING *
    `, [student_id, hall_id || null, item_id || null, rating,
        review_text || null, review_date || new Date().toISOString().slice(0, 10)]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  const { hall_id, item_id } = req.query;
  const conditions = [];
  const params = [];

  if (hall_id) { params.push(hall_id); conditions.push(`r.hall_id = $${params.length}`); }
  if (item_id) { params.push(item_id); conditions.push(`r.item_id = $${params.length}`); }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  try {
    const result = await pool.query(`
      SELECT
          r.review_id,
          r.rating,
          r.review_text,
          r.review_date,
          s.first_name || ' ' || s.last_name AS student_name,
          s.class_year,
          dh.hall_name,
          mi.item_name
      FROM review r
      JOIN student s        ON r.student_id = s.student_id
      LEFT JOIN dininghall dh ON r.hall_id  = dh.hall_id
      LEFT JOIN menuitem mi   ON r.item_id  = mi.item_id
      ${where}
      ORDER BY r.review_date DESC, r.review_id DESC
    `, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
