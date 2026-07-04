import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Account, User, DateRange, UserChallenge, Company } from '../types'
import { getLevelFromXp } from '../utils/gamification'
import { getDefaultRange } from '../utils/dateFilters'
import { XP_REWARDS } from '../utils/gamification'
import { MOCK_ACCOUNTS } from './mockAccounts'
import { authService }     from '../services/auth.service'
import { accountsService } from '../services/accounts.service'
import { COMPANIES, COMPANY_COLORS } from '../data/companies'

/** DEV = demo local en memoria (sin backend garantizado).
 *  PROD = todas las escrituras de cuentas/retiros persisten en Neon vía API. */
const REMOTE = !import.meta.env.DEV

const DEFAULT_COMPANIES: Company[] = COMPANIES.map(name => ({
  id:    `c_${name.toLowerCase().replace(/\s+/g, '_')}`,
  name,
  color: COMPANY_COLORS[name] ?? '#7C3AED',
}))

export type Theme = 'dark' | 'light'

interface AppState {
  /* ── Auth / User ─────────────────────────────────────── */
  currentUser:     User | null
  isAuthenticated: boolean

  /* ── UI ──────────────────────────────────────────────── */
  dateRange:   DateRange
  hideValues:  boolean
  theme:       Theme

  /* ── API mode ────────────────────────────────────────── */
  apiMode:  boolean   // true = usar backend real
  loading:  boolean
  error:    string | null

  /* ── Gamification ────────────────────────────────────── */
  userChallenges: UserChallenge[]

  /* ── Empresas ────────────────────────────────────────── */
  companies: Company[]

  /* ─────────────────────────── ACTIONS ──────────────────── */

  /* Local (mock) — compatibilidad backward */
  login:    (user: User) => void
  logout:   () => void
  register: (username: string, displayName: string) => User

  /* API — autenticación real */
  loginWithApi:    (username: string, password: string) => Promise<void>
  registerWithApi: (username: string, displayName: string, password: string, email?: string, inviteCode?: string) => Promise<void>
  logoutApi:       () => void
  initFromApi:     () => Promise<void>
  loadAccountsFromApi: () => Promise<void>

  /* Cuentas — en producción persisten en la API (Neon); en dev quedan en memoria/localStorage */
  addAccount:        (account: Omit<Account, 'id' | 'userId' | 'dailyEntries' | 'withdrawalsList'>) => Promise<void>
  updateAccount:     (id: string, updates: Partial<Account>) => Promise<void>
  deleteAccount:     (id: string) => Promise<void>
  resetAccount:      (id: string, resetCost: number, startDate: string) => Promise<void>
  approveEvaluation: (id: string) => Promise<void>
  addWithdrawal:     (accountId: string, amount: number, note?: string, date?: string) => Promise<void>
  updateWithdrawal:  (accountId: string, withdrawalId: string, updates: { amount: number; date: string; note?: string }) => Promise<void>
  deleteWithdrawal:  (accountId: string, withdrawalId: string) => Promise<void>
  addDailyEntry:     (accountId: string, date: string, pnl: number) => void

  /* Misc */
  setDateRange:     (range: DateRange) => void
  toggleHideValues: () => void
  setTheme:         (t: Theme) => void
  setApiMode:       (v: boolean) => void
  updateProfile:    (updates: Partial<Pick<User, 'displayName' | 'bio' | 'avatar' | 'country' | 'isPublic'>>) => void

  /* Gamification */
  addXp:     (amount: number) => void
  earnBadge: (badgeId: string) => void
  updateChallengeProgress: (challengeId: string, progress: number) => void

  /* Empresas */
  addCompany:    (company: Omit<Company, 'id'>) => void
  updateCompany: (id: string, updates: Partial<Omit<Company, 'id'>>) => void
  deleteCompany: (id: string) => void

  /* Borrado total de datos (demo → real) */
  wipeAllData: () => Promise<void>
}

