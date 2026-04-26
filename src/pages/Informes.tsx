import { Download } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { calcCompanyStats, formatCurrency } from '../utils/calculations'
import Button from '../components/ui/Button'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { getCompanyColor } from '../data/companies'

export default function Informes() {
  const { currentUser, hideValues } = useAppStore()
  if (!currentUser) return null

  const cssVar = (v: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim()
  const border  = cssVar('--border')  || '#2D2D4E'
  const muted   = cssVar('--muted')   || '#8888AA'
  const surface = cssVar('--surface') || '#1A1A2E'
  const text    = cssVar('--text')    || '#F8F8FF'
  const tooltipStyle = { background: surface, border: `1px solid ${border}`, borderRadius: 12, color: text }

  const accounts = currentUser.accounts
  const companyStats = calcCompanyStats(accounts)

  const pieData = companyStats.filter(s => s.gastos > 0).map(s => ({
    name: s.company, value: s.gastos, color: getCompanyColor(s.company),
  }))

  const barData = companyStats.filter(s => s.accounts > 0).map(s => ({
    name: s.company.slice(0, 10), gastos: s.gastos, retiros: s.retiros,
  }))

  function exportCSV() {
    const headers = 'Nombre,Tipo,Estado,Empresa,Tamaño,Coste,Retiros,Beneficio,Fecha Inicio\n'
    const rows = accounts.map(a =>
      `"${a.name}","${a.type}","${a.status}","${a.company}","${a.size}","${a.cost}","${a.withdrawals}","${a.withdrawals - a.cost}","${a.startDate.slice(0, 10)}"`
    ).join('\n')
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `prop-tracker-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const fmt = (n: number) => formatCurrency(n, hideValues)

  return (
    <div className="p-6 space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Informes</h1>
          <p className="text-sm text-[var(--muted)] mt-0.5">Análisis avanzado de tu rendimiento</p>
        </div>
        <Button variant="secondary" onClick={exportCSV}>
          <Download size={16} /> Exportar CSV
        </Button>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Bar chart */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
          <h3 className="font-semibold text-[var(--text)] mb-4 text-sm">Gastos vs Retiros por Empresa</h3>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={border} />
                <XAxis dataKey="name" tick={{ fill: muted, fontSize: 10 }} angle={-30} textAnchor="end" tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: muted, fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `€${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [fmt(Number(v))]} />
                <Legend wrapperStyle={{ color: muted, fontSize: 11 }} />
                <Bar dataKey="gastos" name="Gastos" fill="#EF4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="retiros" name="Retiros" fill="#22C55E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-[var(--muted)] text-sm py-10 text-center">Sin datos suficientes</p>}
        </div>

        {/* Pie chart */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
          <h3 className="font-semibold text-[var(--text)] mb-4 text-sm">Distribución de Gastos</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [fmt(Number(v))]} />
                <Legend wrapperStyle={{ color: muted, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-[var(--muted)] text-sm py-10 text-center">Sin datos suficientes</p>}
        </div>
      </div>

      {/* Resumen estadístico */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
        <h3 className="font-semibold text-[var(--text)] mb-4 text-sm">Resumen Estadístico</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total cuentas', value: accounts.length },
            { label: 'Cuentas activas', value: accounts.filter(a => a.status === 'activa').length },
            { label: 'Evaluaciones fallidas', value: accounts.filter(a => a.status === 'fallida').length },
            { label: 'Cuentas live', value: accounts.filter(a => a.type === 'live').length },
          ].map(({ label, value }) => (
            <div key={label} className="text-center p-4 bg-[var(--bg)] rounded-xl">
              <div className="text-2xl font-bold text-[var(--text)]">{value}</div>
              <div className="text-xs text-[var(--muted)] mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Historial de retiros */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-[var(--border)]">
          <h3 className="font-semibold text-[var(--text)] text-sm">Historial de Retiros</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {['FECHA', 'CUENTA', 'EMPRESA', 'CANTIDAD', 'NOTA'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-[var(--muted)] px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {accounts.flatMap(a => a.withdrawalsList.map(w => ({ ...w, accountName: a.name, company: a.company }))).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(w => (
                <tr key={w.id} className="border-b border-[var(--border)] hover:bg-[var(--surface2)]/50">
                  <td className="px-5 py-3 text-[var(--muted)] text-xs">{new Date(w.date).toLocaleDateString('es-ES')}</td>
                  <td className="px-5 py-3 font-mono text-xs text-[var(--text)]">{w.accountName}</td>
                  <td className="px-5 py-3 text-[var(--muted)] text-xs">{w.company}</td>
                  <td className="px-5 py-3 font-semibold text-[#22C55E]">{fmt(w.amount)}</td>
                  <td className="px-5 py-3 text-[var(--muted)] text-xs">{w.note ?? '—'}</td>
                </tr>
              ))}
              {accounts.every(a => a.withdrawalsList.length === 0) && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-[var(--muted)] text-sm">Sin retiros registrados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
