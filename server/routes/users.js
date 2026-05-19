const router = require('express').Router();
const db     = require('../database');

// GET /api/users/:id/profile — public user profile
router.get('/:id/profile', (req, res) => {
  const userId = Number(req.params.id);
  const user = db.prepare('SELECT id, name, role, created_at FROM users WHERE id=?').get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (user.role === 'freelancer') {
    const profile = db.prepare('SELECT * FROM freelancer_profiles WHERE user_id=?').get(userId);
    const stats   = db.prepare(`
      SELECT
        CAST(COALESCE(SUM(CASE WHEN pr.status='accepted' THEN 1 ELSE 0 END), 0) AS INTEGER) AS projects_done,
        ROUND(AVG(CASE WHEN pr.status='accepted' THEN pr.price END), 2)                     AS avg_price,
        ROUND(AVG(rv.rating), 1)                                                             AS avg_rating,
        CAST(COUNT(DISTINCT rv.id) AS INTEGER)                                               AS review_count
      FROM proposals pr
      LEFT JOIN reviews rv ON rv.freelancer_id = ?
      WHERE pr.user_id = ?
    `).get(userId, userId);

    return res.json({
      ...user,
      ...(profile || {}),
      projects_done: stats?.projects_done || 0,
      avg_price:     stats?.avg_price     || null,
      avg_rating:    stats?.avg_rating    || null,
      review_count:  stats?.review_count  || 0
    });
  } else {
    const profile = db.prepare('SELECT * FROM client_profiles WHERE user_id=?').get(userId);
    const stats   = db.prepare('SELECT COUNT(*) AS total_posts FROM posts WHERE user_id=?').get(userId);
    return res.json({
      ...user,
      ...(profile || {}),
      total_posts: stats?.total_posts || 0
    });
  }
});

module.exports = router;
