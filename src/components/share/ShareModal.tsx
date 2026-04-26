import { useState, useRef } from 'react'
import { Download, Copy, Check } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { formatCurrency, formatPercent } from '../../utils/calculations'
import { getLevelFromXp } from '../../utils/gamification'
import type { User, Account } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
  user: User
  accounts: Account[]
}

export default function ShareModal({ open, onClose, user, accounts }: Props) {
  const [copied, setCopied] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const totalWithdrawals = accounts.reduce((s, a) => s + a.withdrawals, 0)
  const totalCost = accounts.reduce((s, a) => s + a.cost, 0)
  const profit = totalWithdrawals - totalCost
  const roi = totalCost > 0 ? ((profit / totalCost) * 100) : 0
  const liveAccounts = accounts.filter(a => a.type === 'live' && a.status === 'activa').length
  const level = getLevelFromXp(user.xp)

  async function handleDownload() {
    if (!cardRef.current) return
    const { toPng } = await import('html-to-image')
    const url = await toPng(cardRef.current, { pixelRatio: 2 })
    const a = document.createElement('a')
    a.href = url
    a.download = `proptracker-${user.username}.png`
    a.click()
  }

  function handleTweet() {
    const text = encodeURIComponent(`📊 Mi rendimiento en prop firms:\n💰 Retiros: ${formatCurrency(totalWithdrawals)}\n🚀 ROI: ${formatPercent(roi)}\n📈 Cuentas Live: ${liveAccounts}\n\n¡Únete a PropTracker! 🔥 #PropFirm #Trading #PropTracker`)
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank')
  }

  async function handleCopy() {
    if (!cardRef.current) return
    const { toPng } = await import('html-to-image')
    const url = await toPng(cardRef.current, { pixelRatio: 2 })
    const blob = await (await fetch(url)).blob()
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Modal open={open} onClose={onClose} title="Compartir resultados" size="lg">
      {/* Share card preview */}
      <div
        ref={cardRef}
        className="rounded-2xl p-6 mb-5 text-white"
        style={{ background: 'linear-gradient(135deg, #1A1A2E 0%, #0F0F1A 50%, #1A0A2E 100%)' }}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#3B82F6] flex items-center justify-center text-xs font-black">PT</div>
              <span className="font-bold text-[var(--text)]">PropTracker</span>
            </div>
            <p className="text-[var(--muted)] text-xs mt-1">proptracker.community</p>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-[var(--text)]">{user.displayName}</div>
            <div className="text-xs" style={{ color: level.color }}>{level.icon} {level.name}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-xs text-[var(--muted)] mb-1">Retiros Totales</div>
            <div className="text-xl font-bold text-[#22C55E]">{formatCurrency(totalWithdrawals)}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-xs text-[var(--muted)] mb-1">ROI Total</div>
            <div className={`text-xl font-bold ${roi >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>{formatPercent(roi)}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-xs text-[var(--muted)] mb-1">Beneficio Neto</div>
            <div className={`text-xl font-bold ${profit >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>{formatCurrency(profit)}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-xs text-[var(--muted)] mb-1">Cuentas Live</div>
            <div className="text-xl font-bold text-[#7C3AED]">{liveAccounts}</div>
          </div>
        </div>

        {user.badges.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {user.badges.slice(0, 6).map(b => (
              <span key={b} className="text-lg" title={b}></span>
            ))}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-white/10 text-center">
          <p className="text-xs text-[var(--muted)]">Únete a la comunidad de prop traders 🚀</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <Button onClick={handleDownload} className="flex-1 justify-center">
          <Download size={16} /> Descargar PNG
        </Button>
        <Button variant="secondary" onClick={handleCopy} className="flex-1 justify-center">
          {copied ? <><Check size={16} /> Copiado!</> : <><Copy size={16} /> Copiar imagen</>}
        </Button>
        <Button variant="secondary" onClick={handleTweet} className="flex-1 justify-center">
          𝕏 Tweet
        </Button>
      </div>
    </Modal>
  )
}
