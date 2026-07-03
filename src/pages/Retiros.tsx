import { useState, useMemo } from 'react'
import { DollarSign, TrendingUp, Hash, Calendar, Search, Download, Pencil, Trash2, X, Check, ChevronUp, ChevronDown } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { formatCurrency } from '../utils/calculations'
import { getCompanyColor } from '../data/companies'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

type SortKey = 'date' | 'amount' | 'account' | 'company'
type SortDir = 'asc' | 'desc'

interface FlatWithdrawal {
  id:         string
  accountId:  string
  accountName:string
  company:    string
  amount:     number
  date:       string
  note?:      string
}

function fmtDateES(iso: string) {
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yy = String(d.getFullYear()).slice(2)
  return `${dd}/${mm}/${yy}`
}

function fmtDateInput(iso: string) {
  return iso.slice(0, 10)
}

interface StatCardProps {
  icon: React.ReactNode
  title: string
  value: string
  sub?: string
  color: string
}
function StatCard({ icon, title, value, sub, color }: StatCardProps) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}20` }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted">{title}</p>
        <p className="text-xl font-black text-text leading-none mt-0.5">{value}</p>
        {sub && <p className="text-xs text-muted mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function Retiros() {
  const { currentUser, hideValues, updateWithdrawal, deleteWithdrawal } = useAppStore()

  const [search,      setSearch]      = useState('')
  const [company,     setCompany]     = useState('all')
  const [account,     setAccount]     = useState('all')
  const [fromDate,    setFromDate]    = useState('')
  const [toDate,      setToDate]      = useState('')
  const [sortKey,     setSortKey]     = useState<SortKey>('date')
  const [sortDir,     setSortDir]     = useState<SortDir>('desc')
  const [editingId,   setEditingId]   = useState<string | null>(null)
  const [editForm,    setEditForm]    = useState({ amount: 0, date: '', note: '' })
  const [confirmDel,  setConfirmDel]  = useState<string | null>(null)

  if (!currentUser) return null

  const fmt = (n: number) => formatCurrency(n, hideValues)

  /* ── Flatten todos los retiros ─────────────────────────────── */
  const allWithdrawals: FlatWithdrawal[] = useMemo(() =>
    currentUser.accounts.flatMap(a =>
      a.withdrawalsList.map(w => ({
        id:          w.id,
        accountId:   a.id,
        accountName: a.name,
        company:     a.company,
        amount:      w.amount,
        date:        w.date,
        note:        w.note,
      }))
    ),
    [currentUser.accounts]
  )

  const companies = [...new Set(allWithdrawals.map(w => w.company))].sort()
  const accounts  = [...new Set(allWithdrawals.map(w => w.accountName))].sort()

  /* ── Filtrado ─────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = allWithdrawals
    if (search)        list = list.filter(w => w.accountName.toLowerCase().includes(search.toLowerCase()) || w.company.toLowerCase().includes(search.toLowerCase()) || (w.note ?? '').toLowerCase().includes(search.toLowerCase()))
    if (company !== 'all') list = list.filter(w => w.company === company)
    if (account !== 'all') list = list.filter(w => w.accountName === account)
    if (fromDate)      list = list.filter(w => w.date >= fromDate)
    if (toDate)        list = list.filter(w => w.date <= toDate + 'T23:59:59')
    return list
  }, [allWithdrawals, search, company, account, fromDate, toDate])

  /* ── Ordenado ─────────────────────────────────────────────── */
  const sorted = useMemo(() => {
    const copy = [...filtered]
    copy.sort((a, b) => {
      let cmp = 0
      if (sortKey === 'date')    cmp = a.date.localeCompare(b.date)
      if (sortKey === 'amount')  cmp = a.amount - b.amount
      if (sortKey === 'account') cmp = a.accountName.localeCompare(b.accountName)
      if (sortKey === 'company') cmp = a.company.localeCompare(b.company)
      return sortDir === 'asc' ? cmp : -cmp
    })
    return copy
  }, [filtered, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  /* ── Stats ────────────────────────────────────────────────── */
  const totalAmount = filtered.reduce((s, w) => s + w.amount, 0)
  const count       = filtered.length
  const avgAmount   = count > 0 ? totalAmount / count : 0
  const lastDate    = sorted.length > 0 ? sorted[0]?.date : null

  /* ── Gráfico mensual ──────────────────────────────────────── */
  const chartData = useMemo(() => {
    const byMonth: Record<string, number> = {}
    filtered.forEach(w => {
      const key = w.date.slice(0, 7) // YYYY-MM
      byMonth[key] = (byMonth[key] ?? 0) + w.amount
    })
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => {
        const [y, m] = month.split('-')
        const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
        return { label: `${MESES[Number(m) - 1]} ${y.slice(2)}`, total }
      })
  }, [filtered])

  /* ── Editar ───────────────────────────────────────────────── */
  function startEdit(w: FlatWithdrawal) {
    setEditingId(w.id)
    setEditForm({ amount: w.amount, date: fmtDateInput(w.date), note: w.note ?? '' })
    setConfirmDel(null)
  }
  function saveEdit(w: FlatWithdrawal) {
    updateWithdrawal(w.accountId, w.id, { amount: Number(editForm.amount), date: editForm.date, note: editForm.note || undefined })
    setEditingId(null)
  }
  function doDelete(w: FlatWithdrawal) {
    deleteWithdrawal(w.accountId, w.id)
    setConfirmDel(null)
  }

  /* ── CSV export ───────────────────────────────────────────── */
  function exportCSV() {
    const head = 'Fecha,Cuenta,Empresa,Cantidad,Nota\n'
    const rows = sorted.map(w =>
      `"${fmtDateES(w.date)}","${w.accountName}","${w.company}","${w.amount}","${w.note ?? ''}"`
    ).join('\n')
    const blob = new Blob([head + rows], { type: 'text/csv;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `retiros-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const inputCls = 'bg-bg border border-border rounded-xl px-3 py-2 text-sm text-text focus:outline-none focus:border-[#22C55E] transition-colors'

  const SortIcon = ({ col }: { col: SortKey }) => (
    sortKey === col
      ? sortDir === 'desc' ? <ChevronDown size={12} className="inline ml-0.5 text-[#22C55E]" /> : <ChevronUp size={12} className="inline ml-0.5 text-[#22C55E]" />
      : <ChevronDown size={12} className="inline ml-0.5 opacity-20" />
  )

  const cssVar = (v: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim()

  return (
    <div className="p-6 space-y-6 fade-in">

      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text">Retiros</h1>
          <p className="text-sm text-muted mt-0.5">Historial completo de todos tus retiros</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-muted hover:text-[#22C55E] hover:border-[#22C55E]/40 transition-colors"
        >
          <Download size={15} /> Exportar CSV
        </button>
      </div>

      {/* ── Stats ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<DollarSign size={20} />}  title="Total Retirado"     value={fmt(totalAmount)} color="#22C55E" sub={`${count} retiro${count !== 1 ? 's' : ''}`} />
        <StatCard icon={<Hash size={20} />}         title="Nº de Retiros"      value={String(count)}    color="#3B82F6" sub="en el período filtrado" />
        <StatCard icon={<TrendingUp size={20} />}   title="Promedio por Retiro" value={fmt(avgAmount)}  color="#F59E0B" sub="cantidad media" />
        <StatCard icon={<Calendar size={20} />}     title="Último Retiro"       value={lastDate ? fmtDateES(lastDate) : '—'} color="#8B5CF6" sub={sorted[0]?.company ?? ''} />
      </div>

      {/* ── Gráfico mensual ───────────────────────────────── */}
      {chartData.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl p-5">
          <h2 className="font-semibold text-text mb-1">Retiros por Mes</h2>
          <p className="text-xs text-muted mb-5">Evolución mensual de los importes retirados</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#22C55E" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={cssVar('--color-border') || '#2D2D4E'} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: cssVar('--color-muted') || '#8888AA' }} axisLine={{ stroke: '#9CA3AF', strokeWidth: 2 }} tickLine={{ stroke: '#9CA3AF' }} />
              <YAxis tick={{ fontSize: 11, fill: cssVar('--color-muted') || '#8888AA' }} axisLine={{ stroke: '#9CA3AF', strokeWidth: 2 }} tickLine={{ stroke: '#9CA3AF' }} tickFormatter={v => `€${v}`} />
              <Tooltip
                contentStyle={{ background: cssVar('--color-surface') || '#1A1A2E', border: `1px solid ${cssVar('--color-border') || '#2D2D4E'}`, borderRadius: 12 }}
                labelStyle={{ color: cssVar('--color-text') || '#F8F8FF', fontSize: 12, fontWeight: 600 }}
                formatter={(v: unknown) => [`€${Number(v).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, 'Total']}
              />
              <Area type="monotone" dataKey="total" stroke="#22C55E" strokeWidth={2} fill="url(#retGrad)" dot={{ r: 3, fill: '#22C55E' }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Filtros ───────────────────────────────────────── */}
      <div className="bg-surface border border-border rounded-2xl p-4 flex flex-wrap items-center gap-3">
        {/* Búsqueda */}
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar cuenta, empresa, nota…"
            className={inputCls + ' pl-8 w-full'}
          />
        </div>

        {/* Empresa */}
        <select value={company} onChange={e => setCompany(e.target.value)} className={inputCls}>
          <option value="all">Todas las empresas</option>
          {companies.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Cuenta */}
        <select value={account} onChange={e => setAccount(e.target.value)} className={inputCls + ' max-w-[200px] truncate'}>
          <option value="all">Todas las cuentas</option>
          {accounts.map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        {/* Rango fechas */}
        <div className="flex items-center gap-2">
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className={inputCls} title="Desde" />
          <span className="text-muted text-sm">—</span>
          <input type="date" value={toDate}   onChange={e => setToDate(e.target.value)}   className={inputCls} title="Hasta" />
        </div>

        {/* Reset filtros */}
        {(search || company !== 'all' || account !== 'all' || fromDate || toDate) && (
          <button
            onClick={() => { setSearch(''); setCompany('all'); setAccount('all'); setFromDate(''); setToDate('') }}
            className="flex items-center gap-1.5 text-xs text-muted hover:text-[#EF4444] transition-colors"
          >
            <X size={13} /> Limpiar
          </button>
        )}
      </div>

      {/* ── Tabla ─────────────────────────────────────────── */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        {sorted.length === 0 ? (
          <div className="py-16 text-center text-muted">
            <DollarSign size={36} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">No hay retiros con estos filtros</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {([
                      { key: 'date',    label: 'FECHA' },
                      { key: 'account', label: 'CUENTA' },
                      { key: 'company', label: 'EMPRESA' },
                      { key: 'amount',  label: 'CANTIDAD' },
                    ] as { key: SortKey; label: string }[]).map(col => (
                      <th
                        key={col.key}
                        className="text-left text-xs font-medium text-muted px-5 py-3 cursor-pointer select-none hover:text-text transition-colors"
                        onClick={() => toggleSort(col.key)}
                      >
                        {col.label}<SortIcon col={col.key} />
                      </th>
                    ))}
                    <th className="text-left text-xs font-medium text-muted px-5 py-3">NOTA</th>
                    <th className="text-left text-xs font-medium text-muted px-5 py-3">ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(w => {
                    const companyColor = getCompanyColor(w.company)
                    const isEditing   = editingId === w.id

                    return (
                      <tr key={w.id} className="border-b border-border last:border-0 hover:bg-surface2/40 transition-colors group">

                        {/* Fecha */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          {isEditing ? (
                            <input type="date" value={editForm.date} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} className="bg-bg border border-[#22C55E]/50 rounded-lg px-2 py-1 text-xs text-text outline-none w-32" />
                          ) : (
                            <span className="font-mono text-xs text-muted">{fmtDateES(w.date)}</span>
                          )}
                        </td>

                        {/* Cuenta */}
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-xs text-text">{w.accountName}</span>
                        </td>

                        {/* Empresa */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: companyColor }} />
                            <span className="text-sm text-muted">{w.company}</span>
                          </div>
                        </td>

                        {/* Cantidad */}
                        <td className="px-5 py-3.5">
                          {isEditing ? (
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted text-xs">€</span>
                              <input
                                type="number" min="0.01" step="0.01"
                                value={editForm.amount}
                                onChange={e => setEditForm(f => ({ ...f, amount: Number(e.target.value) }))}
                                className="bg-bg border border-[#22C55E]/50 rounded-lg pl-5 pr-2 py-1 text-xs text-text outline-none w-24"
                              />
                            </div>
                          ) : (
                            <span className="font-semibold text-[#22C55E]">{fmt(w.amount)}</span>
                          )}
                        </td>

                        {/* Nota */}
                        <td className="px-5 py-3.5 max-w-[200px]">
                          {isEditing ? (
                            <input
                              value={editForm.note}
                              onChange={e => setEditForm(f => ({ ...f, note: e.target.value }))}
                              className="bg-bg border border-[#22C55E]/50 rounded-lg px-2 py-1 text-xs text-text outline-none w-full"
                              placeholder="Nota…"
                            />
                          ) : (
                            <span className="text-xs text-muted truncate block">{w.note || '—'}</span>
                          )}
                        </td>

                        {/* Acciones */}
                        <td className="px-5 py-3.5">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <button onClick={() => saveEdit(w)} className="p-1.5 rounded-lg bg-[#22C55E]/10 text-[#22C55E] hover:bg-[#22C55E]/20 transition-colors" title="Guardar">
                                <Check size={13} />
                              </button>
                              <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg bg-surface2 text-muted hover:text-text transition-colors" title="Cancelar">
                                <X size={13} />
                              </button>
                            </div>
                          ) : confirmDel === w.id ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-[#EF4444] whitespace-nowrap">¿Eliminar?</span>
                              <button onClick={() => doDelete(w)} className="px-2 py-0.5 bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] rounded-lg text-xs hover:bg-[#EF4444]/25 transition-colors">Sí</button>
                              <button onClick={() => setConfirmDel(null)} className="px-2 py-0.5 bg-surface2 text-muted rounded-lg text-xs hover:text-text transition-colors">No</button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => startEdit(w)} className="p-1.5 rounded-lg text-muted hover:text-[#22C55E] hover:bg-[#22C55E]/10 transition-colors" title="Editar">
                                <Pencil size={13} />
                              </button>
                              <button onClick={() => { setConfirmDel(w.id); setEditingId(null) }} className="p-1.5 rounded-lg text-muted hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors" title="Eliminar">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted">{sorted.length} retiro{sorted.length !== 1 ? 's' : ''} mostrados</span>
              <span className="text-sm font-semibold text-[#22C55E]">Total: {fmt(totalAmount)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
