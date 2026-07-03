/**
 * Migración idempotente — se ejecuta una vez por instancia serverless
 * antes de atender la primera petición. Todos los cambios usan
 * IF NOT EXISTS, así que es segura de ejecutar tantas veces como haga falta.
 */
const pool = require('./database')

const ADMIN_EMAIL     = 'nemesir83@gmail.com'
const ADMIN_USERNAMES = ['nemesir', 'nemesir83']

async function migrate() {
  // DDL sin parámetros → una sola query multi-sentencia
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS role        text NOT NULL DEFAULT 'member';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS status      text NOT NULL DEFAULT 'active';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_notes text;

    CREATE TABLE IF NOT EXISTS invite_codes (
      id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
      code        text        NOT NULL UNIQUE,
      note        text,
      created_by  text,
      used_by     text,
      used_at     timestamptz,
      expires_at  timestamptz,
      created_at  timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes (upper(code));
  `)

  // Promociona al dueño de la app a admin
  await pool.query(
    `UPDATE users SET role = 'admin'
     WHERE (lower(email) = $1 OR username = ANY($2)) AND role <> 'admin'`,
    [ADMIN_EMAIL, ADMIN_USERNAMES]
  )

  // Email único (necesario para login por email). Tolerante: si existieran
  // emails duplicados antiguos no rompe la API, solo lo deja en el log.
  try {
    await pool.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique
       ON users (lower(email)) WHERE email IS NOT NULL`
    )
  } catch (err) {
    console.error('[ensureSchema] índice único de email no creado:', err.message)
  }
}

let migrationPromise = null

module.exports = function ensureSchema() {
  if (!migrationPromise) {
    migrationPromise = migrate().catch(err => {
      migrationPromise = null // permite reintentar en la siguiente petición
      throw err
    })
  }
  return migrationPromise
}

module.exports.ADMIN_EMAIL     = ADMIN_EMAIL
module.exports.ADMIN_USERNAMES = ADMIN_USERNAMES
