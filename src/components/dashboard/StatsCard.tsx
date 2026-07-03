import { useState, type ReactNode } from 'react'

interface Props {
  title: string
  value: string
  subtitle?: string
  icon: ReactNode
  color?: string
  trend?: { label: string; positive?: boolean }
  tooltip?: string
}

export default function StatsCard({ title, value, subtitle, icon, color = '#7C3AED', trend, tooltip }: Props) {
  const [tipVisible, setTipVisible] = useState(false)

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 hover:border-[#7C3AED]/30 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
          <span style={{ color }}>{icon}</span>
        </div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${trend.positive !== false ? 'text-[#22C55E] bg-[#22C55E]/10' : 'text-[#EF4444] bg-[#EF4444]/10'}`}>
            {trend.label}
          </span>
        )}
      </div>
      <div>
        <div className="text-2xl font-bold text-text mb-1">{value}</div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-muted">{title}</span>
          {tooltip && (
            <span className="relative">
              <span
                onMouseEnter={() => setTipVisible(true)}
                onMouseLeave={() => setTipVisible(false)}
                onClick={() => setTipVisible(v => !v)}
                className="w-4 h-4 rounded-full bg-surface2 border border-border text-muted text-[10px] font-bold flex items-center justify-center cursor-help select-none hover:border-[#7C3AED]/60 hover:text-[#7C3AED] transition-colors"
              >?</span>
              {tipVisible && (
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-surface border border-border rounded-xl px-3 py-2 text-xs text-text shadow-lg z-50 leading-relaxed pointer-events-none">
                  {tooltip}
                  <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-border" />
                </span>
              )}
            </span>
          )}
        </div>
        {subtitle && <div className="text-xs text-muted mt-0.5 opacity-70">{subtitle}</div>}
      </div>
    </div>
  )
}
