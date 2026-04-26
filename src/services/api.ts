/**
 * API client base — wrapper sobre fetch que:
 * 1. Añade el token JWT automáticamente
 * 2. Redirige a /login en 401
 * 3. Lanza errores legibles
 */

const BASE_URL = import.meta.env.DEV ? 'http://localhost:3001/api' : '/api'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('pt_token')

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  })

  if (res.status === 401) {
    localStorage.removeItem('pt_token')
    window.location.href = '/login'
    throw new ApiError(401, 'No autenticado')
  }

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new ApiError(res.status, data.error ?? `Error HTTP ${res.status}`)
  }

  return data as T
}

export const api = {
  get:    <T>(url: string)                   => request<T>(url),
  post:   <T>(url: string, body: unknown)    => request<T>(url, { method: 'POST',   body: JSON.stringify(body) }),
  patch:  <T>(url: string, body: unknown)    => request<T>(url, { method: 'PATCH',  body: JSON.stringify(body) }),
  delete: <T>(url: string)                   => request<T>(url, { method: 'DELETE' }),
}
