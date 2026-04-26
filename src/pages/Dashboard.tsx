import { useState } from 'react'
import { Eye, EyeOff, Share2, BarChart2, CreditCard, Percent, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { calcCompanyStats, calcROI, calcFundingRatio, formatCurrency } from '../utils/calculations'
import StatsCard from '../components/dashboard/StatsCard'
import CapitalChart from '../components/dashboard/CapitalChart'
import CompanyAnalysis from '../components/dashboard/CompanyAnalysis'
import DateRangePicker from '../components/ui/DateRangePicker'
import ShareModal from '../components/share/ShareModal'
import LevelBadge from '../components/gamification/LevelBadge'
import { BADGES } from '../data/badges'

export default function Dashboard() {
  const { currentUser, hideValues, toggleHideValues, dateRange, setDateRange } = useAppStore()
  const [shareOpen, setShareOpen] = useState(false)

  if (!currentUser) return null

  const accounts = currentUser.accounts
  const totalCost = accounts.reduce((s, a) => s + a.cost, 0)
  const totalWithdrawals = accounts.reduce((s, a) => s + a.withdrawals, 0)
  const totalEarnings = accounts.reduce((s, a) => s + a.earnings, 0)
  const profit = totalWithdrawals - totalCost
  const roi = calcROI(accounts)
  const fundingRatio = calcFundingRatio(accounts)
  const companyStats = calcCompanyStats(accounts)

  const evaluaciones = accounts.filter(a => a.type === 'evaluacion').length
  const liveActive = accounts.filter(a => a.type === 'live' && a.status === 'activa').length

  // Day stats from all daily entries
  const allEntries = accounts.flatMap(a => a.dailyEntries)
  const dayMap = new Map<string, number>()
  for (const e of allEntries) {
    dayMap.set(e.date, (dayMap.get(e.date) ?? 0) + e.pnl)
  }
  const dayValues = Array.from(dayMap.values())
  const bestDay = dayValues.length > 0 ? Math.max(...dayValues) : 0
  const worstDay = dayValues.length > 0 ? Math.min(...dayValues) : 0
  const avgDay = dayValues.length > 0 ? dayValues.reduce((s, v) => s + v, 0) / dayValues.length : 0
  const withdrawalCount = accounts.reduce((s, a) => s + a.withdrawalsList.length, 0)

  const fmt = (n: number) => formatCurrency(n, hideValues)

  return (
    <div className="p-6 space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#F8F8FF]">Dashboard</h1>
          <p className="text-sm text-[#8888AA] mt-0.5">Resumen de tu rendimiento</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleHideValues}
            className="flex items-center gap-2 px-3 py-2 bg-[#1A1A2E] border border-[#2D2D4E] rounded-xl text-sm text-[#8888AA] hover:text-[#F8F8FF] hover:border-[#7C3AED]/50 transition-colors"
          >
            {hideValues ? <EyeOff size={14} /> : <Eye size={14} />}
            {hideValues ? 'Mostrar valores' : 'Ocultar valores'}
          </button>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <button onClick={() => setShareOpen(true)} className="p-2 bg-[#1A1A2E] border border-[#2D2D4E] rounded-xl text-[#8888AA] hover:text-[#7C3AED] hover:border-[#7C3AED]/50 transition-colors">
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {/* Level widget */}
      <div className="flex items-center gap-4 bg-[#1A1A2E] border border-[#2D2D4E] rounded-2xl px-5 py-4">
        <LevelBadge xp={currentUser.xp} showProgress size="md" />
        <div className="flex-1" />
        <div className="flex gap-1.5">
          {currentUser.badges.slice(0, 6).map(b => {
            const badge = BADGES.find(bg => bg.id === b)
            return badge ? <span key={b} title={badge.name} className="text-xl cursor-help">{badge.icon}</span> : null
          })}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard
          title="Evaluaciones"
          value={String(evaluaciones)}
          icon={<BarChart2 size={20} />}
          color="#F59E0B"
          trend={{ label: '0 en progreso' }}
        />
        <StatsCard
          title="Cuentas Live"
          value={String(liveActive)}
          icon={<CreditCard size={20} />}
          color="#22C55E"
          trend={{ label: `${liveActive} activas` }}
        />
        <StatsCard
          title="Funding Ratio"
          value={hideValues ? '**%' : `${fundingRatio.toFixed(1)}%`}
          icon={<Percent size={20} />}
          color="#3B82F6"
          trend={{ label: `Retiros: ${withdrawalCount * 20}%` }}
        />
        <StatsCard
          title="Gastos Totales"
          value={fmt(totalCost)}
          subtitle={`Promedio: ${fmt(totalCost / Math.max(accounts.length, 1))}`}
          icon={<TrendingDown size={20} />}
          color="#EF4444"
        />
        <StatsCard
          title="Ganancias Totales"
          value={fmt(totalEarnings)}
          subtitle={`Promedio: ${fmt(totalEarnings / Math.max(accounts.length, 1))}`}
          icon={<TrendingUp size={20} />}
          color="#22C55E"
        />
        <StatsCard
          title="Beneficio Neto"
          value={fmt(profit)}
          subtitle={`ROI: ${hideValues ? '**%' : roi.toFixed(1) + '%'}`}
          icon={<DollarSign size={20} />}
          color={profit >= 0 ? '#22C55E' : '#EF4444'}
          trend={{ label: `ROI: ${roi.toFixed(1)}%`, positive: roi >= 0 }}
        />
      </div>

      {/* Capital Chart */}
      <div className="bg-[#1A1A2E] border border-[#2D2D4E] rounded-2xl p-5">
        <h2 className="font-semibold text-[#F8F8FF] mb-1">Evolución del Capital</h2>
        <p className="text-xs text-[#8888AA] mb-5">Seguimiento de tu rendimiento en el tiempo</p>
        <CapitalChart accounts={accounts} hideValues={hideValues} />
      </div>

      {/* Day Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Mejor Día', value: fmt(bestDay), icon: '📈', color: '#22C55E' },
          { label: 'Peor Día', value: fmt(worstDay), icon: '📉', color: '#EF4444' },
          { label: 'Promedio Diario', value: fmt(avgDay), icon: '📊', color: '#3B82F6' },
          { label: 'Retiros', value: String(withdrawalCount), icon: '💸', color: '#F59E0B' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-[#1A1A2E] border border-[#2D2D4E] rounded-2xl p-4 text-center">
            <div className="text-2xl mb-2">{icon}</div>
            <div className="text-xl font-bold" style={{ color }}>{value}</div>
            <div className="text-xs text-[#8888AA] mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Company Analysis */}
      <div>
        <h2 className="text-lg font-semibold text-[#F8F8FF] mb-1">Análisis por Empresa</h2>
        <p className="text-sm text-[#8888AA] mb-4">Rendimiento detallado de cada prop firm</p>
        <CompanyAnalysis stats={companyStats} hideValues={hideValues} />
      </div>

      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} user={currentUser} accounts={accounts} />
    </div>
  )
}
