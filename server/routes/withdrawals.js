const router = require('express').Router()
const pool   = require('../config/database')
const auth   = require('../middleware/auth')

router.post('/', auth, async (req, res) => {
  const { accountId, amount, note } = req.body

  if (!accountId || !amount || amount <= 0)
    return res.status(400).json({ error: 'accountId y amount > 0 son requeridos' })

  const owns = await pool.query(
    'SELECT id FROM accounts WHERE id = $1 AND user_id = $2', [accountId, req.user.id]
  )
  if (!owns.rows[0]) return res.status(404).json({ error: 'Cuenta no encontrada' })

  try {
    const { rows } = await pool.query(`
      INSERT INTO withdrawals (account_id, user_id, amount, note)
      VALUES ($1, $2, $3, $4)
      RETURNING id, amount, date, note
    `, [accountId, req.user.id, amount, note || null])

    await pool.query(
      'UPDATE accounts SET withdrawals = withdrawals + $1, updated_at = NOW() WHERE id = $2',
      [amount, accountId]
    )

    await pool.query('UPDATE users SET xp = xp + 100 WHERE id = $1', [req.user.id])

    await pool.query(`
      INSERT INTO activity_feed (user_id, type, description, metadata)
      SELECT $1, 'withdrawal',
             u.display_name || ' retiró ' || to_char($2::numeric, 'FM€999,999,999.00'),
             jsonb_build_object('accountId', $3, 'amount', $2)
      FROM users u WHERE u.id = $1
    `, [req.user.id, amount, accountId])

    res.json({
      withdrawal: { id: rows[0].id, amount: parseFloat(rows[0].amount), date: rows[0].date, note: rows[0].note }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error del servidor' })
  }
})

module.exports = router
