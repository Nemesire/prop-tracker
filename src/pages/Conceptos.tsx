import { useState } from 'react'
import { Search, BookOpen, Shield, Brain, Target, DollarSign, BarChart2, Zap, Star, ChevronDown, AlertTriangle } from 'lucide-react'

type Category = 'all' | 'favoritos' | 'riesgo' | 'capital' | 'metricas' | 'reglas' | 'psicologia'

interface Concept {
  id: string
  title: string
  category: Exclude<Category, 'all' | 'favoritos'>
  summary: string
  description: string
  formula?: string
  example?: string
  tags: string[]
}

const CONCEPTS: Concept[] = [
  {
    id: 'riesgo-asimetrico',
    title: 'Riesgo Asimétrico',
    category: 'riesgo',
    summary: 'Arriesgar poco para ganar mucho. La base de cualquier sistema rentable.',
    description: 'El riesgo asimétrico implica que el beneficio potencial es significativamente mayor que la pérdida máxima asumida. En las cuentas fondeadas este concepto cobra especial importancia: el coste real de una evaluación va de 30 a 100 dólares aproximadamente. Aunque operes con una cuenta de 100.000$ y pierdas -2.000$ o -2.500$ durante el proceso, tu pérdida real no es esa cantidad — es únicamente lo que pagaste por el examen (los 30-100$). Eso es radicalmente diferente a perder ese dinero operando con tu propio capital real, donde cada pérdida sale directamente de tu bolsillo. Las fondeadas trasladan el riesgo operativo a la empresa, y tú solo arriesgas el coste de entrada.',
    formula: 'R:R = Beneficio objetivo / Pérdida máxima',
    example: 'Pagas 80$ por una evaluación de 100.000$. Si la cuenta cae -2.500$ y la pierdes, tu pérdida real son 80$ — no 2.500$. Si la superas y retiras 3.000$, tu R:R real es 3.000/80 = 37.5:1.',
    tags: ['R:R', 'stop loss', 'take profit'],
  },
  {
    id: 'ratios-inversos',
    title: 'Ratios Inversos',
    category: 'riesgo',
    summary: 'Operar con R:R menor a 1:1 compensado con un win rate muy alto. Estrategia de alto riesgo.',
    description: 'Los ratios inversos son operativas donde se arriesga más de lo que se pretende ganar en cada trade. Por ejemplo, un R:R de 0.5:1 significa arriesgar 100$ para ganar 50$. Para que este sistema sea rentable matemáticamente, el win rate debe ser muy elevado (por encima del 67% en el ejemplo anterior). En fondeadas, esta estrategia es especialmente peligrosa: una racha corta de pérdidas puede consumir rápidamente el drawdown permitido, ya que cada operación perdedora pesa el doble que cada ganadora. Muchos traders principiantes caen en este patrón de forma inconsciente al mover el stop loss o no respetar el take profit por miedo. El mercado castiga duramente los ratios inversos en el largo plazo, ya que una sola mala racha puede superar el drawdown máximo de la fondeada antes de que el win rate tenga tiempo de compensar.',
    formula: 'Win Rate mínimo = Pérdida / (Pérdida + Ganancia)',
    example: 'R:R inverso 2:1 (arriesgas 200$ para ganar 100$) → necesitas ganar el 67% de las operaciones solo para no perder dinero. Con 40% de win rate perderías 80$ por cada 10 trades.',
    tags: ['win rate', 'scalping', 'gestión'],
  },
  {
    id: 'bankroll',
    title: 'Bankroll',
    category: 'capital',
    summary: 'El capital total disponible para trading, incluyendo todas tus cuentas.',
    description: 'El bankroll es el dinero total que tienes destinado a trading. En el contexto de las fondeadas, incluye tanto el dinero invertido en evaluaciones (coste de los exámenes) como el capital gestionado en cuentas live. Gestionar bien el bankroll implica no exponer más de un porcentaje fijo por operación y diversificar entre varias cuentas o empresas.\n\nUn punto crítico y muchas veces ignorado: necesitas tener entre 3.000 y 4.000 € de bankroll para no morir en el intento. Con menos, una racha de evaluaciones fallidas te deja sin munición antes de que tu sistema pueda demostrar que funciona. El dinero no es solo capital — es tiempo, es paciencia, es la posibilidad de seguir intentándolo. Sin ese colchón mínimo, el desánimo y la presión psicológica te llevan a tomar decisiones desesperadas o a abandonar justo antes de que las cosas empiecen a funcionar. Preservar el bankroll es preservar la perseverancia.\n\nY sobre todo: el objetivo final es RETIRAR. Entre el coste de la evaluación y el fee de activación de la cuenta real, el desembolso total ronda los 100–150 $. A cambio, si lo haces bien, puedes retirar 1.500 o 2.000 $ en el primer pago. Esa asimetría es brutal — gastas 150 $ para cobrar 1.500 $. Eso es exactamente de lo que trata este negocio.',
    formula: 'Riesgo por operación = Bankroll × % riesgo máximo',
    example: 'Con un bankroll de €3.500 puedes permitirte 35–40 evaluaciones fallidas a 80–100$ cada una antes de quedarte sin fondo. Eso te da margen real para aprender, ajustar y perseverar. Y cuando la cuenta funciona: pagas ~150$ en fees y cobras 1.500–2.000$ en el primer retiro. R:R real de 10:1 o más.',
    tags: ['gestión de capital', 'diversificación'],
  },
  {
    id: 'riesgo-ruina',
    title: 'Riesgo de Ruina',
    category: 'riesgo',
    summary: 'Probabilidad de perder todo el capital. Cuanto más bajo, más sostenible es tu trading.',
    description: 'El riesgo de ruina es la probabilidad matemática de que una racha de pérdidas consecutivas destruya tu cuenta. En fondeadas, la ruina equivale a superar el drawdown máximo permitido. Depende directamente de tu win rate, el ratio R:R y el porcentaje de riesgo por operación. Cuanto mayor sea el riesgo por trade, más probable es la ruina aunque el sistema sea rentable.',
    formula: 'RR ≈ ((1 - WR) / WR) ^ (Capital / Pérdida_por_trade)',
    example: 'Con 50% de win rate, R:R 1:1 y 2% de riesgo por trade, el riesgo de ruina supera el 40%.',
    tags: ['drawdown', 'racha perdedora', 'sostenibilidad'],
  },
  {
    id: 'drawdown-maximo',
    title: 'Drawdown Máximo',
    category: 'reglas',
    summary: 'La caída máxima permitida desde el balance más alto. Regla clave en todas las fondeadas.',
    description: 'El drawdown máximo (Max Drawdown) es el límite de pérdida total que una empresa de fondeo te permite antes de cerrar tu cuenta. Suele ser del 8–12% del capital inicial. Existen dos tipos: absoluto (desde el balance inicial) y relativo (trailing, desde el punto más alto alcanzado). Superar este límite implica perder la cuenta automáticamente.',
    formula: 'DD = (Pico - Valle) / Pico × 100',
    example: 'En FTMO con €100.000, el DD máximo es del 10% (€10.000). Si bajas de €90.000, la cuenta se cierra.',
    tags: ['FTMO', 'límite', 'trailing'],
  },
  {
    id: 'trailing-drawdown',
    title: 'Trailing Drawdown',
    category: 'reglas',
    summary: 'Drawdown que sigue tu máximo histórico. El más exigente y común en fondeadas modernas.',
    description: 'El trailing drawdown se mueve junto con el balance más alto alcanzado. Si ganas €2.000 en tu cuenta de €100.000, el nuevo suelo pasa a ser €92.000 en vez de €90.000. Esto significa que tus ganancias no "acolchan" el límite — tienes que mantener la consistencia en todo momento. Empresas como Topstep o Apex utilizan este modelo.',
    example: 'Balance inicial €100.000. Llegas a €105.000. El trailing drawdown de €3.000 sube: no puedes bajar de €102.000.',
    tags: ['Topstep', 'Apex', 'dinámico'],
  },
  {
    id: 'profit-factor',
    title: 'Profit Factor',
    category: 'metricas',
    summary: 'Cociente entre ganancias brutas y pérdidas brutas. Por encima de 1.5 es robusto.',
    description: 'El Profit Factor mide la eficiencia global de un sistema de trading. Un PF de 1.0 significa que empatas. Por encima de 1.5 se considera un sistema sólido; por encima de 2.0, excelente. Las fondeadas suelen exigir un PF mínimo o una consistencia de que ningún día represente más del 30–40% del beneficio total.',
    formula: 'PF = Suma de ganancias / Suma de pérdidas (valores absolutos)',
    example: 'Si ganaste €3.000 en operaciones ganadoras y perdiste €1.500 en perdedoras, PF = 2.0.',
    tags: ['eficiencia', 'consistencia', 'sistema'],
  },
  {
    id: 'win-rate',
    title: 'Win Rate',
    category: 'metricas',
    summary: 'Porcentaje de operaciones ganadoras. No es lo único importante: importa el R:R.',
    description: 'El win rate es el porcentaje de trades que cierran en positivo. Un win rate alto no garantiza rentabilidad si las pérdidas son mayores que las ganancias. En fondeadas, un win rate del 40% con R:R de 2:1 es más rentable que un 70% con R:R de 0.5:1. El mercado penaliza sistemas con win rate alto pero pérdidas grandes.',
    formula: 'WR = Trades ganadores / Total de trades × 100',
    example: 'Con WR 40% y R:R 2:1: Expectativa = 0.4×2 - 0.6×1 = 0.2 → rentable.',
    tags: ['ratio', 'operaciones', 'estadística'],
  },
  {
    id: 'expectativa-matematica',
    title: 'Expectativa Matemática',
    category: 'metricas',
    summary: 'Ganancia media esperada por cada euro arriesgado. Debe ser positiva para ser rentable.',
    description: 'La expectativa matemática combina el win rate y el ratio R:R para determinar si un sistema es rentable en el largo plazo. Es el resultado esperado por cada unidad de riesgo. Un sistema con expectativa positiva ganará dinero con suficientes operaciones, aunque tenga rachas de pérdidas. Es la base matemática del edge en trading.',
    formula: 'E = (WR × Ganancia_media) - ((1 - WR) × Pérdida_media)',
    example: 'WR 45%, ganancia media €200, pérdida media €100 → E = 0.45×200 - 0.55×100 = €35 por trade.',
    tags: ['edge', 'largo plazo', 'matemáticas'],
  },
  {
    id: 'position-sizing',
    title: 'Tamaño de Posición',
    category: 'capital',
    summary: 'Cuántos lotes o contratos operar según el riesgo máximo permitido por trade.',
    description: 'El position sizing determina el número de lotes, contratos o acciones que debes operar para que tu stop loss represente exactamente el porcentaje de riesgo deseado. En fondeadas es crítico: operar demasiado grande en una sola operación puede eliminar la cuenta con un solo movimiento adverso.',
    formula: 'Lotes = (Capital × % riesgo) / (Stop Loss en pips × Valor por pip)',
    example: 'Cuenta €100.000, riesgo 1% (€1.000), stop 20 pips, valor pip €10/lot → 1.000/(20×10) = 5 lotes.',
    tags: ['lotes', 'stop loss', 'gestión'],
  },
  {
    id: 'regla-consistencia',
    title: 'Regla de Consistencia',
    category: 'reglas',
    summary: 'Límite que impone que ningún día represente más del 30–40% del beneficio total.',
    description: 'Muchas empresas de fondeo (FTMO, The5ers) aplican una regla de consistencia que rechaza el pago de beneficios si un solo día representa más del 30–40% del total ganado. Esto busca descartar traders que ganan todo en un día con suerte o sobreexposición. Obliga a tener un rendimiento regular y estable a lo largo del tiempo.',
    example: 'Si ganaste €5.000 en el mes pero €3.000 llegaron en un solo día (60%), FTMO puede rechazar el pago.',
    tags: ['FTMO', 'The5ers', 'pagos'],
  },
  {
    id: 'apalancamiento',
    title: 'Apalancamiento',
    category: 'riesgo',
    summary: 'Multiplicador de exposición. Permite controlar más capital del que tienes en cuenta.',
    description: 'El apalancamiento permite controlar una posición mayor al capital disponible. En fondeadas con €100.000 y apalancamiento 1:100, puedes abrir posiciones de hasta €10.000.000. Sin embargo, cuanto mayor es el apalancamiento, más pequeño puede ser el movimiento adverso que elimina la cuenta. La mayoría de traders profesionales usan un apalancamiento efectivo de 5:1 a 20:1.',
    formula: 'Exposición real = Capital × Apalancamiento utilizado',
    example: 'Abrir 10 lotes en EUR/USD con €100.000 equivale a controlar €1.000.000 → apalancamiento efectivo 10:1.',
    tags: ['margen', 'exposición', 'forex'],
  },
  {
    id: 'racha-perdedora',
    title: 'Racha Perdedora (Drawdown)',
    category: 'psicologia',
    summary: 'Serie de pérdidas consecutivas. Todo sistema rentable las tiene. Hay que planificarlas.',
    description: 'Una racha perdedora es inevitable en cualquier sistema de trading, incluso en los rentables. La clave es conocer de antemano cuántas pérdidas consecutivas puede generar tu sistema y asegurarte de que el drawdown acumulado no supere el límite de la fondeada. Un sistema con WR del 50% puede generar rachas de 8–10 pérdidas seguidas con probabilidad significativa.',
    formula: 'Racha máxima esperada ≈ log(n) / log(1/WR)',
    example: 'Con WR 50% y 100 trades, es estadísticamente normal tener una racha de 7 pérdidas seguidas.',
    tags: ['psicología', 'estadística', 'planificación'],
  },
  {
    id: 'objetivo-beneficio',
    title: 'Objetivo de Beneficio',
    category: 'reglas',
    summary: 'Meta mínima de ganancia para superar la fase de evaluación o challenge.',
    description: 'El objetivo de beneficio es el porcentaje o importe mínimo que debes alcanzar para superar la fase de evaluación de una fondeada. Suele ser del 8–10% en la fase 1 y del 5% en la fase 2. Debe alcanzarse respetando todas las reglas de drawdown, trading days mínimos y consistencia. Correr demasiado hacia el objetivo suele hacer que se violen otras reglas.',
    example: 'FTMO Phase 1: objetivo 10% (€10.000 en cuenta de €100.000) con máximo 10% DD y mínimo 4 días de trading.',
    tags: ['evaluación', 'challenge', 'FTMO'],
  },
  {
    id: 'escala-capital',
    title: 'Escalado de Capital',
    category: 'capital',
    summary: 'Plan de crecimiento de capital ofrecido por la fondeada según tus resultados.',
    description: 'Muchas empresas de fondeo ofrecen planes de escalado que aumentan el capital gestionado a medida que demuestras resultados consistentes. Por ejemplo, tras 3–6 meses rentables, pueden doblar o triplicar tu cuenta. Esto permite crecer sin aportar más capital propio, manteniendo el mismo porcentaje de reparto de beneficios.',
    example: 'The5ers: empiezas con €10.000, tras alcanzar 10% de beneficio doblan a €20.000 automáticamente.',
    tags: ['crecimiento', 'The5ers', 'compound'],
  },
  {
    id: 'drawdown-diario',
    title: 'Pérdida Diaria Máxima',
    category: 'reglas',
    summary: 'Límite de pérdida en un solo día. Superarlo cierra la cuenta aunque no hayas tocado el DD total.',
    description: 'La pérdida diaria máxima es un límite independiente del drawdown máximo total. Si en un solo día pierdes más del 4–5% del capital, la cuenta se cierra automáticamente aunque el balance general esté en positivo. Obliga a los traders a cortar las pérdidas durante el día y no intentar recuperar todo de golpe.',
    example: 'Cuenta €100.000, límite diario 5% = €5.000. Si pierdes €5.001 en un día, la cuenta se suspende.',
    tags: ['reglas', 'límite diario', 'stop day'],
  },
  {
    id: 'reparto-beneficios',
    title: 'Reparto de Beneficios (Split)',
    category: 'capital',
    summary: 'Porcentaje de las ganancias que te queda a ti vs. lo que se queda la fondeada.',
    description: 'El reparto de beneficios determina qué parte de las ganancias generadas en la cuenta fondeada recibes tú. Suele oscilar entre el 70% y el 90% para el trader. Cuanto más alto el split y menos restricciones de pago, más atractiva es la fondeada. Algunos brokers permiten llegar al 100% tras ciertos niveles de escalado.',
    example: 'Con split 80/20 y €5.000 de beneficio mensual: €4.000 para ti, €1.000 para la empresa.',
    tags: ['pago', 'split', 'ingresos'],
  },
]

