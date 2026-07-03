import { useState, useEffect } from 'react'
import {
  Users, Link2, Plus, Trash2, Copy, Check, UserCheck, UserX,
  RefreshCw, Mail, Shield, Clock, AlertTriangle,
} from 'lucide-react'
import { useAdminStore, STATUS_LABELS, STATUS_COLORS, ROLE_LABELS } from '../../store/useAdminStore'
import type { UserStatus, UserRole } from '../../types'

type Tab = 'members' | 'invites'

/** true cuando la app corre contra la API real (Vercel + Neon) */
const IS_REMOTE = !import.meta.env.DEV

/* ── helpers ─────────────────────────────────────── */
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

function StatusBadge({ status }: { status: UserStatus }) {
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{
      background: `${STATUS_COLORS[status]}20`,
      color: STATUS_COLORS[status],
    }}>
      {STATUS_LABELS[status]}
    </span>
  )
}

function RoleBadge({ role }: { role: UserRole }) {
  const color = role === 'admin' ? '#7C3AED' : '#3B82F6'
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{
      background: `${color}20`, color,
    }}>
      {ROLE_LABELS[role]}
    </span>
  )
}

/* ── Formulario añadir miembro ─────────────────── */
function AddMemberForm({ onClose }: { onClose: () => void }) {
  const { addMember } = useAdminStore()
  const [username, setUsername]     = useState('')
  const [displayName, setName]      = useState('')
  const [email, setEmail]           = useState('')
  const [role, setRole]             = useState<UserRole>('member')
  const [status, setStatus]         = useState<UserStatus>('active')
  const [notes, setNotes]           = useState('')

  const inputCls = 'w-full bg-bg border border-border rounded-xl px-3 py-2 text-sm text-text placeholder:text-muted focus:outline-none focus:border-[#7C3AED] transition-colors'
  const selectCls = 'w-full bg-bg border border-border rounded-xl px-3 py-2 text-sm text-text focus:outline-none focus:border-[#7C3AED] transition-colors'

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim() || !displayName.trim() || !email.trim()) return
    addMember({ username: username.trim(), displayName: displayName.trim(), email: email.trim(), role, status, notes: notes.trim() || undefined })
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface border border-[#7C3AED]/30 rounded-2xl p-5 space-y-3">
      <h3 className="font-semibold text-text text-sm flex items-center gap-2">
        <UserCheck size={16} className="text-[#7C3AED]" /> Añadir miembro
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-muted mb-1">Usuario</label>
          <input className={inputCls} value={username} onChange={e => setUsername(e.target.value)} placeholder="nombre_usuario" required />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Nombre público</label>
          <input className={inputCls} value={displayName} onChange={e => setName(e.target.value)} placeholder="Nombre Apellido" required />
        </div>
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">Email</label>
        <input type="email" className={inputCls} value={email} onChange={e => setEmail(e.target.value)} placeholder="usuario@email.com" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-muted mb-1">Rol</label>
          <select className={selectCls} value={role} onChange={e => setRole(e.target.value as UserRole)}>
            <option value="member">Miembro</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Estado</label>
          <select className={selectCls} value={status} onChange={e => setStatus(e.target.value as UserStatus)}>
            <option value="active">Activo</option>
            <option value="pending">Pendiente</option>
            <option value="suspended">Suspendido</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">Notas internas</label>
        <input className={inputCls} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Opcionales..." />
      </div>
      <div className="flex gap-2 pt-1">
        <button type="submit" className="flex-1 py-2 bg-[#7C3AED] text-white rounded-xl text-sm font-semibold hover:bg-[#6D28D9] transition-colors">
          Añadir
        </button>
        <button type="button" onClick={onClose} className="px-4 py-2 border border-border rounded-xl text-sm text-muted hover:text-text transition-colors">
          Cancelar
        </button>
      </div>
    </form>
  )
}

