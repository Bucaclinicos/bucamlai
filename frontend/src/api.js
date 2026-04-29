import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost:8080' })

export const getResumen   = ()       => api.get('/datos/resumen')
export const getPeriodos  = ()       => api.get('/datos/periodos')
export const getClusters      = ()       => api.get('/modelos/clusters')
export const getMedicamentos  = ()       => api.get('/modelos/medicamentos')
export const getReglas    = ()       => api.get('/asociacion/reglas')
export const postPrediccion = (data) => api.post('/modelos/prediccion', data)
export const postConsulta = (pregunta, periodos_filtro = null) =>
  api.post('/gemini/consulta', { pregunta, periodos_filtro })
export const postCargar   = (formData) => api.post('/datos/cargar', formData)
export const getPareto    = ()       => api.get('/pareto/abc')
export const getMetricas  = ()       => api.get('/metricas/resumen')
export const getEvaluacion  = ()      => api.get('/metricas/evaluacion')
export const getClimaActual  = ()     => api.get('/clima/actual')
export const getClimaPeriodo = (p)    => api.get(`/clima/periodo/${p}`)
export const getClimaAlertas = ()     => api.get('/clima/alertas')
