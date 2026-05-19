const router = require('express').Router();
const db     = require('../database');
const { requireAuth } = require('../middleware/auth');

// GET /api/reviews/freelancer/:id — public
router.get('/freelancer/:id', (req, res) => {
  const rows = db.prepare(`
    SELECT r.*, u.name AS client_name, cp.avatar AS client_avatar
    FROM reviews r
    JOIN users u ON u.id = r.client_id
    LEFT JOIN client_profiles cp ON cp.user_id = r.client_id
    WHERE r.freelancer_id = ?
    ORDER BY r.created_at DESC
  `).all(req.params.id);
  res.json(rows);
});

// GET /api/reviews/check/:convId — check if conversation already reviewed
router.get('/check/:convId', requireAuth, (req, res) => {
  const review = db.prepare('SELECT id, rating, comment FROM reviews WHERE conversation_id=?').get(req.params.convId);
  res.json({ reviewed: !!review, review: review || null });
});

// POST /api/reviews — client submits review
router.post('/', requireAuth, (req, res) => {
  if (req.user.role !== 'client')
    return res.status(403).json({ error: 'Only clients can submit reviews' });

  const { freelancer_id, conversation_id, rating, comment } = req.body;
  if (!freelancer_id || !conversation_id || !rating)
    return res.status(400).json({ error: 'freelancer_id, conversation_id, and rating are required' });
  if (rating < 1 || rating > 5)
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });

  const conv = db.prepare('SELECT * FROM conversations WHERE id=? AND client_id=?').get(conversation_id, req.user.id);
  if (!conv) return res.status(403).json({ error: 'Not authorized for this conversation' });
  if (conv.freelancer_id !== Number(freelancer_id))
    return res.status(400).json({ error: 'Freelancer mismatch' });

  try {
    db.prepare(
      'INSERT INTO reviews (freelancer_id, client_id, conversation_id, rating, comment) VALUES (?,?,?,?,?)'
    ).run(Number(freelancer_id), req.user.id, Number(conversation_id), Number(rating), comment || null);

    db.prepare(`
      INSERT INTO notifications (user_id, type, title, body, ref_id, ref_type)
      VALUES (?, 'review_received', ?, ?, ?, 'review')
    `).run(
      Number(freelancer_id),
      '⭐ New Review Received!',
      `You received a ${rating}-star review from ${req.user.name}`,
      Number(freelancer_id)
    );

    res.status(201).json({ message: 'Review submitted successfully' });
  } catch (e) {
    if (e.message && e.message.includes('UNIQUE'))
      return res.status(409).json({ error: 'You already reviewed this project' });
    throw e;
  }
});

module.exports = router;
