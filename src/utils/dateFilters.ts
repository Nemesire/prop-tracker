import type { DateRange } from '../types'

export const DATE_PRESETS: { id: DateRange['preset']; label: string }[] = [
  { id: 'thisMonth', label: 'Este mes' },
  { id: 'thisQuarter', label: 'Este trimestre' },
  { id: 'lastQuarter', label: 'Trimestre anterior' },
  { id: 'thisYear', label: 'Este año' },
  { id: 'lastYear', label: 'Año pasado' },
  { id: 'allTime', label: 'Todo el tiempo' },
]

export function getPresetRange(preset: DateRange['preset']): { from: Date; to: Date } {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()

  switch (preset) {
    case 'thisMonth':
      return { from: new Date(y, m, 1), to: new Date(y, m + 1, 0) }
    case 'thisQuarter': {
      const q = Math.floor(m / 3)
      return { from: new Date(y, q * 3, 1), to: new Date(y, q * 3 + 3, 0) }
    }
    case 'lastQuarter': {
      const q = Math.floor(m / 3) - 1
      const yr = q < 0 ? y - 1 : y
      const qn = q < 0 ? 3 : q
      return { from: new Date(yr, qn * 3, 1), to: new Date(yr, qn * 3 + 3, 0) }
    }
    case 'thisYear':
      return { from: new Date(y, 0, 1), to: new Date(y, 11, 31) }
    case 'lastYear':
      return { from: new Date(y - 1, 0, 1), to: new Date(y - 1, 11, 31) }
    case 'allTime':
    default:
      return { from: new Date(2020, 0, 1), to: new Date(y + 1, 11, 31) }
  }
}

export function formatDateRange(range: DateRange): string {
  if (range.preset && range.preset !== 'custom') {
    return DATE_PRESETS.find(p => p.id === range.preset)?.label ?? ''
  }
  const fmt = (d: Date | null) => d
    ? d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
    : '?'
  return `${fmt(range.from)} – ${fmt(range.to)}`
}

export function getDefaultRange(): DateRange {
  return { from: new Date(new Date().getFullYear(), 0, 1), to: new Date(), preset: 'thisYear' }
}
