const jwt  = require('jsonwebtoken')
const pool = require('../config/database')

module.exports = async function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' })
  }

  const token = header.split(' ')[1]

  try {
    const { userId } = jwt.verify(token, process.env.JWT_SECRET)
    const { rows }   = await pool.query(
      'SELECT id, username, display_name FROM users WHERE id = $1',
      [userId]
    )
    if (!rows[0]) return res.status(401).json({ error: 'Usuario no encontrado' })

    req.user = rows[0]
    next()
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' })
  }
}
