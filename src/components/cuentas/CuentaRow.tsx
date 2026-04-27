import { useState } from 'react'
import { RefreshCw, Check, Ban, Pencil, DollarSign } from 'lucide-react'
import type { Account } from '../../types'
import { formatCurrency } from '../../utils/calculations'
import { useAppStore } from '../../store/useAppStore'
import CuentaModal from './CuentaModal'
import WithdrawalModal from './WithdrawalModal'

interface Props { account: Account }

const TYPE_STYLES: Record<string, string> = {
  evaluacion: 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30',
  live: 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30',
}
const STATUS_STYLES: Record<string, string> = {
  activa: 'bg-[#22C55E]/15 text-[#22C55E]',
  suspendida: 'bg-[#EF4444]/15 text-[#EF4444]',
  completada: 'bg-[#3B82F6]/15 text-[#3B82F6]',
  fallida: 'bg-[#6B7280]/15 text-[#6B7280]',
}
const STATUS_LABELS: Record<string, string> = {
  activa: 'Activa', suspendida: 'Suspendida', completada: 'Completada', fallida: 'Fallida',
}

export default function CuentaRow({ account: acc }: Props) {
  const { approveEvaluation, updateAccount } = useAppStore()
  const [editOpen, setEditOpen] = useState(false)
  const [withdrawOpen, setWithdrawOpen] = useState(false)

  const benefit = acc.withdrawals - acc.cost

  return (
    <>
      <tr className="border-b border-border hover:bg-surface2/40 transition-colors group">
        <td className="px-5 py-4">
          <span className="font-mono text-sm text-text">{acc.name}</span>
        </td>
        <td className="px-5 py-4">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${TYPE_STYLES[acc.type]}`}>
            {acc.type === 'evaluacion' ? 'Evaluación' : 'Live'}
          </span>
        </td>
        <td className="px-5 py-4">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[acc.status]}`}>
            {STATUS_LABELS[acc.status]}
          </span>
        </td>
        <td className="px-5 py-4 text-sm text-muted">{acc.company}</td>
        <td className="px-5 py-4 text-sm text-[#EF4444]">{formatCurrency(acc.cost)}</td>
        <td className="px-5 py-4 text-sm text-[#22C55E]">{formatCurrency(acc.withdrawals)}</td>
        <td className={`px-5 py-4 text-sm font-medium ${benefit >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
          {formatCurrency(benefit)}
        </td>
        <td className="px-5 py-4">
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {acc.type === 'evaluacion' && acc.status === 'activa' && (
              <button title="Renovar" onClick={() => updateAccount(acc.id, { cost: acc.cost })} className="p-1.5 rounded-lg hover:bg-surface2 text-muted hover:text-text transition-colors">
                <RefreshCw size={14} />
              </button>
            )}
            {acc.type === 'evaluacion' && acc.status === 'activa' && (
              <button title="Aprobar evaluación → Live" onClick={() => approveEvaluation(acc.id)} className="p-1.5 rounded-lg hover:bg-surface2 text-muted hover:text-[#22C55E] transition-colors">
                <Check size={14} />
              </button>
            )}
            {acc.type === 'live' && acc.status === 'activa' && (
              <button title="Registrar retiro" onClick={() => setWithdrawOpen(true)} className="p-1.5 rounded-lg hover:bg-surface2 text-muted hover:text-[#22C55E] transition-colors">
                <DollarSign size={14} />
              </button>
            )}
            <button title="Suspender" onClick={() => updateAccount(acc.id, { status: 'suspendida' })} className="p-1.5 rounded-lg hover:bg-surface2 text-muted hover:text-[#EF4444] transition-colors">
              <Ban size={14} />
            </button>
            <button title="Editar" onClick={() => setEditOpen(true)} className="p-1.5 rounded-lg hover:bg-surface2 text-muted hover:text-text transition-colors">
              <Pencil size={14} />
            </button>
          </div>
        </td>
      </tr>
      <CuentaModal open={editOpen} onClose={() => setEditOpen(false)} account={acc} />
      {withdrawOpen && <WithdrawalModal open={withdrawOpen} onClose={() => setWithdrawOpen(false)} account={acc} />}
    </>
  )
}
