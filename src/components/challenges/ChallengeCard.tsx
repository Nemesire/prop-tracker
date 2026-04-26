import { Users, Star, Clock } from 'lucide-react'
import type { Challenge, UserChallenge } from '../../types'
import { DIFFICULTY_COLORS, DIFFICULTY_LABELS } from '../../data/challenges'
import Button from '../ui/Button'
import { useAppStore } from '../../store/useAppStore'

interface Props {
  challenge: Challenge
  userProgress?: UserChallenge
}

export default function ChallengeCard({ challenge, userProgress }: Props) {
  const { updateChallengeProgress } = useAppStore()
  const progress = userProgress?.progress ?? 0
  const completed = userProgress?.completed ?? false
  const pct = Math.min(100, Math.round((progress / challenge.target) * 100))
  const diffColor = DIFFICULTY_COLORS[challenge.difficulty]
  const daysLeft = Math.max(0, Math.ceil((new Date(challenge.endDate).getTime() - Date.now()) / 86400000))

  return (
    <div className={`bg-[var(--surface)] border rounded-2xl p-5 transition-all ${completed ? 'border-[#22C55E]/40 bg-[#22C55E]/5' : 'border-[var(--border)] hover:border-[#7C3AED]/30'}`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-3xl">{challenge.icon}</span>
        <div className="flex flex-col items-end gap-1.5">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: diffColor, background: `${diffColor}20` }}>
            {DIFFICULTY_LABELS[challenge.difficulty]}
          </span>
          {challenge.type === 'community' && (
            <span className="text-xs text-[var(--muted)] flex items-center gap-1">
              <Users size={10} />{challenge.participants?.toLocaleString()} participantes
            </span>
          )}
        </div>
      </div>

      <h3 className="font-semibold text-[var(--text)] mb-1">{challenge.title}</h3>
      <p className="text-sm text-[var(--muted)] mb-4">{challenge.description}</p>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-xs text-[var(--muted)]">
          <span>{progress} / {challenge.target}</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 bg-[var(--bg)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: completed ? '#22C55E' : `linear-gradient(90deg, #7C3AED, #A855F7)`,
            }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
          <span className="flex items-center gap-1"><Star size={11} className="text-[#F59E0B]" />{challenge.xpReward} XP</span>
          {!completed && <span className="flex items-center gap-1"><Clock size={11} />{daysLeft}d restantes</span>}
        </div>
        {completed ? (
          <span className="text-xs font-semibold text-[#22C55E]">✓ Completado</span>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => updateChallengeProgress(challenge.id, Math.min(challenge.target, progress + 1))}>
            +1 progreso
          </Button>
        )}
      </div>
    </div>
  )
}
