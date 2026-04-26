export type AccountType = 'evaluacion' | 'live'
export type AccountStatus = 'activa' | 'suspendida' | 'completada' | 'fallida'

export interface DailyEntry {
  date: string
  pnl: number
}

export interface Withdrawal {
  id: string
  amount: number
  date: string
  note?: string
}

export interface Account {
  id: string
  name: string
  type: AccountType
  status: AccountStatus
  company: string
  size: number
  cost: number
  earnings: number
  withdrawals: number
  withdrawalsList: Withdrawal[]
  dailyEntries: DailyEntry[]
  startDate: string
  endDate?: string
  userId: string
  notes?: string
}

export interface User {
  id: string
  username: string
  displayName: string
  avatar?: string
  bio?: string
  country?: string
  isPublic: boolean
  xp: number
  level: number
  badges: string[]
  joinDate: string
  accounts: Account[]
  following: string[]
  followers: string[]
}

export type ChallengeMetric = 'approvals' | 'withdrawals' | 'roi' | 'accounts' | 'profit' | 'streak'
export type ChallengePeriod = 'week' | 'month' | 'quarter' | 'year'
export type ChallengeType = 'personal' | 'community'

export interface Challenge {
  id: string
  title: string
  description: string
  icon: string
  type: ChallengeType
  metric: ChallengeMetric
  target: number
  period: ChallengePeriod
  xpReward: number
  startDate: string
  endDate: string
  participants?: number
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary'
}

export interface UserChallenge {
  challengeId: string
  userId: string
  progress: number
  completed: boolean
  completedDate?: string
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  condition: string
  xpReward: number
}

export interface Level {
  level: number
  name: string
  minXp: number
  maxXp: number
  color: string
  icon: string
}

export interface ActivityEvent {
  id: string
  userId: string
  username: string
  displayName: string
  avatar?: string
  type: 'account_added' | 'evaluation_passed' | 'withdrawal' | 'challenge_completed' | 'badge_earned' | 'level_up'
  description: string
  amount?: number
  date: string
  reactions: Record<string, string[]>
}

export interface RankingEntry {
  userId: string
  username: string
  displayName: string
  avatar?: string
  level: number
  badges: string[]
  totalWithdrawals: number
  totalProfit: number
  roi: number
  activeAccounts: number
  approvedEvaluations: number
  rank: number
  previousRank?: number
}

export interface DateRange {
  from: Date | null
  to: Date | null
  preset?: 'thisMonth' | 'thisQuarter' | 'lastQuarter' | 'thisYear' | 'lastYear' | 'allTime' | 'custom'
}

export interface CompanyStats {
  company: string
  accounts: number
  activeAccounts: number
  gastos: number
  retiros: number
  beneficio: number
  roi: number
}
