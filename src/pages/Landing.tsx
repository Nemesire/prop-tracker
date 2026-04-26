import { useNavigate } from 'react-router-dom'
import { Trophy, Zap, Users, Star, BarChart2, Share2 } from 'lucide-react'
import Button from '../components/ui/Button'

const FEATURES = [
  { icon: BarChart2, title: 'Dashboard Pro', desc: 'Visualiza gastos, ganancias y ROI de todas tus prop firms en un solo lugar.' },
  { icon: Trophy, title: 'Ranking Global', desc: 'Compite con traders de todo el mundo. Sube posiciones y demuestra tu nivel.' },
  { icon: Zap, title: 'Challenges', desc: 'Retos semanales y mensuales para motivarte. Gana XP y sube de nivel.' },
  { icon: Users, title: 'Comunidad', desc: 'Feed de actividad en tiempo real. Celebra los éxitos de otros traders.' },
  { icon: Star, title: 'Gamificación', desc: '8 niveles, +14 badges y sistema de XP para reconocer tu progreso.' },
  { icon: Share2, title: 'Compartir', desc: 'Genera tarjetas de resultados profesionales para redes sociales.' },
]

const STATS = [
  { value: '10K+', label: 'Traders activos' },
  { value: '€5M+', label: 'En retiros registrados' },
  { value: '50K+', label: 'Evaluaciones seguidas' },
  { value: '98%', label: 'Satisfacción' },
]

const TESTIMONIALS = [
  { name: 'Carlos M.', level: 'Master', badge: '🏆', text: 'PropTracker cambió cómo gestiono mis cuentas. El ranking me motiva cada día.' },
  { name: 'María G.', level: 'Legend', badge: '🌟', text: 'Finalmente una app diseñada por traders para traders. La uso cada mañana.' },
  { name: 'Ana L.', level: 'Pro Trader', badge: '⚡', text: 'Los challenges me hacen ser más consistente. ¡Ya completé 8 retos!' },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* Navbar */}
      <nav className="border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#3B82F6] flex items-center justify-center">
            <span className="text-white font-black text-sm">PT</span>
          </div>
          <span className="font-bold text-lg">PropTracker</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/login')}>Iniciar sesión</Button>
          <Button onClick={() => navigate('/registro')}>Unirse gratis</Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-24 pb-20 text-center">
        <div className="absolute inset-0 bg-gradient-radial from-[#7C3AED]/20 via-transparent to-transparent" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.2) 0%, transparent 70%)' }} />
        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#7C3AED]/15 border border-[#7C3AED]/30 rounded-full text-sm text-[#A855F7] mb-8">
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
            La comunidad de prop traders más activa
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            Gestiona tus{' '}
            <span className="gradient-text">prop firms</span>
            {' '}como un pro
          </h1>
          <p className="text-xl text-[var(--muted)] mb-10 max-w-2xl mx-auto leading-relaxed">
            Sigue todas tus cuentas de fondeo, compite en el ranking global, completa challenges y comparte tus resultados con la comunidad.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" onClick={() => navigate('/registro')} className="shadow-2xl shadow-purple-900/40">
              Empieza gratis — es rápido
            </Button>
            <Button variant="secondary" size="lg" onClick={() => navigate('/login')}>
              Ver demo
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 py-12 border-y border-[var(--border)]">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-3xl font-black gradient-text mb-1">{value}</div>
              <div className="text-sm text-[var(--muted)]">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-4">Todo lo que necesitas para escalar</h2>
            <p className="text-[var(--muted)] text-lg">Herramientas profesionales combinadas con la motivación de la comunidad</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 hover:border-[#7C3AED]/40 hover:bg-[#1E1E38] transition-all group">
                <div className="w-12 h-12 rounded-xl bg-[#7C3AED]/15 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Icon size={22} className="text-[#7C3AED]" />
                </div>
                <h3 className="font-semibold text-[var(--text)] mb-2">{title}</h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-6 py-20 bg-[var(--surface)]/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-14">Lo que dicen los traders</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map(({ name, level, badge, text }) => (
              <div key={name} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
                <div className="text-3xl mb-4">"</div>
                <p className="text-[var(--muted)] text-sm leading-relaxed mb-5">{text}</p>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#3B82F6] flex items-center justify-center text-white font-bold text-sm">
                    {name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[var(--text)]">{name}</div>
                    <div className="text-xs text-[var(--muted)]">{badge} {level}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="text-5xl mb-6 animate-float">🚀</div>
          <h2 className="text-4xl font-black mb-5">¿Listo para unirte?</h2>
          <p className="text-[var(--muted)] text-lg mb-8">Únete a miles de traders que ya gestionan sus prop firms con PropTracker</p>
          <Button size="lg" onClick={() => navigate('/registro')} className="shadow-2xl shadow-purple-900/40 mx-auto">
            Crear cuenta gratis
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] px-6 py-8 text-center text-sm text-[var(--muted)]">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#3B82F6] flex items-center justify-center">
            <span className="text-white font-black text-xs">PT</span>
          </div>
          <span className="font-semibold text-[var(--text)]">PropTracker</span>
        </div>
        <p>La plataforma de prop traders más completa · {new Date().getFullYear()}</p>
      </footer>
    </div>
  )
}
