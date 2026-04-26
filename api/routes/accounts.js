const router = require('express').Router()
const { body, validationResult } = require('express-validator')
const pool   = require('../config/database')
const auth   = require('../middleware/auth')

const mapAccount = (a) => ({
  id:              a.id,
  userId:          a.user_id,
  name:            a.name,
  type:            a.type,
  status:          a.status,
  company:         a.company,
  size:            parseFloat(a.size),
  cost:            parseFloat(a.cost),
  earnings:        parseFloat(a.earnings   || 0),
  withdrawals:     parseFloat(a.withdrawals || 0),
  startDate:       a.start_date,
  endDate:         a.end_date || undefined,
  dailyEntries:    a.dailyEntries    ?? [],
  withdrawalsList: a.withdrawalsList ?? [],
})

router.get('/', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT a.*,
        COALESCE(json_agg(DISTINCT jsonb_build_object(
          'id', de.id::text, 'date', de.date::text, 'pnl', de.pnl
        )) FILTER (WHERE de.id IS NOT NULL), '[]') AS "dailyEntries",
        COALESCE(json_agg(DISTINCT jsonb_build_object(
          'id', w.id::text, 'amount', w.amount, 'date', w.date, 'note', w.note
        )) FILTER (WHERE w.id IS NOT NULL), '[]') AS "withdrawalsList"
      FROM accounts a
      LEFT JOIN daily_entries de ON de.account_id = a.id
      LEFT JOIN withdrawals    w  ON w.account_id  = a.id
      WHERE a.user_id = $1
      GROUP BY a.id
      ORDER BY a.created_at DESC
    `, [req.user.id])

    res.json({ accounts: rows.map(mapAccount) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error del servidor' })
  }
})

router.post('/', auth, [
  body('name').trim().notEmpty(),
  body('type').isIn(['evaluacion', 'live']),
  body('company').trim().notEmpty(),
  body('size').isNumeric(),
  body('cost').isNumeric(),
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

  const { name, type, status = 'activa', company, size, cost, startDate } = req.body

  try {
    const { rows } = await pool.query(`
      INSERT INTO accounts (user_id, name, type, status, company, size, cost, start_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8::date, CURRENT_DATE))
      RETURNING *
    `, [req.user.id, name, type, status, company, size, cost, startDate])

    await pool.query('UPDATE users SET xp = xp + 10 WHERE id = $1', [req.user.id])

    res.status(201).json({
      account: mapAccount({ ...rows[0], dailyEntries: [], withdrawalsList: [] })
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error del servidor' })
  }
})

router.patch('/:id', auth, async (req, res) => {
  const { id } = req.params
  const owns = await pool.query(
    'SELECT id FROM accounts WHERE id = $1 AND user_id = $2', [id, req.user.id]
  )
  if (!owns.rows[0]) return res.status(404).json({ error: 'Cuenta no encontrada' })

  const { name, type, status, company, size, cost, startDate, endDate, earnings, withdrawals } = req.body

  try {
    const { rows } = await pool.query(`
      UPDATE accounts SET
        name        = COALESCE($1,  name),
        type        = COALESCE($2,  type),
        status      = COALESCE($3,  status),
        company     = COALESCE($4,  company),
        size        = COALESCE($5,  size),
        cost        = COALESCE($6,  cost),
        start_date  = COALESCE($7::date, start_date),
        end_date    = COALESCE($8::date, end_date),
        earnings    = COALESCE($9,  earnings),
        withdrawals = COALESCE($10, withdrawals),
        updated_at  = NOW()
      WHERE id = $11
      RETURNING *
    `, [name, type, status, company, size, cost, startDate, endDate, earnings, withdrawals, id])

    res.json({ account: mapAccount(rows[0]) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error del servidor' })
  }
})

router.delete('/:id', auth, async (req, res) => {
  const owns = await pool.query(
    'SELECT id FROM accounts WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]
  )
  if (!owns.rows[0]) return res.status(404).json({ error: 'Cuenta no encontrada' })

  await pool.query('DELETE FROM accounts WHERE id = $1', [req.params.id])
  res.json({ success: true })
})

module.exports = router
