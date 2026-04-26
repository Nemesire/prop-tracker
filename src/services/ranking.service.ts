import { api } from './api'
import type { RankingEntry } from '../types'

export const rankingService = {
  async getAll(): Promise<RankingEntry[]> {
    const { ranking } = await api.get<{ ranking: RankingEntry[] }>('/ranking')
    return ranking
  },
}
