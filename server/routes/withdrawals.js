const router = require('express').Router()
const pool   = require('../config/database')
const auth   = require('../middleware/auth')

router.post('/', auth, async (req, res) => {
  const { accountId, amount, note, date } = req.body

  if (!accountId || !amount || amount <= 0)
    return res.status(400).json({ error: 'accountId y amount > 0 son requeridos' })

  const owns = await pool.query(
    'SELECT id FROM accounts WHERE id = $1 AND user_id = $2', [accountId, req.user.id]
  )
  if (!owns.rows[0]) return res.status(404).json({ error: 'Cuenta no encontrada' })

  try {
    const { rows } = await pool.query(`
      INSERT INTO withdrawals (account_id, user_id, amount, note, date)
      VALUES ($1, $2, $3, $4, COALESCE($5::timestamptz, now()))
      RETURNING id, amount, date, note
    `, [accountId, req.user.id, amount, note || null, date || null])

    await pool.query(
      'UPDATE accounts SET withdrawals = withdrawals + $1, updated_at = NOW() WHERE id = $2',
      [amount, accountId]
    )

    await pool.query('UPDATE users SET xp = xp + 100 WHERE id = $1', [req.user.id])

    await pool.query(`
      INSERT INTO activity_feed (user_id, type, description, metadata)
      SELECT $1, 'withdrawal',
             u.display_name || ' retiró ' || to_char($2::numeric, 'FM€999,999,999.00'),
             jsonb_build_object('accountId', $3::text, 'amount', $2)
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

router.patch('/:id', auth, async (req, res) => {
  const { amount, date, note } = req.body

  try {
    const { rows: existingRows } = await pool.query(`
      SELECT w.id, w.account_id, w.amount
      FROM withdrawals w
      JOIN accounts a ON a.id = w.account_id
      WHERE w.id = $1 AND a.user_id = $2
    `, [req.params.id, req.user.id])

    if (!existingRows[0]) return res.status(404).json({ error: 'Retiro no encontrado' })
    const old = existingRows[0]
    const newAmount = amount !== undefined ? Number(amount) : parseFloat(old.amount)
    const diff = newAmount - parseFloat(old.amount)

    const { rows } = await pool.query(`
      UPDATE withdrawals SET
        amount = COALESCE($1, amount),
        date   = COALESCE($2::timestamptz, date),
        note   = COALESCE($3, note)
      WHERE id = $4
      RETURNING id, amount, date, note
    `, [amount ?? null, date ?? null, note ?? null, req.params.id])

    if (diff !== 0) {
      await pool.query(
        'UPDATE accounts SET withdrawals = withdrawals + $1, updated_at = NOW() WHERE id = $2',
        [diff, old.account_id]
      )
    }

    res.json({
      withdrawal: { id: rows[0].id, amount: parseFloat(rows[0].amount), date: rows[0].date, note: rows[0].note }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error del servidor' })
  }
})

router.delete('/:id', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT w.id, w.account_id, w.amount
      FROM withdrawals w
      JOIN accounts a ON a.id = w.account_id
      WHERE w.id = $1 AND a.user_id = $2
    `, [req.params.id, req.user.id])

    if (!rows[0]) return res.status(404).json({ error: 'Retiro no encontrado' })

    await pool.query('DELETE FROM withdrawals WHERE id = $1', [req.params.id])
    await pool.query(
      'UPDATE accounts SET withdrawals = withdrawals - $1, updated_at = NOW() WHERE id = $2',
      [rows[0].amount, rows[0].account_id]
    )

    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error del servidor' })
  }
})

module.exports = router
