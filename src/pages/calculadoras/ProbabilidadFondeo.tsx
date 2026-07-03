import { useState, useMemo, useCallback } from 'react'
import { Plus, X, Save, Trash2, ChevronDown, ChevronUp, Info } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

/* ─────────────────────────── TIPOS ─────────────────────────── */
interface Phase {
  id: number
  tipo: 'evaluacion' | 'fondeada'
  dd: number
  obj: number
  consistency: number
  ddType: 'EOD' | 'Intraday'
  fixedDD: boolean
  // Solo fondeada
  payoutCap?: number
  limit?: number
  split?: number
}

interface SavedSim {
  id: string
  empresa: string
  tipoCuenta: string
  evalCost: number
  activCost: number
  phases: Phase[]
  results: CalcResults
  date: string
}

interface CalcResults {
  overallProb: number
  phaseProbs: number[]
  expectedReturn: number
  roi: number
  expectedGross: number
}

/* ─────────────────────────── MATEMÁTICA ─────────────────────── */

/**
 * Probabilidad analítica de pasar una fase — Gambler's Ruin con ajuste de consistencia.
 *
 * Fórmula: P = (DD_eff / (DD_eff + OBJ)) × (DD_eff / OBJ)^(1 − C/100)
 *
 * Derivación:
 *  • Base (paseo aleatorio simétrico, sin restricción):  P_base = DD/(DD+OBJ)
 *  • La regla de consistencia limita la ganancia diaria máxima a C%×OBJ,
 *    creando asimetría que reduce la probabilidad. El factor corrector es
 *    (DD/OBJ)^(1−C/100), que vale 1 cuando C=100% (sin restricción) y
 *    disminuye progresivamente cuanto más estricta es la consistencia.
 *  • Intraday aplica un 20% más de restricción sobre el DD efectivo.
 *
 * Verificado contra Tradesfera: DD=2000, OBJ=3000, C=50%, EOD → 32.65% ✓
 */
function calcPhaseProb(dd: number, obj: number, consistency: number, ddType: 'EOD' | 'Intraday'): number {
  if (dd <= 0 || obj <= 0) return 0
  const effDd = ddType === 'Intraday' ? dd * 0.80 : dd
  const base  = effDd / (effDd + obj)
  // consistency=0 significa "sin regla de consistencia" → probabilidad base pura
  if (consistency <= 0) return base
  const consAdj = Math.pow(effDd / obj, 1 - consistency / 100)
  return Math.min(Math.max(base * consAdj, 0), 1)
}


function calcResults(phases: Phase[], evalCost: number, activCost: number): CalcResults {
  const totalCost = evalCost + activCost
  if (phases.length === 0) return { overallProb: 0, phaseProbs: [], expectedReturn: -totalCost, roi: 0, expectedGross: 0 }

  // Probabilidades por fase — fórmula analítica
  const phaseProbs = phases.map(ph =>
    calcPhaseProb(ph.dd, ph.obj, ph.consistency, ph.ddType)
  )
  const overallProb = phaseProbs.reduce((a, p) => a * p, 1)

  // Retorno esperado — fórmula Tradesfera verificada:
  // Esperado_bruto = P_global × OBJ_fondeada × (split/100)
  // Retorno_Neto   = Esperado_bruto − coste_total
  // ROI            = Retorno_Neto / coste_total
  const fundedPhase = [...phases].reverse().find(p => p.tipo === 'fondeada')
  const expectedGross = (fundedPhase?.split)
    ? overallProb * fundedPhase.obj * (fundedPhase.split / 100)
    : 0

  const expectedReturn = expectedGross - totalCost
  const roi            = totalCost > 0 ? expectedReturn / totalCost : 0

  return {
    overallProb:  overallProb * 100,
    phaseProbs:   phaseProbs.map(p => p * 100),
    expectedReturn,
    roi,
    expectedGross,
  }
}

/* ─────────────────────────── COMPONENTES UI ─────────────────── */
function NumInput({ label, value, onChange, prefix = '€', suffix = '', min = 0, step = 1, max }: {
  label?: string; value: number; onChange: (n: number) => void
  prefix?: string; suffix?: string; min?: number; step?: number; max?: number
}) {
  return (
    <div className="flex-1 min-w-0">
      {label && <label className="block text-xs text-muted mb-1">{label}</label>}
      <div className="flex items-center bg-bg border border-border rounded-xl overflow-hidden focus-within:border-[#7C3AED] transition-colors">
        {prefix && <span className="px-2.5 text-muted text-sm border-r border-border">{prefix}</span>}
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="flex-1 bg-transparent px-3 py-2.5 text-sm text-text outline-none"
        />
        {suffix && <span className="px-2.5 text-muted text-sm border-l border-border">{suffix}</span>}
      </div>
    </div>
  )
}

