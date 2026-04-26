interface Props {
  name: string
  src?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  level?: number
}

const sizes = { xs: 'w-6 h-6 text-xs', sm: 'w-8 h-8 text-sm', md: 'w-10 h-10 text-base', lg: 'w-14 h-14 text-lg', xl: 'w-20 h-20 text-2xl' }

const COLORS = ['#7C3AED', '#3B82F6', '#EC4899', '#10B981', '#F59E0B', '#EF4444', '#06B6D4']

function getColor(name: string): string {
  let hash = 0
  for (const c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}

export default function Avatar({ name, src, size = 'md', level }: Props) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const color = getColor(name)

  return (
    <div className={`relative inline-flex flex-shrink-0 ${sizes[size]}`}>
      {src ? (
        <img src={src} alt={name} className={`${sizes[size]} rounded-full object-cover`} />
      ) : (
        <div
          className={`${sizes[size]} rounded-full flex items-center justify-center font-bold text-white`}
          style={{ background: `linear-gradient(135deg, ${color}, ${color}99)` }}
        >
          {initials}
        </div>
      )}
      {level !== undefined && (
        <span className="absolute -bottom-1 -right-1 bg-[#7C3AED] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-[#0F0F1A]">
          {level}
        </span>
      )}
    </div>
  )
}