function applyTheme(theme: Theme) {
  if (theme === 'light') {
    document.documentElement.classList.add('light')
    document.documentElement.classList.remove('dark')
  } else {
    document.documentElement.classList.add('dark')
    document.documentElement.classList.remove('light')
  }
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser:     null,
      isAuthenticated: false,
      dateRange:       getDefaultRange(),
      hideValues:      false,
      theme:           'dark',
      apiMode:         false,
      loading:         false,
      error:           null,
      userChallenges:  [],
      companies:       DEFAULT_COMPANIES,

      /* ── Auth local (mock) ──────────────────────────── */
      login:  (user) => set({ currentUser: user, isAuthenticated: true }),
      logout: ()     => set({ currentUser: null, isAuthenticated: false }),

      register: (username, displayName) => {
        const newUser: User = {
          id:          `u_${Date.now()}`,
          username,
          displayName,
          isPublic:    true,
          xp:          0,
          level:       1,
          badges:      [],
          joinDate:    new Date().toISOString(),
          accounts:    [...MOCK_ACCOUNTS],
          following:   [],
          followers:   [],
        }
        set({ currentUser: newUser, isAuthenticated: true })
        return newUser
      },

      /* ── Auth API ───────────────────────────────────── */
      loginWithApi: async (username, password) => {
        set({ loading: true, error: null })
        try {
          const { user } = await authService.login(username, password)
          set({ currentUser: user, isAuthenticated: true, loading: false })
          await get().loadAccountsFromApi()
        } catch (err) {
          set({ loading: false, error: (err as Error).message })
          throw err
        }
      },

      registerWithApi: async (username, displayName, password, email, inviteCode) => {
        set({ loading: true, error: null })
        try {
          const { user } = await authService.register(username, displayName, password, email, inviteCode)
          set({ currentUser: user, isAuthenticated: true, loading: false })
        } catch (err) {
          set({ loading: false, error: (err as Error).message })
          throw err
        }
      },

      logoutApi: () => {
        authService.logout()
        set({ currentUser: null, isAuthenticated: false })
      },

      /**
       * Llamar al montar App.tsx.
       * Si hay token guardado restaura la sesión automáticamente.
       */
      initFromApi: async () => {
        if (!authService.isLoggedIn()) return
        try {
          const user = await authService.me()
          set({ currentUser: user, isAuthenticated: true })
          await get().loadAccountsFromApi()
        } catch {
          authService.logout()
          set({ currentUser: null, isAuthenticated: false })
        }
      },

      loadAccountsFromApi: async () => {
        try {
          const accounts = await accountsService.getAll()
          set(s => s.currentUser ? { currentUser: { ...s.currentUser, accounts } } : {})
        } catch (err) {
          console.error('Error cargando cuentas:', err)
        }
      },

      /* ── Cuentas ──────────────────────────────────────
       * En producción (REMOTE) cada acción llama a la API y persiste en Neon.
       * En desarrollo se mantiene en memoria/localStorage para el modo demo. */
      addAccount: async (account) => {
        if (REMOTE) {
          const created = await accountsService.create(account)
          set(s => s.currentUser
            ? { currentUser: { ...s.currentUser, accounts: [...s.currentUser.accounts, created] } }
            : {}
          )
        } else {
          set(s => {
            if (!s.currentUser) return {}
            const newAcc: Account = {
              ...account,
              id:              `acc_${Date.now()}`,
              userId:          s.currentUser.id,
              dailyEntries:    [],
              withdrawalsList: [],
            }
            return { currentUser: { ...s.currentUser, accounts: [...s.currentUser.accounts, newAcc] } }
          })
        }
        get().addXp(XP_REWARDS.account_added)
      },

      updateAccount: async (id, updates) => {
        if (REMOTE) {
          const updated = await accountsService.update(id, updates)
          set(s => {
            if (!s.currentUser) return {}
            const accounts = s.currentUser.accounts.map(a => a.id === id ? { ...a, ...updated } : a)
            return { currentUser: { ...s.currentUser, accounts } }
          })
        } else {
          set(s => {
            if (!s.currentUser) return {}
            const accounts = s.currentUser.accounts.map(a => a.id === id ? { ...a, ...updates } : a)
            return { currentUser: { ...s.currentUser, accounts } }
          })
        }
      },

      deleteAccount: async (id) => {
        if (REMOTE) await accountsService.delete(id)
        set(s => {
          if (!s.currentUser) return {}
          return { currentUser: { ...s.currentUser, accounts: s.currentUser.accounts.filter(a => a.id !== id) } }
        })
      },

      /** Resetea una cuenta: acumula el coste del reset, pone contadores a cero y borra el histórico */
      resetAccount: async (id, resetCost, startDate) => {
        if (REMOTE) {
          const updated = await accountsService.reset(id, resetCost, startDate)
          set(s => {
            if (!s.currentUser) return {}
            const accounts = s.currentUser.accounts.map(a => a.id === id ? updated : a)
            return { currentUser: { ...s.currentUser, accounts } }
          })
        } else {
          set(s => {
            if (!s.currentUser) return {}
            const accounts = s.currentUser.accounts.map(a => a.id === id
              ? {
                  ...a,
                  cost:            a.cost + resetCost,
                  earnings:        0,
                  withdrawals:     0,
                  dailyEntries:    [],
                  withdrawalsList: [],
                  startDate,
                  status:          'activa' as const,
                }
              : a)
            return { currentUser: { ...s.currentUser, accounts } }
          })
        }
      },

      approveEvaluation: async (id) => {
        if (REMOTE) await accountsService.update(id, { type: 'live', status: 'activa' })
        set(s => {
          if (!s.currentUser) return {}
          const accounts = s.currentUser.accounts.map(a =>
            a.id === id ? { ...a, type: 'live' as const, status: 'activa' as const } : a
          )
          return { currentUser: { ...s.currentUser, accounts } }
        })
        get().addXp(XP_REWARDS.evaluation_passed)
      },

      addWithdrawal: async (accountId, amount, note, date) => {
        if (REMOTE) {
          const withdrawal = await accountsService.addWithdrawal(accountId, amount, note, date)
          set(s => {
            if (!s.currentUser) return {}
            const accounts = s.currentUser.accounts.map(a => a.id === accountId
              ? { ...a, withdrawals: a.withdrawals + amount, withdrawalsList: [...a.withdrawalsList, withdrawal] }
              : a)
            return { currentUser: { ...s.currentUser, accounts } }
          })
        } else {
          set(s => {
            if (!s.currentUser) return {}
            const accounts = s.currentUser.accounts.map(a => {
              if (a.id !== accountId) return a
              const withdrawal = { id: `w_${Date.now()}`, amount, date: date ? new Date(date).toISOString() : new Date().toISOString(), note }
              return { ...a, withdrawals: a.withdrawals + amount, withdrawalsList: [...a.withdrawalsList, withdrawal] }
            })
            return { currentUser: { ...s.currentUser, accounts } }
          })
        }
        get().addXp(XP_REWARDS.withdrawal)
      },

      updateWithdrawal: async (accountId, withdrawalId, updates) => {
        if (REMOTE) await accountsService.updateWithdrawal(withdrawalId, updates)
        set(s => {
          if (!s.currentUser) return {}
          const accounts = s.currentUser.accounts.map(a => {
            if (a.id !== accountId) return a
            const old = a.withdrawalsList.find(w => w.id === withdrawalId)
            const diff = updates.amount - (old?.amount ?? 0)
            const withdrawalsList = a.withdrawalsList.map(w =>
              w.id === withdrawalId ? { ...w, ...updates } : w
            )
            return { ...a, withdrawals: a.withdrawals + diff, withdrawalsList }
          })
          return { currentUser: { ...s.currentUser, accounts } }
        })
      },

      deleteWithdrawal: async (accountId, withdrawalId) => {
        if (REMOTE) await accountsService.deleteWithdrawal(withdrawalId)
        set(s => {
          if (!s.currentUser) return {}
          const accounts = s.currentUser.accounts.map(a => {
            if (a.id !== accountId) return a
            const w = a.withdrawalsList.find(w => w.id === withdrawalId)
            const withdrawalsList = a.withdrawalsList.filter(w => w.id !== withdrawalId)
            return { ...a, withdrawals: a.withdrawals - (w?.amount ?? 0), withdrawalsList }
          })
          return { currentUser: { ...s.currentUser, accounts } }
        })
      },

      /** Nota: aún no expuesto en ninguna pantalla — se mantiene solo en memoria/local */
      addDailyEntry: (accountId, date, pnl) => set(s => {
        if (!s.currentUser) return {}
        const accounts = s.currentUser.accounts.map(a => {
          if (a.id !== accountId) return a
          const existing = a.dailyEntries.findIndex(e => e.date === date)
          const dailyEntries = existing >= 0
            ? a.dailyEntries.map((e, i) => i === existing ? { ...e, pnl } : e)
            : [...a.dailyEntries, { date, pnl }]
          return { ...a, earnings: a.earnings + pnl, dailyEntries }
        })
        return { currentUser: { ...s.currentUser, accounts } }
      }),

      /* ── Misc ───────────────────────────────────────── */
      setDateRange:     (range) => set({ dateRange: range }),
      toggleHideValues: ()      => set(s => ({ hideValues: !s.hideValues })),
      setApiMode:       (v)     => set({ apiMode: v }),

      setTheme: (theme) => {
        applyTheme(theme)
        set({ theme })
      },

      updateProfile: (updates) => set(s => {
        if (!s.currentUser) return {}
        return { currentUser: { ...s.currentUser, ...updates } }
      }),

      /* ── Gamification ───────────────────────────────── */
      addXp: (amount) => set(s => {
        if (!s.currentUser) return {}
        const xp    = s.currentUser.xp + amount
        const level = getLevelFromXp(xp).level
        return { currentUser: { ...s.currentUser, xp, level } }
      }),

      earnBadge: (badgeId) => set(s => {
        if (!s.currentUser || s.currentUser.badges.includes(badgeId)) return {}
        const badges = [...s.currentUser.badges, badgeId]
        get().addXp(XP_REWARDS.badge_earned)
        return { currentUser: { ...s.currentUser, badges } }
      }),

      updateChallengeProgress: (challengeId, progress) => set(s => {
        const existing = s.userChallenges.find(c => c.challengeId === challengeId)
        if (existing) {
          const completed = progress >= 100 && !existing.completed
          const userChallenges = s.userChallenges.map(c =>
            c.challengeId === challengeId
              ? {
                  ...c, progress,
                  completed:     c.completed || completed,
                  completedDate: completed ? new Date().toISOString() : c.completedDate,
                }
              : c
          )
          if (completed) get().addXp(XP_REWARDS.challenge_completed)
          return { userChallenges }
        }
        const newChallenge: UserChallenge = {
          challengeId,
          userId:        s.currentUser?.id ?? '',
          progress,
          completed:     progress >= 100,
          completedDate: progress >= 100 ? new Date().toISOString() : undefined,
        }
        return { userChallenges: [...s.userChallenges, newChallenge] }
      }),

      /* ── Empresas ─────────────────────────────────────── */
      addCompany: (company) => set(s => ({
        companies: [...s.companies, { ...company, id: `c_${Date.now()}` }]
      })),

      updateCompany: (id, updates) => set(s => ({
        companies: s.companies.map(c => c.id === id ? { ...c, ...updates } : c)
      })),

      deleteCompany: (id) => set(s => ({
        companies: s.companies.filter(c => c.id !== id)
      })),

      /* ── Borrado total de datos (demo → real) ─────────── */
      wipeAllData: async () => {
        const s = get()
        if (!s.currentUser) return

        // En producción borra también las cuentas del servidor
        if (REMOTE && authService.isLoggedIn()) {
          for (const acc of s.currentUser.accounts) {
            try { await accountsService.delete(acc.id) }
            catch (err) { console.error('Error borrando cuenta en servidor:', err) }
          }
        }

        // Datos auxiliares en localStorage
        localStorage.removeItem('prop-calc-sims')          // simulaciones de la calculadora
        localStorage.removeItem('pt-conceptos-favoritos')  // favoritos de Conceptos

        set({
          currentUser: {
            ...s.currentUser,
            accounts: [],
            xp:       0,
            level:    1,
            badges:   [],
          },
          userChallenges: [],
          dateRange:      getDefaultRange(),
        })
      },
    }),
    {
      name: 'prop-tracker-app',
      partialize: (s) => ({
        currentUser:     s.currentUser,
        isAuthenticated: s.isAuthenticated,
        hideValues:      s.hideValues,
        theme:           s.theme,
        companies:       s.companies,
        apiMode:         s.apiMode,
        userChallenges:  s.userChallenges,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme)
      },
    }
  )
)