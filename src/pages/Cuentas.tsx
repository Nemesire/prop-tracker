import { useState, useMemo } from 'react'
import { Plus, Search } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import CuentaRow from '../components/cuentas/CuentaRow'
import CuentaModal from '../components/cuentas/CuentaModal'
import Button from '../components/ui/Button'
import type { AccountType, AccountStatus } from '../types'

type TypeFilter = 'all' | AccountType
type StatusFilter = 'all' | AccountStatus

export default function Cuentas() {
  const { currentUser } = useAppStore()
  const [newOpen, setNewOpen] = useState(false)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('activa')
  const [companyFilter, setCompanyFilter] = useState('all')
  const [search, setSearch] = useState('')

  const accounts = currentUser?.accounts ?? []

  const filtered = useMemo(() => {
    return accounts.filter(a => {
      if (typeFilter !== 'all' && a.type !== typeFilter) return false
      if (statusFilter !== 'all' && a.status !== statusFilter) return false
      if (companyFilter !== 'all' && a.company !== companyFilter) return false
      if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.company.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [accounts, typeFilter, statusFilter, companyFilter, search])

  const companies = [...new Set(accounts.map(a => a.company))]

  const filterBtnCls = (active: boolean) =>
    `px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${active ? 'bg-[#7C3AED] text-white' : 'bg-[#1A1A2E] border border-[#2D2D4E] text-[#8888AA] hover:text-[#F8F8FF]'}`

  return (
    <div className="p-6 space-y-5 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#F8F8FF]">Cuentas</h1>
          <p className="text-sm text-[#8888AA] mt-0.5">Gestiona tus cuentas de fondeo</p>
        </div>
        <Button onClick={() => setNewOpen(true)}>
          <Plus size={16} /> Nueva Cuenta
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[#8888AA] uppercase tracking-wide">TIPO:</span>
          <div className="flex gap-1.5">
            {(['all', 'evaluacion', 'live'] as const).map(t => (
              <button key={t} onClick={() => setTypeFilter(t)} className={filterBtnCls(typeFilter === t)}>
                {t === 'all' ? 'Todas' : t === 'evaluacion' ? 'Evaluación' : 'Live'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[#8888AA] uppercase tracking-wide">ESTADO:</span>
          <div className="flex gap-1.5">
            {(['all', 'activa', 'suspendida'] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} className={filterBtnCls(statusFilter === s)}>
                {s === 'all' ? 'Todos' : s === 'activa' ? 'Activas' : 'Suspendidas'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[#8888AA] uppercase tracking-wide">EMPRESA:</span>
          <select
            value={companyFilter}
            onChange={e => setCompanyFilter(e.target.value)}
            className="bg-[#1A1A2E] border border-[#2D2D4E] rounded-xl px-3 py-1.5 text-sm text-[#F8F8FF] focus:outline-none focus:border-[#7C3AED]"
          >
            <option value="all">Todas</option>
            {companies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="ml-auto relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8888AA]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar cuenta..."
            className="pl-9 pr-3 py-1.5 bg-[#1A1A2E] border border-[#2D2D4E] rounded-xl text-sm text-[#F8F8FF] placeholder:text-[#8888AA] focus:outline-none focus:border-[#7C3AED] w-48"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#1A1A2E] border border-[#2D2D4E] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2D2D4E]">
                {['NOMBRE', 'TIPO', 'ESTADO', 'EMPRESA', 'GASTOS', 'GANANCIAS', 'BENEFICIO', 'ACCIONES'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-[#8888AA] px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(acc => <CuentaRow key={acc.id} account={acc} />)}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center">
                    <div className="text-4xl mb-3">📋</div>
                    <p className="text-[#8888AA]">No hay cuentas con estos filtros</p>
                    <Button className="mt-4" size="sm" onClick={() => setNewOpen(true)}>
                      <Plus size={14} /> Añadir primera cuenta
                    </Button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-[#2D2D4E] text-xs text-[#8888AA]">
            Mostrando {filtered.length} de {accounts.length} cuentas
          </div>
        )}
      </div>

      <CuentaModal open={newOpen} onClose={() => setNewOpen(false)} />
    </div>
  )
}
