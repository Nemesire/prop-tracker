import { Trophy, Flame } from 'lucide-react'
import type { CompanyStats } from '../../types'
import { formatCurrency } from '../../utils/calculations'
import { getCompanyColor } from '../../data/companies'

interface Props {
  stats: CompanyStats[]
  hideValues?: boolean
}

export default function CompanyAnalysis({ stats, hideValues }: Props) {
  const topROI = [...stats].sort((a, b) => b.roi - a.roi).slice(0, 3)
  const topRetiros = [...stats].sort((a, b) => b.retiros - a.retiros).slice(0, 3)

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Top ROI */}
        <div className="bg-surface border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={16} className="text-[#F59E0B]" />
            <span className="font-semibold text-text text-sm">Top Empresas por ROI</span>
          </div>
          {topROI.length === 0 ? (
            <p className="text-muted text-sm">Sin datos aún</p>
          ) : topROI.map((s, i) => (
            <div key={s.company} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
              <div className="flex items-center gap-2.5">
                <span className="text-lg">{medals[i]}</span>
                <div>
                  <div className="text-sm font-medium text-text">{s.company}</div>
                  <div className="text-xs text-muted">{s.accounts} cuentas</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-bold ${s.roi >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                  {hideValues ? '**%' : `${s.roi.toFixed(1)}%`}
                </div>
                <div className="text-xs text-muted">{hideValues ? '€***' : formatCurrency(s.beneficio)}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Top Retiros */}
        <div className="bg-surface border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Flame size={16} className="text-[#EF4444]" />
            <span className="font-semibold text-text text-sm">Top Empresas por Retiros</span>
          </div>
          {topRetiros.length === 0 ? (
            <p className="text-muted text-sm">Sin datos aún</p>
          ) : topRetiros.map((s, i) => (
            <div key={s.company} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
              <div className="flex items-center gap-2.5">
                <span className="text-lg">{medals[i]}</span>
                <div>
                  <div className="text-sm font-medium text-text">{s.company}</div>
                  <div className="text-xs text-muted">{s.accounts} cuentas</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-[#22C55E]">{hideValues ? '€***' : formatCurrency(s.retiros)}</div>
                <div className="text-xs text-muted">Prom: {hideValues ? '€***' : formatCurrency(s.retiros / (s.accounts || 1))}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* All companies table */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <h3 className="font-semibold text-text text-sm">Todas las Empresas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['EMPRESA', 'CUENTAS', 'GASTOS', 'RETIROS', 'BENEFICIO', 'ROI'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-muted px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.map(s => (
                <tr key={s.company} className="border-b border-border hover:bg-surface2/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: getCompanyColor(s.company) }} />
                      <span className="font-medium text-text">{s.company}</span>
                    </div>
                    <div className="text-xs text-muted">{s.activeAccounts} activas</div>
                  </td>
                  <td className="px-5 py-3.5 text-text">{s.accounts}</td>
                  <td className="px-5 py-3.5 text-[#EF4444]">{hideValues ? '€***' : formatCurrency(s.gastos)}</td>
                  <td className="px-5 py-3.5 text-[#22C55E]">{hideValues ? '€***' : formatCurrency(s.retiros)}</td>
                  <td className={`px-5 py-3.5 font-medium ${s.beneficio >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                    {hideValues ? '€***' : formatCurrency(s.beneficio)}
                  </td>
                  <td className={`px-5 py-3.5 font-medium ${s.roi >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                    {hideValues ? '**%' : `${s.roi.toFixed(1)}%`}
                  </td>
                </tr>
              ))}
              {stats.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-muted">Sin cuentas registradas</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
