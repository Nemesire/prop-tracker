import type { Account, CompanyStats, DateRange } from '../types'

export function filterAccountsByDate(accounts: Account[], range: DateRange): Account[] {
  if (!range.from && !range.to) return accounts
  return accounts.filter(acc => {
    const d = new Date(acc.startDate)
    if (range.from && d < range.from) return false
    if (range.to && d > range.to) return false
    return true
  })
}

export function calcBenefit(acc: Account): number {
  return acc.withdrawals - acc.cost
}

export function calcROI(accounts: Account[]): number {
  const totalCost = accounts.reduce((s, a) => s + a.cost, 0)
  const totalWithdrawals = accounts.reduce((s, a) => s + a.withdrawals, 0)
  if (totalCost === 0) return 0
  return ((totalWithdrawals - totalCost) / totalCost) * 100
}

export function calcFundingRatio(accounts: Account[]): number {
  const total = accounts.length
  if (total === 0) return 0
  const live = accounts.filter(a => a.type === 'live').length
  return (live / total) * 100
}

export function calcCompanyStats(accounts: Account[]): CompanyStats[] {
  const map = new Map<string, CompanyStats>()
  for (const acc of accounts) {
    const existing = map.get(acc.company) ?? {
      company: acc.company,
      accounts: 0,
      activeAccounts: 0,
      gastos: 0,
      retiros: 0,
      beneficio: 0,
      roi: 0,
    }
    existing.accounts += 1
    if (acc.status === 'activa') existing.activeAccounts += 1
    existing.gastos += acc.cost
    existing.retiros += acc.withdrawals
    existing.beneficio = existing.retiros - existing.gastos
    map.set(acc.company, existing)
  }
  const result = Array.from(map.values())
  result.forEach(s => {
    s.roi = s.gastos > 0 ? ((s.retiros - s.gastos) / s.gastos) * 100 : 0
  })
  return result.sort((a, b) => b.retiros - a.retiros)
}

export function buildCapitalChartData(accounts: Account[]): {
  date: string
  capital: number
  ganancias: number
  gastos: number
}[] {
  const dailyMap = new Map<string, { ganancias: number; gastos: number }>()

  for (const acc of accounts) {
    const dateKey = acc.startDate.slice(0, 10)
    const prev = dailyMap.get(dateKey) ?? { ganancias: 0, gastos: 0 }
    prev.gastos += acc.cost
    dailyMap.set(dateKey, prev)

    for (const entry of acc.dailyEntries) {
      const key = entry.date.slice(0, 10)
      const p = dailyMap.get(key) ?? { ganancias: 0, gastos: 0 }
      if (entry.pnl > 0) p.ganancias += entry.pnl
      dailyMap.set(key, p)
    }
  }

  const sorted = Array.from(dailyMap.entries()).sort(([a], [b]) => a.localeCompare(b))
  let capital = 0
  return sorted.map(([date, { ganancias, gastos }]) => {
    capital += ganancias - gastos
    return { date, capital, ganancias, gastos }
  })
}

export function formatCurrency(n: number, hideValues = false): string {
  if (hideValues) return '€***'
  const abs = Math.abs(n)
  const formatted = abs.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `${n < 0 ? '-' : ''}€${formatted}`
}

export function formatPercent(n: number): string {
  return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora mismo'
  if (mins < 60) return `hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  return `hace ${days}d`
}
