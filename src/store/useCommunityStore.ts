import { create } from 'zustand'
import type { ActivityEvent, RankingEntry } from '../types'
import { MOCK_RANKING, MOCK_ACTIVITY } from '../data/mockUsers'
import { rankingService } from '../services/ranking.service'

/** DEV usa datos de ejemplo (no hay BD local salvo que arranques server/local.js).
 *  PROD siempre lee el ranking real desde la API (usuarios registrados). */
const REMOTE = !import.meta.env.DEV

interface CommunityState {
  ranking: RankingEntry[]
  activity: ActivityEvent[]
  rankingFilter: 'roi' | 'profit' | 'withdrawals' | 'approvals'
  activityFilter: 'all' | 'mine'
  rankingLoading: boolean
  rankingError: string | null

  setRankingFilter: (f: CommunityState['rankingFilter']) => void
  setActivityFilter: (f: CommunityState['activityFilter']) => void
  addReaction: (eventId: string, emoji: string, userId: string) => void
  addActivity: (event: Omit<ActivityEvent, 'id' | 'reactions'>) => void
  insertUserInRanking: (entry: RankingEntry) => void
  loadRankingFromApi: () => Promise<void>
}

export const useCommunityStore = create<CommunityState>()((set) => ({
  ranking: REMOTE ? [] : MOCK_RANKING,
  activity: MOCK_ACTIVITY,
  rankingFilter: 'withdrawals',
  activityFilter: 'all',
  rankingLoading: false,
  rankingError: null,

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

  /** Carga el ranking real (usuarios registrados) desde la API — solo en producción */
  loadRankingFromApi: async () => {
    if (!REMOTE) return
    set({ rankingLoading: true, rankingError: null })
    try {
      const ranking = await rankingService.getAll()
      set({ ranking, rankingLoading: false })
    } catch (err) {
      set({ rankingLoading: false, rankingError: (err as Error).message })
    }
  },
}))
