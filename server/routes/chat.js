const router = require('express').Router();
const db     = require('../database');
const { requireAuth } = require('../middleware/auth');

// ── Specific routes FIRST (before /:id wildcard) ─────────────────────────────

// GET /api/chat/conversations
router.get('/conversations', requireAuth, (req, res) => {
  const uid = req.user.id;
  const rows = db.prepare(`
    SELECT c.*,
           p.title  AS post_title,
           p.budget AS post_budget,
           cl.name  AS client_name,
           fl.name  AS freelancer_name,
           fp.avatar AS freelancer_avatar,
           (SELECT body FROM messages WHERE conversation_id=c.id ORDER BY created_at DESC LIMIT 1) AS last_message,
           (SELECT created_at FROM messages WHERE conversation_id=c.id ORDER BY created_at DESC LIMIT 1) AS last_message_at,
           (SELECT COUNT(*) FROM messages WHERE conversation_id=c.id AND sender_id!=? AND is_read_by_recipient=0) AS unread_count
    FROM conversations c
    JOIN posts p  ON p.id  = c.post_id
    JOIN users cl ON cl.id = c.client_id
    JOIN users fl ON fl.id = c.freelancer_id
    LEFT JOIN freelancer_profiles fp ON fp.user_id = c.freelancer_id
    WHERE c.client_id=? OR c.freelancer_id=?
    ORDER BY COALESCE(last_message_at, c.created_at) DESC
  `).all(uid, uid, uid);
  res.json(rows);
});

// GET /api/chat/unread — total unread (must be before /:id)
router.get('/unread', requireAuth, (req, res) => {
  const uid = req.user.id;
  const p = db.prepare(`
    SELECT COUNT(*) as n FROM messages m
    JOIN conversations c ON c.id = m.conversation_id
    WHERE (c.client_id=? OR c.freelancer_id=?) AND m.sender_id!=? AND m.is_read_by_recipient=0
  `).get(uid, uid, uid).n || 0;
  const d = db.prepare(`
    SELECT COUNT(*) as n FROM direct_messages dm
    JOIN direct_conversations dc ON dc.id = dm.conv_id
    WHERE (dc.user1_id=? OR dc.user2_id=?) AND dm.sender_id!=? AND dm.is_read=0
  `).get(uid, uid, uid).n || 0;
  res.json({ count: p + d });
});

// GET /api/chat/direct — my direct conversations (must be before /:id)
router.get('/direct', requireAuth, (req, res) => {
  const uid = req.user.id;
  const rows = db.prepare(`
    SELECT dc.*,
      u1.name AS user1_name, u2.name AS user2_name,
      COALESCE(fp1.avatar, cp1.avatar) AS user1_avatar,
      COALESCE(fp2.avatar, cp2.avatar) AS user2_avatar,
      (SELECT body FROM direct_messages WHERE conv_id=dc.id ORDER BY created_at DESC LIMIT 1) AS last_message,
      (SELECT created_at FROM direct_messages WHERE conv_id=dc.id ORDER BY created_at DESC LIMIT 1) AS last_message_at,
      (SELECT COUNT(*) FROM direct_messages WHERE conv_id=dc.id AND sender_id!=? AND is_read=0) AS unread_count
    FROM direct_conversations dc
    JOIN users u1 ON u1.id = dc.user1_id
    JOIN users u2 ON u2.id = dc.user2_id
    LEFT JOIN freelancer_profiles fp1 ON fp1.user_id = dc.user1_id
    LEFT JOIN freelancer_profiles fp2 ON fp2.user_id = dc.user2_id
    LEFT JOIN client_profiles cp1 ON cp1.user_id = dc.user1_id
    LEFT JOIN client_profiles cp2 ON cp2.user_id = dc.user2_id
    WHERE dc.user1_id=? OR dc.user2_id=?
    ORDER BY COALESCE(last_message_at, dc.created_at) DESC
  `).all(uid, uid, uid);

  res.json(rows.map(r => ({
    ...r,
    conv_type:    'direct',
    other_id:     r.user1_id === uid ? r.user2_id    : r.user1_id,
    other_name:   r.user1_id === uid ? r.user2_name  : r.user1_name,
    other_avatar: r.user1_id === uid ? r.user2_avatar : r.user1_avatar
  })));
});

