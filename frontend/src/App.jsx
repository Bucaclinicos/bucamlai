import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import Prediccion from './pages/Prediccion'
import Inventario from './pages/Inventario'
import Pareto from './pages/Pareto'
import Chatbot from './pages/Chatbot'
import CargarDatos from './pages/CargarDatos'
import Metricas from './pages/Metricas'
import Evaluacion from './pages/Evaluacion'
import AlertasClima from './pages/AlertasClima'
import AdminPanel from './pages/AdminPanel'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"            element={<Login />} />
          <Route path="/forgot-password"  element={<ForgotPassword />} />
          <Route path="/reset-password"   element={<ResetPassword />} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/"               element={<Dashboard />} />
            <Route path="/prediccion"     element={<Prediccion />} />
            <Route path="/inventario"     element={<Inventario />} />
            <Route path="/pareto"         element={<Pareto />} />
            <Route path="/chatbot"        element={<Chatbot />} />
            <Route path="/metricas"       element={<Metricas />} />
            <Route path="/evaluacion"     element={<Evaluacion />} />
            <Route path="/alertas-clima"  element={<AlertasClima />} />
            <Route path="/cargar" element={
              <ProtectedRoute roles={['admin']}>
                <CargarDatos />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute roles={['admin']}>
                <AdminPanel />
              </ProtectedRoute>
            } />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
