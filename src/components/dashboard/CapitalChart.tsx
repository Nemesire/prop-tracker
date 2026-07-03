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

function fmtFull(v: number) {
  return v.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

function fmtDateES(iso: string) {
  const [y, m, d] = iso.split('-')
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y.slice(2)}`
}

const SERIES = [
  { key: 'capital',   label: 'Capital',   color: '#7C3AED' },
  { key: 'ganancias', label: 'Ganancias', color: '#22C55E' },
  { key: 'gastos',    label: 'Gastos',    color: '#EF4444' },
] as const

function CustomTooltip({ active, payload, label, hideValues }: {
  active?: boolean
  payload?: { value: number; dataKey: string }[]
  label?: string
  hideValues?: boolean
}) {
  if (!active || !payload?.length || !label) return null

  const style  = getComputedStyle(document.documentElement)
  const surface = style.getPropertyValue('--color-surface').trim() || '#1A1A2E'
  const border  = style.getPropertyValue('--color-border').trim()  || '#2D2D4E'
  const text    = style.getPropertyValue('--color-text').trim()    || '#F8F8FF'
  const muted   = style.getPropertyValue('--color-muted').trim()   || '#8888AA'

  return (
    <div style={{
      background: surface,
      border: `1px solid ${border}`,
      borderRadius: 12,
      padding: '10px 14px',
      minWidth: 180,
      boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
    }}>
      {/* Fecha en la parte superior */}
      <div style={{ color: text, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
        {fmtDateES(label)}
      </div>
      {/* Filas de series */}
      {SERIES.map(s => {
        const entry = payload.find(p => p.dataKey === s.key)
        const val   = entry?.value ?? 0
        return (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{
              display: 'inline-block', width: 10, height: 10,
              borderRadius: '50%', background: s.color, flexShrink: 0,
            }} />
            <span style={{ color: muted, fontSize: 12, flex: 1 }}>{s.label}:</span>
            <span style={{ color: text, fontWeight: 600, fontSize: 12 }}>
              {hideValues ? '***' : fmtFull(val)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default function CapitalChart({ accounts, hideValues }: Props) {
  const data = buildCapitalChartData(accounts)

  const style  = getComputedStyle(document.documentElement)
  const border = style.getPropertyValue('--color-border').trim() || '#2D2D4E'
  const muted  = style.getPropertyValue('--color-muted').trim()  || '#8888AA'

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted text-sm">
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
        <XAxis
          dataKey="date"
          tickFormatter={(d: string) => {
            const [y, m, day] = d.split('-')
            return `${day}/${m}/${y.slice(2)}`
          }}
          tick={{ fill: muted, fontSize: 11 }}
          tickLine={{ stroke: '#9CA3AF', strokeWidth: 1 }}
          axisLine={{ stroke: '#9CA3AF', strokeWidth: 2 }}
        />
        <YAxis
          tickFormatter={hideValues ? () => '***' : fmt}
          tick={{ fill: muted, fontSize: 11 }}
          tickLine={{ stroke: '#9CA3AF', strokeWidth: 1 }}
          axisLine={{ stroke: '#9CA3AF', strokeWidth: 2 }}
        />
        <Tooltip content={<CustomTooltip hideValues={hideValues} />} />
        <Legend wrapperStyle={{ color: muted, fontSize: 12 }} />
        <Area type="monotone" dataKey="capital"   name="Capital"   stroke="#7C3AED" strokeWidth={2}   fill="url(#gradCapital)"   dot={false} />
        <Area type="monotone" dataKey="ganancias" name="Ganancias" stroke="#22C55E" strokeWidth={2}   fill="url(#gradGanancias)" dot={false} />
        <Area type="monotone" dataKey="gastos"    name="Gastos"    stroke="#EF4444" strokeWidth={1.5} fill="url(#gradGastos)"    dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
