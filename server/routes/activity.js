const router = require('express').Router()
const pool   = require('../config/database')
const auth   = require('../middleware/auth')

router.get('/', auth, async (req, res) => {
  const { filter = 'community' } = req.query
  const isMine = filter === 'mine'

  try {
    const { rows } = await pool.query(`
      SELECT af.id, af.type, af.description,
        (af.metadata->>'amount')::float AS amount,
        af.created_at AS date,
        u.id AS "userId", u.username,
        u.display_name AS "displayName", u.avatar, u.level,
        COALESCE(
          (SELECT jsonb_object_agg(r.emoji, r.user_ids)
           FROM (
             SELECT emoji, jsonb_agg(user_id::text) AS user_ids
             FROM activity_reactions
             WHERE activity_id = af.id
             GROUP BY emoji
           ) r),
          '{}'::jsonb
        ) AS reactions
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

// Alterna la reacción del usuario actual (añade si no existe, quita si ya estaba)
router.post('/:id/react', auth, async (req, res) => {
  const { emoji } = req.body
  const allowed   = ['👏', '🔥', '💪', '🚀', '💎']

  if (!allowed.includes(emoji)) return res.status(400).json({ error: 'Emoji no permitido' })

  try {
    const existing = await pool.query(
      'SELECT 1 FROM activity_reactions WHERE activity_id = $1 AND user_id = $2 AND emoji = $3',
      [req.params.id, req.user.id, emoji]
    )

    if (existing.rows[0]) {
      await pool.query(
        'DELETE FROM activity_reactions WHERE activity_id = $1 AND user_id = $2 AND emoji = $3',
        [req.params.id, req.user.id, emoji]
      )
    } else {
      await pool.query(
        'INSERT INTO activity_reactions (activity_id, user_id, emoji) VALUES ($1, $2, $3)',
        [req.params.id, req.user.id, emoji]
      )
    }

    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error del servidor' })
  }
})

module.exports = router
