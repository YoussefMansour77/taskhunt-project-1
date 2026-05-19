const router = require('express').Router();
const db     = require('../database');
const { requireAuth } = require('../middleware/auth');

// ── Freelancer Profile ──────────────────────────────────────────────────────

// GET /api/profiles/freelancer
router.get('/freelancer', requireAuth, (req, res) => {
  const profile = db.prepare('SELECT * FROM freelancer_profiles WHERE user_id = ?').get(req.user.id);
  res.json(profile || null);
});

// POST /api/profiles/freelancer  (JSON body — avatar is base64 string)
router.post('/freelancer', requireAuth, (req, res) => {
  const {
    display_name, title, bio, skills, category, sub_category,
    experience_level, hourly_rate, portfolio_url, github_url,
    linkedin_url, phone, city, country, languages, education, avatar
  } = req.body;

  // avatar is a base64 data-URL string (or null)
  const avatarVal = avatar && avatar.startsWith('data:image') ? avatar : null;

  const existing = db.prepare('SELECT id, avatar FROM freelancer_profiles WHERE user_id = ?').get(req.user.id);

  if (existing) {
    db.prepare(`
      UPDATE freelancer_profiles SET
        display_name=?, title=?, bio=?, skills=?, category=?, sub_category=?,
        experience_level=?, hourly_rate=?, portfolio_url=?, github_url=?,
        linkedin_url=?, phone=?, city=?, country=?, languages=?, education=?,
        avatar=COALESCE(?,avatar), profile_complete=1, updated_at=CURRENT_TIMESTAMP
      WHERE user_id=?
    `).run(
      display_name||null, title||null, bio||null, skills||'[]', category||null,
      sub_category||null, experience_level||null, hourly_rate||null,
      portfolio_url||null, github_url||null, linkedin_url||null,
      phone||null, city||null, country||null, languages||'[]', education||null,
      avatarVal, req.user.id
    );
  } else {
    db.prepare(`
      INSERT INTO freelancer_profiles
        (user_id, display_name, title, bio, skills, category, sub_category,
         experience_level, hourly_rate, portfolio_url, github_url, linkedin_url,
         phone, city, country, languages, education, avatar, profile_complete)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)
    `).run(
      req.user.id, display_name||null, title||null, bio||null, skills||'[]',
      category||null, sub_category||null, experience_level||null, hourly_rate||null,
      portfolio_url||null, github_url||null, linkedin_url||null,
      phone||null, city||null, country||null, languages||'[]', education||null, avatarVal
    );
  }

  const profile = db.prepare('SELECT * FROM freelancer_profiles WHERE user_id = ?').get(req.user.id);
  res.json({ message: 'Profile saved successfully', profile });
});

// ── Client Profile ──────────────────────────────────────────────────────────

// GET /api/profiles/client
router.get('/client', requireAuth, (req, res) => {
  const profile = db.prepare('SELECT * FROM client_profiles WHERE user_id = ?').get(req.user.id);
  res.json(profile || null);
});

// POST /api/profiles/client  (JSON body — avatar is base64 string)
router.post('/client', requireAuth, (req, res) => {
  const { display_name, description, avatar } = req.body;
  const avatarVal = avatar && avatar.startsWith('data:image') ? avatar : null;

  const existing = db.prepare('SELECT id FROM client_profiles WHERE user_id = ?').get(req.user.id);

  if (existing) {
    db.prepare(`
      UPDATE client_profiles SET
        display_name=?, description=?, avatar=COALESCE(?,avatar),
        profile_complete=1, updated_at=CURRENT_TIMESTAMP
      WHERE user_id=?
    `).run(display_name||null, description||null, avatarVal, req.user.id);
  } else {
    db.prepare(`
      INSERT INTO client_profiles (user_id, display_name, description, avatar, profile_complete)
      VALUES (?,?,?,?,1)
    `).run(req.user.id, display_name||null, description||null, avatarVal);
  }

  const profile = db.prepare('SELECT * FROM client_profiles WHERE user_id = ?').get(req.user.id);
  res.json({ message: 'Profile saved successfully', profile });
});

module.exports = router;
