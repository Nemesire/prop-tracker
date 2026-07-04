import { useState } from 'react'
import { Eye, EyeOff, Share2, ClipboardCheck, Percent, TrendingUp, TrendingDown, DollarSign, Trophy } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { calcCompanyStats, calcROI, calcFundingRatio, formatCurrency } from '../utils/calculations'
import StatsCard from '../components/dashboard/StatsCard'
import CapitalChart from '../components/dashboard/CapitalChart'
import CompanyAnalysis from '../components/dashboard/CompanyAnalysis'
import AdvancedStats from '../components/dashboard/AdvancedStats'
import DateRangePicker from '../components/ui/DateRangePicker'
import ShareModal from '../components/share/ShareModal'
import LevelBadge from '../components/gamification/LevelBadge'
import { BADGES } from '../data/badges'
import { getPresetRange } from '../utils/dateFilters'
import type { DateRange } from '../types'

/** Devuelve {from, to} efectivos para un DateRange (preset o custom) */
function getEffectiveRange(dr: DateRange): { from: Date; to: Date } {
  if (dr.preset && dr.preset !== 'custom') return getPresetRange(dr.preset)
  return {
    from: dr.from ?? new Date(2020, 0, 1),
    to:   dr.to   ?? new Date(),
  }
}

function inRange(dateStr: string, from: Date, to: Date): boolean {
  const d = new Date(dateStr)
  const toEnd = new Date(to); toEnd.setHours(23, 59, 59, 999)
  return d >= from && d <= toEnd
}

