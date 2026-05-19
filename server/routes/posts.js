const router = require('express').Router();
const db     = require('../database');
const { requireAuth } = require('../middleware/auth');

// GET /api/posts — list all posts (public)
router.get('/', (req, res) => {
  const { category, status = 'open', limit = 20, offset = 0 } = req.query;

  let query = `
    SELECT p.*, u.name AS author_name, u.role AS author_role,
           COALESCE(cp.avatar, fp.avatar) AS author_avatar,
           (SELECT COUNT(*) FROM proposals WHERE post_id = p.id) AS proposals_count
    FROM posts p
    JOIN users u ON u.id = p.user_id
    LEFT JOIN client_profiles   cp ON cp.user_id = p.user_id
    LEFT JOIN freelancer_profiles fp ON fp.user_id = p.user_id
    WHERE 1=1
  `;
  const params = [];

  if (status !== 'all') { query += ' AND p.status = ?'; params.push(status); }
  if (category) { query += ' AND p.category = ?'; params.push(category); }
  if (req.query.user_id) { query += ' AND p.user_id = ?'; params.push(Number(req.query.user_id)); }
  query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  res.json(db.prepare(query).all(...params));
});

// GET /api/posts/:id — single post with proposals count
router.get('/:id', (req, res) => {
  const post = db.prepare(`
    SELECT p.*, u.name AS author_name, u.role AS author_role,
           (SELECT COUNT(*) FROM proposals WHERE post_id = p.id) AS proposals_count
    FROM posts p
    JOIN users u ON u.id = p.user_id
    WHERE p.id = ?
  `).get(req.params.id);

  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json(post);
});

// POST /api/posts — create post (any logged-in user)
router.post('/', requireAuth, (req, res) => {
  const { title, description, budget, category, post_type } = req.body;
  if (!title || !description)
    return res.status(400).json({ error: 'Title and description are required' });

  const result = db.prepare(
    'INSERT INTO posts (title, description, budget, category, post_type, user_id) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(title, description, budget || 0, category || 'General', post_type || 'job', req.user.id);

  res.status(201).json({ message: 'Post created', id: result.lastInsertRowid });
});

// PUT /api/posts/:id — update post (owner only)
router.put('/:id', requireAuth, (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (post.user_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

  const { title, description, budget, category, status } = req.body;
  db.prepare(`
    UPDATE posts SET
      title       = COALESCE(?, title),
      description = COALESCE(?, description),
      budget      = COALESCE(?, budget),
      category    = COALESCE(?, category),
      status      = COALESCE(?, status)
    WHERE id = ?
  `).run(title, description, budget, category, status, req.params.id);

  res.json({ message: 'Post updated' });
});

// DELETE /api/posts/:id — delete post (owner only)
router.delete('/:id', requireAuth, (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (post.user_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

  db.prepare('DELETE FROM proposals WHERE post_id = ?').run(req.params.id);
  db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
  res.json({ message: 'Post deleted' });
});

// POST /api/posts/:id/proposals — freelancer submits proposal
router.post('/:id/proposals', requireAuth, (req, res) => {
  if (req.user.role !== 'freelancer')
    return res.status(403).json({ error: 'Only freelancers can submit proposals' });

  const post = db.prepare("SELECT * FROM posts WHERE id = ? AND status = 'open'").get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found or closed' });

  const { message, price } = req.body;
  if (!message || !price)
    return res.status(400).json({ error: 'Message and price are required' });

  const already = db.prepare('SELECT id FROM proposals WHERE post_id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (already) return res.status(409).json({ error: 'You already submitted a proposal' });

  const result = db.prepare(
    'INSERT INTO proposals (post_id, user_id, message, price) VALUES (?, ?, ?, ?)'
  ).run(req.params.id, req.user.id, message, price);

  // Notify the client
  db.prepare(`
    INSERT INTO notifications (user_id, type, title, body, ref_id, ref_type)
    VALUES (?, 'proposal_received', ?, ?, ?, 'proposal')
  `).run(
    post.user_id,
    'New Proposal Received',
    `${req.user.name} submitted a proposal on "${post.title}"`,
    result.lastInsertRowid
  );

  res.status(201).json({ message: 'Proposal submitted', id: result.lastInsertRowid });
});

// GET /api/posts/:id/proposals — get proposals (post owner only)
router.get('/:id/proposals', requireAuth, (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (post.user_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

  const proposals = db.prepare(`
    SELECT pr.*,
           u.name AS freelancer_name, u.bio AS freelancer_bio,
           fp.title AS freelancer_title, fp.avatar AS freelancer_avatar,
           fp.skills AS freelancer_skills, fp.hourly_rate AS freelancer_rate
    FROM proposals pr
    JOIN users u ON u.id = pr.user_id
    LEFT JOIN freelancer_profiles fp ON fp.user_id = pr.user_id
    WHERE pr.post_id = ?
    ORDER BY pr.created_at DESC
  `).all(req.params.id);

  res.json(proposals);
});

// PATCH /api/posts/:id/proposals/:pid — accept or reject a proposal
router.patch('/:id/proposals/:pid', requireAuth, (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (post.user_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

  const proposal = db.prepare('SELECT * FROM proposals WHERE id = ? AND post_id = ?').get(req.params.pid, req.params.id);
  if (!proposal) return res.status(404).json({ error: 'Proposal not found' });

  const { action } = req.body; // 'accept' | 'reject'
  if (!['accept', 'reject'].includes(action))
    return res.status(400).json({ error: 'action must be accept or reject' });

  if (action === 'reject') {
    db.prepare("UPDATE proposals SET status='rejected' WHERE id=?").run(proposal.id);
    db.prepare(`
      INSERT INTO notifications (user_id, type, title, body, ref_id, ref_type)
      VALUES (?, 'proposal_rejected', 'Proposal Not Selected', ?, ?, 'post')
    `).run(proposal.user_id, `Your proposal on "${post.title}" was not selected.`, post.id);
    return res.json({ message: 'Proposal rejected' });
  }

  // Accept: mark this one accepted, reject others, close post, create conversation
  db.prepare("UPDATE proposals SET status='accepted' WHERE id=?").run(proposal.id);
  db.prepare("UPDATE proposals SET status='rejected' WHERE post_id=? AND id!=?").run(post.id, proposal.id);
  db.prepare("UPDATE posts SET status='closed' WHERE id=?").run(post.id);

  const conv = db.prepare(`
    INSERT INTO conversations (post_id, client_id, freelancer_id, proposal_id)
    VALUES (?, ?, ?, ?)
  `).run(post.id, post.user_id, proposal.user_id, proposal.id);

  // Notify freelancer
  db.prepare(`
    INSERT INTO notifications (user_id, type, title, body, ref_id, ref_type)
    VALUES (?, 'proposal_accepted', '🎉 Proposal Accepted!', ?, ?, 'conversation')
  `).run(
    proposal.user_id,
    `Your proposal on "${post.title}" was accepted! Start chatting now.`,
    conv.lastInsertRowid
  );

  res.json({ message: 'Proposal accepted', conversation_id: conv.lastInsertRowid });
});

module.exports = router;
