import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { useAdminStore } from '../store/useAdminStore'
import { authService } from '../services/auth.service'
import Button from '../components/ui/Button'

const REMEMBER_KEY = 'pt_remember'

/** Lee las credenciales recordadas (usuario + contraseña ofuscada en base64) */
function loadRemembered(): { username: string; password: string } | null {
  try {
    const raw = localStorage.getItem(REMEMBER_KEY)
    if (!raw) return null
    const obj = JSON.parse(raw)
    return { username: obj.u ?? '', password: obj.p ? atob(obj.p) : '' }
  } catch { return null }
}

export default function Auth() {
  const [mode, setMode]           = useState<'login' | 'register' | 'forgot'>('login')
  const [username, setUsername]   = useState('')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [remember, setRemember]   = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [info, setInfo]           = useState('')
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)

  const { loginWithApi, registerWithApi, register } = useAppStore()
  const { validateInvite, consumeInvite } = useAdminStore()
  const navigate     = useNavigate()
  const [params]     = useSearchParams()

  useEffect(() => {
    const code = params.get('invite')
    if (code) { setInviteCode(code.toUpperCase()); setMode('register') }
    // Prellenar credenciales recordadas
    const saved = loadRemembered()
    if (saved && saved.username) {
      setUsername(saved.username)
      setPassword(saved.password)
      setRemember(true)
    }
  }, [params])

  // En desarrollo siempre modo local (no hay DB local).
  // En producción (Vercel) siempre API real.
  const useLocalMode = import.meta.env.DEV

  /** Guarda o borra las credenciales recordadas según el checkbox */
  function persistRemember() {
    if (remember) {
      localStorage.setItem(REMEMBER_KEY, JSON.stringify({ u: username.toLowerCase().trim(), p: btoa(password) }))
    } else {
      localStorage.removeItem(REMEMBER_KEY)
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setInfo(''); setLoading(true)
    try {
      if (useLocalMode) {
        setInfo('La recuperación por email solo funciona en la app publicada (producción).')
        return
      }
      const res = await authService.forgotPassword(forgotEmail.trim().toLowerCase())
      setInfo(res.message || 'Si el email existe, recibirás una contraseña temporal en unos minutos.')
    } catch (err: unknown) {
      setError((err as Error).message || 'No se pudo procesar la solicitud')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'register') {
        if (!username.trim() || !displayName.trim()) {
          setError('Completa todos los campos')
          return
        }
        if (!useLocalMode && !email.trim()) {
          setError('Introduce tu email — lo necesitas para iniciar sesión')
          return
        }
        if (password.length < 6) {
          setError('La contraseña debe tener al menos 6 caracteres')
          return
        }
        if (useLocalMode) {
          // Desarrollo: validación local del código (si hay invitaciones creadas)
          const { invites } = useAdminStore.getState()
          if (invites.length > 0) {
            if (!inviteCode.trim()) {
              setError('Necesitas un código de invitación para registrarte')
              return
            }
            if (!validateInvite(inviteCode.trim())) {
              setError('Código de invitación inválido o ya utilizado')
              return
            }
          }
          register(username.toLowerCase().trim(), displayName.trim())
          if (inviteCode.trim()) consumeInvite(inviteCode.trim(), username.toLowerCase().trim())
        } else {
          // Producción: el servidor valida y consume el código de invitación
          await registerWithApi(
            username.toLowerCase().trim(),
            displayName.trim(),
            password,
            email.trim().toLowerCase(),
            inviteCode.trim() || undefined
          )
        }
        navigate('/dashboard')

      } else {
        if (!username.trim() || !password.trim()) {
          setError('Introduce tu usuario o email y la contraseña')
          return
        }
        if (useLocalMode) {
          register(username.toLowerCase().trim(), username.trim())
        } else {
          await loginWithApi(username.toLowerCase().trim(), password)
        }
        persistRemember()
        navigate('/dashboard')
      }
    } catch (err: unknown) {
      const msg = (err as Error).message
      setError(msg || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-muted focus:outline-none focus:border-[#7C3AED] transition-colors'

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#3B82F6] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-900/40">
            <span className="text-white font-black text-xl">PT</span>
          </div>
          <h1 className="text-2xl font-bold text-text">PropTracker</h1>
          <p className="text-sm text-muted mt-1">La comunidad de prop traders</p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-border rounded-2xl p-6">

          {/* Tabs (ocultas en modo recuperar) */}
          {mode !== 'forgot' && (
            <div className="flex gap-1 mb-6 bg-bg rounded-xl p-1">
              {(['login', 'register'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(''); setInfo('') }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    mode === m ? 'bg-[#7C3AED] text-white' : 'text-muted hover:text-text'
                  }`}
                >
                  {m === 'login' ? 'Iniciar sesión' : 'Registrarse'}
                </button>
              ))}
            </div>
          )}

          {/* ── RECUPERAR CONTRASEÑA ── */}
          {mode === 'forgot' ? (
            <form onSubmit={handleForgot} className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-text mb-1">Recuperar contraseña</h2>
                <p className="text-xs text-muted">
                  Escribe el email con el que te registraste. Te enviaremos una <strong>contraseña temporal</strong> para entrar y luego cambiarla.
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Email registrado</label>
                <input
                  type="email"
                  className={inputCls}
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  placeholder="tu@email.com"
                  autoFocus
                  required
                />
              </div>

              {info && (
                <p className="text-xs text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-lg px-3 py-2">
                  {info}
                </p>
              )}
              {error && (
                <p className="text-xs text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full justify-center" size="lg" loading={loading}>
                Enviar contraseña temporal
              </Button>
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); setInfo('') }}
                className="w-full text-center text-xs text-[#7C3AED] hover:underline"
              >
                ← Volver a iniciar sesión
              </button>
            </form>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">
                {mode === 'login' ? 'Usuario o email' : 'Alias de usuario'}
              </label>
              <input
                className={inputCls}
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder={mode === 'login' ? 'tu_alias o tu@email.com' : 'tu_alias'}
                autoFocus
                autoComplete="username"
              />
              {mode === 'register' && (
                <p className="text-[11px] text-muted mt-1">Con este alias (o tu email) iniciarás sesión.</p>
              )}
            </div>

            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">Nombre público</label>
                  <input
                    className={inputCls}
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Tu Nombre"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">Email</label>
                  <input
                    type="email"
                    className={inputCls}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    autoComplete="email"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">Código de invitación</label>
                  <input
                    className={inputCls}
                    value={inviteCode}
                    onChange={e => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    style={{ fontFamily: 'monospace', letterSpacing: '0.1em' }}
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Contraseña</label>
              <input
                type="password"
                className={inputCls}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            {/* Recordar + recuperar (solo login) */}
            {mode === 'login' && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <button
                    type="button"
                    onClick={() => setRemember(r => { const next = !r; if (!next) localStorage.removeItem(REMEMBER_KEY); return next })}
                    className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${remember ? 'bg-[#7C3AED]' : 'bg-border'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${remember ? 'translate-x-4' : ''}`} />
                  </button>
                  <span className="text-xs text-muted">Recordar mis datos</span>
                </label>
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); setError(''); setInfo(''); setForgotEmail(username.includes('@') ? username : '') }}
                  className="text-xs text-[#7C3AED] hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            {error && (
              <p className="text-xs text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full justify-center" size="lg" loading={loading}>
              {mode === 'login' ? 'Entrar' : 'Crear cuenta'}
            </Button>
          </form>
          )}
        </div>

        {mode !== 'forgot' && (
          <p className="text-center text-xs text-muted mt-6">
            {mode === 'login' ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setInfo('') }}
              className="text-[#7C3AED] hover:underline"
            >
              {mode === 'login' ? 'Regístrate gratis' : 'Inicia sesión'}
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
