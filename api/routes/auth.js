const router  = require('express').Router()
const bcrypt  = require('bcryptjs')
const jwt     = require('jsonwebtoken')
const { body, validationResult } = require('express-validator')
const pool    = require('../config/database')
const auth    = require('../middleware/auth')

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' })

const mapUser = (u, accounts = []) => ({
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
  accounts,
  following:   [],
  followers:   [],
})

router.post('/register', [
  body('username').trim().isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_]+$/),
  body('displayName').trim().isLength({ min: 2, max: 100 }),
  body('password').isLength({ min: 6 }),
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

  const { username, displayName, password, email } = req.body

  try {
    const exists = await pool.query('SELECT id FROM users WHERE username = $1', [username.toLowerCase()])
    if (exists.rows[0]) return res.status(409).json({ error: 'El nombre de usuario ya existe' })

    const passwordHash = await bcrypt.hash(password, 12)
    const { rows } = await pool.query(`
      INSERT INTO users (username, display_name, email, password_hash)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, display_name, avatar, bio, country, is_public, xp, level, badges, join_date
    `, [username.toLowerCase(), displayName, email || null, passwordHash])

    const token = signToken(rows[0].id)
    res.status(201).json({ token, user: mapUser(rows[0]) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error del servidor' })
  }
})

router.post('/login', [
  body('username').trim().notEmpty(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

  const { username, password } = req.body

  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username.toLowerCase()])
    const user = rows[0]

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' })
    }

    const token = signToken(user.id)
    res.json({ token, user: mapUser(user) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error del servidor' })
  }
})

router.get('/me', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, username, display_name, avatar, bio, country, is_public, xp, level, badges, join_date
       FROM users WHERE id = $1`,
      [req.user.id]
    )
    res.json({ user: mapUser(rows[0]) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error del servidor' })
  }
})

module.exports = router
module.exports.mapUser = mapUser
