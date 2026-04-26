import { api } from './api'
import type { CompanyStats } from '../types'

interface DashboardData {
  stats: {
    totalCost:            number
    totalWithdrawals:     number
    totalEarnings:        number
    profit:               number
    roi:                  number
    liveAccounts:         number
    evaluacionAccounts:   number
    fundingRatio:         number
    totalAccounts:        number
  }
  dailyChart:   { date: string; pnl: number }[]
  bestDay:      { date: string; pnl: number } | null
  worstDay:     { date: string; pnl: number } | null
  avgDay:       number
  companyStats: CompanyStats[]
}

export const dashboardService = {
  async get(): Promise<DashboardData> {
    return api.get<DashboardData>('/dashboard')
  },
}
