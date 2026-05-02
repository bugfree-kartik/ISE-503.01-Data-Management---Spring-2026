const router = require('express').Router();
const pool   = require('../db');

// All 10 complex queries — PostgreSQL-compatible
const QUERIES = {
  1: {
    title: 'Top 5 Students by Total Dining Spend',
    description: 'Aggregates transactions per student and ranks the top 5 spenders, joining with their meal plan.',
    joins: 'Student × DiningTransaction × MealPlan',
    sql: `
      SELECT
          s.student_id,
          s.first_name || ' ' || s.last_name           AS student_name,
          mp.plan_name                                  AS meal_plan,
          COUNT(t.transaction_id)                       AS num_transactions,
          ROUND(SUM(t.amount)::numeric, 2)              AS total_spent
      FROM student s
      JOIN diningtransaction t ON s.student_id = t.student_id
      JOIN mealplan mp         ON s.plan_id    = mp.plan_id
      GROUP BY s.student_id, s.first_name, s.last_name, mp.plan_name
      ORDER BY total_spent DESC
      LIMIT 5
    `,
  },
  2: {
    title: 'Top 10 Most Popular Menu Items',
    description: 'Ranks menu items by total quantity sold, with total revenue and category breakdown.',
    joins: 'MenuItem × TransactionItem × DiningTransaction',
    sql: `
      SELECT
          mi.item_id,
          mi.item_name,
          mi.category,
          SUM(ti.quantity)                              AS total_sold,
          COUNT(DISTINCT t.transaction_id)              AS appears_in_transactions,
          ROUND(SUM(ti.quantity * ti.item_price)::numeric, 2) AS total_revenue
      FROM menuitem mi
      JOIN transactionitem ti  ON mi.item_id        = ti.item_id
      JOIN diningtransaction t ON ti.transaction_id = t.transaction_id
      GROUP BY mi.item_id, mi.item_name, mi.category
      ORDER BY total_sold DESC, total_revenue DESC
      LIMIT 10
    `,
  },
  3: {
    title: 'Dining Hall Ratings (≥ 3 Reviews)',
    description: 'Average rating per hall filtered to halls with at least 3 reviews, sorted best-rated first.',
    joins: 'DiningHall × Review',
    sql: `
      SELECT
          dh.hall_id,
          dh.hall_name,
          dh.location,
          COUNT(r.review_id)              AS num_reviews,
          ROUND(AVG(r.rating)::numeric, 2) AS avg_rating,
          MIN(r.rating)                   AS lowest_rating,
          MAX(r.rating)                   AS highest_rating
      FROM dininghall dh
      JOIN review r ON dh.hall_id = r.hall_id
      WHERE r.hall_id IS NOT NULL
      GROUP BY dh.hall_id, dh.hall_name, dh.location
      HAVING COUNT(r.review_id) >= 3
      ORDER BY avg_rating DESC, num_reviews DESC
    `,
  },
  4: {
    title: 'Vegan + Gluten-Free Allergen-Free Items',
    description: 'Menu items that are both vegan and gluten-free AND contain no registered allergens — safe for severely restricted diets.',
    joins: 'MenuItem × ItemAllergen (LEFT)',
    sql: `
      SELECT
          mi.item_id,
          mi.item_name,
          mi.category,
          mi.calories,
          mi.price
      FROM menuitem mi
      LEFT JOIN itemallergen ia ON mi.item_id = ia.item_id
      WHERE mi.is_vegan       = true
        AND mi.is_gluten_free = true
        AND ia.allergen_id IS NULL
      ORDER BY mi.category, mi.item_name
    `,
  },
  5: {
    title: 'Supervisor Analysis — Subordinate Count & Wage Gap',
    description: 'Each supervisor with their team size, average subordinate wage, and the difference vs. their own wage.',
    joins: 'Employee SELF-JOIN × DiningHall',
    sql: `
      SELECT
          sup.employee_id                                          AS supervisor_id,
          sup.first_name || ' ' || sup.last_name                   AS supervisor_name,
          sup.role                                                 AS supervisor_role,
          dh.hall_name,
          COUNT(sub.employee_id)                                   AS subordinate_count,
          ROUND(AVG(sub.hourly_wage)::numeric, 2)                  AS avg_subordinate_wage,
          ROUND((sup.hourly_wage - AVG(sub.hourly_wage))::numeric, 2) AS wage_gap
      FROM employee sup
      JOIN employee sub  ON sup.employee_id = sub.supervisor_id
      JOIN dininghall dh ON sup.hall_id     = dh.hall_id
      GROUP BY sup.employee_id, sup.first_name, sup.last_name,
               sup.role, sup.hourly_wage, dh.hall_name
      ORDER BY subordinate_count DESC, supervisor_name
    `,
  },
  6: {
    title: 'Revenue by Hall × Payment Method',
    description: 'Total revenue broken down by dining hall and payment method — reveals which halls rely most on meal swipes vs. cash/card.',
    joins: 'DiningHall × DiningTransaction',
    sql: `
      SELECT
          dh.hall_name,
          t.payment_method,
          COUNT(t.transaction_id)             AS num_transactions,
          ROUND(SUM(t.amount)::numeric, 2)    AS total_revenue,
          ROUND(AVG(t.amount)::numeric, 2)    AS avg_transaction_value
      FROM dininghall dh
      JOIN diningtransaction t ON dh.hall_id = t.hall_id
      GROUP BY dh.hall_name, t.payment_method
      ORDER BY dh.hall_name, total_revenue DESC
    `,
  },
  7: {
    title: 'Students Who Visited 3+ Distinct Halls',
    description: 'Students who ate at three or more different dining halls, with their total spend and diversity of visits.',
    joins: 'Student × DiningTransaction × MealPlan',
    sql: `
      SELECT
          s.student_id,
          s.first_name || ' ' || s.last_name   AS student_name,
          s.major,
          mp.plan_name                         AS meal_plan,
          COUNT(DISTINCT t.hall_id)            AS distinct_halls_visited,
          COUNT(t.transaction_id)              AS total_transactions,
          ROUND(SUM(t.amount)::numeric, 2)     AS total_spent
      FROM student s
      JOIN diningtransaction t ON s.student_id = t.student_id
      JOIN mealplan mp         ON s.plan_id    = mp.plan_id
      GROUP BY s.student_id, s.first_name, s.last_name, s.major, mp.plan_name
      HAVING COUNT(DISTINCT t.hall_id) >= 3
      ORDER BY distinct_halls_visited DESC, total_spent DESC
    `,
  },
  8: {
    title: 'Daily Menu for 2026-04-20 with Allergen Warnings',
    description: 'Full menu for April 20, 2026 across all halls and meal periods, with dietary tags and allergen lists.',
    joins: 'DailyMenu × Station × DiningHall × MenuItem × ItemAllergen × Allergen (LEFT)',
    sql: `
      SELECT
          dh.hall_name,
          st.station_name,
          dm.meal_period,
          mi.item_name,
          mi.category,
          mi.price,
          CASE WHEN mi.is_vegan       = true THEN 'V'
               WHEN mi.is_vegetarian  = true THEN 'VG'
               ELSE '' END
          || CASE WHEN mi.is_gluten_free = true THEN ' GF' ELSE '' END AS dietary_tags,
          COALESCE(STRING_AGG(a.allergen_name, ', '), 'None')           AS allergens
      FROM dailymenu dm
      JOIN station st       ON dm.station_id  = st.station_id
      JOIN dininghall dh    ON st.hall_id     = dh.hall_id
      JOIN menuitem mi      ON dm.item_id     = mi.item_id
      LEFT JOIN itemallergen ia ON mi.item_id = ia.item_id
      LEFT JOIN allergen a      ON ia.allergen_id = a.allergen_id
      WHERE dm.serve_date = '2026-04-20'
      GROUP BY dh.hall_name, st.station_name, dm.meal_period,
               mi.item_name, mi.category, mi.price,
               mi.is_vegan, mi.is_vegetarian, mi.is_gluten_free
      ORDER BY dh.hall_name, dm.meal_period, st.station_name, mi.item_name
    `,
  },
  9: {
    title: 'Dead Menu Items — Never Ordered & Never Reviewed',
    description: 'Items that have zero transaction appearances and zero reviews — prime candidates for menu removal.',
    joins: 'MenuItem × TransactionItem (LEFT) × Review (LEFT)',
    sql: `
      SELECT
          mi.item_id,
          mi.item_name,
          mi.category,
          mi.price
      FROM menuitem mi
      LEFT JOIN transactionitem ti ON mi.item_id = ti.item_id
      LEFT JOIN review r           ON mi.item_id = r.item_id
      WHERE ti.transaction_id IS NULL
        AND r.review_id IS NULL
      ORDER BY mi.category, mi.item_name
    `,
  },
  10: {
    title: 'High-Investment Students',
    description: 'Students on above-average-priced plans who also spend above 75% of the average per-student total — their plan usage genuinely justifies the cost.',
    joins: 'Student × MealPlan × DiningTransaction (with scalar subqueries)',
    sql: `
      SELECT
          s.student_id,
          s.first_name || ' ' || s.last_name          AS student_name,
          s.class_year,
          mp.plan_name                                 AS meal_plan,
          mp.price                                     AS plan_price,
          ROUND(SUM(t.amount)::numeric, 2)             AS total_spent,
          COUNT(t.transaction_id)                      AS num_transactions,
          ROUND(AVG(t.amount)::numeric, 2)             AS avg_transaction
      FROM student s
      JOIN mealplan mp         ON s.plan_id    = mp.plan_id
      JOIN diningtransaction t ON s.student_id = t.student_id
      WHERE mp.price > (SELECT AVG(price) FROM mealplan)
      GROUP BY s.student_id, s.first_name, s.last_name,
               s.class_year, mp.plan_name, mp.price
      HAVING SUM(t.amount) > 0.75 * (
              SELECT AVG(student_total)
              FROM (
                  SELECT SUM(amount) AS student_total
                  FROM diningtransaction
                  GROUP BY student_id
              ) AS per_student_totals
          )
      ORDER BY total_spent DESC
    `,
  },
};

// GET /api/analytics/meta — list all query titles
router.get('/meta', (_req, res) => {
  const meta = Object.entries(QUERIES).map(([id, q]) => ({
    id: parseInt(id),
    title: q.title,
    description: q.description,
    joins: q.joins,
  }));
  res.json(meta);
});

// GET /api/analytics/:id — run a specific query
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const query = QUERIES[id];
  if (!query) return res.status(404).json({ error: `Query ${id} not found` });

  try {
    const result = await pool.query(query.sql);
    res.json({
      id,
      title: query.title,
      description: query.description,
      joins: query.joins,
      rowCount: result.rowCount,
      columns: result.fields.map((f) => f.name),
      rows: result.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
