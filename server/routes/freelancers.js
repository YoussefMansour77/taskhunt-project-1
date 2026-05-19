const router = require('express').Router();
const db     = require('../database');

// GET /api/freelancers — returns registered freelancers with complete profiles
router.get('/', (req, res) => {
  const { category, sub_category, min_price, max_price, limit = 500, offset = 0 } = req.query;

  let where = 'fp.profile_complete = 1';
  const params = [];
  if (category)     { where += ' AND fp.category = ?';     params.push(category); }
  if (sub_category) { where += ' AND fp.sub_category = ?'; params.push(sub_category); }
  if (min_price)    { where += ' AND fp.hourly_rate >= ?'; params.push(Number(min_price)); }
  if (max_price)    { where += ' AND fp.hourly_rate <= ?'; params.push(Number(max_price)); }

  const query = `
    SELECT
      fp.user_id,
      fp.user_id AS id,
      COALESCE(fp.display_name, u.name) AS name,
      fp.title, fp.category, fp.sub_category,
      fp.hourly_rate, fp.skills, fp.avatar,
      CASE fp.experience_level
        WHEN 'beginner'     THEN 1
        WHEN 'intermediate' THEN 4
        WHEN 'expert'       THEN 8
        ELSE 0
      END AS experience_years,
      COALESCE(ROUND((SELECT AVG(r.rating) FROM reviews r WHERE r.freelancer_id=fp.user_id), 1), 4.5) AS rating
    FROM freelancer_profiles fp
    JOIN users u ON u.id = fp.user_id
    WHERE ${where}
    ORDER BY fp.updated_at DESC
    LIMIT ? OFFSET ?
  `;

  params.push(Number(limit), Number(offset));
  res.json(db.prepare(query).all(...params));
});

// GET /api/freelancers/categories — list of distinct categories
router.get('/categories', (_, res) => {
  res.json(db.prepare("SELECT DISTINCT category FROM freelancers ORDER BY category").all().map(r => r.category));
});

module.exports = router;
