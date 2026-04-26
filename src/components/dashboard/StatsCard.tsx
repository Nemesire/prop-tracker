import type { ReactNode } from 'react'

interface Props {
  title: string
  value: string
  subtitle?: string
  icon: ReactNode
  color?: string
  trend?: { label: string; positive?: boolean }
}

export default function StatsCard({ title, value, subtitle, icon, color = '#7C3AED', trend }: Props) {
  return (
    <div className="bg-[#1A1A2E] border border-[#2D2D4E] rounded-2xl p-5 hover:border-[#7C3AED]/30 transition-all group">
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
        <div className="text-2xl font-bold text-[#F8F8FF] mb-1">{value}</div>
        <div className="text-sm text-[#8888AA]">{title}</div>
        {subtitle && <div className="text-xs text-[#8888AA] mt-0.5 opacity-70">{subtitle}</div>}
      </div>
    </div>
  )
}
