const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../database');
const { SECRET } = require('../middleware/auth');

// ── Admin auth middleware ─────────────────────────────────────────
function requireAdmin(req, res, next) {
  const header = req.headers['authorization'];
  const token  = header && header.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Admin login required' });
  try {
    const decoded = jwt.verify(token, SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    req.admin = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// GET /api/admin/stats — real platform stats
router.get('/stats', requireAdmin, (req, res) => {
  res.json({
    users:       db.prepare('SELECT COUNT(*) as n FROM users').get().n,
    clients:     db.prepare("SELECT COUNT(*) as n FROM users WHERE role='client'").get().n,
    freelancers: db.prepare("SELECT COUNT(*) as n FROM users WHERE role='freelancer'").get().n,
    posts:       db.prepare('SELECT COUNT(*) as n FROM posts').get().n,
    proposals:   db.prepare('SELECT COUNT(*) as n FROM proposals').get().n,
  });
});

// GET /api/admin/users — list platform users
router.get('/users', requireAdmin, (req, res) => {
  const rows = db.prepare(
    'SELECT id, name, email, role, created_at FROM users ORDER BY id DESC'
  ).all();
  res.json(rows);
});

// GET /api/admin/accounts — list all admin accounts
router.get('/accounts', requireAdmin, (req, res) => {
  const rows = db.prepare(
    'SELECT id, name, email, created_at FROM admins ORDER BY id'
  ).all();
  res.json(rows);
});

// POST /api/admin/accounts — add new admin
router.post('/accounts', requireAdmin, (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email and password are required' });

  if (db.prepare('SELECT id FROM admins WHERE email = ?').get(email))
    return res.status(409).json({ error: 'This email is already registered as admin' });

  const hash   = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO admins (name, email, password) VALUES (?, ?, ?)'
  ).run(name, email, hash);

  res.status(201).json({ id: result.lastInsertRowid, name, email, created_at: new Date().toISOString() });
});

// DELETE /api/admin/accounts/:id — delete admin
router.delete('/accounts/:id', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
  if (id === req.admin.id) return res.status(400).json({ error: 'You cannot delete your own account' });

  const changes = db.prepare('DELETE FROM admins WHERE id = ?').run(id).changes;
  if (!changes) return res.status(404).json({ error: 'Admin not found' });
  res.json({ message: 'Admin deleted successfully' });
});

module.exports = router;
