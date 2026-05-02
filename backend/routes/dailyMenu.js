const router = require('express').Router();
const pool   = require('../db');

// GET /api/daily-menu?date=2026-04-20&period=Lunch
router.get('/', async (req, res) => {
  const { date, period } = req.query;
  const conditions = [];
  const params = [];

  if (date)   { params.push(date);   conditions.push(`dm.serve_date = $${params.length}`); }
  if (period) { params.push(period); conditions.push(`dm.meal_period = $${params.length}`); }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  try {
    const result = await pool.query(`
      SELECT
          dh.hall_name,
          dh.hall_id,
          st.station_name,
          st.cuisine_type,
          dm.meal_period,
          dm.serve_date,
          mi.item_id,
          mi.item_name,
          mi.category,
          mi.price,
          mi.calories,
          mi.is_vegetarian,
          mi.is_vegan,
          mi.is_gluten_free,
          COALESCE(STRING_AGG(a.allergen_name, ', '), 'None') AS allergens
      FROM dailymenu dm
      JOIN station st       ON dm.station_id  = st.station_id
      JOIN dininghall dh    ON st.hall_id     = dh.hall_id
      JOIN menuitem mi      ON dm.item_id     = mi.item_id
      LEFT JOIN itemallergen ia ON mi.item_id = ia.item_id
      LEFT JOIN allergen a      ON ia.allergen_id = a.allergen_id
      ${where}
      GROUP BY dh.hall_id, dh.hall_name, st.station_name, st.cuisine_type,
               dm.meal_period, dm.serve_date,
               mi.item_id, mi.item_name, mi.category, mi.price, mi.calories,
               mi.is_vegetarian, mi.is_vegan, mi.is_gluten_free
      ORDER BY dh.hall_name, dm.meal_period, st.station_name, mi.item_name
    `, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/daily-menu/dates — list all available dates
router.get('/dates', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT DISTINCT serve_date FROM dailymenu ORDER BY serve_date`
    );
    res.json(rows.map(r => r.serve_date));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
