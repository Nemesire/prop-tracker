import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { useAppStore } from '../../store/useAppStore'
import type { Account } from '../../types'
import { formatCurrency } from '../../utils/calculations'

interface Props {
  open: boolean
  onClose: () => void
  account: Account
}

export default function WithdrawalModal({ open, onClose, account }: Props) {
  const { addWithdrawal } = useAppStore()
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) return
    addWithdrawal(account.id, Number(amount), note || undefined)
    setAmount('')
    setNote('')
    onClose()
  }

  const inputCls = 'w-full bg-[#0F0F1A] border border-[#2D2D4E] rounded-xl px-3 py-2.5 text-sm text-[#F8F8FF] focus:outline-none focus:border-[#7C3AED] transition-colors'

  return (
    <Modal open={open} onClose={onClose} title="Registrar Retiro">
      <div className="mb-4 p-3 bg-[#0F0F1A] rounded-xl border border-[#2D2D4E]">
        <p className="text-xs text-[#8888AA]">Cuenta</p>
        <p className="text-sm font-medium text-[#F8F8FF]">{account.name}</p>
        <p className="text-xs text-[#8888AA] mt-1">Retiros anteriores: <span className="text-[#22C55E]">{formatCurrency(account.withdrawals)}</span></p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[#8888AA] mb-1.5">Cantidad (€)</label>
          <input type="number" min="0.01" step="0.01" className={inputCls} value={amount} onChange={e => setAmount(e.target.value)} required placeholder="0.00" autoFocus />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#8888AA] mb-1.5">Nota (opcional)</label>
          <input className={inputCls} value={note} onChange={e => setNote(e.target.value)} placeholder="ej. Pago de octubre" />
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1 justify-center">Cancelar</Button>
          <Button type="submit" variant="success" className="flex-1 justify-center">Registrar</Button>
        </div>
      </form>
    </Modal>
  )
}
