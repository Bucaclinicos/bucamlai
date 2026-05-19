import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost:8080' })

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('bucamlai_user')
  if (stored) {
    const user = JSON.parse(stored)
    if (user?.access_token) {
      config.headers['Authorization'] = `Bearer ${user.access_token}`
    }
  }
  return config
})

export const getResumen      = ()       => api.get('/datos/resumen')
export const getPeriodos     = ()       => api.get('/datos/periodos')
export const getClusters     = ()       => api.get('/modelos/clusters')
export const getMedicamentos = ()       => api.get('/modelos/medicamentos')
export const getReglas       = ()       => api.get('/asociacion/reglas')
export const postPrediccion  = (data)   => api.post('/modelos/prediccion', data)
export const postConsulta    = (pregunta, periodos_filtro = null) =>
  api.post('/gemini/consulta', { pregunta, periodos_filtro })
export const postCargar      = (fd)     => api.post('/datos/cargar', fd)
export const getPareto       = ()       => api.get('/pareto/abc')
export const getMetricas     = ()       => api.get('/metricas/resumen')
export const getEvaluacion   = ()       => api.get('/metricas/evaluacion')
export const getClimaActual  = ()       => api.get('/clima/actual')
export const getClimaPeriodo = (p)      => api.get(`/clima/periodo/${p}`)
export const getClimaAlertas = ()       => api.get('/clima/alertas')

// Admin — gestión de usuarios
export const getAdminUsers   = ()       => api.get('/admin/users')
export const createAdminUser = (data)   => api.post('/admin/users', data)
export const updateAdminUser = (id, d)  => api.put(`/admin/users/${id}`, d)
export const deleteAdminUser = (id)     => api.delete(`/admin/users/${id}`)

// Auth — recuperación de contraseña
export const forgotPassword  = (email)           => api.post('/auth/forgot-password', { email })
export const resetPassword   = (token, new_password) => api.post('/auth/reset-password', { token, new_password })
