import { api } from './api'

export interface ApiChallenge {
  id:            string
  title:         string
  description:   string
  type:          'personal' | 'community'
  metric:        string
  target:        number
  period:        string
  xpReward:      number
  difficulty:    string
  icon:          string
  startDate:     string | null
  endDate:       string | null
  progress:      number
  completed:     boolean
  completedDate: string | null
}

export const challengesService = {
  async getAll(): Promise<ApiChallenge[]> {
    const { challenges } = await api.get<{ challenges: ApiChallenge[] }>('/challenges')
    return challenges
  },

  async updateProgress(challengeId: string, progress: number): Promise<void> {
    await api.patch(`/challenges/${challengeId}/progress`, { progress })
  },
}