const CATEGORY_META: Record<Category, { label: string; icon: React.ReactNode; color: string }> = {
  all:        { label: 'Todos',      icon: <BookOpen size={14} />,   color: '#7C3AED' },
  favoritos:  { label: 'Favoritos',  icon: <Star size={14} />,       color: '#F59E0B' },
  riesgo:     { label: 'Riesgo',     icon: <Shield size={14} />,     color: '#EF4444' },
  capital:    { label: 'Capital',    icon: <DollarSign size={14} />, color: '#22C55E' },
  metricas:   { label: 'Métricas',   icon: <BarChart2 size={14} />,  color: '#3B82F6' },
  reglas:     { label: 'Reglas',     icon: <Target size={14} />,     color: '#F59E0B' },
  psicologia: { label: 'Psicología', icon: <Brain size={14} />,      color: '#8B5CF6' },
}

const STORAGE_KEY = 'pt-conceptos-favoritos'

function loadFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch { return new Set() }
}

function saveFavorites(fav: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...fav]))
}

/* ── Reglas de Consistencia ─────────────────────────────────── */
const REGLAS = [
  {
    num: '1',
    title: 'Bankroll mínimo de 2.000–3.000 €',
    color: '#22C55E',
    body: 'Contar con un bankroll de entre 2.000 y 3.000 € es la base para no matar la esperanza matemática. Con menos capital, una racha de evaluaciones fallidas agota el fondo antes de que el sistema tenga tiempo de demostrar su edge. Este colchón te permite encajar pérdidas de exámenes sin comprometer la operativa.',
    warning: null,
  },
  {
    num: '2',
    title: 'Separar las dos fases: Evaluación y Ordeño',
    color: '#3B82F6',
    body: 'Cada fase exige una mentalidad distinta:',
    bullets: [
      'Evaluación: cuanto antes la pases, mejor. Aquí se opera más arriesgado, con el objetivo de llegar al profit target lo antes posible sin violar el drawdown.',
      'Ordeño: a veces el primer día te juegas el colchón inicial, y el resto de días (ver regla de días mínimos de la empresa) simplemente cumples esa regla mínima de días y retiras el mínimo permitido para no matar la cuenta — o directamente sacas todo y das la cuenta por muerta y vuelves a empezar.',
    ],
    warning: '⚠️ Revisa siempre bien las normas específicas de cada empresa antes de operar.',
  },
  {
    num: '3',
    title: 'Usar Ratios Negativos (Inversos) en la operativa',
    color: '#F97316',
    body: 'Arriesgar 1 para ganar 0.5 (ratio inverso) puede ser parte de una estrategia de ordeño controlada. Sin embargo, hay que vigilar muy de cerca la regla de consistencia: si un solo día representa demasiado porcentaje del beneficio total acumulado, la empresa puede rechazar el pago o bloquear la cuenta. Operar con ratios negativos hace que las ganancias lleguen más rápido en días buenos, pero también se acumulan más deprisa — lo que puede disparar ese límite de consistencia antes de lo esperado.',
    tips: [
      'Calcula de antemano el importe máximo que puedes ganar en un día sin superar el % de consistencia exigido por la empresa.',
      'Si llegas cerca del techo de consistencia diario, para de operar aunque el mercado esté a favor.',
      'Lleva un registro diario de cuánto acumulas para no activar el límite por sorpresa.',
    ],
    warning: '⚠️ Calcula siempre cuánto puedes ganar en un día sin superar el % de consistencia exigido.',
  },
]

