const { ADMIN_EMAIL, ADMIN_USERNAMES } = require('../config/ensureSchema')

/** Requiere que el usuario autenticado sea admin. Usar SIEMPRE después del middleware auth. */
module.exports = function requireAdmin(req, res, next) {
  const u = req.user
  const envAdmins = (process.env.ADMIN_USERNAMES || '')
    .split(',').map(s => s.trim().toLowerCase()).filter(Boolean)

  const isAdmin =
    u.role === 'admin' ||
    (u.email && u.email.toLowerCase() === ADMIN_EMAIL) ||
    ADMIN_USERNAMES.includes(u.username) ||
    envAdmins.includes(u.username)

  if (!isAdmin) return res.status(403).json({ error: 'Solo el administrador puede acceder' })
  next()
}
