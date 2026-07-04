import { api } from './api'
import type { ActivityEvent } from '../types'

export const activityService = {
  async getAll(filter: 'community' | 'mine' = 'community'): Promise<ActivityEvent[]> {
    const { events } = await api.get<{ events: ActivityEvent[] }>(`/activity?filter=${filter}`)
    return events
  },

  /** Alterna la reacción del usuario actual sobre un evento */
  async react(eventId: string, emoji: string): Promise<void> {
    await api.post(`/activity/${eventId}/react`, { emoji })
  },
}
