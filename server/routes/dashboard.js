const router = require('express').Router()
const pool   = require('../config/database')
const auth   = require('../middleware/auth')

router.get('/', auth, async (req, res) => {
  const userId = req.user.id

  try {
    const { rows: accounts } = await pool.query(
      'SELECT * FROM accounts WHERE user_id = $1', [userId]
    )

    const totalCost        = accounts.reduce((s, a) => s + parseFloat(a.cost),        0)
    const totalWithdrawals = accounts.reduce((s, a) => s + parseFloat(a.withdrawals),  0)
    const totalEarnings    = accounts.reduce((s, a) => s + parseFloat(a.earnings),     0)
    const profit           = totalWithdrawals - totalCost
    const roi              = totalCost > 0 ? (profit / totalCost) * 100 : 0
    const liveAccounts     = accounts.filter(a => a.type === 'live'       && a.status === 'activa').length
    const evalAccounts     = accounts.filter(a => a.type === 'evaluacion').length
    const fundingRatio     = evalAccounts > 0 ? (liveAccounts / evalAccounts) * 100 : 0

    const { rows: dailyData } = await pool.query(`
      SELECT de.date::text AS date, SUM(de.pnl)::float AS pnl
      FROM daily_entries de
      JOIN accounts a ON a.id = de.account_id
      WHERE a.user_id = $1
      GROUP BY de.date
      ORDER BY de.date ASC
    `, [userId])

    let bestDay = null, worstDay = null, avgDay = 0
    if (dailyData.length) {
      bestDay  = dailyData.reduce((b, d) => d.pnl > b.pnl ? d : b)
      worstDay = dailyData.reduce((b, d) => d.pnl < b.pnl ? d : b)
      avgDay   = dailyData.reduce((s, d) => s + d.pnl, 0) / dailyData.length
    }

    const { rows: companyStats } = await pool.query(`
      SELECT company,
        COUNT(*)::int                                                  AS "totalAccounts",
        SUM(cost)::float                                               AS "totalCost",
        SUM(withdrawals)::float                                        AS "totalWithdrawals",
        (SUM(withdrawals) - SUM(cost))::float                         AS profit,
        CASE WHEN SUM(cost) > 0
          THEN ((SUM(withdrawals) - SUM(cost)) / SUM(cost) * 100)::float
          ELSE 0 END                                                   AS roi
      FROM accounts WHERE user_id = $1
      GROUP BY company ORDER BY profit DESC
    `, [userId])

    res.json({
      stats: { totalCost, totalWithdrawals, totalEarnings, profit, roi,
               liveAccounts, evaluacionAccounts: evalAccounts, fundingRatio, totalAccounts: accounts.length },
      dailyChart: dailyData, bestDay, worstDay, avgDay, companyStats,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error del servidor' })
  }
})

module.exports = router
