import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { COMPANIES } from '../../data/companies'
import { useAppStore } from '../../store/useAppStore'
import type { Account } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
  account?: Account
}

const SIZES = [10000, 25000, 50000, 100000, 150000, 200000, 300000]

export default function CuentaModal({ open, onClose, account }: Props) {
  const { addAccount, updateAccount } = useAppStore()

  const [form, setForm] = useState({
    name: account?.name ?? '',
    type: account?.type ?? 'evaluacion',
    status: account?.status ?? 'activa',
    company: account?.company ?? 'FTMO',
    size: account?.size ?? 100000,
    cost: account?.cost ?? 0,
    startDate: account?.startDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    notes: account?.notes ?? '',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const data = {
      ...form,
      size: Number(form.size),
      cost: Number(form.cost),
      earnings: account?.earnings ?? 0,
      withdrawals: account?.withdrawals ?? 0,
    }
    if (account) {
      updateAccount(account.id, data)
    } else {
      addAccount(data as Parameters<typeof addAccount>[0])
    }
    onClose()
  }

  const inputCls = 'w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:border-[#7C3AED] transition-colors'
  const labelCls = 'block text-xs font-medium text-[var(--muted)] mb-1.5'

  return (
    <Modal open={open} onClose={onClose} title={account ? 'Editar Cuenta' : 'Nueva Cuenta'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelCls}>Nombre / ID de la cuenta</label>
            <input className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="ej. FTMO-XK998821" />
          </div>

          <div>
            <label className={labelCls}>Tipo</label>
            <select className={inputCls} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as 'evaluacion' | 'live' }))}>
              <option value="evaluacion">Evaluación</option>
              <option value="live">Live</option>
            </select>
          </div>

          <div>
            <label className={labelCls}>Estado</label>
            <select className={inputCls} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Account['status'] }))}>
              <option value="activa">Activa</option>
              <option value="suspendida">Suspendida</option>
              <option value="completada">Completada</option>
              <option value="fallida">Fallida</option>
            </select>
          </div>

          <div>
            <label className={labelCls}>Empresa</label>
            <select className={inputCls} value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))}>
              {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className={labelCls}>Tamaño de la cuenta</label>
            <select className={inputCls} value={form.size} onChange={e => setForm(f => ({ ...f, size: Number(e.target.value) }))}>
              {SIZES.map(s => <option key={s} value={s}>€{s.toLocaleString()}</option>)}
            </select>
          </div>

          <div>
            <label className={labelCls}>Precio pagado (€)</label>
            <input type="number" min="0" step="0.01" className={inputCls} value={form.cost} onChange={e => setForm(f => ({ ...f, cost: Number(e.target.value) }))} required />
          </div>

          <div>
            <label className={labelCls}>Fecha de inicio</label>
            <input type="date" className={inputCls} value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} required />
          </div>

          <div className="col-span-2">
            <label className={labelCls}>Notas (opcional)</label>
            <textarea rows={2} className={inputCls + ' resize-none'} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Estrategia, objetivos..." />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1 justify-center">Cancelar</Button>
          <Button type="submit" className="flex-1 justify-center">{account ? 'Guardar cambios' : 'Añadir cuenta'}</Button>
        </div>
      </form>
    </Modal>
  )
}
