import { useState } from 'react'
import { Download, Pencil, Trash2, X, Check } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { calcCompanyStats, formatCurrency } from '../utils/calculations'
import Button from '../components/ui/Button'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { getCompanyColor } from '../data/companies'

interface EditingWithdrawal {
  withdrawalId: string
  accountId: string
  amount: number
  date: string
  note: string
}

export default function Informes() {
  const { currentUser, hideValues, updateWithdrawal, deleteWithdrawal } = useAppStore()
  const [editing, setEditing]       = useState<EditingWithdrawal | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null) // withdrawalId
  if (!currentUser) return null

  const cssVar = (v: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim()
  const border  = cssVar('--color-border')  || '#2D2D4E'
  const muted   = cssVar('--color-muted')   || '#8888AA'
  const surface = cssVar('--color-surface') || '#1A1A2E'
  const text    = cssVar('--color-text')    || '#F8F8FF'
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

  function startEdit(accountId: string, w: { id: string; amount: number; date: string; note?: string }) {
    setEditing({ withdrawalId: w.id, accountId, amount: w.amount, date: w.date.slice(0, 10), note: w.note ?? '' })
  }

  function saveEdit() {
    if (!editing) return
    updateWithdrawal(editing.accountId, editing.withdrawalId, {
      amount: editing.amount,
      date:   new Date(editing.date).toISOString(),
      note:   editing.note || undefined,
    })
    setEditing(null)
  }

  function confirmAndDelete(accountId: string, withdrawalId: string) {
    deleteWithdrawal(accountId, withdrawalId)
    setConfirmDelete(null)
  }

  return (
    <div className="p-6 space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Informes</h1>
          <p className="text-sm text-muted mt-0.5">Análisis avanzado de tu rendimiento</p>
        </div>
        <Button variant="secondary" onClick={exportCSV}>
          <Download size={16} /> Exportar CSV
        </Button>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Bar chart */}
        <div className="bg-surface border border-border rounded-2xl p-5">
          <h3 className="font-semibold text-text mb-4 text-sm">Gastos vs Retiros por Empresa</h3>
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
          ) : <p className="text-muted text-sm py-10 text-center">Sin datos suficientes</p>}
        </div>

        {/* Pie chart */}
        <div className="bg-surface border border-border rounded-2xl p-5">
          <h3 className="font-semibold text-text mb-4 text-sm">Distribución de Gastos</h3>
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
          ) : <p className="text-muted text-sm py-10 text-center">Sin datos suficientes</p>}
        </div>
      </div>

      {/* Resumen estadístico */}
      <div className="bg-surface border border-border rounded-2xl p-5">
        <h3 className="font-semibold text-text mb-4 text-sm">Resumen Estadístico</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total cuentas', value: accounts.length },
            { label: 'Cuentas activas', value: accounts.filter(a => a.status === 'activa').length },
            { label: 'Evaluaciones fallidas', value: accounts.filter(a => a.status === 'fallida').length },
            { label: 'Cuentas live', value: accounts.filter(a => a.type === 'live').length },
          ].map(({ label, value }) => (
            <div key={label} className="text-center p-4 bg-bg rounded-xl">
              <div className="text-2xl font-bold text-text">{value}</div>
              <div className="text-xs text-muted mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Historial de retiros */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <h3 className="font-semibold text-text text-sm">Historial de Retiros</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['FECHA', 'CUENTA', 'EMPRESA', 'CANTIDAD', 'NOTA', ''].map((h, i) => (
                  <th key={i} className="text-left text-xs font-medium text-muted px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {accounts
                .flatMap(a => a.withdrawalsList.map(w => ({ ...w, accountId: a.id, accountName: a.name, company: a.company })))
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map(w => {
                  const isEditing = editing?.withdrawalId === w.id
                  const isConfirming = confirmDelete === w.id

                  if (isEditing) {
                    return (
                      <tr key={w.id} className="border-b border-border bg-[#7C3AED]/5">
                        {/* Fecha editable */}
                        <td className="px-3 py-2">
                          <input
                            type="date"
                            value={editing.date}
                            onChange={e => setEditing({ ...editing, date: e.target.value })}
                            className="bg-bg border border-[#7C3AED]/50 rounded-lg px-2 py-1.5 text-xs text-text outline-none focus:border-[#7C3AED] w-32"
                          />
                        </td>
                        {/* Cuenta (no editable) */}
                        <td className="px-5 py-2 font-mono text-xs text-muted">{w.accountName}</td>
                        {/* Empresa (no editable) */}
                        <td className="px-5 py-2 text-muted text-xs">{w.company}</td>
                        {/* Cantidad editable */}
                        <td className="px-3 py-2">
                          <div className="flex items-center bg-bg border border-[#7C3AED]/50 rounded-lg overflow-hidden focus-within:border-[#7C3AED]">
                            <span className="px-2 text-muted text-xs border-r border-border">€</span>
                            <input
                              type="number"
                              min={0}
                              step={0.01}
                              value={editing.amount}
                              onChange={e => setEditing({ ...editing, amount: Number(e.target.value) })}
                              className="bg-transparent px-2 py-1.5 text-xs text-text outline-none w-24"
                            />
                          </div>
                        </td>
                        {/* Nota editable */}
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            placeholder="Nota opcional"
                            value={editing.note}
                            onChange={e => setEditing({ ...editing, note: e.target.value })}
                            className="bg-bg border border-[#7C3AED]/50 rounded-lg px-2 py-1.5 text-xs text-text outline-none focus:border-[#7C3AED] w-36"
                          />
                        </td>
                        {/* Acciones guardar / cancelar */}
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={saveEdit}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E] rounded-lg text-xs hover:bg-[#22C55E]/25 transition-colors"
                            >
                              <Check size={12} /> Guardar
                            </button>
                            <button
                              onClick={() => setEditing(null)}
                              className="p-1.5 text-muted hover:text-text transition-colors rounded-lg hover:bg-surface2"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  }

                  return (
                    <tr key={w.id} className="border-b border-border hover:bg-surface2/50 group">
                      <td className="px-5 py-3 text-muted text-xs whitespace-nowrap">{new Date(w.date).toLocaleDateString('es-ES')}</td>
                      <td className="px-5 py-3 font-mono text-xs text-text">{w.accountName}</td>
                      <td className="px-5 py-3 text-muted text-xs">{w.company}</td>
                      <td className="px-5 py-3 font-semibold text-[#22C55E]">{fmt(w.amount)}</td>
                      <td className="px-5 py-3 text-muted text-xs max-w-[160px] truncate">{w.note ?? '—'}</td>
                      <td className="px-4 py-3">
                        {isConfirming ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-[#EF4444] whitespace-nowrap">¿Eliminar?</span>
                            <button
                              onClick={() => confirmAndDelete(w.accountId, w.id)}
                              className="px-2 py-1 bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] rounded-lg text-xs hover:bg-[#EF4444]/25 transition-colors"
                            >Sí</button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="px-2 py-1 bg-surface2 text-muted rounded-lg text-xs hover:text-text transition-colors"
                            >No</button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => startEdit(w.accountId, w)}
                              title="Editar"
                              className="p-1.5 text-muted hover:text-[#7C3AED] transition-colors rounded-lg hover:bg-[#7C3AED]/10"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => setConfirmDelete(w.id)}
                              title="Eliminar"
                              className="p-1.5 text-muted hover:text-[#EF4444] transition-colors rounded-lg hover:bg-[#EF4444]/10"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              {accounts.every(a => a.withdrawalsList.length === 0) && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-muted text-sm">Sin retiros registrados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
