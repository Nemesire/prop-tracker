const router = require('express').Router()
const { body, validationResult } = require('express-validator')
const pool   = require('../config/database')
const auth   = require('../middleware/auth')

const mapUser = (u) => ({
  id:          u.id,
  username:    u.username,
  displayName: u.display_name,
  avatar:      u.avatar   || undefined,
  bio:         u.bio      || undefined,
  country:     u.country  || undefined,
  isPublic:    u.is_public,
  xp:          u.xp    || 0,
  level:       u.level || 1,
  badges:      u.badges || [],
  joinDate:    u.join_date,
  following:   [],
  followers:   [],
})

router.get('/:username', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, username, display_name, avatar, bio, country, is_public, xp, level, badges, join_date
       FROM users WHERE username = $1`,
      [req.params.username.toLowerCase()]
    )
    if (!rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' })

    const u = rows[0]
    if (!u.is_public && u.id !== req.user.id)
      return res.status(403).json({ error: 'Perfil privado' })

    res.json({ user: mapUser(u) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error del servidor' })
  }
})

router.patch('/', auth, [
  body('displayName').optional().trim().isLength({ min: 2, max: 100 }),
  body('bio').optional().isLength({ max: 500 }),
  body('country').optional().isLength({ max: 100 }),
  body('avatar').optional().isString(),
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

  const { displayName, bio, country, isPublic, avatar } = req.body

  try {
    const { rows } = await pool.query(`
      UPDATE users SET
        display_name = COALESCE($1, display_name),
        bio          = COALESCE($2, bio),
        country      = COALESCE($3, country),
        is_public    = COALESCE($4, is_public),
        avatar       = COALESCE($5, avatar),
        updated_at   = NOW()
      WHERE id = $6
      RETURNING id, username, display_name, avatar, bio, country, is_public, xp, level, badges, join_date
    `, [displayName, bio, country, isPublic, avatar, req.user.id])

    res.json({ user: mapUser(rows[0]) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error del servidor' })
  }
})

module.exports = router
