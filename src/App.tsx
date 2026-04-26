import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAppStore } from './store/useAppStore'
import Layout from './components/layout/Layout'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Cuentas from './pages/Cuentas'
import Ranking from './pages/Ranking'
import Challenges from './pages/Challenges'
import Actividad from './pages/Actividad'
import Informes from './pages/Informes'
import Perfil from './pages/Perfil'
import Configuracion from './pages/Configuracion'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAppStore(s => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAppStore(s => s.isAuthenticated)
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  const initFromApi = useAppStore(s => s.initFromApi)

  /**
   * Al arrancar la app, si hay un JWT guardado en localStorage,
   * lo verifica con el backend y restaura la sesión automáticamente.
   * Si el backend no está disponible, no hace nada (la sesión queda
   * en localStorage tal como la dejó Zustand persist).
   */
  useEffect(() => {
    initFromApi().catch(() => {/* backend offline, sesión local sigue activa */})
  }, [initFromApi])

  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/"         element={<PublicOnlyRoute><Landing /></PublicOnlyRoute>} />
        <Route path="/login"    element={<PublicOnlyRoute><Auth /></PublicOnlyRoute>} />
        <Route path="/registro" element={<PublicOnlyRoute><Auth /></PublicOnlyRoute>} />

        {/* Rutas protegidas dentro del Layout */}
        <Route path="/dashboard"    element={<ProtectedRoute><Layout><Dashboard    /></Layout></ProtectedRoute>} />
        <Route path="/cuentas"      element={<ProtectedRoute><Layout><Cuentas      /></Layout></ProtectedRoute>} />
        <Route path="/ranking"      element={<ProtectedRoute><Layout><Ranking      /></Layout></ProtectedRoute>} />
        <Route path="/challenges"   element={<ProtectedRoute><Layout><Challenges   /></Layout></ProtectedRoute>} />
        <Route path="/actividad"    element={<ProtectedRoute><Layout><Actividad    /></Layout></ProtectedRoute>} />
        <Route path="/informes"     element={<ProtectedRoute><Layout><Informes     /></Layout></ProtectedRoute>} />
        <Route path="/perfil"       element={<ProtectedRoute><Layout><Perfil       /></Layout></ProtectedRoute>} />
        <Route path="/perfil/:username" element={<ProtectedRoute><Layout><Perfil   /></Layout></ProtectedRoute>} />
        <Route path="/configuracion" element={<ProtectedRoute><Layout><Configuracion /></Layout></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
