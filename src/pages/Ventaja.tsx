import { Dices, TrendingUp, Wallet, Target, Rocket, Percent } from 'lucide-react'

/* ─────────────────────────────────────────────────────────────
   Ventaja — los 5 pilares de la ventaja estadística en fondeadas
   ───────────────────────────────────────────────────────────── */

interface Pilar {
  num: number
  title: string
  color: string
  icon: typeof Dices
  bullets: { text: React.ReactNode }[]
}

const PILARES: Pilar[] = [
  {
    num: 1,
    title: 'Trading aleatorio en fase de prueba',
    color: '#3B82F6',
    icon: Dices,
    bullets: [
      { text: <>Por varianza, una estrategia común de trading sufrirá <strong>rachas perdedoras prolongadas</strong> = dudas y frustración.</> },
      { text: <>Es más factible operar de forma aleatoria y pasar un <strong>50% de las pruebas</strong> en una N grande.</> },
      { text: <>Reduces el <strong>tiempo de exposición</strong> a los gráficos.</> },
      { text: <>Eliminas el <strong>factor humano</strong>.</> },
    ],
  },
  {
    num: 2,
    title: 'Estrategias con winrate superior al 90% en «real»',
    color: '#7C3AED',
    icon: TrendingUp,
    bullets: [
      { text: <>Para lograr un winrate tan alto (90%) tienes que usar un <strong>ratio negativo</strong>: arriesgar más de lo que ganas (ej. <strong>arriesgar 1 para ganar 0.5</strong>), así el profit que buscas se da rápido y con más probabilidad.</> },
      { text: <>Necesitas <strong>rallys positivos prolongados</strong> (15-20 trades).</> },
      { text: <>Si no, por varianza <strong>perderás antes de cobrar</strong> y no tendrás un buen ratio de payout.</> },
      { text: <>Piensa que por muchas evaluaciones que pases y mucho capital que gestiones, aquí lo que importa es <strong>cuánto retiras antes de quebrar la cuenta</strong>.</> },
      { text: <>Tu objetivo debería ser <strong>cubrir rápidamente el coste de oportunidad</strong> y dejar que la varianza haga el resto para los beneficios.</> },
      { text: <>Cobra cuando llegues al <strong>mínimo exigido por la empresa para retirar</strong> (no te calientes para ganar más).</> },
    ],
  },
  {
    num: 3,
    title: 'Necesitas un buen bankroll',
    color: '#22C55E',
    icon: Wallet,
    bullets: [
      { text: <>Es muy difícil retirar dinero si tienes <strong>menos de 2-3k</strong>.</> },
      { text: <>Por varianza, y con las normas de <strong>DD dinámico</strong> y las reglas absurdas, perderás muchas pruebas antes de retirar <strong>aunque la estrategia sea ganadora</strong>.</> },
      { text: <>Debes <strong>sobrevivir N trades</strong> hasta que la aleatoriedad te sonría.</> },
      { text: <>A un coste medio de <strong>50-80$ por prueba</strong> (cuentas de 50k), podrás hacer unos <strong>40 challenges de margen</strong> para que la varianza te favorezca.</> },
    ],
  },
  {
    num: 4,
    title: 'Sobre-apaláncate en fondeo',
    color: '#F59E0B',
    icon: Rocket,
    bullets: [
      { text: <>Esto <strong>no es trading real</strong>, por lo que la gestión del riesgo se debe <strong>adaptar a las condiciones de las empresas</strong>.</> },
      { text: <>La ventaja de las empresas de fondeo es el <strong>apalancamiento absurdo</strong> que te dejan. Lo hacen porque así, aunque tengas una estrategia ganadora, <strong>perderás con alta probabilidad más veces de las que ganarás</strong>.</> },
      { text: <>Actúa de forma <strong>contraintuitiva</strong> y usa <strong>todo el apalancamiento que puedas</strong> para pasar los challenges.</> },
      { text: <>Si haces trading con buena gestión del riesgo, <strong>el tiempo que le dedicarás no compensará</strong> (además de la alta probabilidad de perder la cuenta).</> },
    ],
  },
  {
    num: 5,
    title: 'Busca descuentos que reduzcan tu coste total anual',
    color: '#EF4444',
    icon: Percent,
    bullets: [
      { text: <>Las empresas <strong>no paran de sacar descuentos</strong>: úsalos para reducir costes y <strong>aumentar tu ROI anual</strong>.</> },
      { text: <>Tienes que ser <strong>más buscador de ofertas que trader</strong> en muchas ocasiones.</> },
      { text: <>Si consigues reducir tu coste anual con descuentos un <strong>20%</strong>, es <strong>beneficio que te llevas</strong>.</> },
    ],
  },
]

export default function Ventaja() {
  return (
    <div className="p-6 space-y-6 fade-in max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text flex items-center gap-2">
          <Target size={24} className="text-[#7C3AED]" /> Ventaja
        </h1>
        <p className="text-sm text-muted mt-0.5">
          Los 5 pilares de la ventaja estadística en cuentas de fondeo
        </p>
      </div>

      {/* Intro */}
      <div className="bg-gradient-to-r from-[#7C3AED]/15 to-[#3B82F6]/10 border border-[#7C3AED]/25 rounded-2xl px-5 py-4">
        <p className="text-sm text-text leading-relaxed">
          La ventaja en las fondeadas no está en predecir el mercado, sino en{' '}
          <strong>explotar la varianza con un bankroll suficiente</strong>: pasar pruebas en cantidad,
          cubrir el coste rápido y retirar en cuanto la empresa lo permita.
        </p>
      </div>

      {/* Pilares */}
      <div className="space-y-5">
        {PILARES.map(p => (
          <div
            key={p.num}
            className="bg-surface border border-border rounded-2xl overflow-hidden hover:border-[#7C3AED]/30 transition-all"
          >
            {/* Cabecera del pilar */}
            <div
              className="flex items-center gap-3 px-5 py-4 border-b border-border"
              style={{ background: `${p.color}0D` }}
            >
              <span
                className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-lg text-white flex-shrink-0"
                style={{ background: p.color }}
              >
                {p.num}
              </span>
              <h2 className="font-bold text-text text-base leading-snug">{p.title}</h2>
              <p.icon size={20} style={{ color: p.color }} className="ml-auto flex-shrink-0 opacity-70" />
            </div>

            {/* Bullets */}
            <ul className="px-5 py-4 space-y-3">
              {p.bullets.map((b, i) => (
                <li key={i} className="flex gap-3 text-sm text-muted leading-relaxed">
                  <span
                    className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                    style={{ background: p.color }}
                  />
                  <span className="[&>strong]:text-text [&>strong]:font-semibold">{b.text}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
