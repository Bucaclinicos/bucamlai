import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Prediccion from './pages/Prediccion'
import Inventario from './pages/Inventario'
import Pareto from './pages/Pareto'
import Chatbot from './pages/Chatbot'
import CargarDatos from './pages/CargarDatos'
import Metricas from './pages/Metricas'
import Evaluacion from './pages/Evaluacion'
import AlertasClima from './pages/AlertasClima'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/"           element={<Dashboard />} />
          <Route path="/prediccion" element={<Prediccion />} />
          <Route path="/inventario" element={<Inventario />} />
          <Route path="/pareto"     element={<Pareto />} />
          <Route path="/chatbot"    element={<Chatbot />} />
          <Route path="/cargar"     element={<CargarDatos />} />
          <Route path="/metricas"    element={<Metricas />} />
          <Route path="/evaluacion"  element={<Evaluacion />} />
          <Route path="/alertas-clima" element={<AlertasClima />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
