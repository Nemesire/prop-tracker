import { useState } from 'react'
import { Calculator, TrendingUp } from 'lucide-react'
import ProbabilidadFondeo from './calculadoras/ProbabilidadFondeo'

const TABS = [
  { id: 'fondeo', label: 'Prob. Cuentas Fondeo', icon: Calculator },
  { id: 'interes', label: 'Interés Compuesto', icon: TrendingUp, soon: true },
]

export default function Calculadora() {
  const [active, setActive] = useState('fondeo')

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex gap-1 px-6 pt-5 border-b border-border bg-surface shrink-0 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            disabled={t.soon}
            onClick={() => !t.soon && setActive(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-xl transition-colors whitespace-nowrap relative
              ${active === t.id
                ? 'bg-bg text-[#7C3AED] border-t border-x border-border -mb-px'
                : t.soon
                  ? 'text-muted cursor-not-allowed opacity-50'
                  : 'text-muted hover:text-text'
              }`}
          >
            <t.icon size={14} />
            {t.label}
            {t.soon && (
              <span className="text-[9px] px-1 py-0.5 bg-[#F59E0B]/20 text-[#F59E0B] rounded font-bold">PRÓXIMO</span>
            )}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto bg-bg">
        {active === 'fondeo' && <ProbabilidadFondeo />}
      </div>
    </div>
  )
}