// POST /api/chat/direct/with/:userId — get or create direct conversation
router.post('/direct/with/:userId', requireAuth, (req, res) => {
  const uid     = req.user.id;
  const otherId = Number(req.params.userId);
  if (uid === otherId) return res.status(400).json({ error: 'Cannot message yourself' });

  const u1 = Math.min(uid, otherId);
  const u2 = Math.max(uid, otherId);

  let conv = db.prepare('SELECT * FROM direct_conversations WHERE user1_id=? AND user2_id=?').get(u1, u2);
  if (!conv) {
    const r = db.prepare('INSERT INTO direct_conversations (user1_id, user2_id) VALUES (?,?)').run(u1, u2);
    conv = db.prepare('SELECT * FROM direct_conversations WHERE id=?').get(r.lastInsertRowid);
  }

  const other = db.prepare(`
    SELECT u.name, COALESCE(fp.avatar, cp.avatar) AS avatar
    FROM users u
    LEFT JOIN freelancer_profiles fp ON fp.user_id = u.id
    LEFT JOIN client_profiles cp ON cp.user_id = u.id
    WHERE u.id=?
  `).get(otherId);

  res.json({ ...conv, conv_type: 'direct', other_id: otherId, other_name: other?.name || 'User', other_avatar: other?.avatar || null });
});

// GET /api/chat/direct/:id/messages
router.get('/direct/:id/messages', requireAuth, (req, res) => {
  const uid  = req.user.id;
  const conv = db.prepare('SELECT * FROM direct_conversations WHERE id=?').get(req.params.id);
  if (!conv) return res.status(404).json({ error: 'Not found' });
  if (conv.user1_id !== uid && conv.user2_id !== uid) return res.status(403).json({ error: 'Not authorized' });

  db.prepare('UPDATE direct_messages SET is_read=1 WHERE conv_id=? AND sender_id!=?').run(conv.id, uid);

  const msgs = db.prepare(`
    SELECT dm.*, u.name AS sender_name,
           COALESCE(fp.avatar, cp.avatar) AS sender_avatar
    FROM direct_messages dm
    JOIN users u ON u.id = dm.sender_id
    LEFT JOIN freelancer_profiles fp ON fp.user_id = dm.sender_id
    LEFT JOIN client_profiles     cp ON cp.user_id = dm.sender_id
    WHERE dm.conv_id=? ORDER BY dm.created_at ASC
  `).all(conv.id);
  res.json(msgs);
});

// POST /api/chat/direct/:id/messages
router.post('/direct/:id/messages', requireAuth, (req, res) => {
  const uid  = req.user.id;
  const conv = db.prepare('SELECT * FROM direct_conversations WHERE id=?').get(req.params.id);
  if (!conv) return res.status(404).json({ error: 'Not found' });
  if (conv.user1_id !== uid && conv.user2_id !== uid) return res.status(403).json({ error: 'Not authorized' });

  const { body } = req.body;
  if (!body?.trim()) return res.status(400).json({ error: 'Empty message' });

  const result = db.prepare('INSERT INTO direct_messages (conv_id, sender_id, body) VALUES (?,?,?)').run(conv.id, uid, body.trim());

  const recipientId = uid === conv.user1_id ? conv.user2_id : conv.user1_id;
  const senderName  = db.prepare('SELECT name FROM users WHERE id=?').get(uid)?.name || 'User';

  db.prepare(`INSERT INTO notifications (user_id,type,title,body,ref_id,ref_type) VALUES (?,'new_message',?,?,?,'direct_conversation')`).run(
    recipientId, `New message from ${senderName}`, body.trim().slice(0, 80), conv.id
  );

  const msg = db.prepare(`SELECT dm.*, u.name AS sender_name, COALESCE(fp.avatar,cp.avatar) AS sender_avatar FROM direct_messages dm JOIN users u ON u.id=dm.sender_id LEFT JOIN freelancer_profiles fp ON fp.user_id=dm.sender_id LEFT JOIN client_profiles cp ON cp.user_id=dm.sender_id WHERE dm.id=?`).get(result.lastInsertRowid);
  res.status(201).json(msg);
});