export default function Dashboard() {
  const { currentUser, hideValues, toggleHideValues, dateRange, setDateRange } = useAppStore()
  const [shareOpen, setShareOpen] = useState(false)

  if (!currentUser) return null

  const { from, to } = getEffectiveRange(dateRange)
  const allAccounts = currentUser.accounts

  // Cuentas cuya fecha de inicio cae en el rango
  const accounts = allAccounts.filter(a => inRange(a.startDate, from, to))

  // Para la cuenta live activa no filtramos por fecha (estado actual)
  const liveActive = allAccounts.filter(a => a.type === 'live' && a.status === 'activa').length

  // Gastos = cuentas iniciadas en el rango
  const totalCost = accounts.reduce((s, a) => s + a.cost, 0)

  // Retiros dentro del rango (de todas las cuentas)
  const withdrawalsInRange = allAccounts.flatMap(a =>
    a.withdrawalsList.filter(w => inRange(w.date, from, to))
  )
  const totalWithdrawals = withdrawalsInRange.reduce((s, w) => s + w.amount, 0)
  const withdrawalCount  = withdrawalsInRange.length

  // Entradas diarias dentro del rango
  const allEntries = allAccounts.flatMap(a =>
    a.dailyEntries.filter(e => inRange(e.date, from, to))
  )
  const totalEarnings = allEntries.reduce((s, e) => s + e.pnl, 0)

  const profit = totalWithdrawals - totalCost
  const roi = calcROI(accounts)
  const fundingRatio = calcFundingRatio(allAccounts)
  const companyStats = calcCompanyStats(accounts)

  // Withdraw Ratio = veces que retiras / total de cuentas compradas
  const withdrawRatio = accounts.length > 0 ? (withdrawalCount / accounts.length) * 100 : 0

  // Cuentas con entradas diarias y costes filtrados por rango → para el gráfico
  const accountsForChart = allAccounts.map(a => ({
    ...a,
    dailyEntries: a.dailyEntries.filter(e => inRange(e.date, from, to)),
    cost: inRange(a.startDate, from, to) ? a.cost : 0,
  }))

  const evaluaciones = accounts.filter(a => a.type === 'evaluacion').length

  // Day stats
  const dayMap = new Map<string, number>()
  for (const e of allEntries) {
    dayMap.set(e.date, (dayMap.get(e.date) ?? 0) + e.pnl)
  }
  const dayValues = Array.from(dayMap.values())
  const bestDay  = dayValues.length > 0 ? Math.max(...dayValues) : 0
  const worstDay = dayValues.length > 0 ? Math.min(...dayValues) : 0
  const avgDay   = dayValues.length > 0 ? dayValues.reduce((s, v) => s + v, 0) / dayValues.length : 0

  const fmt = (n: number) => formatCurrency(n, hideValues)

  return (
    <div className="p-6 space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Dashboard</h1>
          <p className="text-sm text-muted mt-0.5">Resumen de tu rendimiento</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleHideValues}
            className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-xl text-sm text-muted hover:text-text hover:border-[#7C3AED]/50 transition-colors"
          >
            {hideValues ? <EyeOff size={14} /> : <Eye size={14} />}
            {hideValues ? 'Mostrar valores' : 'Ocultar valores'}
          </button>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <button onClick={() => setShareOpen(true)} className="p-2 bg-surface border border-border rounded-xl text-muted hover:text-[#7C3AED] hover:border-[#7C3AED]/50 transition-colors">
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {/* Level widget */}
      <div className="flex items-center gap-4 bg-surface border border-border rounded-2xl px-5 py-4">
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
          icon={<ClipboardCheck size={20} />}
          color="#F59E0B"
          trend={{ label: '0 en progreso' }}
        />
        <StatsCard
          title="Cuentas Live"
          value={String(liveActive)}
          icon={<Trophy size={20} />}
          color="#F59E0B"
          trend={{ label: `${liveActive} activas` }}
        />
        <StatsCard
          title="Funding Ratio"
          value={hideValues ? '**%' : `${fundingRatio.toFixed(1)}%`}
          icon={<Percent size={20} />}
          color="#3B82F6"
          trend={{ label: `Retiros: ${withdrawalCount * 20}%` }}
          tooltip="Es la cantidad de veces que te fondeas de los exámenes que haces. Recomendable cerca del 30%."
        />
        <StatsCard
          title="Gastos Totales"
          value={fmt(totalCost)}
          icon={<TrendingDown size={20} />}
          color="#EF4444"
          trend={{ label: `↓ ${fmt(totalCost / Math.max(accounts.length, 1))}`, positive: false }}
        />
        <StatsCard
          title="Ganancias Totales"
          value={fmt(totalEarnings)}
          icon={<TrendingUp size={20} />}
          color="#22C55E"
          trend={{ label: `↑ ${fmt(totalEarnings / Math.max(accounts.length, 1))}`, positive: true }}
          tooltip="Total retirado de todas las empresas."
          secondaryStat={{
            label: 'Withdraw Ratio',
            value: hideValues ? '**%' : `${withdrawRatio.toFixed(1)}%`,
            tooltip: 'Es el ratio de las veces que retiras de un total de cuentas.',
          }}
        />
        <StatsCard
          title="Beneficio Neto"
          value={fmt(profit)}
          subtitle={`ROI: ${hideValues ? '**%' : roi.toFixed(1) + '%'}`}
          icon={<DollarSign size={20} />}
          color={profit >= 0 ? '#22C55E' : '#EF4444'}
          trend={{ label: `ROI: ${roi.toFixed(1)}%`, positive: roi >= 0 }}
          tooltip="Ganancias netas pero antes de impuestos."
        />
      </div>

      {/* Capital Chart */}
      <div className="bg-surface border border-border rounded-2xl p-5">
        <h2 className="font-semibold text-text mb-1">Evolución del Capital</h2>
        <p className="text-xs text-muted mb-5">Seguimiento de tu rendimiento en el tiempo</p>
        <CapitalChart accounts={accountsForChart} hideValues={hideValues} />
      </div>

      {/* Day Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Mejor Día',       value: fmt(bestDay),         icon: '📈', color: '#22C55E', sub: 'Mayor ganancia diaria' },
          { label: 'Peor Día',        value: fmt(worstDay),        icon: '📉', color: '#EF4444', sub: 'Mayor pérdida diaria' },
          { label: 'Promedio Diario', value: fmt(avgDay),          icon: '📊', color: '#3B82F6', sub: 'Cambio promedio por día' },
          { label: 'Retiros',         value: String(withdrawalCount), icon: '💸', color: '#F59E0B', sub: 'Número de retiros realizados' },
        ].map(({ label, value, icon, color, sub }) => (
          <div key={label} className="bg-surface border border-border rounded-2xl p-4">
            {/* Título izquierda — icono derecha */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted">{label}</span>
              <span className="text-xl leading-none">{icon}</span>
            </div>
            {/* Valor grande */}
            <div className="text-2xl font-black mb-1" style={{ color }}>{value}</div>
            {/* Subtítulo */}
            <div className="text-xs text-muted">{sub}</div>
          </div>
        ))}
      </div>

      {/* Estadísticas Avanzadas */}
      <AdvancedStats accounts={allAccounts} />

      {/* Company Analysis */}
      <div>
        <h2 className="text-lg font-semibold text-text mb-1">Análisis por Empresa</h2>
        <p className="text-sm text-muted mb-4">Rendimiento detallado de cada prop firm</p>
        <CompanyAnalysis stats={companyStats} hideValues={hideValues} />
      </div>

      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} user={currentUser} accounts={accounts} />
    </div>
  )
}
