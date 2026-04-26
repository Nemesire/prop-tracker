import type { Level, Account, Badge } from '../types'
import { BADGES } from '../data/badges'

export const LEVELS: Level[] = [
  { level: 1, name: 'Rookie', minXp: 0, maxXp: 99, color: '#9CA3AF', icon: '🌱' },
  { level: 2, name: 'Aprendiz', minXp: 100, maxXp: 299, color: '#22C55E', icon: '📈' },
  { level: 3, name: 'Trader', minXp: 300, maxXp: 699, color: '#3B82F6', icon: '💹' },
  { level: 4, name: 'Senior Trader', minXp: 700, maxXp: 1499, color: '#6366F1', icon: '🎯' },
  { level: 5, name: 'Pro Trader', minXp: 1500, maxXp: 2999, color: '#A855F7', icon: '⚡' },
  { level: 6, name: 'Elite', minXp: 3000, maxXp: 5999, color: '#EC4899', icon: '🔥' },
  { level: 7, name: 'Master', minXp: 6000, maxXp: 11999, color: '#F59E0B', icon: '👑' },
  { level: 8, name: 'Legend', minXp: 12000, maxXp: Infinity, color: '#7C3AED', icon: '🌟' },
]

export const XP_REWARDS = {
  account_added: 10,
  evaluation_passed: 50,
  withdrawal: 100,
  challenge_completed: 200,
  daily_streak_7: 50,
  badge_earned: 25,
}

export function getLevelFromXp(xp: number): Level {
  return LEVELS.findLast(l => xp >= l.minXp) ?? LEVELS[0]
}

export function getLevelProgress(xp: number): number {
  const level = getLevelFromXp(xp)
  if (level.maxXp === Infinity) return 100
  const range = level.maxXp - level.minXp + 1
  const progress = xp - level.minXp
  return Math.min(100, Math.floor((progress / range) * 100))
}

export function getXpToNextLevel(xp: number): number {
  const level = getLevelFromXp(xp)
  if (level.maxXp === Infinity) return 0
  return level.maxXp + 1 - xp
}

export function checkEarnedBadges(accounts: Account[], currentBadges: string[], stats: {
  totalWithdrawals: number
  totalProfit: number
  roi: number
  approvedEvaluations: number
  rank?: number
  followers?: number
}): Badge[] {
  const earned: Badge[] = []

  const checks: Record<string, boolean> = {
    first_account: accounts.length >= 1,
    first_approval: stats.approvedEvaluations >= 1,
    first_withdrawal: stats.totalWithdrawals > 0,
    hot_streak: stats.approvedEvaluations >= 5,
    top_10: (stats.rank ?? 999) <= 10,
    diamond_hands: stats.totalProfit >= 10000,
    roi_master: stats.roi >= 100,
    multi_account: accounts.filter(a => a.status === 'activa').length >= 10,
    whale: accounts.length >= 50,
    community_star: (stats.followers ?? 0) >= 100,
  }

  for (const badge of BADGES) {
    if (!currentBadges.includes(badge.id) && checks[badge.id]) {
      earned.push(badge)
    }
  }
  return earned
}
