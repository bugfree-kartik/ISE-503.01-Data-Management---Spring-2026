require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────────────
app.use('/api/stats',         require('./routes/stats'));
app.use('/api/analytics',     require('./routes/analytics'));
app.use('/api/dining-halls',  require('./routes/diningHalls'));
app.use('/api/menu-items',    require('./routes/menuItems'));
app.use('/api/meal-plans',    require('./routes/mealPlans'));
app.use('/api/employees',     require('./routes/employees'));
app.use('/api/students',      require('./routes/students'));
app.use('/api/daily-menu',    require('./routes/dailyMenu'));
app.use('/api/reviews',       require('./routes/reviews'));
app.use('/api/transactions',  require('./routes/transactions'));

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`SBU Dining API running on http://localhost:${PORT}`);
});