// ── Wildcard routes LAST ──────────────────────────────────────────────────────

// GET /api/chat/:id — single proposal conversation info
router.get('/:id', requireAuth, (req, res) => {
  const uid  = req.user.id;
  const conv = db.prepare(`
    SELECT c.*,
           p.title AS post_title, p.budget AS post_budget,
           cl.name AS client_name, fl.name AS freelancer_name,
           fp.avatar AS freelancer_avatar, fp.title AS freelancer_title
    FROM conversations c
    JOIN posts p  ON p.id  = c.post_id
    JOIN users cl ON cl.id = c.client_id
    JOIN users fl ON fl.id = c.freelancer_id
    LEFT JOIN freelancer_profiles fp ON fp.user_id = c.freelancer_id
    WHERE c.id=?
  `).get(req.params.id);
  if (!conv) return res.status(404).json({ error: 'Conversation not found' });
  if (conv.client_id !== uid && conv.freelancer_id !== uid)
    return res.status(403).json({ error: 'Not authorized' });
  res.json(conv);
});

// GET /api/chat/:id/messages
router.get('/:id/messages', requireAuth, (req, res) => {
  const uid  = req.user.id;
  const conv = db.prepare('SELECT * FROM conversations WHERE id=?').get(req.params.id);
  if (!conv) return res.status(404).json({ error: 'Conversation not found' });
  if (conv.client_id !== uid && conv.freelancer_id !== uid)
    return res.status(403).json({ error: 'Not authorized' });

  db.prepare(`UPDATE messages SET is_read_by_recipient=1 WHERE conversation_id=? AND sender_id!=?`).run(conv.id, uid);

  const messages = db.prepare(`
    SELECT m.*, u.name AS sender_name,
           COALESCE(fp.avatar, cp.avatar) AS sender_avatar
    FROM messages m
    JOIN users u ON u.id = m.sender_id
    LEFT JOIN freelancer_profiles fp ON fp.user_id = m.sender_id
    LEFT JOIN client_profiles     cp ON cp.user_id = m.sender_id
    WHERE m.conversation_id=? ORDER BY m.created_at ASC
  `).all(conv.id);
  res.json(messages);
});

// POST /api/chat/:id/messages
router.post('/:id/messages', requireAuth, (req, res) => {
  const uid  = req.user.id;
  const conv = db.prepare('SELECT * FROM conversations WHERE id=?').get(req.params.id);
  if (!conv) return res.status(404).json({ error: 'Conversation not found' });
  if (conv.client_id !== uid && conv.freelancer_id !== uid)
    return res.status(403).json({ error: 'Not authorized' });

  const { body } = req.body;
  if (!body || !body.trim()) return res.status(400).json({ error: 'Message cannot be empty' });

  const result = db.prepare(`INSERT INTO messages (conversation_id, sender_id, body) VALUES (?,?,?)`).run(conv.id, uid, body.trim());

  const recipientId = uid === conv.client_id ? conv.freelancer_id : conv.client_id;
  const senderName  = db.prepare('SELECT name FROM users WHERE id=?').get(uid).name;
  const post        = db.prepare('SELECT title FROM posts WHERE id=?').get(conv.post_id);

  db.prepare(`INSERT INTO notifications (user_id,type,title,body,ref_id,ref_type) VALUES (?,'new_message',?,?,?,'conversation')`).run(
    recipientId,
    `New message from ${senderName}`,
    `"${body.trim().slice(0, 60)}${body.length > 60 ? '…' : ''}" — re: ${post.title}`,
    conv.id
  );

  const msg = db.prepare(`SELECT m.*, u.name AS sender_name, COALESCE(fp.avatar,cp.avatar) AS sender_avatar FROM messages m JOIN users u ON u.id=m.sender_id LEFT JOIN freelancer_profiles fp ON fp.user_id=m.sender_id LEFT JOIN client_profiles cp ON cp.user_id=m.sender_id WHERE m.id=?`).get(result.lastInsertRowid);
  res.status(201).json(msg);
});

module.exports = router;
