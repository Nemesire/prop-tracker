const router = require('express').Router()
const pool   = require('../config/database')
const auth   = require('../middleware/auth')

router.post('/', auth, async (req, res) => {
  const { accountId, date, pnl } = req.body

  if (!accountId || !date || pnl === undefined)
    return res.status(400).json({ error: 'accountId, date y pnl son requeridos' })

  const owns = await pool.query(
    'SELECT id FROM accounts WHERE id = $1 AND user_id = $2', [accountId, req.user.id]
  )
  if (!owns.rows[0]) return res.status(404).json({ error: 'Cuenta no encontrada' })

  try {
    const { rows } = await pool.query(`
      INSERT INTO daily_entries (account_id, user_id, date, pnl)
      VALUES ($1, $2, $3::date, $4)
      ON CONFLICT (account_id, date) DO UPDATE SET pnl = $4
      RETURNING id, date, pnl
    `, [accountId, req.user.id, date, pnl])

    const { rows: totals } = await pool.query(
      'SELECT COALESCE(SUM(pnl), 0) AS total FROM daily_entries WHERE account_id = $1',
      [accountId]
    )
    await pool.query(
      'UPDATE accounts SET earnings = $1, updated_at = NOW() WHERE id = $2',
      [totals[0].total, accountId]
    )

    res.json({ entry: { id: rows[0].id, date: rows[0].date, pnl: parseFloat(rows[0].pnl) } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error del servidor' })
  }
})

module.exports = router
