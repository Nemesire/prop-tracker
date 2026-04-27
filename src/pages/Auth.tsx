import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import Button from '../components/ui/Button'

export default function Auth() {
  const [mode, setMode]           = useState<'login' | 'register'>('login')
  const [username, setUsername]   = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword]   = useState('')
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)

  const { loginWithApi, registerWithApi } = useAppStore()
  const navigate = useNavigate()

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
        if (password.length < 6) {
          setError('La contraseña debe tener al menos 6 caracteres')
          return
        }
        await registerWithApi(username.toLowerCase().trim(), displayName.trim(), password)
        navigate('/dashboard')

      } else {
        if (!username.trim() || !password.trim()) {
          setError('Introduce tu usuario y contraseña')
          return
        }
        await loginWithApi(username.toLowerCase().trim(), password)
        navigate('/dashboard')
      }
    } catch (err: unknown) {
      const msg = (err as Error).message
      if (msg.includes('fetch') || msg.includes('network') || msg.includes('Failed')) {
        setError('No se puede conectar al servidor. Inténtalo de nuevo.')
      } else {
        setError(msg)
      }
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

          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-bg rounded-xl p-1">
            {(['login', 'register'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError('') }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === m ? 'bg-[#7C3AED] text-white' : 'text-muted hover:text-text'
                }`}
              >
                {m === 'login' ? 'Iniciar sesión' : 'Registrarse'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Usuario</label>
              <input
                className={inputCls}
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="tu_usuario"
                autoFocus
                autoComplete="username"
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Nombre público</label>
                <input
                  className={inputCls}
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Tu Nombre"
                />
              </div>
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

            {error && (
              <p className="text-xs text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full justify-center" size="lg" loading={loading}>
              {mode === 'login' ? 'Entrar' : 'Crear cuenta'}
            </Button>
          </form>

          {mode === 'login' && (
            <p className="text-center text-xs text-muted mt-4">
              ¿No tienes cuenta? <button onClick={() => { setMode('register'); setError('') }} className="text-[#7C3AED] hover:underline">Regístrate gratis</button>
            </p>
          )}
        </div>

        <p className="text-center text-xs text-muted mt-6">
          {mode === 'login' ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
            className="text-[#7C3AED] hover:underline"
          >
            {mode === 'login' ? 'Regístrate gratis' : 'Inicia sesión'}
          </button>
        </p>
      </div>
    </div>
  )
}
