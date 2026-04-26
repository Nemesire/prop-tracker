import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { RankingEntry } from '../../types'
import { formatCurrency } from '../../utils/calculations'
import Avatar from '../ui/Avatar'
import { BADGES } from '../../data/badges'
import { useNavigate } from 'react-router-dom'

interface Props {
  entries: RankingEntry[]
  currentUserId?: string
  sortBy?: 'roi' | 'profit' | 'withdrawals' | 'approvals'
}

const RANK_COLORS: Record<number, string> = {
  1: '#F59E0B',
  2: '#9CA3AF',
  3: '#CD7C3F',
}

function RankDelta({ current, previous }: { current: number; previous?: number }) {
  if (!previous) return null
  const delta = previous - current
  if (delta > 0) return <span className="text-[10px] text-[#22C55E] flex items-center"><TrendingUp size={10} />+{delta}</span>
  if (delta < 0) return <span className="text-[10px] text-[#EF4444] flex items-center"><TrendingDown size={10} />{delta}</span>
  return <Minus size={10} className="text-[#8888AA]" />
}

export default function RankingTable({ entries, currentUserId }: Props) {
  const navigate = useNavigate()

  return (
    <div className="bg-[#1A1A2E] border border-[#2D2D4E] rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2D2D4E]">
              <th className="text-left text-xs font-medium text-[#8888AA] px-5 py-3 w-16">#</th>
              <th className="text-left text-xs font-medium text-[#8888AA] px-5 py-3">TRADER</th>
              <th className="text-left text-xs font-medium text-[#8888AA] px-5 py-3">RETIROS</th>
              <th className="text-left text-xs font-medium text-[#8888AA] px-5 py-3">BENEFICIO</th>
              <th className="text-left text-xs font-medium text-[#8888AA] px-5 py-3">ROI</th>
              <th className="text-left text-xs font-medium text-[#8888AA] px-5 py-3">APROBADAS</th>
              <th className="text-left text-xs font-medium text-[#8888AA] px-5 py-3">CUENTAS</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(entry => {
              const isMe = entry.userId === currentUserId
              const earnedBadges = BADGES.filter(b => entry.badges.includes(b.id)).slice(0, 3)

              return (
                <tr
                  key={entry.userId}
                  onClick={() => navigate(`/perfil/${entry.username}`)}
                  className={`border-b border-[#2D2D4E] cursor-pointer transition-colors ${isMe ? 'bg-[#7C3AED]/10 hover:bg-[#7C3AED]/15' : 'hover:bg-[#22223A]/50'}`}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-base" style={{ color: RANK_COLORS[entry.rank] ?? '#8888AA' }}>
                        {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : `#${entry.rank}`}
                      </span>
                      <RankDelta current={entry.rank} previous={entry.previousRank} />
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={entry.displayName} size="sm" level={entry.level} />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-[#F8F8FF]">{entry.displayName}</span>
                          {isMe && <span className="text-[10px] bg-[#7C3AED]/20 text-[#7C3AED] px-1.5 py-0.5 rounded-full">Tú</span>}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-xs text-[#8888AA]">@{entry.username}</span>
                          {earnedBadges.map(b => <span key={b.id} title={b.name} className="text-xs">{b.icon}</span>)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-medium text-[#22C55E]">{formatCurrency(entry.totalWithdrawals)}</td>
                  <td className={`px-5 py-4 font-medium ${entry.totalProfit >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>{formatCurrency(entry.totalProfit)}</td>
                  <td className={`px-5 py-4 font-medium ${entry.roi >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>{entry.roi.toFixed(1)}%</td>
                  <td className="px-5 py-4 text-[#F8F8FF]">{entry.approvedEvaluations}</td>
                  <td className="px-5 py-4 text-[#F8F8FF]">{entry.activeAccounts} activas</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
