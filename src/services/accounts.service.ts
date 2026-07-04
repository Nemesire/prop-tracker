import { api } from './api'
import type { Account } from '../types'

type NewAccount = Omit<Account, 'id' | 'userId' | 'dailyEntries' | 'withdrawalsList'>
type WithdrawalDto = { id: string; amount: number; date: string; note?: string }

export const accountsService = {
  /** Devuelve todas las cuentas del usuario autenticado */
  async getAll(): Promise<Account[]> {
    const { accounts } = await api.get<{ accounts: Account[] }>('/accounts')
    return accounts
  },

  /** Crea una cuenta nueva */
  async create(account: NewAccount): Promise<Account> {
    const { account: created } = await api.post<{ account: Account }>('/accounts', {
      name:      account.name,
      type:      account.type,
      status:    account.status,
      company:   account.company,
      size:      account.size,
      cost:      account.cost,
      startDate: account.startDate,
    })
    return created
  },

  /** Actualiza campos de una cuenta */
  async update(id: string, updates: Partial<Account>): Promise<Account> {
    const { account } = await api.patch<{ account: Account }>(`/accounts/${id}`, updates)
    return account
  },

  /** Elimina una cuenta */
  async delete(id: string): Promise<void> {
    await api.delete(`/accounts/${id}`)
  },

  /** Resetea una cuenta: acumula el coste, pone contadores a cero y borra el histórico real */
  async reset(id: string, resetCost: number, startDate: string): Promise<Account> {
    const { account } = await api.post<{ account: Account }>(`/accounts/${id}/reset`, { resetCost, startDate })
    return account
  },

  /** Registra un retiro en una cuenta */
  async addWithdrawal(accountId: string, amount: number, note?: string, date?: string): Promise<WithdrawalDto> {
    const { withdrawal } = await api.post<{ withdrawal: WithdrawalDto }>(
      '/withdrawals',
      { accountId, amount, note, date }
    )
    return withdrawal
  },

  /** Edita un retiro existente */
  async updateWithdrawal(withdrawalId: string, updates: { amount: number; date: string; note?: string }): Promise<WithdrawalDto> {
    const { withdrawal } = await api.patch<{ withdrawal: WithdrawalDto }>(`/withdrawals/${withdrawalId}`, updates)
    return withdrawal
  },

  /** Elimina un retiro */
  async deleteWithdrawal(withdrawalId: string): Promise<void> {
    await api.delete(`/withdrawals/${withdrawalId}`)
  },

  /** Registra un P&L diario (upsert por fecha) */
  async addDailyEntry(accountId: string, date: string, pnl: number) {
    const { entry } = await api.post<{ entry: { id: string; date: string; pnl: number } }>(
      '/daily-entries',
      { accountId, date, pnl }
    )
    return entry
  },
}
