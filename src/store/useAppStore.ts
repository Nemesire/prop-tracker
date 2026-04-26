import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Account, User, DateRange, UserChallenge } from '../types'
import { getLevelFromXp } from '../utils/gamification'
import { getDefaultRange } from '../utils/dateFilters'
import { XP_REWARDS } from '../utils/gamification'
import { MOCK_ACCOUNTS } from './mockAccounts'
import { authService }     from '../services/auth.service'
import { accountsService } from '../services/accounts.service'

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

  /* ─────────────────────────── ACTIONS ──────────────────── */

  /* Local (mock) — compatibilidad backward */
  login:    (user: User) => void
  logout:   () => void
  register: (username: string, displayName: string) => User

  /* API — autenticación real */
  loginWithApi:    (username: string, password: string) => Promise<void>
  registerWithApi: (username: string, displayName: string, password: string, email?: string) => Promise<void>
  logoutApi:       () => void
  initFromApi:     () => Promise<void>

  /* Cuentas — sincrono (local) */
  addAccount:        (account: Omit<Account, 'id' | 'userId' | 'dailyEntries' | 'withdrawalsList'>) => void
  updateAccount:     (id: string, updates: Partial<Account>) => void
  deleteAccount:     (id: string) => void
  approveEvaluation: (id: string) => void
  addWithdrawal:     (accountId: string, amount: number, note?: string) => void
  addDailyEntry:     (accountId: string, date: string, pnl: number) => void

  /* Cuentas — async (API) */
  loadAccountsFromApi:  () => Promise<void>
  createAccountApi:     (account: Omit<Account, 'id' | 'userId' | 'dailyEntries' | 'withdrawalsList'>) => Promise<void>
  updateAccountApi:     (id: string, updates: Partial<Account>) => Promise<void>
  deleteAccountApi:     (id: string) => Promise<void>
  addWithdrawalApi:     (accountId: string, amount: number, note?: string) => Promise<void>
  addDailyEntryApi:     (accountId: string, date: string, pnl: number) => Promise<void>
  approveEvaluationApi: (id: string) => Promise<void>

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
      apiMode:         false,   // ← cambiar a true cuando tengas el backend listo
      loading:         false,
      error:           null,
      userChallenges:  [],

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

      registerWithApi: async (username, displayName, password, email) => {
        set({ loading: true, error: null })
        try {
          const { user } = await authService.register(username, displayName, password, email)
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

      /* ── Cuentas sincrono (local) ───────────────────── */
      addAccount: (account) => set(s => {
        if (!s.currentUser) return {}
        const newAcc: Account = {
          ...account,
          id:              `acc_${Date.now()}`,
          userId:          s.currentUser.id,
          dailyEntries:    [],
          withdrawalsList: [],
        }
        const accounts = [...s.currentUser.accounts, newAcc]
        get().addXp(XP_REWARDS.account_added)
        return { currentUser: { ...s.currentUser, accounts } }
      }),

      updateAccount: (id, updates) => set(s => {
        if (!s.currentUser) return {}
        const accounts = s.currentUser.accounts.map(a => a.id === id ? { ...a, ...updates } : a)
        return { currentUser: { ...s.currentUser, accounts } }
      }),

      deleteAccount: (id) => set(s => {
        if (!s.currentUser) return {}
        const accounts = s.currentUser.accounts.filter(a => a.id !== id)
        return { currentUser: { ...s.currentUser, accounts } }
      }),

      approveEvaluation: (id) => set(s => {
        if (!s.currentUser) return {}
        const accounts = s.currentUser.accounts.map(a =>
          a.id === id ? { ...a, type: 'live' as const, status: 'activa' as const } : a
        )
        get().addXp(XP_REWARDS.evaluation_passed)
        return { currentUser: { ...s.currentUser, accounts } }
      }),

      addWithdrawal: (accountId, amount, note) => set(s => {
        if (!s.currentUser) return {}
        const accounts = s.currentUser.accounts.map(a => {
          if (a.id !== accountId) return a
          const withdrawal = { id: `w_${Date.now()}`, amount, date: new Date().toISOString(), note }
          return { ...a, withdrawals: a.withdrawals + amount, withdrawalsList: [...a.withdrawalsList, withdrawal] }
        })
        get().addXp(XP_REWARDS.withdrawal)
        return { currentUser: { ...s.currentUser, accounts } }
      }),

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

      /* ── Cuentas async (API) ────────────────────────── */
      loadAccountsFromApi: async () => {
        try {
          const accounts = await accountsService.getAll()
          set(s => s.currentUser ? { currentUser: { ...s.currentUser, accounts } } : {})
        } catch (err) {
          console.error('Error cargando cuentas:', err)
        }
      },

      createAccountApi: async (account) => {
        const created = await accountsService.create(account)
        set(s => s.currentUser
          ? { currentUser: { ...s.currentUser, accounts: [...s.currentUser.accounts, created] } }
          : {}
        )
        get().addXp(XP_REWARDS.account_added)
      },

      updateAccountApi: async (id, updates) => {
        const updated = await accountsService.update(id, updates)
        set(s => {
          if (!s.currentUser) return {}
          const accounts = s.currentUser.accounts.map(a => a.id === id ? { ...a, ...updated } : a)
          return { currentUser: { ...s.currentUser, accounts } }
        })
      },

      deleteAccountApi: async (id) => {
        await accountsService.delete(id)
        set(s => {
          if (!s.currentUser) return {}
          const accounts = s.currentUser.accounts.filter(a => a.id !== id)
          return { currentUser: { ...s.currentUser, accounts } }
        })
      },

      addWithdrawalApi: async (accountId, amount, note) => {
        const withdrawal = await accountsService.addWithdrawal(accountId, amount, note)
        set(s => {
          if (!s.currentUser) return {}
          const accounts = s.currentUser.accounts.map(a => {
            if (a.id !== accountId) return a
            return {
              ...a,
              withdrawals:     a.withdrawals + amount,
              withdrawalsList: [...a.withdrawalsList, withdrawal],
            }
          })
          return { currentUser: { ...s.currentUser, accounts } }
        })
        get().addXp(XP_REWARDS.withdrawal)
      },

      addDailyEntryApi: async (accountId, date, pnl) => {
        const entry = await accountsService.addDailyEntry(accountId, date, pnl)
        set(s => {
          if (!s.currentUser) return {}
          const accounts = s.currentUser.accounts.map(a => {
            if (a.id !== accountId) return a
            const existing = a.dailyEntries.findIndex(e => e.date === date)
            const dailyEntries = existing >= 0
              ? a.dailyEntries.map((e, i) => i === existing ? entry : e)
              : [...a.dailyEntries, entry]
            return { ...a, dailyEntries }
          })
          return { currentUser: { ...s.currentUser, accounts } }
        })
      },

      approveEvaluationApi: async (id) => {
        await accountsService.update(id, { type: 'live', status: 'activa' })
        get().approveEvaluation(id)
      },

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
    }),
    {
      name: 'prop-tracker-app',
      partialize: (s) => ({
        currentUser:     s.currentUser,
        isAuthenticated: s.isAuthenticated,
        hideValues:      s.hideValues,
        theme:           s.theme,
        apiMode:         s.apiMode,
        userChallenges:  s.userChallenges,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme)
      },
    }
  )
)
