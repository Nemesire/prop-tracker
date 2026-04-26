const express   = require('express')
const cors      = require('cors')
const helmet    = require('helmet')
const rateLimit = require('express-rate-limit')

const app = express()

/* ── Security ────────────────────────────────────────── */
app.use(helmet())
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true)
    if (
      /\.vercel\.app$/.test(origin) ||
      /localhost/.test(origin)
    ) return cb(null, true)
    cb(new Error(`CORS bloqueado: ${origin}`))
  },
  credentials: true,
}))

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 })
app.use(limiter)

/* ── Body parser ─────────────────────────────────────── */
app.use(express.json({ limit: '10mb' }))

/* ── Routes ──────────────────────────────────────────── */
app.use('/api/auth',          require('./routes/auth'))
app.use('/api/accounts',      require('./routes/accounts'))
app.use('/api/daily-entries', require('./routes/dailyEntries'))
app.use('/api/withdrawals',   require('./routes/withdrawals'))
app.use('/api/dashboard',     require('./routes/dashboard'))
app.use('/api/ranking',       require('./routes/ranking'))
app.use('/api/challenges',    require('./routes/challenges'))
app.use('/api/activity',      require('./routes/activity'))
app.use('/api/profile',       require('./routes/profile'))

/* ── Health check ────────────────────────────────────── */
app.get('/api/health', (_, res) =>
  res.json({ status: 'ok', version: '2.0.0', timestamp: new Date().toISOString() })
)

/* ── Error handler ───────────────────────────────────── */
app.use((err, req, res, _next) => {
  console.error('[ERROR]', err.message)
  res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor' })
})

module.exports = app
