import type { Account } from '../types'

export const MOCK_ACCOUNTS: Account[] = [
  {
    id: 'acc_1', name: 'TDFYSL150199786058', type: 'evaluacion', status: 'activa',
    company: 'Tradeify', size: 150000, cost: 331.87, earnings: 0, withdrawals: 0,
    withdrawalsList: [], dailyEntries: [
      { date: '2026-01-10', pnl: -120 }, { date: '2026-01-15', pnl: 280 },
      { date: '2026-01-20', pnl: -90 }, { date: '2026-02-01', pnl: 450 },
    ],
    startDate: '2026-01-05', userId: 'u1',
  },
  {
    id: 'acc_2', name: 'TDFYSL150985853001', type: 'evaluacion', status: 'activa',
    company: 'Tradeify', size: 150000, cost: 437.22, earnings: 0, withdrawals: 0,
    withdrawalsList: [], dailyEntries: [
      { date: '2026-01-12', pnl: -200 }, { date: '2026-01-18', pnl: 180 },
      { date: '2026-02-05', pnl: -150 }, { date: '2026-02-10', pnl: 320 },
    ],
    startDate: '2026-01-10', userId: 'u1',
  },
  {
    id: 'acc_3', name: 'TDFYSL150680345180', type: 'evaluacion', status: 'activa',
    company: 'Tradeify', size: 150000, cost: 299.67, earnings: 0, withdrawals: 0,
    withdrawalsList: [], dailyEntries: [
      { date: '2026-01-25', pnl: 600 }, { date: '2026-02-08', pnl: -180 },
      { date: '2026-03-01', pnl: 420 },
    ],
    startDate: '2026-01-20', userId: 'u1',
  },
  {
    id: 'acc_4', name: 'FTPROPLUSM126837594101', type: 'live', status: 'activa',
    company: 'Funding Ticks', size: 200000, cost: 320.76, earnings: 1200, withdrawals: 0,
    withdrawalsList: [], dailyEntries: [
      { date: '2026-01-15', pnl: 800 }, { date: '2026-02-01', pnl: 400 },
      { date: '2026-02-20', pnl: -180 }, { date: '2026-03-10', pnl: 180 },
    ],
    startDate: '2025-12-01', userId: 'u1',
  },
  {
    id: 'acc_5', name: 'LFF0506011804001', type: 'live', status: 'activa',
    company: 'Lucid Trading', size: 50000, cost: 61.77, earnings: 0, withdrawals: 0,
    withdrawalsList: [], dailyEntries: [
      { date: '2026-02-10', pnl: 150 }, { date: '2026-03-01', pnl: -80 },
      { date: '2026-03-15', pnl: 210 },
    ],
    startDate: '2026-02-01', userId: 'u1',
  },
  {
    id: 'acc_6', name: 'FTPROPLUSM112389017645', type: 'live', status: 'activa',
    company: 'Funding Ticks', size: 200000, cost: 242.09, earnings: 0, withdrawals: 0,
    withdrawalsList: [], dailyEntries: [
      { date: '2026-01-20', pnl: 320 }, { date: '2026-02-15', pnl: -100 },
      { date: '2026-03-05', pnl: 480 }, { date: '2026-04-01', pnl: 190 },
    ],
    startDate: '2026-01-15', userId: 'u1',
  },
  {
    id: 'acc_7', name: 'FTMO-XK998821', type: 'evaluacion', status: 'fallida',
    company: 'FTMO', size: 100000, cost: 540, earnings: 0, withdrawals: 0,
    withdrawalsList: [], dailyEntries: [],
    startDate: '2025-11-01', endDate: '2025-11-20', userId: 'u1',
  },
  {
    id: 'acc_8', name: 'TS-ELITE-44821', type: 'live', status: 'suspendida',
    company: 'Topstep', size: 150000, cost: 165, earnings: 4575.25, withdrawals: 4575.25,
    withdrawalsList: [
      { id: 'w1', amount: 2287.63, date: '2025-10-15' },
      { id: 'w2', amount: 2287.62, date: '2025-12-01' },
    ],
    dailyEntries: [],
    startDate: '2025-08-01', endDate: '2025-12-15', userId: 'u1',
  },
]
