import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, CreditCard, Trophy, Zap, Activity, FileBarChart, LogOut, ChevronLeft, ChevronRight, User, Settings } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { getLevelFromXp, getLevelProgress } from '../../utils/gamification'
import Avatar from '../ui/Avatar'

const NAV_ITEMS = [
  { to: '/dashboard',      icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/cuentas',        icon: CreditCard,      label: 'Cuentas' },
  { to: '/ranking',        icon: Trophy,          label: 'Ranking' },
  { to: '/challenges',     icon: Zap,             label: 'Challenges' },
  { to: '/actividad',      icon: Activity,        label: 'Actividad' },
  { to: '/informes',       icon: FileBarChart,    label: 'Informes' },
  { to: '/perfil',         icon: User,            label: 'Mi Perfil' },
  { to: '/configuracion',  icon: Settings,        label: 'Configuración' },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { currentUser, logout } = useAppStore()
  const navigate = useNavigate()

  const level    = currentUser ? getLevelFromXp(currentUser.xp) : null
  const progress = currentUser ? getLevelProgress(currentUser.xp) : 0

  function handleLogout() {
    logout()
    navigate('/login')
  }

  /* ── Color tokens using CSS variables ── */
  const sidebarBg = 'bg-[var(--surface)] border-r border-[var(--border)]'
  const linkBase  = 'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-sm font-medium'
  const linkActive = 'bg-[#7C3AED]/20 text-[#7C3AED] border border-[#7C3AED]/30'
  const linkIdle   = 'text-[var(--muted)] hover:bg-[var(--surface2)] hover:text-[var(--text)]'

  return (
    <aside className={`relative flex flex-col h-screen ${sidebarBg} transition-all duration-300 flex-shrink-0 ${collapsed ? 'w-16' : 'w-60'}`}>

      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-[var(--border)] ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#3B82F6] flex items-center justify-center flex-shrink-0 pulse-ring">
          <span className="text-white font-black text-sm">PT</span>
        </div>
        {!collapsed && (
          <div>
            <div className="font-bold text-[var(--text)] text-sm leading-none">PropTracker</div>
            <div className="text-[10px] text-[var(--muted)] mt-0.5">Comunidad</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-0.5 px-2 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : linkIdle} ${collapsed ? 'justify-center' : ''}`
            }
            title={collapsed ? label : undefined}
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      {currentUser && (
        <div className={`border-t border-[var(--border)] p-3 ${collapsed ? 'flex flex-col items-center gap-2' : ''}`}>
          {!collapsed ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Avatar name={currentUser.displayName} src={currentUser.avatar} size="sm" level={currentUser.level} />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[var(--text)] truncate">{currentUser.displayName}</div>
                  <div className="text-xs text-[var(--muted)] truncate">{level?.icon} {level?.name}</div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-[var(--muted)]">
                  <span>{currentUser.xp} XP</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-1.5 bg-[var(--bg)] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#7C3AED] to-[#3B82F6] rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-xs text-[var(--muted)] hover:text-[#EF4444] transition-colors py-1 w-full"
              >
                <LogOut size={14} /> Cerrar Sesión
              </button>
            </div>
          ) : (
            <>
              <Avatar name={currentUser.displayName} src={currentUser.avatar} size="sm" level={currentUser.level} />
              <button onClick={handleLogout} className="text-[var(--muted)] hover:text-[#EF4444] transition-colors">
                <LogOut size={16} />
              </button>
            </>
          )}
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="absolute -right-3 top-20 w-6 h-6 bg-[var(--surface)] border border-[var(--border)] rounded-full flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] hover:border-[#7C3AED] transition-colors z-10"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  )
}