const INDICADORES = [
  {
    name: 'MACD',
    color: '#3B82F6',
    desc: 'Usado para anticiparse a los giros del precio, pero siempre con Contexto. Sin contexto de estructura de mercado, las señales del MACD generan muchas entradas falsas. Úsalo como confirmación, no como detonante.',
  },
  {
    name: 'RSI',
    color: '#8B5CF6',
    desc: 'Útil para detectar sobrecompra y sobreventa según el timeframe y la situación del mercado. Su efectividad varía mucho dependiendo de si el mercado está en tendencia o en rango — aplica según el contexto.',
  },
]

function ReglasConsistencia() {
  const [open, setOpen] = useState(true)

  return (
    <div className="bg-surface border border-[#7C3AED]/30 rounded-2xl overflow-hidden">
      {/* Cabecera */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-surface2/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#7C3AED]/15 flex items-center justify-center flex-shrink-0">
            <Target size={15} className="text-[#7C3AED]" />
          </div>
          <div>
            <p className="font-bold text-text text-sm">Reglas de Consistencia en Fondeo</p>
            <p className="text-xs text-muted">Protocolo personal para maximizar la rentabilidad en fondeadas</p>
          </div>
        </div>
        <ChevronDown
          size={16}
          className="text-muted flex-shrink-0 transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {/* Contenido */}
      {open && (
        <div className="border-t border-border divide-y divide-border">
          {REGLAS.map(r => (
            <div key={r.num} className="px-5 py-4 flex gap-4">
              {/* Número */}
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5"
                style={{ background: `${r.color}20`, color: r.color, border: `1.5px solid ${r.color}50` }}
              >
                {r.num}
              </div>

              {/* Texto */}
              <div className="flex-1 space-y-2">
                <p className="text-sm font-semibold text-text">{r.title}</p>
                <p className="text-sm text-muted leading-relaxed">{r.body}</p>

                {r.bullets && (
                  <ul className="space-y-1.5 mt-2">
                    {r.bullets.map((b, i) => (
                      <li key={i} className="flex gap-2 text-sm text-muted leading-relaxed">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: r.color }} />
                        {b}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Tips */}
                {r.tips && (
                  <div className="mt-3 bg-bg border border-border rounded-xl p-3 space-y-2">
                    <p className="text-[10px] font-semibold text-muted uppercase tracking-wider">💡 Tips</p>
                    <ul className="space-y-1.5">
                      {r.tips.map((t, i) => (
                        <li key={i} className="flex gap-2 text-xs text-muted leading-relaxed">
                          <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0 bg-[#F97316]" />
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {r.warning && (
                  <div className="flex items-start gap-2 mt-2 px-3 py-2 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/25">
                    <AlertTriangle size={13} className="text-[#F59E0B] flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-[#F59E0B] leading-relaxed">{r.warning.replace(/^⚠️\s*/, '')}</p>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Indicadores recomendados */}
          <div className="px-5 py-4 flex gap-4">
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-[#7C3AED]/15 border border-[#7C3AED]/30">
              <BarChart2 size={13} className="text-[#7C3AED]" />
            </div>
            <div className="flex-1 space-y-3">
              <p className="text-sm font-semibold text-text">Indicadores Recomendados</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {INDICADORES.map(ind => (
                  <div key={ind.name} className="bg-bg border border-border rounded-xl p-3 space-y-1.5">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `${ind.color}20`, color: ind.color }}
                    >
                      {ind.name}
                    </span>
                    <p className="text-xs text-muted leading-relaxed">{ind.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Tarjeta individual ─────────────────────────────────────── */
function ConceptCard({
  c,
  isFav,
  onToggleFav,
}: {
  c: Concept
  isFav: boolean
  onToggleFav: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const meta = CATEGORY_META[c.category]

  return (
    <div
      className="bg-surface border border-border rounded-2xl overflow-hidden transition-all cursor-pointer"
      onClick={() => setOpen(o => !o)}
    >
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: `${meta.color}18`, color: meta.color }}>
            {meta.icon} {meta.label}
          </span>
          <div className="flex items-center gap-2">
            {/* Estrella favorito */}
            <button
              onClick={e => { e.stopPropagation(); onToggleFav(c.id) }}
              className="p-1 rounded-lg transition-colors hover:bg-surface2"
              title={isFav ? 'Quitar de favoritos' : 'Añadir a favoritos'}
            >
              <Star
                size={15}
                className="transition-colors"
                style={{ color: isFav ? '#F59E0B' : 'var(--color-muted)', fill: isFav ? '#F59E0B' : 'none' }}
              />
            </button>
            {/* Flecha expand */}
            <span className="text-muted text-lg leading-none select-none transition-transform duration-200" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>⌄</span>
          </div>
        </div>
        <h3 className="font-bold text-text text-base mb-1">{c.title}</h3>
        <p className="text-sm text-muted leading-relaxed">{c.summary}</p>
      </div>

      {/* Expandido */}
      {open && (
        <div className="border-t border-border px-5 pb-5 pt-4 space-y-4">
          <p className="text-sm text-text/80 leading-relaxed">{c.description}</p>

          {c.formula && (
            <div className="bg-bg border border-border rounded-xl p-3">
              <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-1.5">Fórmula</p>
              <p className="font-mono text-sm text-[#7C3AED]">{c.formula}</p>
            </div>
          )}

          {c.example && (
            <div className="bg-bg border border-border rounded-xl p-3">
              <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-1.5">Ejemplo práctico</p>
              <p className="text-sm text-text leading-relaxed">{c.example}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 pt-1">
            {c.tags.map(t => (
              <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-surface2 text-muted border border-border">#{t}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Página principal ───────────────────────────────────────── */
export default function Conceptos() {
  const [search,    setSearch]    = useState('')
  const [category,  setCategory]  = useState<Category>('all')
  const [favorites, setFavorites] = useState<Set<string>>(() => loadFavorites())

  function toggleFav(id: string) {
    setFavorites(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      saveFavorites(next)
      return next
    })
  }

  const filtered = CONCEPTS.filter(c => {
    if (category === 'favoritos' && !favorites.has(c.id)) return false
    if (category !== 'all' && category !== 'favoritos' && c.category !== category) return false
    const q = search.toLowerCase()
    return !q || c.title.toLowerCase().includes(q) || c.summary.toLowerCase().includes(q) || c.tags.some(t => t.includes(q))
  })

  return (
    <div className="p-6 space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text">Conceptos</h1>
          <p className="text-sm text-muted mt-0.5">Glosario de términos clave enfocados en cuentas fondeadas</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-xl">
          <BookOpen size={14} className="text-[#7C3AED]" />
          <span className="text-xs text-muted">{CONCEPTS.length} conceptos</span>
          {favorites.size > 0 && (
            <span className="flex items-center gap-1 text-xs text-[#F59E0B]">
              · <Star size={11} style={{ fill: '#F59E0B' }} /> {favorites.size}
            </span>
          )}
        </div>
      </div>

      {/* ── Reglas Consistencia Fondeo ────────────────────────── */}
      <ReglasConsistencia />

      {/* Buscador */}
      <div className="relative">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar concepto, término o etiqueta…"
          className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-text placeholder:text-muted outline-none focus:border-[#7C3AED] transition-colors"
        />
      </div>

      {/* Filtros de categoría */}
      <div className="flex flex-wrap gap-2">
        {(Object.entries(CATEGORY_META) as [Category, typeof CATEGORY_META[Category]][]).map(([key, meta]) => (
          <button
            key={key}
            onClick={() => setCategory(key)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all"
            style={category === key
              ? { background: `${meta.color}20`, color: meta.color, border: `1px solid ${meta.color}50` }
              : { background: 'var(--color-surface)', color: 'var(--color-muted)', border: '1px solid var(--color-border)' }
            }
          >
            {meta.icon} {meta.label}
            {key === 'favoritos' && favorites.size > 0 && (
              <span className="text-[10px] opacity-70">{favorites.size}</span>
            )}
            {key !== 'all' && key !== 'favoritos' && (
              <span className="text-[10px] opacity-60">{CONCEPTS.filter(c => c.category === key).length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-muted">
          {category === 'favoritos' ? (
            <>
              <Star size={32} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm">Aún no tienes favoritos</p>
              <p className="text-xs mt-1 opacity-60">Haz clic en la ⭐ de cualquier concepto para guardarlo aquí</p>
            </>
          ) : (
            <>
              <Zap size={32} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm">No hay conceptos con esa búsqueda</p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(c => (
            <ConceptCard
              key={c.id}
              c={c}
              isFav={favorites.has(c.id)}
              onToggleFav={toggleFav}
            />
          ))}
        </div>
      )}
    </div>
  )
}
