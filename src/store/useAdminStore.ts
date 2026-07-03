import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CommunityMember, InviteCode, UserRole, UserStatus } from '../types'
import { adminService } from '../services/admin.service'

/**
 * Modo híbrido:
 *  - DEV  → todo en localStorage (no hay base de datos local)
 *  - PROD → todo contra la API de Vercel + Neon PostgreSQL
 */
const REMOTE = !import.meta.env.DEV

interface AdminState {
  members: CommunityMember[]
  invites: InviteCode[]
  loading: boolean
  error:   string | null

  /** Carga miembros e invitaciones desde la API (solo producción) */
  syncFromApi: () => Promise<void>

  addMember:    (m: Omit<CommunityMember, 'id' | 'joinDate'>) => void
  updateMember: (id: string, updates: Partial<CommunityMember>) => Promise<void>
  deleteMember: (id: string) => Promise<void>
  setMemberPassword: (id: string, password: string) => Promise<void>

  createInvite: (note?: string) => Promise<void>
  deleteInvite: (id: string) => Promise<void>
  consumeInvite: (code: string, username: string) => boolean
  validateInvite: (code: string) => InviteCode | null
}

function genCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      members: [],
      invites: [],
      loading: false,
      error:   null,

      syncFromApi: async () => {
        if (!REMOTE) return
        set({ loading: true, error: null })
        try {
          const [members, invites] = await Promise.all([
            adminService.getMembers(),
            adminService.getInvites(),
          ])
          set({ members, invites, loading: false })
        } catch (err) {
          set({ loading: false, error: (err as Error).message })
        }
      },

      addMember: (m) => {
        // Solo local (en producción los usuarios se crean registrándose con invitación)
        set(s => ({
          members: [...s.members, { ...m, id: `m_${Date.now()}`, joinDate: new Date().toISOString() }],
        }))
      },

      updateMember: async (id, updates) => {
        if (REMOTE) {
          const member = await adminService.updateMember(id, updates)
          set(s => ({ members: s.members.map(m => m.id === id ? member : m) }))
        } else {
          set(s => ({ members: s.members.map(m => m.id === id ? { ...m, ...updates } : m) }))
        }
      },

      deleteMember: async (id) => {
        if (REMOTE) await adminService.deleteMember(id)
        set(s => ({ members: s.members.filter(m => m.id !== id) }))
      },

      setMemberPassword: async (id, password) => {
        // Solo tiene efecto en producción (la BD guarda el hash).
        if (REMOTE) await adminService.setMemberPassword(id, password)
      },

      createInvite: async (note) => {
        if (REMOTE) {
          const invite = await adminService.createInvite(note)
          set(s => ({ invites: [invite, ...s.invites] }))
        } else {
          const inv: InviteCode = {
            id: `inv_${Date.now()}`,
            code: genCode(),
            createdAt: new Date().toISOString(),
            note,
          }
          set(s => ({ invites: [inv, ...s.invites] }))
        }
      },

      deleteInvite: async (id) => {
        if (REMOTE) await adminService.deleteInvite(id)
        set(s => ({ invites: s.invites.filter(i => i.id !== id) }))
      },

      validateInvite: (code) => {
        const inv = get().invites.find(i => i.code === code.toUpperCase())
        if (!inv) return null
        if (inv.usedBy) return null
        if (inv.expiresAt && new Date(inv.expiresAt) < new Date()) return null
        return inv
      },

      consumeInvite: (code, username) => {
        // Solo modo local — en producción el backend marca el código como usado
        const inv = get().validateInvite(code)
        if (!inv) return false
        set(s => ({
          invites: s.invites.map(i =>
            i.id === inv.id
              ? { ...i, usedBy: username, usedAt: new Date().toISOString() }
              : i
          ),
        }))
        return true
      },
    }),
    {
      name: 'pt-admin-store',
      // En producción la fuente de verdad es la BD — no persistimos listas
      partialize: (s) => REMOTE ? {} : { members: s.members, invites: s.invites },
    }
  )
)

/* ─── helpers exportados ─── */
export const ADMIN_EMAIL = 'nemesir83@gmail.com'

export function isAdminUser(email?: string, username?: string, role?: string): boolean {
  if (role === 'admin') return true
  if (email && email.toLowerCase() === ADMIN_EMAIL) return true
  if (username && ['nemesir', 'nemesir83'].includes(username.toLowerCase())) return true
  return false
}

export const ROLE_LABELS: Record<UserRole, string>   = { admin: 'Admin', member: 'Miembro' }
export const STATUS_LABELS: Record<UserStatus, string> = { active: 'Activo', pending: 'Pendiente', suspended: 'Suspendido' }
export const STATUS_COLORS: Record<UserStatus, string> = {
  active:    '#22C55E',
  pending:   '#F59E0B',
  suspended: '#EF4444',
}
