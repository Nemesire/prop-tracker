import { useState, useRef } from 'react'
import { Sun, Moon, User, Globe, Shield, Download, Camera, Check } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import type { Theme } from '../store/useAppStore'
import Avatar from '../components/ui/Avatar'
import Button from '../components/ui/Button'

type Section = 'perfil' | 'apariencia' | 'privacidad' | 'cuenta'

const SECTIONS: { id: Section; label: string; icon: typeof User }[] = [
  { id: 'perfil',      label: 'Perfil',       icon: User },
  { id: 'apariencia',  label: 'Apariencia',   icon: Sun },
  { id: 'privacidad',  label: 'Privacidad',   icon: Shield },
  { id: 'cuenta',      label: 'Cuenta',       icon: Globe },
]

const COUNTRIES = ['España', 'México', 'Argentina', 'Colombia', 'Chile', 'Perú', 'Venezuela', 'Ecuador', 'Uruguay', 'Otro']

export default function Configuracion() {
  const { currentUser, setTheme, theme, updateProfile } = useAppStore()
  const [section, setSection] = useState<Section>('perfil')
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  /* form state */
  const [displayName, setDisplayName] = useState(currentUser?.displayName ?? '')
  const [bio, setBio]                 = useState(currentUser?.bio ?? '')
  const [country, setCountry]         = useState(currentUser?.country ?? '')
  const [isPublic, setIsPublic]       = useState(currentUser?.isPublic ?? true)
  const [avatarPreview, setAvatarPreview] = useState(currentUser?.avatar ?? '')

  if (!currentUser) return null

  /* ── Handlers ─────────────────────────────────────────── */
  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const result = ev.target?.result as string
      setAvatarPreview(result)
    }
    reader.readAsDataURL(file)
  }

  function handleSavePerfil(e: React.FormEvent) {
    e.preventDefault()
    updateProfile({ displayName, bio, country, isPublic, avatar: avatarPreview || undefined })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleExportCSV() {
    const accounts = currentUser!.accounts
    const headers  = 'Nombre,Tipo,Estado,Empresa,Tamaño,Coste,Retiros,Beneficio\n'
    const rows     = accounts.map(a =>
      `"${a.name}","${a.type}","${a.status}","${a.company}","${a.size}","${a.cost}","${a.withdrawals}","${a.withdrawals - a.cost}"`
    ).join('\n')
    const blob = new Blob([headers + rows], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href     = url
    link.download = `proptracker-${currentUser!.username}-${new Date().toISOString().slice(0,10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  /* ── Shared classes ───────────────────────────────────── */
  const inputCls  = 'input-base'
  const labelCls  = 'block text-xs font-medium text-muted mb-1.5'
  const cardCls   = 'bg-surface border border-border rounded-2xl p-6'
  const headingCls = 'text-base font-semibold text-text mb-4'

  return (
    <div className="p-6 fade-in max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text">Configuración</h1>
        <p className="text-sm text-muted mt-0.5">Personaliza tu experiencia en PropTracker</p>
      </div>

      <div className="flex gap-6">

        {/* ── Sidebar nav ─────────────────── */}
        <nav className="flex flex-col gap-1 w-44 flex-shrink-0">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSection(id)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                section === id
                  ? 'bg-[#7C3AED]/15 text-[#7C3AED] border border-[#7C3AED]/30'
                  : 'text-muted hover:bg-surface2 hover:text-text'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>

        {/* ── Content ─────────────────────── */}
        <div className="flex-1 space-y-5">

          {/* PERFIL */}
          {section === 'perfil' && (
            <form onSubmit={handleSavePerfil} className="space-y-5">
              <div className={cardCls}>
                <h2 className={headingCls}>Foto de perfil</h2>
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <Avatar name={displayName || currentUser.displayName} src={avatarPreview} size="xl" />
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#7C3AED] text-white flex items-center justify-center shadow-lg hover:bg-[#6D28D9] transition-colors"
                    >
                      <Camera size={14} />
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text">Sube tu foto</p>
                    <p className="text-xs text-muted mt-0.5">JPG, PNG o GIF · máximo 5 MB</p>
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="mt-2 text-xs text-[#7C3AED] hover:underline font-medium"
                    >
                      Cambiar foto →
                    </button>
                    {avatarPreview && (
                      <button
                        type="button"
                        onClick={() => setAvatarPreview('')}
                        className="mt-1 ml-3 text-xs text-[#EF4444] hover:underline"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className={cardCls}>
                <h2 className={headingCls}>Información pública</h2>
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>Nombre público</label>
                    <input className={inputCls} value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Tu Nombre" />
                  </div>
                  <div>
                    <label className={labelCls}>Usuario</label>
                    <input className={inputCls} value={`@${currentUser.username}`} disabled
                      style={{ opacity: 0.5, cursor: 'not-allowed' }} />
                    <p className="text-xs text-muted mt-1">El nombre de usuario no se puede cambiar</p>
                  </div>
                  <div>
                    <label className={labelCls}>Biografía</label>
                    <textarea
                      rows={3}
                      className={inputCls + ' resize-none'}
                      value={bio}
                      onChange={e => setBio(e.target.value)}
                      placeholder="Cuéntanos algo sobre ti..."
                      style={{ borderRadius: 12 }}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>País</label>
                    <select className={inputCls} value={country} onChange={e => setCountry(e.target.value)}>
                      <option value="">Seleccionar país</option>
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full justify-center" size="lg">
                {saved ? <><Check size={16} /> Guardado</> : 'Guardar cambios'}
              </Button>
            </form>
          )}

          {/* APARIENCIA */}
          {section === 'apariencia' && (
            <div className={cardCls}>
              <h2 className={headingCls}>Tema de la interfaz</h2>
              <div className="grid grid-cols-2 gap-4">
                {([
                  { value: 'dark',  label: 'Oscuro',  icon: Moon,  desc: 'Fondo negro profundo, ideal para sesiones largas' },
                  { value: 'light', label: 'Claro',   icon: Sun,   desc: 'Fondo blanco, máxima legibilidad de día' },
                ] as { value: Theme; label: string; icon: typeof Sun; desc: string }[]).map(opt => {
                  const Icon = opt.icon
                  const active = theme === opt.value
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setTheme(opt.value)}
                      className={`relative flex flex-col items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
                        active
                          ? 'border-[#7C3AED] bg-[#7C3AED]/10'
                          : 'border-border bg-surface2 hover:border-[#7C3AED]/40'
                      }`}
                    >
                      {active && (
                        <span className="absolute top-3 right-3 w-5 h-5 bg-[#7C3AED] rounded-full flex items-center justify-center">
                          <Check size={11} className="text-white" />
                        </span>
                      )}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${active ? 'bg-[#7C3AED]/20' : 'bg-surface'}`}>
                        <Icon size={20} className={active ? 'text-[#7C3AED]' : 'text-muted'} />
                      </div>
                      <div>
                        <div className={`font-semibold text-sm ${active ? 'text-[#7C3AED]' : 'text-text'}`}>{opt.label}</div>
                        <div className="text-xs text-muted mt-0.5 leading-snug">{opt.desc}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-muted mt-4">El tema se guarda automáticamente y persiste entre sesiones.</p>
            </div>
          )}

          {/* PRIVACIDAD */}
          {section === 'privacidad' && (
            <div className="space-y-4">
              <div className={cardCls}>
                <h2 className={headingCls}>Visibilidad del perfil</h2>
                <div className="space-y-4">
                  {[
                    { label: 'Perfil público', desc: 'Otros traders pueden ver tu perfil y estadísticas', key: 'isPublic' as const, value: isPublic, onChange: setIsPublic },
                  ].map(item => (
                    <label key={item.label} className="flex items-center justify-between cursor-pointer gap-4">
                      <div>
                        <div className="text-sm font-medium text-text">{item.label}</div>
                        <div className="text-xs text-muted mt-0.5">{item.desc}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => item.onChange(!item.value)}
                        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${item.value ? 'bg-[#7C3AED]' : 'bg-border'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${item.value ? 'translate-x-5' : ''}`} />
                      </button>
                    </label>
                  ))}
                </div>
                <Button className="mt-4 w-full justify-center" onClick={() => updateProfile({ isPublic })}>
                  Guardar privacidad
                </Button>
              </div>
            </div>
          )}

          {/* CUENTA */}
          {section === 'cuenta' && (
            <div className="space-y-4">
              <div className={cardCls}>
                <h2 className={headingCls}>Exportar datos</h2>
                <p className="text-sm text-muted mb-4">Descarga todos tus datos de cuentas en formato CSV.</p>
                <Button variant="secondary" onClick={handleExportCSV}>
                  <Download size={16} /> Exportar CSV
                </Button>
              </div>
              <div className={cardCls}>
                <h2 className="text-base font-semibold text-[#EF4444] mb-2">Zona de peligro</h2>
                <p className="text-sm text-muted mb-4">
                  Estas acciones son irreversibles. Procede con cuidado.
                </p>
                <Button variant="danger" onClick={() => {
                  if (confirm('¿Seguro que quieres cerrar sesión?')) {
                    useAppStore.getState().logout()
                    window.location.href = '/login'
                  }
                }}>
                  Cerrar sesión
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
