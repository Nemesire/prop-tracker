import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Share2, Globe, ArrowLeft, Camera, Settings } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { useCommunityStore } from '../store/useCommunityStore'
import { MOCK_COMMUNITY_USERS } from '../data/mockUsers'
import Avatar from '../components/ui/Avatar'
import LevelBadge from '../components/gamification/LevelBadge'
import AchievementsGrid from '../components/gamification/AchievementsGrid'
import ShareModal from '../components/share/ShareModal'
import { calcROI, formatCurrency } from '../utils/calculations'
import { BADGES } from '../data/badges'

export default function Perfil() {
  const { username } = useParams()
  const navigate = useNavigate()
  const { currentUser, updateProfile } = useAppStore()
  const { ranking } = useCommunityStore()
  const [shareOpen, setShareOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const result = ev.target?.result as string
      updateProfile({ avatar: result })
    }
    reader.readAsDataURL(file)
  }

  const isOwnProfile = !username || username === currentUser?.username

  const user = isOwnProfile
    ? currentUser
    : MOCK_COMMUNITY_USERS.find(u => u.username === username)

  if (!user) {
    return (
      <div className="p-6 text-center py-20">
        <div className="text-5xl mb-4">😕</div>
        <p className="text-muted">Perfil no encontrado</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-[#7C3AED] hover:underline text-sm flex items-center gap-1 mx-auto">
          <ArrowLeft size={14} />Volver
        </button>
      </div>
    )
  }

  const accounts = isOwnProfile ? (currentUser?.accounts ?? []) : []
  const totalWithdrawals = accounts.reduce((s, a) => s + a.withdrawals, 0)
  const roi = calcROI(accounts)
  const liveAccounts = accounts.filter(a => a.type === 'live' && a.status === 'activa').length

  const rankEntry = ranking.find(r => r.userId === user.id)
  const earnedBadges = BADGES.filter(b => user.badges.includes(b.id))

  return (
    <div className="p-6 space-y-6 fade-in max-w-4xl">
      {!isOwnProfile && (
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-muted hover:text-text transition-colors text-sm">
          <ArrowLeft size={16} />Volver al ranking
        </button>
      )}

      {/* Profile header */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="flex items-start gap-5 flex-wrap">
          <div className="relative flex-shrink-0">
            <Avatar name={user.displayName} src={isOwnProfile ? currentUser?.avatar : undefined} size="xl" />
            {isOwnProfile && (
              <>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#7C3AED] text-white flex items-center justify-center shadow-lg hover:bg-[#6D28D9] transition-colors"
                  title="Cambiar foto"
                >
                  <Camera size={14} />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h1 className="text-2xl font-bold text-text">{user.displayName}</h1>
              {rankEntry && (
                <span className="text-sm bg-[#7C3AED]/15 border border-[#7C3AED]/30 text-[#7C3AED] px-2.5 py-0.5 rounded-full font-medium">
                  #{rankEntry.rank} Ranking
                </span>
              )}
              {user.isPublic && <Globe size={14} className="text-muted" />}
            </div>
            <p className="text-sm text-muted mb-3">@{user.username} · {user.country ?? 'ES'}</p>
            {user.bio && <p className="text-sm text-text mb-3">{user.bio}</p>}
            <LevelBadge xp={user.xp} showProgress />
          </div>
          {isOwnProfile && (
            <div className="flex gap-2">
              <button onClick={() => setShareOpen(true)} className="p-2 bg-bg border border-border rounded-xl text-muted hover:text-[#7C3AED] hover:border-[#7C3AED]/40 transition-colors" title="Compartir perfil">
                <Share2 size={16} />
              </button>
              <button onClick={() => navigate('/configuracion')} className="p-2 bg-bg border border-border rounded-xl text-muted hover:text-[#7C3AED] hover:border-[#7C3AED]/40 transition-colors" title="Configuración">
                <Settings size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Quick stats */}
        {isOwnProfile && (
          <div className="grid grid-cols-4 gap-3 mt-5 pt-5 border-t border-border">
            {[
              { label: 'Cuentas', value: accounts.length },
              { label: 'Cuentas Live', value: liveAccounts },
              { label: 'Retiros', value: formatCurrency(totalWithdrawals) },
              { label: 'ROI', value: `${roi.toFixed(1)}%`, color: roi >= 0 ? '#22C55E' : '#EF4444' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center">
                <div className="text-lg font-bold" style={{ color: color ?? 'var(--color-text)' }}>{value}</div>
                <div className="text-xs text-muted">{label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Badges */}
      <div className="bg-surface border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-text">Logros ({earnedBadges.length}/{BADGES.length})</h2>
        </div>
        <AchievementsGrid earnedBadges={user.badges} showAll />
      </div>

      {/* Recent accounts (own profile only) */}
      {isOwnProfile && accounts.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-border">
            <h2 className="font-semibold text-text">Cuentas Recientes</h2>
          </div>
          <div className="divide-y divide-border">
            {accounts.slice(0, 5).map(acc => (
              <div key={acc.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <div className="text-sm font-medium text-text font-mono">{acc.name}</div>
                  <div className="text-xs text-muted">{acc.company} · {acc.type === 'live' ? 'Live' : 'Evaluación'}</div>
                </div>
                <div className={`text-sm font-medium ${acc.withdrawals - acc.cost >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                  {formatCurrency(acc.withdrawals - acc.cost)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentUser && isOwnProfile && (
        <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} user={currentUser} accounts={accounts} />
      )}
    </div>
  )
}
