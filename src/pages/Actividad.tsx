import { useState } from 'react'
import { Globe, User } from 'lucide-react'
import { useCommunityStore } from '../store/useCommunityStore'
import { useAppStore } from '../store/useAppStore'
import Avatar from '../components/ui/Avatar'
import { timeAgo, formatCurrency } from '../utils/calculations'

const REACTIONS = ['👏', '🔥', '💪', '🚀', '💎']

const EVENT_ICONS: Record<string, string> = {
  account_added: '📋',
  evaluation_passed: '✅',
  withdrawal: '💰',
  challenge_completed: '🏆',
  badge_earned: '🎖️',
  level_up: '⬆️',
}

export default function Actividad() {
  const { activity, addReaction } = useCommunityStore()
  const { currentUser } = useAppStore()
  const [filter, setFilter] = useState<'all' | 'mine'>('all')

  const displayed = filter === 'mine'
    ? activity.filter(e => e.userId === currentUser?.id)
    : activity

  return (
    <div className="p-6 space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Actividad</h1>
          <p className="text-sm text-muted mt-0.5">Lo que está pasando en la comunidad</p>
        </div>
        <div className="flex gap-2">
          {([
            { value: 'all', label: 'Comunidad', icon: Globe },
            { value: 'mine', label: 'Solo yo', icon: User },
          ] as const).map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${filter === value ? 'bg-[#7C3AED] text-white' : 'bg-surface border border-border text-muted hover:text-text'}`}
            >
              <Icon size={14} />{label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 max-w-2xl">
        {displayed.map(event => (
          <div key={event.id} className="bg-surface border border-border rounded-2xl p-4 hover:border-[#7C3AED]/20 transition-colors">
            <div className="flex items-start gap-3">
              <div className="relative">
                <Avatar name={event.displayName} src={event.avatar} size="sm" />
                <span className="absolute -bottom-1 -right-1 text-sm">{EVENT_ICONS[event.type]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="font-medium text-text text-sm">{event.displayName}</span>
                  <span className="text-sm text-muted">{event.description}</span>
                  {event.amount != null && (
                    <span className="text-sm font-semibold text-[#22C55E]">{formatCurrency(event.amount)}</span>
                  )}
                </div>
                <span className="text-xs text-muted mt-0.5 block">{timeAgo(event.date)}</span>

                {/* Reactions */}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {REACTIONS.map(emoji => {
                    const users = event.reactions[emoji] ?? []
                    const count = users.length
                    const reacted = currentUser ? users.includes(currentUser.id) : false
                    return (
                      <button
                        key={emoji}
                        onClick={() => currentUser && addReaction(event.id, emoji, currentUser.id)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all ${reacted ? 'bg-[#7C3AED]/20 border border-[#7C3AED]/40' : 'bg-bg border border-border hover:border-[#7C3AED]/30'}`}
                      >
                        {emoji}{count > 0 && <span className={reacted ? 'text-[#7C3AED]' : 'text-muted'}>{count}</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}

        {displayed.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-muted">No hay actividad reciente</p>
          </div>
        )}
      </div>
    </div>
  )
}
