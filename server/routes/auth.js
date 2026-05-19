const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../database');
const { SECRET } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role)
    return res.status(400).json({ error: 'All fields are required' });

  if (!['client', 'freelancer'].includes(role))
    return res.status(400).json({ error: 'Role must be client or freelancer' });

  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (exists) return res.status(409).json({ error: 'Email already registered' });

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)'
  ).run(name, email, hash, role);

  const token = jwt.sign(
    { id: result.lastInsertRowid, name, email, role },
    SECRET,
    { expiresIn: '7d' }
  );

  res.status(201).json({ message: 'Registered successfully', token, user: { id: result.lastInsertRowid, name, email, role } });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required' });

  // Check regular users first, then admins
  let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  let role = user?.role;

  if (!user) {
    user = db.prepare('SELECT * FROM admins WHERE email = ?').get(email);
    if (user) role = 'admin';
  }

  if (!user) return res.status(401).json({ error: 'Invalid email or password' });

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, role },
    SECRET,
    { expiresIn: '7d' }
  );

  let profile_complete = false;
  if (role === 'freelancer') {
    const fp = db.prepare('SELECT profile_complete FROM freelancer_profiles WHERE user_id = ?').get(user.id);
    profile_complete = fp ? fp.profile_complete === 1 : false;
  } else if (role === 'client') {
    const cp = db.prepare('SELECT profile_complete FROM client_profiles WHERE user_id = ?').get(user.id);
    profile_complete = cp ? cp.profile_complete === 1 : false;
  }

  res.json({ message: 'Login successful', token, user: { id: user.id, name: user.name, email: user.email, role, profile_complete } });
});

// GET /api/auth/me  — get current user info
router.get('/me', require('../middleware/auth').requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, name, email, role, bio, avatar, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// PUT /api/auth/me  — update bio
router.put('/me', require('../middleware/auth').requireAuth, (req, res) => {
  const { bio, name } = req.body;
  db.prepare('UPDATE users SET bio = COALESCE(?, bio), name = COALESCE(?, name) WHERE id = ?')
    .run(bio !== undefined ? bio : null, name || null, req.user.id);
  const user = db.prepare('SELECT id, name, email, role, bio, avatar, created_at FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

// GET /api/auth/my-proposals — freelancer's submitted proposals
router.get('/my-proposals', require('../middleware/auth').requireAuth, (req, res) => {
  const proposals = db.prepare(`
    SELECT pr.*, p.title AS post_title, p.budget AS post_budget, u.name AS client_name
    FROM proposals pr
    JOIN posts p ON p.id = pr.post_id
    JOIN users u ON u.id = p.user_id
    WHERE pr.user_id = ?
    ORDER BY pr.created_at DESC
  `).all(req.user.id);
  res.json(proposals);
});

module.exports = router;
