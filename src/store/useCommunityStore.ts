import { create } from 'zustand'
import type { ActivityEvent, RankingEntry } from '../types'
import { MOCK_RANKING, MOCK_ACTIVITY } from '../data/mockUsers'

interface CommunityState {
  ranking: RankingEntry[]
  activity: ActivityEvent[]
  rankingFilter: 'roi' | 'profit' | 'withdrawals' | 'approvals'
  activityFilter: 'all' | 'mine'

  setRankingFilter: (f: CommunityState['rankingFilter']) => void
  setActivityFilter: (f: CommunityState['activityFilter']) => void
  addReaction: (eventId: string, emoji: string, userId: string) => void
  addActivity: (event: Omit<ActivityEvent, 'id' | 'reactions'>) => void
  insertUserInRanking: (entry: RankingEntry) => void
}

export const useCommunityStore = create<CommunityState>()((set) => ({
  ranking: MOCK_RANKING,
  activity: MOCK_ACTIVITY,
  rankingFilter: 'withdrawals',
  activityFilter: 'all',

  setRankingFilter: (f) => set({ rankingFilter: f }),
  setActivityFilter: (f) => set({ activityFilter: f }),

  addReaction: (eventId, emoji, userId) => set(s => ({
    activity: s.activity.map(ev => {
      if (ev.id !== eventId) return ev
      const reactions = { ...ev.reactions }
      const users = reactions[emoji] ?? []
      if (users.includes(userId)) {
        reactions[emoji] = users.filter(u => u !== userId)
      } else {
        reactions[emoji] = [...users, userId]
      }
      return { ...ev, reactions }
    }),
  })),

  addActivity: (event) => set(s => {
    const newEvent: ActivityEvent = {
      ...event,
      id: `a_${Date.now()}`,
      reactions: {},
    }
    return { activity: [newEvent, ...s.activity] }
  }),

  insertUserInRanking: (entry) => set(s => {
    const existing = s.ranking.find(r => r.userId === entry.userId)
    if (existing) {
      return {
        ranking: s.ranking
          .map(r => r.userId === entry.userId ? { ...entry } : r)
          .sort((a, b) => b.totalWithdrawals - a.totalWithdrawals)
          .map((r, i) => ({ ...r, rank: i + 1 })),
      }
    }
    const updated = [...s.ranking, entry]
      .sort((a, b) => b.totalWithdrawals - a.totalWithdrawals)
      .map((r, i) => ({ ...r, rank: i + 1 }))
    return { ranking: updated }
  }),
}))
