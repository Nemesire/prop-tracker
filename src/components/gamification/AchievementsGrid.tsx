import { BADGES, BADGE_RARITY_COLORS } from '../../data/badges'

interface Props {
  earnedBadges: string[]
  showAll?: boolean
}

export default function AchievementsGrid({ earnedBadges, showAll = false }: Props) {
  const displayed = showAll ? BADGES : BADGES.slice(0, 8)

  return (
    <div className="grid grid-cols-4 gap-3">
      {displayed.map(badge => {
        const earned = earnedBadges.includes(badge.id)
        const color = BADGE_RARITY_COLORS[badge.rarity]
        return (
          <div
            key={badge.id}
            title={`${badge.name}: ${badge.description}`}
            className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
              earned
                ? 'bg-surface2 border-border hover:border-purple-500/50'
                : 'bg-bg border-surface opacity-40 grayscale'
            }`}
          >
            <span className="text-2xl">{badge.icon}</span>
            <span className="text-xs font-medium text-text leading-tight">{badge.name}</span>
            {earned && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ color, background: `${color}20` }}>
                {badge.rarity}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
