const router = require('express').Router();
const pool   = require('../db');

// POST /api/menu-items — add a new menu item
router.post('/', async (req, res) => {
  const { item_name, category, calories, price, is_vegetarian, is_vegan, is_gluten_free, allergen_ids } = req.body;
  if (!item_name || !category || price === undefined) {
    return res.status(400).json({ error: 'item_name, category, and price are required' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(`
      INSERT INTO menuitem (item_id, item_name, category, calories, price, is_vegetarian, is_vegan, is_gluten_free)
      SELECT COALESCE(MAX(item_id), 0) + 1, $1, $2, $3, $4, $5, $6, $7
      FROM menuitem
      RETURNING *
    `, [item_name, category, calories || null, price,
        is_vegetarian || false, is_vegan || false, is_gluten_free || false]);
    const newItem = rows[0];
    // Insert allergens if provided
    if (allergen_ids && allergen_ids.length > 0) {
      for (const aid of allergen_ids) {
        await client.query(
          `INSERT INTO itemallergen (item_id, allergen_id) VALUES ($1, $2)`,
          [newItem.item_id, aid]
        );
      }
    }
    await client.query('COMMIT');
    res.status(201).json(newItem);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.get('/', async (req, res) => {
  const { vegan, vegetarian, gluten_free, category } = req.query;
  const conditions = [];
  const params = [];

  if (vegan        === 'true') { params.push(true); conditions.push(`mi.is_vegan = $${params.length}`); }
  if (vegetarian   === 'true') { params.push(true); conditions.push(`mi.is_vegetarian = $${params.length}`); }
  if (gluten_free  === 'true') { params.push(true); conditions.push(`mi.is_gluten_free = $${params.length}`); }
  if (category)                { params.push(category); conditions.push(`mi.category = $${params.length}`); }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  try {
    const result = await pool.query(`
      SELECT
          mi.*,
          COALESCE(STRING_AGG(a.allergen_name, ', '), 'None') AS allergens
      FROM menuitem mi
      LEFT JOIN itemallergen ia ON mi.item_id    = ia.item_id
      LEFT JOIN allergen a      ON ia.allergen_id = a.allergen_id
      ${where}
      GROUP BY mi.item_id
      ORDER BY mi.category, mi.item_name
    `, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/categories', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT DISTINCT category FROM menuitem ORDER BY category`
    );
    res.json(rows.map(r => r.category));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT mi.*,
             COALESCE(STRING_AGG(a.allergen_name, ', '), 'None') AS allergens
      FROM menuitem mi
      LEFT JOIN itemallergen ia ON mi.item_id     = ia.item_id
      LEFT JOIN allergen a      ON ia.allergen_id = a.allergen_id
      WHERE mi.item_id = $1
      GROUP BY mi.item_id
    `, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
