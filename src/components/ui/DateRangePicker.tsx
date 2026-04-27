import { useState } from 'react'
import { Calendar, ChevronDown, X } from 'lucide-react'
import type { DateRange } from '../../types'
import { DATE_PRESETS, formatDateRange, getPresetRange } from '../../utils/dateFilters'
import Button from './Button'

interface Props {
  value: DateRange
  onChange: (range: DateRange) => void
}

export default function DateRangePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [fromStr, setFromStr] = useState('')
  const [toStr, setToStr] = useState('')

  function selectPreset(preset: DateRange['preset']) {
    if (!preset || preset === 'custom') return
    const { from, to } = getPresetRange(preset)
    onChange({ from, to, preset })
    setOpen(false)
  }

  function applyCustom() {
    const from = fromStr ? new Date(fromStr) : null
    const to = toStr ? new Date(toStr) : null
    onChange({ from, to, preset: 'custom' })
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-xl text-sm text-text hover:border-[#7C3AED]/50 transition-colors"
      >
        <Calendar size={14} className="text-[#7C3AED]" />
        <span>{formatDateRange(value)}</span>
        <ChevronDown size={14} className="text-muted" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-72 bg-surface border border-border rounded-2xl shadow-2xl fade-in overflow-hidden">
            <div className="p-1">
              {DATE_PRESETS.map(p => (
                <button
                  key={p.id}
                  onClick={() => selectPreset(p.id)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-colors ${value.preset === p.id ? 'bg-[#7C3AED]/20 text-[#7C3AED]' : 'text-text hover:bg-surface2'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="border-t border-border p-4">
              <p className="text-xs text-muted mb-3">Rango personalizado</p>
              <div className="space-y-2 mb-3">
                <input
                  type="date"
                  value={fromStr}
                  onChange={e => setFromStr(e.target.value)}
                  placeholder="dd/mm/aaaa"
                  className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-[#7C3AED]"
                />
                <input
                  type="date"
                  value={toStr}
                  onChange={e => setToStr(e.target.value)}
                  className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-[#7C3AED]"
                />
              </div>
              <Button className="w-full justify-center" onClick={applyCustom}>Aplicar</Button>
              <button
                onClick={() => { onChange({ from: null, to: null, preset: 'allTime' }); setOpen(false) }}
                className="w-full mt-2 text-center text-sm text-[#EF4444] hover:text-red-300 py-1"
              >
                <span className="flex items-center justify-center gap-1"><X size={12} />Limpiar filtro</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
