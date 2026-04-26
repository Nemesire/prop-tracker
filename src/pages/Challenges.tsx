import { useState } from 'react'
import { Zap, Users, User } from 'lucide-react'
import { CHALLENGES } from '../data/challenges'
import { useAppStore } from '../store/useAppStore'
import ChallengeCard from '../components/challenges/ChallengeCard'

type FilterType = 'all' | 'community' | 'personal' | 'completed'

export default function Challenges() {
  const { userChallenges } = useAppStore()
  const [filter, setFilter] = useState<FilterType>('all')

  const filtered = CHALLENGES.filter(ch => {
    const uc = userChallenges.find(u => u.challengeId === ch.id)
    if (filter === 'completed') return uc?.completed
    if (filter === 'community') return ch.type === 'community' && !uc?.completed
    if (filter === 'personal') return ch.type === 'personal' && !uc?.completed
    return !uc?.completed
  })

  const completedCount = userChallenges.filter(u => u.completed).length
  const totalXpEarned = CHALLENGES
    .filter(ch => userChallenges.find(u => u.challengeId === ch.id)?.completed)
    .reduce((s, ch) => s + ch.xpReward, 0)

  const filterBtnCls = (active: boolean) =>
    `flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${active ? 'bg-[#7C3AED] text-white' : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'}`

  return (
    <div className="p-6 space-y-6 fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Challenges</h1>
          <p className="text-sm text-[var(--muted)] mt-0.5">Completa retos y gana XP</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-xl font-bold text-[#7C3AED]">{completedCount}</div>
            <div className="text-xs text-[var(--muted)]">Completados</div>
          </div>
          <div className="w-px h-8 bg-[var(--border)]" />
          <div className="text-center">
            <div className="text-xl font-bold text-[#F59E0B]">+{totalXpEarned}</div>
            <div className="text-xs text-[var(--muted)]">XP ganado</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter('all')} className={filterBtnCls(filter === 'all')}>
          <Zap size={14} /> Todos
        </button>
        <button onClick={() => setFilter('community')} className={filterBtnCls(filter === 'community')}>
          <Users size={14} /> Comunidad
        </button>
        <button onClick={() => setFilter('personal')} className={filterBtnCls(filter === 'personal')}>
          <User size={14} /> Personales
        </button>
        <button onClick={() => setFilter('completed')} className={filterBtnCls(filter === 'completed')}>
          ✓ Completados ({completedCount})
        </button>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(ch => (
            <ChallengeCard
              key={ch.id}
              challenge={ch}
              userProgress={userChallenges.find(u => u.challengeId === ch.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🎯</div>
          <p className="text-[var(--muted)]">
            {filter === 'completed' ? '¡Aún no has completado ningún reto!' : 'No hay retos con este filtro'}
          </p>
        </div>
      )}
    </div>
  )
}
