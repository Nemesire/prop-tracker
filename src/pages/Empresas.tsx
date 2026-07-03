import { useState } from 'react'
import { Plus, Pencil, Trash2, X, Check, Building2 } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import type { Company } from '../types'

const PRESET_COLORS = [
  '#7C3AED','#3B82F6','#22C55E','#F59E0B','#EF4444',
  '#EC4899','#06B6D4','#10B981','#F97316','#8B5CF6',
  '#14B8A6','#6366F1','#A855F7','#2563EB','#00C2FF',
]

function CompanyForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<Company>
  onSave: (data: Omit<Company, 'id'>) => void
  onCancel: () => void
}) {
  const [name,    setName]    = useState(initial?.name    ?? '')
  const [color,   setColor]   = useState(initial?.color   ?? '#7C3AED')
  const [website, setWebsite] = useState(initial?.website ?? '')
  const [country, setCountry] = useState(initial?.country ?? '')
  const [err,     setErr]     = useState('')

  function handleSave() {
    if (!name.trim()) { setErr('El nombre es obligatorio'); return }
    onSave({ name: name.trim(), color, website: website.trim() || undefined, country: country.trim() || undefined })
  }

  const inputCls = 'w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm text-text outline-none focus:border-[#7C3AED] transition-colors'

  return (
    <div className="bg-surface border border-[#7C3AED]/30 rounded-2xl p-5 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Nombre */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-muted mb-1.5">Nombre de la empresa *</label>
          <input
            className={inputCls}
            value={name}
            onChange={e => { setName(e.target.value); setErr('') }}
            placeholder="Ej: FTMO, Topstep…"
            autoFocus
          />
          {err && <p className="text-xs text-[#EF4444] mt-1">{err}</p>}
        </div>

        {/* Website */}
        <div>
          <label className="block text-xs font-medium text-muted mb-1.5">Website (opcional)</label>
          <input
            className={inputCls}
            value={website}
            onChange={e => setWebsite(e.target.value)}
            placeholder="https://ftmo.com"
          />
        </div>

        {/* País */}
        <div>
          <label className="block text-xs font-medium text-muted mb-1.5">País (opcional)</label>
          <input
            className={inputCls}
            value={country}
            onChange={e => setCountry(e.target.value)}
            placeholder="República Checa"
          />
        </div>

        {/* Color */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-muted mb-2">Color identificador</label>
          <div className="flex items-center gap-2 flex-wrap">
            {PRESET_COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                style={{
                  background: c,
                  borderColor: color === c ? '#fff' : 'transparent',
                  boxShadow: color === c ? `0 0 0 2px ${c}` : 'none',
                }}
              />
            ))}
            {/* Color personalizado */}
            <label className="w-7 h-7 rounded-full border-2 border-border cursor-pointer overflow-hidden hover:scale-110 transition-transform" title="Color personalizado">
              <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-full h-full opacity-0 cursor-pointer" />
              <span className="w-full h-full flex items-center justify-center text-[10px] text-muted -mt-7">+</span>
            </label>
            {/* Preview */}
            <div className="ml-2 flex items-center gap-2">
              <div className="w-7 h-7 rounded-full border-2 border-white/20" style={{ background: color }} />
              <span className="text-xs text-muted font-mono">{color}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-[#7C3AED] text-white rounded-xl text-sm font-medium hover:bg-[#6D28D9] transition-colors"
        >
          <Check size={15} /> Guardar
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2 bg-surface2 text-muted rounded-xl text-sm hover:text-text transition-colors"
        >
          <X size={15} /> Cancelar
        </button>
      </div>
    </div>
  )
}

export default function Empresas() {
  const { companies, addCompany, updateCompany, deleteCompany, currentUser } = useAppStore()
  const [showForm,     setShowForm]     = useState(false)
  const [editingId,    setEditingId]    = useState<string | null>(null)
  const [confirmDel,   setConfirmDel]   = useState<string | null>(null)
  const [search,       setSearch]       = useState('')

  const filtered = companies.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  // Cuántas cuentas tiene cada empresa (del usuario actual)
  const accountCounts = Object.fromEntries(
    companies.map(c => [
      c.id,
      currentUser?.accounts.filter(a => a.company === c.name).length ?? 0,
    ])
  )

  function handleAdd(data: Omit<Company, 'id'>) {
    addCompany(data)
    setShowForm(false)
  }

  function handleUpdate(id: string, data: Omit<Company, 'id'>) {
    updateCompany(id, data)
    setEditingId(null)
  }

  function handleDelete(id: string) {
    deleteCompany(id)
    setConfirmDel(null)
  }

  return (
    <div className="p-6 space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text">Empresas de Fondeo</h1>
          <p className="text-sm text-muted mt-0.5">{companies.length} empresas registradas</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null) }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#7C3AED] text-white rounded-xl text-sm font-medium hover:bg-[#6D28D9] transition-colors"
        >
          <Plus size={16} /> Nueva Empresa
        </button>
      </div>

      {/* Formulario nueva empresa */}
      {showForm && (
        <CompanyForm
          onSave={handleAdd}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Buscador */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Buscar empresa…"
        className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-muted outline-none focus:border-[#7C3AED] transition-colors"
      />

      {/* Lista */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-muted text-sm">
            <Building2 size={32} className="mx-auto mb-3 opacity-30" />
            {search ? 'Sin resultados' : 'No hay empresas registradas'}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(company => (
              <div key={company.id}>
                {editingId === company.id ? (
                  <div className="p-4">
                    <CompanyForm
                      initial={company}
                      onSave={data => handleUpdate(company.id, data)}
                      onCancel={() => setEditingId(null)}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-4 px-5 py-4 hover:bg-surface2/50 transition-colors group">
                    {/* Color dot */}
                    <div
                      className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
                      style={{ background: `${company.color}25`, border: `2px solid ${company.color}60` }}
                    >
                      <span className="font-black text-sm" style={{ color: company.color }}>
                        {company.name.slice(0, 2).toUpperCase()}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-text text-sm">{company.name}</span>
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ background: company.color }}
                        />
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {company.country && (
                          <span className="text-xs text-muted">{company.country}</span>
                        )}
                        {company.website && (
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#7C3AED] hover:underline truncate max-w-[200px]"
                          >
                            {company.website.replace(/^https?:\/\//, '')}
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Cuentas asociadas */}
                    <div className="text-right flex-shrink-0 hidden sm:block">
                      <div className="text-sm font-semibold text-text">{accountCounts[company.id] ?? 0}</div>
                      <div className="text-xs text-muted">cuentas</div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      {confirmDel === company.id ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-[#EF4444] whitespace-nowrap">¿Eliminar?</span>
                          <button
                            onClick={() => handleDelete(company.id)}
                            className="px-2 py-1 bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] rounded-lg text-xs hover:bg-[#EF4444]/25 transition-colors"
                          >Sí</button>
                          <button
                            onClick={() => setConfirmDel(null)}
                            className="px-2 py-1 bg-surface2 text-muted rounded-lg text-xs hover:text-text transition-colors"
                          >No</button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => { setEditingId(company.id); setShowForm(false) }}
                            className="p-1.5 text-muted hover:text-[#7C3AED] transition-colors rounded-lg hover:bg-[#7C3AED]/10"
                            title="Editar"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setConfirmDel(company.id)}
                            className="p-1.5 text-muted hover:text-[#EF4444] transition-colors rounded-lg hover:bg-[#EF4444]/10"
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
