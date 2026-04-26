const router = require('express').Router()
const pool   = require('../config/database')
const auth   = require('../middleware/auth')

router.get('/', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        u.id AS "userId", u.username,
        u.display_name AS "displayName",
        u.avatar, u.xp, u.level, u.badges,
        COALESCE(SUM(a.withdrawals), 0)::float                      AS "totalWithdrawals",
        COALESCE(SUM(a.withdrawals) - SUM(a.cost), 0)::float        AS "totalProfit",
        CASE WHEN COALESCE(SUM(a.cost), 0) > 0
          THEN ((SUM(a.withdrawals) - SUM(a.cost)) / SUM(a.cost) * 100)::float
          ELSE 0 END                                                  AS roi,
        COUNT(CASE WHEN a.type = 'live' THEN 1 END)::int             AS "approvedEvaluations"
      FROM users u
      LEFT JOIN accounts a ON a.user_id = u.id
      WHERE u.is_public = true
      GROUP BY u.id
      ORDER BY "totalWithdrawals" DESC
    `)

    res.json({ ranking: rows.map((r, i) => ({ ...r, rank: i + 1, badges: r.badges || [] })) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error del servidor' })
  }
})

module.exports = router
