import { Skull, TrendingUp, Repeat, Flame } from 'lucide-react'
import type { Account } from '../../types'
import StatsCard from './StatsCard'

interface Props {
  accounts: Account[] // todas las cuentas del usuario, sin filtrar por rango de fechas
}

/**
 * Recorre las cuentas ordenadas por fecha de inicio y calcula la racha de
 * "quemadas" (fallida sin ningún retiro) hasta el próximo éxito (>0 retiros).
 * Las cuentas en curso (activa/suspendida/completada sin retiros) no cuentan
 * ni como quema ni como éxito — solo interrumpen la racha las quemadas y los éxitos.
 */
function calcStreaks(accounts: Account[]) {
  const sorted = [...accounts].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  )
  let current = 0
  let worst = 0
  for (const a of sorted) {
    const isBurn = a.status === 'fallida' && a.withdrawals <= 0
    const isWin  = a.withdrawals > 0
    if (isBurn) {
      current += 1
      worst = Math.max(worst, current)
    } else if (isWin) {
      current = 0
    }
  }
  return { current, worst }
}

export default function AdvancedStats({ accounts }: Props) {
  const burnedCount      = accounts.filter(a => a.status === 'fallida').length
  const fundedEverCount  = accounts.filter(a => a.type === 'live').length
  const totalWithdrawals = accounts.reduce((s, a) => s + a.withdrawalsList.length, 0)
  const perAccount       = fundedEverCount > 0 ? totalWithdrawals / fundedEverCount : 0
  const { current, worst } = calcStreaks(accounts)

  return (
    <div>
      <h2 className="text-lg font-semibold text-text mb-1">Estadísticas Avanzadas</h2>
      <p className="text-sm text-muted mb-4">Vista general de todo tu historial — no depende del rango de fechas seleccionado</p>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard
          title="Cuentas Quemadas"
          value={String(burnedCount)}
          icon={<Skull size={20} />}
          color="#EF4444"
          tooltip="Cuentas fallidas (evaluación o live) que no llegaron a generar ningún retiro."
        />
        <StatsCard
          title="Cuentas Fondeadas"
          value={String(fundedEverCount)}
          icon={<TrendingUp size={20} />}
          color="#22C55E"
          tooltip="Total histórico de cuentas que pasaron a Live alguna vez, estén o no activas ahora mismo."
        />
        <StatsCard
          title="Retiros Totales"
          value={String(totalWithdrawals)}
          icon={<Repeat size={20} />}
          color="#3B82F6"
          tooltip="Número total de retiros realizados en todas tus cuentas, de toda la vida."
        />
        <StatsCard
          title="Retiros por Cuenta"
          value={perAccount.toFixed(1)}
          icon={<Repeat size={20} />}
          color="#3B82F6"
          tooltip="Promedio de retiros por cada cuenta que llegó a estar fondeada (Live)."
        />
        <StatsCard
          title="Racha Actual de Quemadas"
          value={String(current)}
          icon={<Flame size={20} />}
          color={current >= 3 ? '#EF4444' : '#F59E0B'}
          tooltip="Cuentas quemadas seguidas (sin retiro) desde tu último éxito, ordenadas por fecha de inicio."
        />
        <StatsCard
          title="Peor Racha de Quemadas"
          value={String(worst)}
          icon={<Flame size={20} />}
          color="#EF4444"
          tooltip="La racha más larga de tu historial: cuentas quemadas seguidas antes de conseguir un retiro."
        />
      </div>
    </div>
  )
}
