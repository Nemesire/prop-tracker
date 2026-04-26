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
  const [apiDown, setApiDown]     = useState(false)

  const { loginWithApi, registerWithApi, register, login } = useAppStore()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'register') {
        if (!username.trim() || !displayName.trim()) {
          setError('Completa todos los campos')
          setLoading(false)
          return
        }
        if (password.length < 6) {
          setError('La contraseña debe tener al menos 6 caracteres')
          setLoading(false)
          return
        }

        try {
          // Intenta registro real con backend
          await registerWithApi(username.toLowerCase().trim(), displayName.trim(), password)
          navigate('/dashboard')
        } catch (err: unknown) {
          const isNetwork = err instanceof TypeError && err.message.includes('fetch')
          if (isNetwork) {
            // Backend no disponible → modo demo
            setApiDown(true)
            register(username.toLowerCase().replace(/\s+/g, '_'), displayName.trim())
            navigate('/dashboard')
          } else {
            setError((err as Error).message)
          }
        }

      } else {
        if (!username.trim()) {
          setError('Introduce tu usuario')
          setLoading(false)
          return
        }

        try {
          // Intenta login real con backend
          await loginWithApi(username.toLowerCase().trim(), password)
          navigate('/dashboard')
        } catch (err: unknown) {
          const isNetwork = err instanceof TypeError && err.message.includes('fetch')
          if (isNetwork) {
            // Backend no disponible → modo demo con datos mock
            setApiDown(true)
            const mockAccounts = (await import('../store/mockAccounts')).MOCK_ACCOUNTS
            login({
              id:          'u1',
              username:    username.toLowerCase().trim() || 'demo',
              displayName: username.trim() || 'Demo',
              isPublic:    true,
              xp:          2400,
              level:       4,
              badges:      ['first_account', 'first_approval', 'first_withdrawal'],
              joinDate:    '2025-01-01',
              accounts:    mockAccounts,
              following:   [],
              followers:   [],
            })
            navigate('/dashboard')
          } else {
            setError((err as Error).message)
          }
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full bg-[#0F0F1A] border border-[#2D2D4E] rounded-xl px-4 py-3 text-sm text-[#F8F8FF] placeholder:text-[#8888AA] focus:outline-none focus:border-[#7C3AED] transition-colors'

  return (
    <div className="min-h-screen bg-[#0F0F1A] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#3B82F6] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-900/40">
            <span className="text-white font-black text-xl">PT</span>
          </div>
          <h1 className="text-2xl font-bold text-[#F8F8FF]">PropTracker</h1>
          <p className="text-sm text-[#8888AA] mt-1">La comunidad de prop traders</p>
        </div>

        {/* Banner backend offline */}
        {apiDown && (
          <div className="mb-4 px-4 py-2.5 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-xs text-[#F59E0B] text-center">
            ⚠️ Backend no detectado — entrando en modo demo
          </div>
        )}

        {/* Card */}
        <div className="bg-[#1A1A2E] border border-[#2D2D4E] rounded-2xl p-6">

          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-[#0F0F1A] rounded-xl p-1">
            {(['login', 'register'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setApiDown(false) }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === m ? 'bg-[#7C3AED] text-white' : 'text-[#8888AA] hover:text-[#F8F8FF]'
                }`}
              >
                {m === 'login' ? 'Iniciar sesión' : 'Registrarse'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#8888AA] mb-1.5">Usuario</label>
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
                <label className="block text-xs font-medium text-[#8888AA] mb-1.5">Nombre público</label>
                <input
                  className={inputCls}
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Tu Nombre"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#8888AA] mb-1.5">Contraseña</label>
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

          {mode === 'login' && !apiDown && (
            <p className="text-center text-xs text-[#8888AA] mt-4">
              Demo: usa cualquier usuario para entrar con datos de ejemplo
            </p>
          )}
        </div>

        <p className="text-center text-xs text-[#8888AA] mt-6">
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
