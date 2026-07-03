/**
 * Envío de emails vía Resend (https://resend.com) usando su API REST.
 * No requiere dependencias: Node 18+ trae fetch global.
 *
 * Variables de entorno necesarias (en Vercel → Settings → Environment Variables):
 *   RESEND_API_KEY  → tu API key de Resend (empieza por "re_")
 *   EMAIL_FROM      → remitente, ej: "PropTracker <noreply@tudominio.com>"
 *                     (si no tienes dominio propio verificado, usa
 *                      "PropTracker <onboarding@resend.dev>", que en modo
 *                      de prueba solo entrega a tu propio email de Resend)
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY
const EMAIL_FROM      = process.env.EMAIL_FROM || 'PropTracker <onboarding@resend.dev>'

const emailEnabled = !!RESEND_API_KEY

async function sendEmail({ to, subject, html }) {
  if (!emailEnabled) {
    const err = new Error('El envío de emails no está configurado (falta RESEND_API_KEY)')
    err.code = 'EMAIL_NOT_CONFIGURED'
    throw err
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: EMAIL_FROM, to, subject, html }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Resend respondió ${res.status}: ${detail}`)
  }
  return res.json()
}

/* ── Plantilla: contraseña temporal ── */
function tempPasswordEmail(displayName, tempPassword) {
  return {
    subject: 'PropTracker — Tu nueva contraseña temporal',
    html: `
      <div style="font-family:system-ui,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1a1a2e">
        <div style="text-align:center;margin-bottom:24px">
          <div style="display:inline-block;width:48px;height:48px;line-height:48px;border-radius:12px;background:linear-gradient(135deg,#7C3AED,#3B82F6);color:#fff;font-weight:900;font-size:18px">PT</div>
          <h1 style="font-size:20px;margin:12px 0 0">PropTracker</h1>
        </div>
        <p>Hola${displayName ? ' ' + displayName : ''},</p>
        <p>Has solicitado recuperar el acceso a tu cuenta. Esta es tu <strong>nueva contraseña temporal</strong>:</p>
        <div style="background:#f4f2fb;border:1px solid #e0d9f5;border-radius:12px;padding:16px;text-align:center;font-size:22px;font-weight:800;letter-spacing:2px;color:#7C3AED;margin:16px 0">
          ${tempPassword}
        </div>
        <p>Entra con tu email o alias y esta contraseña. Por seguridad, <strong>cámbiala</strong> desde Configuración una vez dentro.</p>
        <p style="color:#8888aa;font-size:12px;margin-top:24px">Si no solicitaste este cambio, ignora este correo: tu contraseña anterior ha dejado de funcionar solo si abriste esta petición.</p>
      </div>
    `,
  }
}

module.exports = { sendEmail, tempPasswordEmail, emailEnabled }