/* ── Tab Miembros ──────────────────────────────── */
function MembersTab() {
  const { members, updateMember, deleteMember } = useAdminStore()
  const [showAdd, setShowAdd]   = useState(false)
  const [search, setSearch]     = useState('')
  const [confirmDel, setConfirmDel] = useState<string | null>(null)

  const filtered = members.filter(m =>
    m.username.toLowerCase().includes(search.toLowerCase()) ||
    m.displayName.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {/* Stats rápidas */}
      <div className="grid grid-cols-3 gap-3">
        {([
          { label: 'Total', value: members.length, color: '#7C3AED' },
          { label: 'Activos', value: members.filter(m => m.status === 'active').length, color: '#22C55E' },
          { label: 'Suspendidos', value: members.filter(m => m.status === 'suspended').length, color: '#EF4444' },
        ] as const).map(s => (
          <div key={s.label} className="bg-surface border border-border rounded-xl p-3 text-center">
            <div className="text-xl font-black" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-muted">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Barra de herramientas */}
      <div className="flex gap-2">
        <input
          className="flex-1 bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text placeholder:text-muted focus:outline-none focus:border-[#7C3AED] transition-colors"
          placeholder="Buscar usuario..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {!IS_REMOTE && (
          <button
            onClick={() => setShowAdd(s => !s)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#7C3AED] text-white rounded-xl text-sm font-semibold hover:bg-[#6D28D9] transition-colors"
          >
            <Plus size={15} /> Añadir
          </button>
        )}
      </div>

      {IS_REMOTE && (
        <p className="text-xs text-muted">
          Los usuarios nuevos se añaden solos al registrarse con un código de invitación.
          Desde aquí puedes activarlos, suspenderlos o eliminarlos.
        </p>
      )}

      {showAdd && !IS_REMOTE && <AddMemberForm onClose={() => setShowAdd(false)} />}

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 text-muted">
          <Users size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">{members.length === 0 ? 'Aún no hay miembros registrados' : 'Sin resultados'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(m => (
            <div key={m.id} className="bg-surface border border-border rounded-xl px-4 py-3 flex items-center gap-3 group hover:border-[#7C3AED]/30 transition-all">
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#3B82F6] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {m.displayName[0].toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-text">{m.displayName}</span>
                  <span className="text-xs text-muted">@{m.username}</span>
                  <RoleBadge role={m.role} />
                  <StatusBadge status={m.status} />
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-muted flex items-center gap-1">
                    <Mail size={10} /> {m.email}
                  </span>
                  <span className="text-xs text-muted flex items-center gap-1">
                    <Clock size={10} /> {fmtDate(m.joinDate)}
                  </span>
                </div>
                {m.notes && <p className="text-xs text-muted italic mt-0.5 truncate">{m.notes}</p>}
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {m.status !== 'active' && (
                  <button
                    onClick={() => updateMember(m.id, { status: 'active' })}
                    title="Activar"
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-[#22C55E] hover:bg-[#22C55E]/10 transition-colors"
                  >
                    <UserCheck size={14} />
                  </button>
                )}
                {m.status !== 'suspended' && (
                  <button
                    onClick={() => updateMember(m.id, { status: 'suspended' })}
                    title="Suspender"
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-[#F59E0B] hover:bg-[#F59E0B]/10 transition-colors"
                  >
                    <UserX size={14} />
                  </button>
                )}
                {m.role !== 'admin' && (
                  <button
                    onClick={() => updateMember(m.id, { role: 'admin' })}
                    title="Hacer admin"
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-[#7C3AED] hover:bg-[#7C3AED]/10 transition-colors"
                  >
                    <Shield size={14} />
                  </button>
                )}
                {confirmDel === m.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { deleteMember(m.id); setConfirmDel(null) }}
                      className="text-xs px-2 py-0.5 bg-[#EF4444] text-white rounded-lg font-semibold"
                    >Sí</button>
                    <button
                      onClick={() => setConfirmDel(null)}
                      className="text-xs px-2 py-0.5 border border-border rounded-lg text-muted"
                    >No</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDel(m.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Tab Invitaciones ──────────────────────────── */
function InvitesTab() {
  const { invites, createInvite, deleteInvite } = useAdminStore()
  const [note, setNote]       = useState('')
  const [copied, setCopied]   = useState<string | null>(null)
  const [confirmDel, setConfirmDel] = useState<string | null>(null)

  const appUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/registro`
    : 'https://tu-app.vercel.app/registro'

  function handleCreate() {
    createInvite(note.trim() || undefined)
    setNote('')
  }

  function copyLink(code: string) {
    const link = `${appUrl}?invite=${code}`
    navigator.clipboard.writeText(link).then(() => {
      setCopied(code)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  const pending = invites.filter(i => !i.usedBy)
  const used    = invites.filter(i => i.usedBy)

  return (
    <div className="space-y-5">
      {/* Aviso informativo */}
      <div className="bg-[#3B82F6]/10 border border-[#3B82F6]/20 rounded-xl p-3 flex gap-2">
        <AlertTriangle size={14} className="text-[#3B82F6] flex-shrink-0 mt-0.5" />
        <p className="text-xs text-muted leading-relaxed">
          Genera un código, cópialo y comparte el enlace con la persona que quieras invitar.
          Cuando se registre con ese código, aparecerá aquí como usado.
          Con Supabase conectada, la validación es automática y en tiempo real.
        </p>
      </div>

      {/* Crear invitación */}
      <div className="bg-surface border border-border rounded-xl p-4 flex gap-2">
        <input
          className="flex-1 bg-bg border border-border rounded-xl px-3 py-2 text-sm text-text placeholder:text-muted focus:outline-none focus:border-[#7C3AED] transition-colors"
          placeholder="Nota (ej: Para Juan García)..."
          value={note}
          onChange={e => setNote(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
        />
        <button
          onClick={handleCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#7C3AED] text-white rounded-xl text-sm font-semibold hover:bg-[#6D28D9] transition-colors"
        >
          <Plus size={15} /> Generar
        </button>
      </div>

      {/* Pendientes */}
      {pending.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
            Pendientes ({pending.length})
          </p>
          <div className="space-y-2">
            {pending.map(inv => (
              <div key={inv.id} className="bg-surface border border-border rounded-xl px-4 py-3 flex items-center gap-3 group hover:border-[#7C3AED]/30 transition-all">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-[#7C3AED] tracking-widest">{inv.code}</span>
                    {inv.note && <span className="text-xs text-muted truncate">— {inv.note}</span>}
                  </div>
                  <div className="text-xs text-muted mt-0.5 flex items-center gap-1">
                    <Clock size={10} /> Creado {fmtDate(inv.createdAt)}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => copyLink(inv.code)}
                    title="Copiar enlace"
                    className="flex items-center gap-1 px-2.5 py-1.5 border border-border rounded-lg text-xs text-muted hover:text-[#7C3AED] hover:border-[#7C3AED]/40 transition-colors"
                  >
                    {copied === inv.code ? <><Check size={12} className="text-[#22C55E]" /> Copiado</> : <><Copy size={12} /> Copiar enlace</>}
                  </button>
                  {confirmDel === inv.id ? (
                    <div className="flex gap-1">
                      <button onClick={() => { deleteInvite(inv.id); setConfirmDel(null) }} className="text-xs px-2 py-0.5 bg-[#EF4444] text-white rounded-lg font-semibold">Sí</button>
                      <button onClick={() => setConfirmDel(null)} className="text-xs px-2 py-0.5 border border-border rounded-lg text-muted">No</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDel(inv.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Usados */}
      {used.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
            Usados ({used.length})
          </p>
          <div className="space-y-2">
            {used.map(inv => (
              <div key={inv.id} className="bg-surface border border-border rounded-xl px-4 py-3 flex items-center gap-3 opacity-60">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-muted tracking-widest line-through">{inv.code}</span>
                    {inv.note && <span className="text-xs text-muted truncate">— {inv.note}</span>}
                  </div>
                  <div className="text-xs text-muted mt-0.5">
                    Usado por <strong>{inv.usedBy}</strong> el {inv.usedAt ? fmtDate(inv.usedAt) : '—'}
                  </div>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#22C55E]/20 text-[#22C55E]">
                  <Check size={10} className="inline mr-1" />Usado
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {invites.length === 0 && (
        <div className="text-center py-8 text-muted">
          <Link2 size={28} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Genera tu primera invitación</p>
        </div>
      )}
    </div>
  )
}

/* ── Componente principal ─────────────────────── */
export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>('members')
  const { members, invites, syncFromApi, loading, error } = useAdminStore()

  useEffect(() => { syncFromApi() }, [syncFromApi])

  const TABS: { id: Tab; label: string; icon: typeof Users; count?: number }[] = [
    { id: 'members', label: 'Miembros', icon: Users, count: members.length },
    { id: 'invites', label: 'Invitaciones', icon: Link2, count: invites.filter(i => !i.usedBy).length },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#7C3AED]/20 to-[#3B82F6]/10 border border-[#7C3AED]/30 rounded-2xl px-5 py-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#7C3AED] flex items-center justify-center">
          <Shield size={20} className="text-white" />
        </div>
        <div>
          <h2 className="font-bold text-text">Panel de Administración</h2>
          <p className="text-xs text-muted">Gestiona miembros e invitaciones de la comunidad</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-[#22C55E] bg-[#22C55E]/10 px-3 py-1.5 rounded-full border border-[#22C55E]/20">
          <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
          {IS_REMOTE ? 'Conectado a la base de datos' : 'Modo local (desarrollo)'}
        </div>
      </div>

      {error && (
        <p className="text-xs text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl px-3 py-2">
          Error al sincronizar: {error}
        </p>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-surface border border-border rounded-xl p-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id ? 'bg-[#7C3AED] text-white' : 'text-muted hover:text-text'
            }`}
          >
            <t.icon size={15} />
            {t.label}
            {t.count !== undefined && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                tab === t.id ? 'bg-white/20 text-white' : 'bg-surface2 text-muted'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'members' && <MembersTab />}
      {tab === 'invites' && <InvitesTab />}
    </div>
  )
}
