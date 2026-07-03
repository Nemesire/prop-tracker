import { api } from './api'
import type { CommunityMember, InviteCode } from '../types'

export const adminService = {
  /* ── Miembros ── */
  async getMembers(): Promise<CommunityMember[]> {
    const { members } = await api.get<{ members: CommunityMember[] }>('/admin/members')
    return members
  },

  async updateMember(id: string, updates: Partial<Pick<CommunityMember, 'role' | 'status' | 'notes'>>): Promise<CommunityMember> {
    const { member } = await api.patch<{ member: CommunityMember }>(`/admin/members/${id}`, updates)
    return member
  },

  async deleteMember(id: string): Promise<void> {
    await api.delete(`/admin/members/${id}`)
  },

  /* ── Invitaciones ── */
  async getInvites(): Promise<InviteCode[]> {
    const { invites } = await api.get<{ invites: InviteCode[] }>('/admin/invites')
    return invites
  },

  async createInvite(note?: string): Promise<InviteCode> {
    const { invite } = await api.post<{ invite: InviteCode }>('/admin/invites', { note })
    return invite
  },

  async deleteInvite(id: string): Promise<void> {
    await api.delete(`/admin/invites/${id}`)
  },
}
