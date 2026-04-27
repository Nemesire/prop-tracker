import { getLevelFromXp, getLevelProgress, getXpToNextLevel } from '../../utils/gamification'

interface Props {
  xp: number
  showProgress?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function LevelBadge({ xp, showProgress, size = 'md' }: Props) {
  const level = getLevelFromXp(xp)
  const progress = getLevelProgress(xp)
  const toNext = getXpToNextLevel(xp)

  const sizes = {
    sm: { badge: 'px-2 py-1 text-xs', icon: 'text-sm' },
    md: { badge: 'px-3 py-1.5 text-sm', icon: 'text-base' },
    lg: { badge: 'px-4 py-2 text-base', icon: 'text-xl' },
  }

  return (
    <div className="inline-flex flex-col gap-1.5">
      <div
        className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${sizes[size].badge}`}
        style={{ color: level.color, borderColor: `${level.color}40`, background: `${level.color}15` }}
      >
        <span className={sizes[size].icon}>{level.icon}</span>
        <span>Nivel {level.level} — {level.name}</span>
      </div>
      {showProgress && (
        <div className="space-y-1">
          <div className="h-2 bg-bg rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${level.color}, ${level.color}99)` }}
            />
          </div>
          {level.maxXp !== Infinity && (
            <p className="text-xs text-muted">{toNext} XP para el siguiente nivel</p>
          )}
        </div>
      )}
    </div>
  )
}
