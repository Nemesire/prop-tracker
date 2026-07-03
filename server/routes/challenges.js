const router = require('express').Router()
const pool   = require('../config/database')
const auth   = require('../middleware/auth')

router.get('/', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.id, c.title, c.description, c.type, c.metric,
        c.target, c.period, c.xp_reward AS "xpReward",
        c.difficulty, c.icon,
        c.start_date AS "startDate", c.end_date AS "endDate",
        COALESCE(uc.progress, 0) AS progress,
        COALESCE(uc.completed, false) AS completed,
        uc.completed_date AS "completedDate"
      FROM challenges c
      LEFT JOIN user_challenges uc ON uc.challenge_id = c.id AND uc.user_id = $1
      WHERE c.is_active = true
      ORDER BY c.created_at ASC
    `, [req.user.id])

    res.json({ challenges: rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error del servidor' })
  }
})

router.patch('/:id/progress', auth, async (req, res) => {
  const { progress } = req.body
  if (progress === undefined) return res.status(400).json({ error: 'progress requerido' })

  try {
    const completed     = progress >= 100
    const completedDate = completed ? new Date().toISOString() : null

    const { rows } = await pool.query(`
      INSERT INTO user_challenges (user_id, challenge_id, progress, completed, completed_date)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, challenge_id) DO UPDATE SET
        progress       = $3,
        completed      = CASE WHEN user_challenges.completed THEN true ELSE $4 END,
        completed_date = CASE WHEN user_challenges.completed THEN user_challenges.completed_date ELSE $5 END
      RETURNING *
    `, [req.user.id, req.params.id, progress, completed, completedDate])

    if (completed) {
      const { rows: ch } = await pool.query('SELECT xp_reward FROM challenges WHERE id = $1', [req.params.id])
      if (ch[0]) await pool.query('UPDATE users SET xp = xp + $1 WHERE id = $2', [ch[0].xp_reward, req.user.id])
    }

    res.json({ userChallenge: rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error del servidor' })
  }
})

module.exports = router
