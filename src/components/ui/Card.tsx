import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
  glow?: boolean
  onClick?: () => void
}

export default function Card({ children, className = '', glow, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className={`bg-surface border border-border rounded-2xl p-5 transition-all duration-200 ${glow ? 'card-glow' : ''} ${onClick ? 'cursor-pointer hover:border-[#7C3AED]/50 hover:bg-[#1E1E38]' : ''} ${className}`}
    >
      {children}
    </div>
  )
}
