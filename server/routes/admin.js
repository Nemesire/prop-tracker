const router = require('express').Router()
const bcrypt = require('bcryptjs')
const { body, validationResult } = require('express-validator')
const pool         = require('../config/database')
const auth         = require('../middleware/auth')
const requireAdmin = require('../middleware/admin')

router.use(auth, requireAdmin)

/* ── Mappers ─────────────────────────────────────────── */
const mapMember = (u) => ({
  id:          String(u.id),
  username:    u.username,
  displayName: u.display_name,
  email:       u.email  || '',
  role:        u.role   || 'member',
  status:      u.status || 'active',
  joinDate:    u.join_date,
  notes:       u.admin_notes || undefined,
})

const mapInvite = (i) => ({
  id:        String(i.id),
  code:      i.code,
  note:      i.note      || undefined,
  createdAt: i.created_at,
  expiresAt: i.expires_at || undefined,
  usedBy:    i.used_by    || undefined,
  usedAt:    i.used_at    || undefined,
})

/* ── Miembros ────────────────────────────────────────── */
router.get('/members', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, username, display_name, email, role, status, join_date, admin_notes
      FROM users ORDER BY join_date DESC
    `)
    res.json({ members: rows.map(mapMember) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error del servidor' })
  }
})

router.patch('/members/:id', [
  body('role').optional().isIn(['admin', 'member']),
  body('status').optional().isIn(['active', 'pending', 'suspended']),
  body('notes').optional({ nullable: true }).isString(),
  body('displayName').optional().trim().isLength({ min: 2, max: 100 }),
  body('email').optional().trim().isEmail().withMessage('Email inválido'),
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

  const { role, status, notes, displayName } = req.body
  const email = req.body.email ? req.body.email.trim().toLowerCase() : undefined

  // El admin no puede quitarse el rol ni suspenderse a sí mismo
  if (String(req.params.id) === String(req.user.id) && (role === 'member' || status === 'suspended')) {
    return res.status(400).json({ error: 'No puedes quitarte permisos ni suspenderte a ti mismo' })
  }

  try {
    // Si cambia el email, verificar que no lo tenga otro usuario
    if (email) {
      const dup = await pool.query(
        'SELECT id FROM users WHERE lower(email) = $1 AND id <> $2',
        [email, req.params.id]
      )
      if (dup.rows[0]) return res.status(409).json({ error: 'Ese email ya está registrado por otro usuario' })
    }

    const { rows } = await pool.query(`
      UPDATE users SET
        role         = COALESCE($1, role),
        status       = COALESCE($2, status),
        admin_notes  = COALESCE($3, admin_notes),
        display_name = COALESCE($4, display_name),
        email        = COALESCE($5, email)
      WHERE id = $6
      RETURNING id, username, display_name, email, role, status, join_date, admin_notes
    `, [role ?? null, status ?? null, notes ?? null, displayName ?? null, email ?? null, req.params.id])

    if (!rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' })
    res.json({ member: mapMember(rows[0]) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error del servidor' })
  }
})

// El admin fija una contraseña nueva para un usuario
router.post('/members/:id/password', [
  body('password').isLength({ min: 6 }).withMessage('Mínimo 6 caracteres'),
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

  try {
    const hash = await bcrypt.hash(req.body.password, 12)
    const { rowCount } = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [hash, req.params.id]
    )
    if (!rowCount) return res.status(404).json({ error: 'Usuario no encontrado' })
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error del servidor' })
  }
})

router.delete('/members/:id', async (req, res) => {
  if (String(req.params.id) === String(req.user.id)) {
    return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta de admin' })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const uid = req.params.id
    await client.query('DELETE FROM daily_entries   WHERE account_id IN (SELECT id FROM accounts WHERE user_id = $1)', [uid])
    await client.query('DELETE FROM withdrawals     WHERE account_id IN (SELECT id FROM accounts WHERE user_id = $1)', [uid])
    await client.query('DELETE FROM accounts        WHERE user_id = $1', [uid])
    await client.query('DELETE FROM user_challenges WHERE user_id = $1', [uid])
    await client.query('DELETE FROM activity_feed   WHERE user_id = $1', [uid])
    const { rowCount } = await client.query('DELETE FROM users WHERE id = $1', [uid])
    await client.query('COMMIT')

    if (!rowCount) return res.status(404).json({ error: 'Usuario no encontrado' })
    res.json({ ok: true })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    res.status(500).json({ error: 'Error del servidor' })
  } finally {
    client.release()
  }
})

/* ── Invitaciones ────────────────────────────────────── */
router.get('/invites', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM invite_codes ORDER BY created_at DESC')
    res.json({ invites: rows.map(mapInvite) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error del servidor' })
  }
})

router.post('/invites', [
  body('note').optional({ nullable: true }).isString().isLength({ max: 200 }),
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

  try {
    // Genera código único de 6 caracteres (reintenta ante colisión)
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = Math.random().toString(36).slice(2, 8).toUpperCase()
      try {
        const { rows } = await pool.query(
          'INSERT INTO invite_codes (code, note, created_by) VALUES ($1, $2, $3) RETURNING *',
          [code, req.body.note || null, req.user.username]
        )
        return res.status(201).json({ invite: mapInvite(rows[0]) })
      } catch (err) {
        if (err.code !== '23505') throw err // 23505 = unique_violation → reintenta
      }
    }
    res.status(500).json({ error: 'No se pudo generar un código único' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error del servidor' })
  }
})

router.delete('/invites/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM invite_codes WHERE id = $1', [req.params.id])
    if (!rowCount) return res.status(404).json({ error: 'Invitación no encontrada' })
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error del servidor' })
  }
})

module.exports = router
