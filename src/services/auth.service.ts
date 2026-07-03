import { api } from './api'
import type { User } from '../types'

interface AuthResponse { token: string; user: User }

export const authService = {
  /** Login con usuario y contraseña reales */
  async login(username: string, password: string): Promise<AuthResponse> {
    const data = await api.post<AuthResponse>('/auth/login', { username, password })
    localStorage.setItem('pt_token', data.token)
    return data
  },

  /** Registro de nuevo usuario (requiere código de invitación en producción) */
  async register(
    username: string,
    displayName: string,
    password: string,
    email?: string,
    inviteCode?: string
  ): Promise<AuthResponse> {
    const data = await api.post<AuthResponse>('/auth/register', {
      username, displayName, password, email, inviteCode,
    })
    localStorage.setItem('pt_token', data.token)
    return data
  },

  /** Verifica el token actual y devuelve el usuario */
  async me(): Promise<User> {
    const { user } = await api.get<{ user: User }>('/auth/me')
    return user
  },

  /** Solicita recuperar contraseña — envía una temporal al email */
  async forgotPassword(email: string): Promise<{ message: string }> {
    return api.post<{ message: string }>('/auth/forgot-password', { email })
  },

  /** Cierra sesión */
  logout(): void {
    localStorage.removeItem('pt_token')
  },

  /** Devuelve el token guardado (o null) */
  getToken(): string | null {
    return localStorage.getItem('pt_token')
  },

  /** True si hay token activo */
  isLoggedIn(): boolean {
    return !!localStorage.getItem('pt_token')
  },
}
