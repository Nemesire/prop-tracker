const router = require('express').Router()
const pool   = require('../config/database')
const auth   = require('../middleware/auth')

router.get('/', auth, async (req, res) => {
  const { filter = 'community' } = req.query
  const isMine = filter === 'mine'

  try {
    const { rows } = await pool.query(`
      SELECT af.id, af.type, af.description, af.metadata, af.reactions,
        af.created_at AS "createdAt",
        u.id AS "userId", u.username,
        u.display_name AS "displayName", u.avatar, u.level
      FROM activity_feed af
      JOIN users u ON u.id = af.user_id
      WHERE ${isMine ? 'af.user_id = $1' : 'u.is_public = true'}
      ORDER BY af.created_at DESC LIMIT 50
    `, isMine ? [req.user.id] : [])

    res.json({ events: rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error del servidor' })
  }
})

router.post('/:id/react', auth, async (req, res) => {
  const { emoji } = req.body
  const allowed   = ['👏', '🔥', '💪']

  if (!allowed.includes(emoji)) return res.status(400).json({ error: 'Emoji no permitido' })

  try {
    await pool.query(`
      UPDATE activity_feed
      SET reactions = jsonb_set(reactions, ARRAY[$1], (COALESCE(reactions->$1, '0')::int + 1)::text::jsonb)
      WHERE id = $2
    `, [emoji, req.params.id])

    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error del servidor' })
  }
})

module.exports = router
