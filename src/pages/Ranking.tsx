import { useState } from 'react'
import { Calendar, Share2, ChevronRight } from 'lucide-react'
import { useCommunityStore } from '../store/useCommunityStore'
import { useAppStore } from '../store/useAppStore'
import Avatar from '../components/ui/Avatar'
import { formatCurrency } from '../utils/calculations'
import { BADGES } from '../data/badges'
import { useNavigate } from 'react-router-dom'

type SortOption = 'withdrawals' | 'roi' | 'profit' | 'approvals'

const TABS: { value: SortOption; label: string; icon: string }[] = [
  { value: 'withdrawals', label: 'Retirado',  icon: '💰' },
  { value: 'roi',         label: 'ROI',       icon: '📈' },
  { value: 'profit',      label: 'Beneficio', icon: '💎' },
  { value: 'approvals',   label: 'Fondeadas', icon: '🏆' },
]

const SORT_VALUE = (entry: ReturnType<typeof useCommunityStore.getState>['ranking'][0], sort: SortOption) => {
  if (sort === 'withdrawals') return entry.totalWithdrawals
  if (sort === 'roi')         return entry.roi
  if (sort === 'profit')      return entry.totalProfit
  return entry.approvedEvaluations
}

const SORT_FMT = (v: number, sort: SortOption) => {
  if (sort === 'roi') return `${v.toFixed(1)}%`
  if (sort === 'approvals') return String(v)
  return formatCurrency(v)
}

const ENCOURAGEMENT: Record<number, string> = {
  1: '¡Número 1! 👑',
  2: '¡Casi en lo más alto! 🔥',
  3: '¡En el pódium! 🥉',
}
function encouragement(rank: number, total: number) {
  if (ENCOURAGEMENT[rank]) return ENCOURAGEMENT[rank]
  if (rank <= Math.ceil(total * 0.1)) return '¡Top 10%! 🚀'
  if (rank <= Math.ceil(total * 0.25)) return '¡Top 25%! 💪'
  return '¡Sigue subiendo! ⬆️'
}

