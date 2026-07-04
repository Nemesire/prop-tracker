import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import Modal from '../ui/Modal'
import { useAppStore } from '../../store/useAppStore'
import type { Account } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
  account: Account
}

export default function ResetearModal({ open, onClose, account }: Props) {
  const { resetAccount } = useAppStore()
  const [price, setPrice] = useState('')
  const [date,  setDate]  = useState(new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const resetCost = Number(price) || 0
    try {
      await resetAccount(account.id, resetCost, date)
      onClose()
      setPrice('')
      setDate(new Date().toISOString().slice(0, 10))
    } catch (err) {
      setError((err as Error).message || 'No se pudo resetear la cuenta. Inténtalo de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm text-text focus:outline-none focus:border-[#F97316] transition-colors'
  const labelCls = 'block text-xs font-medium text-muted mb-1.5'

  return (
    <Modal open={open} onClose={onClose} title="Resetear Cuenta">
      <p className="text-xs text-muted -mt-1 mb-5">Resetea la cuenta y registra el costo</p>
      <form onSubmit={handleReset} className="space-y-4">
        {/* Nombre (solo lectura) */}
        <div>
          <label className={labelCls}>Nombre</label>
          <input
            readOnly
            value={account.name}
            className={inputCls + ' opacity-60 cursor-default'}
          />
        </div>

        {/* Precio del reset */}
        <div>
          <label className={labelCls}>Precio del Reset</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">€</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={price}
              onChange={e => setPrice(e.target.value)}
              className={inputCls + ' pl-7'}
              autoFocus
            />
          </div>
        </div>

        {/* Fecha */}
        <div>
          <label className={labelCls}>Fecha</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className={inputCls}
            required
          />
        </div>

        {error && (
          <p className="text-xs text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted hover:text-text hover:border-[#F97316]/50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#F97316] text-white text-sm font-semibold hover:bg-[#EA6C0A] transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={saving ? 'animate-spin' : ''} /> {saving ? 'Reseteando...' : 'Resetear'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