function Select({ label, value, onChange, options }: {
  label?: string; value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="flex-1 min-w-0">
      {label && <label className="block text-xs text-muted mb-1">{label}</label>}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm text-text outline-none focus:border-[#7C3AED] transition-colors"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

/* ─────────────────────────── COMPONENTE PRINCIPAL ─────────────── */
const ACCOUNT_SIZES = ['5k','10k','25k','50k','100k','150k','200k','300k','400k']

let phaseIdCounter = 3

export default function ProbabilidadFondeo() {
  const [empresa,    setEmpresa]    = useState('')
  const [tipoCuenta, setTipoCuenta] = useState('100k')
  const [evalCost,   setEvalCost]   = useState(80)
  const [activCost,  setActivCost]  = useState(0)
  const [phases,     setPhases]     = useState<Phase[]>([
    { id: 1, tipo: 'evaluacion', dd: 2000, obj: 3000, consistency: 50, ddType: 'EOD', fixedDD: true },
    { id: 2, tipo: 'fondeada',   dd: 2000, obj: 3000, consistency: 50, ddType: 'EOD', fixedDD: true, payoutCap: 50, limit: 1000, split: 80 },
  ])
  const [savedSims,  setSavedSims]  = useState<SavedSim[]>(() => {
    try { return JSON.parse(localStorage.getItem('prop-calc-sims') ?? '[]') } catch { return [] }
  })
  const [showSaved, setShowSaved] = useState(false)

  // Calculamos los resultados con useMemo — se recalcula con cada cambio
  const results = useMemo(() => calcResults(phases, evalCost, activCost), [phases, evalCost, activCost])

  /* ── Handlers ─────────────────────────────────────────── */
  const updatePhase = useCallback(<K extends keyof Phase>(id: number, key: K, val: Phase[K]) => {
    setPhases(ps => ps.map(p => p.id === id ? { ...p, [key]: val } : p))
  }, [])

  const addPhase = () => {
    const isFondeada = phases.some(p => p.tipo === 'fondeada')
    setPhases(ps => [...ps, {
      id: phaseIdCounter++,
      tipo: isFondeada ? 'fondeada' : 'evaluacion',
      dd: 2000, obj: 3000, consistency: 50, ddType: 'EOD', fixedDD: true,
      ...(isFondeada ? { payoutCap: 50, limit: 1000, split: 80 } : {}),
    }])
  }

  const removePhase = (id: number) => setPhases(ps => ps.filter(p => p.id !== id))

  const saveSim = () => {
    const sim: SavedSim = {
      id: `sim_${Date.now()}`,
      empresa: empresa || 'Sin nombre',
      tipoCuenta,
      evalCost, activCost, phases,
      results,
      date: new Date().toLocaleDateString('es-ES'),
    }
    const updated = [sim, ...savedSims].slice(0, 20)
    setSavedSims(updated)
    localStorage.setItem('prop-calc-sims', JSON.stringify(updated))
  }

  const deleteSim = (id: string) => {
    const updated = savedSims.filter(s => s.id !== id)
    setSavedSims(updated)
    localStorage.setItem('prop-calc-sims', JSON.stringify(updated))
  }

  const loadSim = (sim: SavedSim) => {
    setEmpresa(sim.empresa)
    setTipoCuenta(sim.tipoCuenta)
    setEvalCost(sim.evalCost)
    setActivCost(sim.activCost)
    setPhases(sim.phases)
  }

  /* ── Colors ───────────────────────────────────────────── */
  const probColor = results.overallProb >= 20 ? '#22C55E' : results.overallProb >= 10 ? '#F59E0B' : '#EF4444'
  const barColors = ['#7C3AED', '#22C55E', '#3B82F6', '#F59E0B', '#EF4444']

  const chartData = phases.map((_ph, i) => ({
    name: `Fase ${i + 1}`,
    prob: Number(results.phaseProbs[i]?.toFixed(1) ?? 0),
  }))

  return (
    <div className="p-6 space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text">Calculadora de Probabilidad</h1>
          <p className="text-sm text-muted mt-0.5">Simula tus posibilidades de éxito en cuentas de fondeo</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={saveSim}
            className="flex items-center gap-2 px-4 py-2 bg-[#7C3AED]/15 border border-[#7C3AED]/30 text-[#7C3AED] rounded-xl text-sm font-medium hover:bg-[#7C3AED]/25 transition-colors"
          >
            <Save size={15} /> Guardar simulación
          </button>
          {savedSims.length > 0 && (
            <button
              onClick={() => setShowSaved(s => !s)}
              className="flex items-center gap-2 px-4 py-2 bg-surface border border-border text-muted rounded-xl text-sm hover:text-text transition-colors"
            >
              {showSaved ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              Historial ({savedSims.length})
            </button>
          )}
        </div>
      </div>

      {/* Historial de simulaciones guardadas */}
      {showSaved && savedSims.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-text text-sm">Simulaciones guardadas</h3>
          </div>
          <div className="divide-y divide-border">
            {savedSims.map(sim => (
              <div key={sim.id} className="flex items-center justify-between px-4 py-3 hover:bg-surface2/50 transition-colors">
                <div className="flex items-center gap-3">
                  <button onClick={() => loadSim(sim)} className="text-left">
                    <div className="text-sm font-medium text-text">{sim.empresa}</div>
                    <div className="text-xs text-muted">{sim.tipoCuenta} · {sim.date} · {sim.phases.length} fases</div>
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-bold" style={{ color: sim.results.overallProb >= 15 ? '#22C55E' : sim.results.overallProb >= 8 ? '#F59E0B' : '#EF4444' }}>
                      {sim.results.overallProb.toFixed(2)}%
                    </div>
                    <div className="text-xs text-muted">ROI {sim.results.roi.toFixed(2)}x</div>
                  </div>
                  <button onClick={() => deleteSim(sim.id)} className="text-muted hover:text-[#EF4444] transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid principal */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">

        {/* ── Panel izquierdo: Inputs ── */}
        <div className="space-y-5">

          {/* Empresa + Tipo */}
          <div className="bg-surface border border-border rounded-2xl p-5">
            <h3 className="font-semibold text-text text-sm mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#7C3AED]/20 flex items-center justify-center text-[#7C3AED] text-xs">🏢</span>
              Empresa
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex-1">
                <label className="block text-xs text-muted mb-1">Nombre</label>
                <input
                  value={empresa}
                  onChange={e => setEmpresa(e.target.value)}
                  placeholder="Ej: FTMO, MyForexFunds…"
                  className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm text-text placeholder:text-muted outline-none focus:border-[#7C3AED] transition-colors"
                />
              </div>
              <Select
                label="Tipo de cuenta"
                value={tipoCuenta}
                onChange={setTipoCuenta}
                options={ACCOUNT_SIZES.map(s => ({ value: s, label: `${s} cuenta` }))}
              />
            </div>
          </div>

          {/* Costes */}
          <div className="bg-surface border border-border rounded-2xl p-5">
            <h3 className="font-semibold text-text text-sm mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#F59E0B]/20 flex items-center justify-center text-xs">🔥</span>
              Costes
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <NumInput label="Evaluación" value={evalCost} onChange={setEvalCost} />
              <NumInput label="Activación" value={activCost} onChange={setActivCost} />
            </div>
          </div>

          {/* Fases */}
          <div className="bg-surface border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-text text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#3B82F6]/20 flex items-center justify-center text-xs">📋</span>
                Fases
              </h3>
              <button
                onClick={addPhase}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-[#7C3AED]/40 text-[#7C3AED] rounded-lg hover:bg-[#7C3AED]/10 transition-colors"
              >
                <Plus size={13} /> Fase
              </button>
            </div>

            <div className="space-y-4">
              {phases.map((ph, idx) => (
                <PhaseCard
                  key={ph.id}
                  phase={ph}
                  index={idx}
                  prob={results.phaseProbs[idx] ?? 0}
                  onUpdate={updatePhase}
                  onRemove={phases.length > 1 ? removePhase : undefined}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Panel derecho: Resultados ── */}
        <div className="space-y-4">

          {/* VEREDICTO */}
          <VeredictCard results={results} totalCost={evalCost + activCost} phases={phases} />

          {/* Probabilidad de Éxito */}
          <div className="bg-surface border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">📊</span>
              <h3 className="font-semibold text-text text-sm">Resultados</h3>
            </div>

            <div className="text-center py-3">
              <div className="text-xs text-muted mb-1">Probabilidad de Éxito</div>
              <div className="text-4xl font-black mb-2" style={{ color: probColor }}>
                {results.overallProb.toFixed(2)}%
              </div>
              {/* Barra de probabilidad */}
              <div className="h-2 bg-bg rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(results.overallProb, 100)}%`, background: probColor }}
                />
              </div>
            </div>

            {/* ROI + Retorno */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-bg rounded-xl p-3 text-center">
                <div className="text-xs text-muted mb-1">Retorno Esperado</div>
                <div className="text-lg font-bold" style={{ color: results.expectedReturn >= 0 ? '#22C55E' : '#EF4444' }}>
                  {results.expectedGross > 0
                    ? `€${results.expectedReturn.toFixed(2)}`
                    : '—'}
                </div>
              </div>
              <div className="bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] rounded-xl p-3 text-center">
                <div className="text-xs text-white/70 mb-1">ROI</div>
                <div className="text-lg font-black text-white">
                  {results.expectedGross > 0 ? `${results.roi.toFixed(2)}x` : '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Desglose por fase */}
          <div className="bg-surface border border-border rounded-2xl p-5">
            <h3 className="font-semibold text-text text-sm mb-3">Desglose por Fase</h3>
            <div className="space-y-2">
              {phases.map((ph, i) => {
                const prob = results.phaseProbs[i] ?? 0
                const color = barColors[i % barColors.length]
                return (
                  <div key={ph.id} className="flex items-center justify-between">
                    <span className="text-xs text-muted">
                      Fase {i + 1} ({ph.tipo === 'evaluacion' ? 'Evaluación' : 'Fondeada'})
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-bg rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${Math.min(prob, 100)}%`, background: color }} />
                      </div>
                      <span className="text-xs font-semibold" style={{ color }}>{prob.toFixed(2)}%</span>
                    </div>
                  </div>
                )
              })}
              {/* Overall */}
              <div className="pt-2 mt-2 border-t border-border flex items-center justify-between">
                <span className="text-xs font-medium text-text">Global</span>
                <span className="text-xs font-black" style={{ color: probColor }}>{results.overallProb.toFixed(2)}%</span>
              </div>
            </div>
          </div>

          {/* Gráfico de barras */}
          <div className="bg-surface border border-border rounded-2xl p-5">
            <h3 className="font-semibold text-text text-sm mb-3">Probabilidad por Fase</h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'var(--color-muted)', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: 'var(--color-muted)', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip
                  contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, fontSize: 12 }}
                  formatter={(v: unknown) => [`${Number(v).toFixed(2)}%`, 'Probabilidad']}
                />
                <Bar dataKey="prob" radius={[6, 6, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={barColors[i % barColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Info tooltip matemática */}
          <div className="bg-[#3B82F6]/10 border border-[#3B82F6]/20 rounded-xl p-3 flex gap-2">
            <Info size={14} className="text-[#3B82F6] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted leading-relaxed">
              Fórmula analítica: P = (DD/(DD+OBJ)) × (DD/OBJ)^(1−C%). Retorno esperado por distribución geométrica de ciclos. Intraday aplica −20% al DD efectivo.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────── VEREDICTO ─────────────────────── */
function VeredictCard({ results, totalCost, phases }: {
  results: CalcResults
  totalCost: number
  phases: Phase[]
}) {
  const prob           = results.overallProb                          // %
  const fundedPhase    = [...phases].reverse().find(p => p.tipo === 'fondeada')
  const grossIfSuccess = fundedPhase ? fundedPhase.obj * (fundedPhase.split ?? 80) / 100 : 0

  // ── Métricas clave ──────────────────────────────────────────
  // Nº esperado de cuentas hasta el 1er éxito (distribución geométrica)
  const accountsToSuccess = prob > 0 ? Math.ceil(100 / prob) : 0
  // Inversión total esperada hasta el 1er éxito
  const investToSuccess   = totalCost > 0 ? accountsToSuccess * totalCost : 0
  // Beneficio NETO tras conseguir ese primer éxito
  const netAfterSuccess   = grossIfSuccess - investToSuccess
  // Nº mínimo de cuentas para break-even (invertir = retiro)
  const breakEvenAccounts = (totalCost > 0 && grossIfSuccess > 0)
    ? Math.ceil(grossIfSuccess / totalCost)
    : 0
  // Prob acumulada de al menos 1 éxito comprando N cuentas: 1-(1-p)^N
  const probAtLeastOneIn5  = prob > 0 ? (1 - Math.pow(1 - prob / 100, 5))  * 100 : 0
  const probAtLeastOneIn10 = prob > 0 ? (1 - Math.pow(1 - prob / 100, 10)) * 100 : 0

  // ── Nivel de veredicto ──────────────────────────────────────
  const verdict = results.roi >= 1
    ? { label: 'Muy Rentable',  color: '#22C55E', bg: '#22C55E15', border: '#22C55E30', icon: '🚀' }
    : results.roi >= 0
    ? { label: 'Rentable',      color: '#22C55E', bg: '#22C55E10', border: '#22C55E25', icon: '✅' }
    : results.roi >= -0.3
    ? { label: 'Marginal',      color: '#F59E0B', bg: '#F59E0B10', border: '#F59E0B30', icon: '⚠️' }
    : { label: 'No Rentable',   color: '#EF4444', bg: '#EF444410', border: '#EF444430', icon: '❌' }

  if (prob === 0 || totalCost === 0) return null

  return (
    <div className="rounded-2xl overflow-hidden border" style={{ background: verdict.bg, borderColor: verdict.border }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: verdict.border }}>
        <span className="text-base">{verdict.icon}</span>
        <span className="font-bold text-sm" style={{ color: verdict.color }}>Veredicto — {verdict.label}</span>
      </div>

      {/* Resumen en texto */}
      <div className="px-4 pt-3 pb-1">
        <p className="text-xs text-text leading-relaxed">
          Con esta configuración, estadísticamente necesitas comprar{' '}
          <span className="font-black" style={{ color: verdict.color }}>~{accountsToSuccess} cuentas</span>
          {totalCost > 0 && (
            <> (<span className="font-semibold">€{investToSuccess.toFixed(0)} invertidos</span>)</>
          )}{' '}
          para esperar <strong>pasar una evaluación y hacer tu primer retiro</strong>.{' '}
          {grossIfSuccess > 0 && (
            <>
              Si lo consigues, retirarás <span className="font-black text-[#22C55E]">€{grossIfSuccess.toFixed(0)}</span>,
              quedando un {netAfterSuccess >= 0
                ? <><span className="font-bold text-[#22C55E]">beneficio neto de €{netAfterSuccess.toFixed(0)}</span>.</>
                : <><span className="font-bold text-[#EF4444]">pérdida neta de €{Math.abs(netAfterSuccess).toFixed(0)}</span>.</>
              }
            </>
          )}
        </p>
      </div>

      {/* Métricas en grid */}
      <div className="grid grid-cols-2 gap-2 p-3">
        <MetricRow
          icon="🎯"
          label="Cuentas hasta 1er retiro"
          value={`~${accountsToSuccess}`}
          sub={totalCost > 0 ? `€${investToSuccess.toFixed(0)} total` : undefined}
          color={verdict.color}
        />
        <MetricRow
          icon="💰"
          label="Cobras si tienes éxito"
          value={grossIfSuccess > 0 ? `€${grossIfSuccess.toFixed(0)}` : '—'}
          sub={netAfterSuccess >= 0 ? `+€${netAfterSuccess.toFixed(0)} neto` : `-€${Math.abs(netAfterSuccess).toFixed(0)} neto`}
          color={netAfterSuccess >= 0 ? '#22C55E' : '#EF4444'}
        />
        <MetricRow
          icon="⚖️"
          label="Break-even"
          value={breakEvenAccounts > 0 ? `${breakEvenAccounts} cuentas` : '—'}
          sub={`para cubrir el retiro`}
          color="#F59E0B"
        />
        <MetricRow
          icon="📊"
          label="Prob. acum. en 10 cuentas"
          value={`${probAtLeastOneIn10.toFixed(1)}%`}
          sub={`${probAtLeastOneIn5.toFixed(1)}% en 5 cuentas`}
          color="#3B82F6"
        />
      </div>

      {/* Barra visual de probabilidad acumulada */}
      <div className="px-4 pb-4 space-y-1">
        <div className="flex justify-between text-[10px] text-muted mb-1">
          <span>Prob. de al menos 1 éxito comprando N cuentas</span>
          <span>100%</span>
        </div>
        <div className="h-3 bg-bg/60 rounded-full overflow-hidden flex">
          {Array.from({ length: Math.min(accountsToSuccess * 2, 20) }, (_, i) => {
            const p = prob > 0 ? (1 - Math.pow(1 - prob / 100, i + 1)) * 100 : 0
            return (
              <div
                key={i}
                className="h-full flex-1 transition-all"
                style={{
                  background: p < 33 ? '#EF4444' : p < 66 ? '#F59E0B' : '#22C55E',
                  opacity: 0.3 + (p / 100) * 0.7,
                }}
                title={`${i + 1} cuentas: ${p.toFixed(1)}%`}
              />
            )
          })}
        </div>
        <div className="flex justify-between text-[10px] text-muted">
          <span>1 cuenta</span>
          <span>{Math.min(accountsToSuccess * 2, 20)} cuentas</span>
        </div>
      </div>
    </div>
  )
}

function MetricRow({ icon, label, value, sub, color }: {
  icon: string; label: string; value: string; sub?: string; color: string
}) {
  return (
    <div className="bg-bg/50 rounded-xl p-2.5">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-sm">{icon}</span>
        <span className="text-[10px] text-muted leading-tight">{label}</span>
      </div>
      <div className="font-black text-sm" style={{ color }}>{value}</div>
      {sub && <div className="text-[10px] text-muted mt-0.5">{sub}</div>}
    </div>
  )
}

/* ─────────────────────────── PHASE CARD ─────────────────────── */
function PhaseCard({ phase, index, prob, onUpdate, onRemove }: {
  phase: Phase
  index: number
  prob: number
  onUpdate: <K extends keyof Phase>(id: number, key: K, val: Phase[K]) => void
  onRemove?: (id: number) => void
}) {
  const isFondeada = phase.tipo === 'fondeada'
  const color = isFondeada ? '#7C3AED' : '#3B82F6'
  const probColor = prob >= 30 ? '#22C55E' : prob >= 15 ? '#F59E0B' : '#EF4444'

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-bg">
      {/* Header de la fase */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-bg border-2 flex items-center justify-center text-xs font-bold text-text" style={{ borderColor: color }}>
            {index + 1}
          </span>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={isFondeada
              ? { background: 'transparent', color: 'var(--color-muted)', border: '1px solid var(--color-border)' }
              : { background: `${color}25`, color }}
          >
            Evaluación
          </span>
          <span
            className="text-xs font-bold px-3 py-1 rounded-full transition-all"
            style={isFondeada
              ? { background: `linear-gradient(135deg, #7C3AED, #5B21B6)`, color: '#fff', boxShadow: '0 0 10px #7C3AED55' }
              : { background: 'transparent', color: 'var(--color-muted)', border: '1px solid var(--color-border)' }}
          >
            Fondeada
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold" style={{ color: probColor }}>{prob.toFixed(2)}%</span>
          {onRemove && (
            <button onClick={() => onRemove(phase.id)} className="text-muted hover:text-[#EF4444] transition-colors">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* DD, Objetivo, Consistencia */}
        <div className="grid grid-cols-3 gap-2">
          <NumInput label="Drawdown" value={phase.dd} onChange={v => onUpdate(phase.id, 'dd', v)} prefix="$" />
          <NumInput label="Objetivo" value={phase.obj} onChange={v => onUpdate(phase.id, 'obj', v)} prefix="$" />
          <NumInput label="Consistencia" value={phase.consistency} onChange={v => onUpdate(phase.id, 'consistency', v)} prefix="" suffix="%" min={1} max={100} />
        </div>

        {/* Tipo DD + checkbox */}
        <div className="flex items-center gap-3">
          <Select
            label="Tipo DD"
            value={phase.ddType}
            onChange={v => onUpdate(phase.id, 'ddType', v as 'EOD' | 'Intraday')}
            options={[{ value: 'EOD', label: 'EOD' }, { value: 'Intraday', label: 'Intradía' }]}
          />
          <label className="flex items-center gap-1.5 cursor-pointer pt-5 shrink-0">
            <input
              type="checkbox"
              checked={phase.fixedDD}
              onChange={e => onUpdate(phase.id, 'fixedDD', e.target.checked)}
              className="w-3.5 h-3.5 accent-[#7C3AED]"
            />
            <span className="text-xs text-muted whitespace-nowrap">DD se fija al superar DD inicial</span>
          </label>
        </div>

        {/* Parámetros de fondeada */}
        {isFondeada && (
          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border">
            <NumInput label="Payout Cap" value={phase.payoutCap ?? 50} onChange={v => onUpdate(phase.id, 'payoutCap', v)} prefix="" suffix="%" />
            <NumInput label="Límite" value={phase.limit ?? 1000} onChange={v => onUpdate(phase.id, 'limit', v)} />
            <NumInput label="Split" value={phase.split ?? 80} onChange={v => onUpdate(phase.id, 'split', v)} prefix="" suffix="%" />
          </div>
        )}
      </div>
    </div>
  )
}