export default function Ranking() {
  const { ranking } = useCommunityStore()
  const { currentUser } = useAppStore()
  const navigate = useNavigate()
  const [sortBy, setSortBy] = useState<SortOption>('withdrawals')
  const [yearFilter] = useState(new Date().getFullYear().toString())

  const sorted = [...ranking]
    .sort((a, b) => SORT_VALUE(b, sortBy) - SORT_VALUE(a, sortBy))
    .map((r, i) => ({ ...r, rank: i + 1 }))

  const myEntry = sorted.find(r => r.userId === currentUser?.id)
  const myRank  = myEntry?.rank ?? 0
  const myValue = myEntry ? SORT_VALUE(myEntry, sortBy) : 0
  const total   = sorted.length

  const [p1, p2, p3] = [sorted[0], sorted[1], sorted[2]]

  /* Podium pedestals: display order is #2 | #1 | #3 */
  const podiumOrder = [p2, p1, p3]
  const podiumHeights = ['h-24', 'h-32', 'h-20']
  const podiumColors  = ['#9CA3AF', '#F59E0B', '#CD7C3F']
  const podiumLabels  = ['#2', '#1', '#3']

  return (
    <div className="fade-in">

      {/* ── LEADERBOARD HEADER ─────────────────────────────── */}
      <div className="relative overflow-hidden rounded-none md:rounded-b-3xl" style={{
        background: 'linear-gradient(135deg, #4C1D95 0%, #6D28D9 40%, #7C3AED 70%, #2563EB 100%)',
        minHeight: 140,
      }}>
        {/* decorative circles */}
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-20" style={{ background: 'rgba(255,255,255,0.15)' }} />
        <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full opacity-10" style={{ background: 'rgba(255,255,255,0.2)' }} />

        <div className="relative px-6 pt-6 pb-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                <span className="text-2xl">🏆</span>
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">Leaderboard</h1>
                <p className="text-white/70 text-sm">Compite con los mejores traders</p>
              </div>
            </div>
            <button className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 transition-colors">
              <Share2 size={16} />
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 mt-4">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-medium transition-colors border border-white/20">
              <Calendar size={13} /> {yearFilter}
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/30 text-white text-sm font-semibold border border-white/30">
              ✦ All Time
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">

        {/* ── MY POSITION CARD ────────────────────────────── */}
        {myEntry && (
          <div
            className="relative overflow-hidden rounded-2xl p-5 cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #059669 0%, #10B981 60%, #34D399 100%)' }}
            onClick={() => navigate('/perfil')}
          >
            <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10" />
            <div className="relative flex items-center gap-4">
              <Avatar name={currentUser!.displayName} src={currentUser!.avatar} size="md" />
              <div className="flex-1">
                <p className="text-white/80 text-xs font-medium mb-0.5">
                  Tu posición en {TABS.find(t => t.value === sortBy)?.label}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">#{myRank}</span>
                  <span className="text-white/70 text-sm">de {total}</span>
                </div>
                <p className="text-white/80 text-xs mt-1">{encouragement(myRank, total)}</p>
              </div>
              <div className="text-right">
                <p className="text-white/70 text-xs mb-0.5">Tu valor</p>
                <p className="text-2xl font-black text-white">{SORT_FMT(myValue, sortBy)}</p>
              </div>
              <ChevronRight size={18} className="text-white/60" />
            </div>
          </div>
        )}

        {/* ── CATEGORY TABS ───────────────────────────────── */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setSortBy(tab.value)}
              className={`flex flex-col items-center gap-1 px-5 py-3 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                sortBy === tab.value
                  ? 'bg-[#7C3AED] text-white shadow-lg shadow-purple-900/30'
                  : 'bg-surface border border-border text-muted hover:text-text'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── PODIUM ──────────────────────────────────────── */}
        <div className="flex items-end justify-center gap-3 pt-4 pb-2">
          {podiumOrder.map((entry, idx) => {
            if (!entry) return <div key={idx} className="w-28" />
            const earnedBadges = BADGES.filter(b => entry.badges.includes(b.id)).slice(0, 2)
            const isCenter = idx === 1
            return (
              <div key={entry.userId} className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => navigate(`/perfil/${entry.username}`)}>
                {/* Crown for #1 */}
                {isCenter && <span className="text-2xl -mb-1">👑</span>}

                {/* Avatar */}
                <div className={`relative transition-transform group-hover:scale-105 ${isCenter ? 'w-16 h-16' : 'w-12 h-12'}`}>
                  <div
                    className={`rounded-full border-4 overflow-hidden ${isCenter ? 'w-16 h-16' : 'w-12 h-12'}`}
                    style={{ borderColor: podiumColors[idx] }}
                  >
                    {entry.avatar ? (
                      <img src={entry.avatar} alt={entry.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg"
                        style={{ background: `linear-gradient(135deg, #7C3AED, #3B82F6)` }}>
                        {entry.displayName[0]}
                      </div>
                    )}
                  </div>
                  {/* Rank badge */}
                  <div
                    className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-black text-white border-2 border-bg"
                    style={{ background: podiumColors[idx] }}
                  >
                    {podiumLabels[idx].replace('#', '')}
                  </div>
                </div>

                <div className="text-center">
                  <div className={`font-bold text-text ${isCenter ? 'text-sm' : 'text-xs'} truncate max-w-[90px]`}>{entry.displayName}</div>
                  <div className={`font-semibold ${isCenter ? 'text-base text-[#22C55E]' : 'text-sm text-muted'}`}>
                    {SORT_FMT(SORT_VALUE(entry, sortBy), sortBy)}
                  </div>
                  <div className="flex justify-center gap-0.5 mt-0.5">
                    {earnedBadges.map(b => <span key={b.id} className="text-xs">{b.icon}</span>)}
                  </div>
                </div>

                {/* Pedestal */}
                <div
                  className={`w-full rounded-t-xl flex items-center justify-center font-black text-white text-sm ${podiumHeights[idx]}`}
                  style={{
                    background: `linear-gradient(180deg, ${podiumColors[idx]}, ${podiumColors[idx]}99)`,
                    minWidth: isCenter ? 96 : 80,
                  }}
                >
                  {podiumLabels[idx]}
                </div>
              </div>
            )
          })}
        </div>

        {/* ── CLASIFICACIÓN (lista completa) ──────────────── */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
            <span className="text-sm font-semibold text-text">📊 Clasificación</span>
            <span className="text-xs text-muted ml-auto">{total} traders</span>
          </div>
          <div className="divide-y divide-border">
            {sorted.map((entry) => {
              const isMe = entry.userId === currentUser?.id
              const val  = SORT_VALUE(entry, sortBy)
              const earnedBadges = BADGES.filter(b => entry.badges.includes(b.id)).slice(0, 2)
              const rankColor = entry.rank === 1 ? '#F59E0B' : entry.rank === 2 ? '#9CA3AF' : entry.rank === 3 ? '#CD7C3F' : 'var(--color-muted)'

              return (
                <div
                  key={entry.userId}
                  onClick={() => navigate(`/perfil/${entry.username}`)}
                  className={`flex items-center gap-3 px-5 py-3.5 cursor-pointer transition-colors ${
                    isMe ? 'bg-[#7C3AED]/10 hover:bg-[#7C3AED]/15' : 'hover:bg-surface2'
                  }`}
                >
                  {/* Rank */}
                  <span className="w-8 text-sm font-bold text-center flex-shrink-0" style={{ color: rankColor }}>
                    {entry.rank <= 3 ? ['🥇','🥈','🥉'][entry.rank-1] : `${entry.rank}`}
                  </span>

                  {/* Avatar */}
                  <Avatar name={entry.displayName} src={entry.avatar} size="sm" level={entry.level} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-semibold text-text truncate">{entry.displayName}</span>
                      {isMe && <span className="text-[10px] bg-[#7C3AED]/20 text-[#7C3AED] px-1.5 py-0.5 rounded-full font-bold">Tú</span>}
                      {earnedBadges.map(b => <span key={b.id} className="text-xs">{b.icon}</span>)}
                    </div>
                    <div className="text-xs text-muted">@{entry.username}</div>
                  </div>

                  {/* Value */}
                  <span className={`text-sm font-bold ${val >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                    {SORT_FMT(val, sortBy)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
