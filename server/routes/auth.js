const router  = require('express').Router()
const bcrypt  = require('bcryptjs')
const jwt     = require('jsonwebtoken')
const { body, validationResult } = require('express-validator')
const pool    = require('../config/database')
const auth    = require('../middleware/auth')
const { sendEmail, tempPasswordEmail, emailEnabled } = require('../config/email')

/** Genera una contraseña temporal legible, ej: "PT-7K9M2X" */
function genTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sin caracteres ambiguos
  let out = ''
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return `PT-${out}`
}

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' })

const mapUser = (u, accounts = []) => ({
  id:          u.id,
  username:    u.username,
  displayName: u.display_name,
  email:       u.email    || undefined,
  role:        u.role     || 'member',
  status:      u.status   || 'active',
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
  body('email').trim().isEmail().withMessage('Email inválido'),
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

  const { username, displayName, password, inviteCode } = req.body
  const email = req.body.email.trim().toLowerCase()

  try {
    const exists = await pool.query('SELECT id FROM users WHERE username = $1', [username.toLowerCase()])
    if (exists.rows[0]) return res.status(409).json({ error: 'El alias de usuario ya existe' })

    const emailExists = await pool.query('SELECT id FROM users WHERE lower(email) = $1', [email])
    if (emailExists.rows[0]) return res.status(409).json({ error: 'Ese email ya está registrado' })

    // Registro solo con invitación (salvo bootstrap: primera cuenta de la BD)
    const { rows: countRows } = await pool.query('SELECT COUNT(*)::int AS n FROM users')
    let inviteId = null
    if (countRows[0].n > 0) {
      if (!inviteCode || !String(inviteCode).trim()) {
        return res.status(403).json({ error: 'Necesitas un código de invitación para registrarte' })
      }
      const { rows: invRows } = await pool.query(
        `SELECT id FROM invite_codes
         WHERE upper(code) = upper($1) AND used_by IS NULL
           AND (expires_at IS NULL OR expires_at > now())`,
        [String(inviteCode).trim()]
      )
      if (!invRows[0]) {
        return res.status(403).json({ error: 'Código de invitación inválido o ya utilizado' })
      }
      inviteId = invRows[0].id
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const { rows } = await pool.query(`
      INSERT INTO users (username, display_name, email, password_hash)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, display_name, email, role, status, avatar, bio, country, is_public, xp, level, badges, join_date
    `, [username.toLowerCase(), displayName, email, passwordHash])

    if (inviteId) {
      await pool.query(
        'UPDATE invite_codes SET used_by = $1, used_at = now() WHERE id = $2',
        [username.toLowerCase(), inviteId]
      )
    }

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
    // Permite iniciar sesión con el alias de usuario O con el email
    const identifier = username.toLowerCase().trim()
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR lower(email) = $1',
      [identifier]
    )
    const user = rows[0]

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Usuario/email o contraseña incorrectos' })
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Tu cuenta está suspendida. Contacta con el administrador.' })
    }

    const token = signToken(user.id)
    res.json({ token, user: mapUser(user) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error del servidor' })
  }
})

/* ── Recuperar contraseña ──────────────────────────────
   Genera una contraseña temporal, la envía por email y solo
   entonces la guarda (si el email falla, no se cambia nada). */
router.post('/forgot-password', [
  body('email').trim().isEmail().withMessage('Email inválido'),
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

  if (!emailEnabled) {
    return res.status(503).json({
      error: 'El envío de emails aún no está configurado. Pide al administrador que recupere tu contraseña.',
    })
  }

  const email = req.body.email.trim().toLowerCase()
  const genericOk = { ok: true, message: 'Si el email existe, recibirás una contraseña temporal en unos minutos.' }

  try {
    const { rows } = await pool.query(
      'SELECT id, display_name FROM users WHERE lower(email) = $1',
      [email]
    )
    const user = rows[0]
    // No revelamos si el email existe o no
    if (!user) return res.json(genericOk)

    const tempPassword = genTempPassword()
    const { subject, html } = tempPasswordEmail(user.display_name, tempPassword)

    // 1º enviar el email; solo si va bien cambiamos la contraseña
    await sendEmail({ to: email, subject, html })
    const hash = await bcrypt.hash(tempPassword, 12)
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, user.id])

    res.json(genericOk)
  } catch (err) {
    console.error('[forgot-password]', err.message)
    res.status(500).json({ error: 'No se pudo enviar el email. Inténtalo más tarde o contacta con el administrador.' })
  }
})

router.get('/me', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, username, display_name, email, role, status, avatar, bio, country, is_public, xp, level, badges, join_date
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
