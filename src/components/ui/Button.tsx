import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
  loading?: boolean
}

const variants = {
  primary: 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-lg shadow-purple-900/30',
  secondary: 'bg-surface2 hover:bg-border text-text border border-border',
  ghost: 'bg-transparent hover:bg-surface2 text-muted hover:text-text',
  danger: 'bg-[#EF4444] hover:bg-[#DC2626] text-white',
  success: 'bg-[#22C55E] hover:bg-[#16A34A] text-white',
}
const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
}

export default function Button({ variant = 'primary', size = 'md', children, loading, className = '', disabled, ...props }: Props) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`inline-flex items-center gap-2 font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading && (
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  )
}
