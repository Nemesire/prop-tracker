import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { Account } from '../../types'
import { buildCapitalChartData } from '../../utils/calculations'

interface Props {
  accounts: Account[]
  hideValues?: boolean
}

function fmt(v: number) {
  if (Math.abs(v) >= 1000) return `€${(v / 1000).toFixed(1)}k`
  return `€${v.toFixed(0)}`
}

export default function CapitalChart({ accounts, hideValues }: Props) {
  const data = buildCapitalChartData(accounts)

  // Lee las CSS vars en tiempo de render para que cambien con el tema
  const style  = getComputedStyle(document.documentElement)
  const border = style.getPropertyValue('--border').trim()   || '#2D2D4E'
  const muted  = style.getPropertyValue('--muted').trim()    || '#8888AA'
  const surface= style.getPropertyValue('--surface').trim()  || '#1A1A2E'
  const text   = style.getPropertyValue('--text').trim()     || '#F8F8FF'

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-[var(--muted)] text-sm">
        Añade cuentas para ver la evolución del capital
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gradCapital" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradGanancias" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22C55E" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradGastos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={border} />
        <XAxis dataKey="date" tick={{ fill: muted, fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis tickFormatter={hideValues ? () => '***' : fmt} tick={{ fill: muted, fontSize: 11 }} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{ background: surface, border: `1px solid ${border}`, borderRadius: 12, color: text }}
          formatter={(v: unknown, name: unknown) => [hideValues ? '***' : fmt(Number(v)), String(name)]}
        />
        <Legend wrapperStyle={{ color: muted, fontSize: 12 }} />
        <Area type="monotone" dataKey="capital"   name="Capital"   stroke="#7C3AED" strokeWidth={2}   fill="url(#gradCapital)"   dot={false} />
        <Area type="monotone" dataKey="ganancias" name="Ganancias" stroke="#22C55E" strokeWidth={2}   fill="url(#gradGanancias)" dot={false} />
        <Area type="monotone" dataKey="gastos"    name="Gastos"    stroke="#EF4444" strokeWidth={1.5} fill="url(#gradGastos)"    dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
