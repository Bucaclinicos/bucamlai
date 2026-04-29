import { useState, useEffect, useRef } from 'react'
import { postPrediccion, getMedicamentos, getClimaActual } from '../api'
import PageHeader from '../components/PageHeader'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import ToggleButton from '@mui/material/ToggleButton'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import CircularProgress from '@mui/material/CircularProgress'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import ThermostatRoundedIcon from '@mui/icons-material/ThermostatRounded'
import WaterDropRoundedIcon from '@mui/icons-material/WaterDropRounded'
import CloudRoundedIcon from '@mui/icons-material/CloudRounded'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'

export default function Prediccion() {
  const [busqueda, setBusqueda] = useState('')
  const [medicamento, setMedicamento] = useState('')
  const [meses, setMeses] = useState(3)
  const [resultado, setResultado] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [todos, setTodos] = useState([])
  const [sugerencias, setSugerencias] = useState([])
  const [mostrarLista, setMostrarLista] = useState(false)
  const [climaActual, setClimaActual] = useState(null)
  const inputRef = useRef()

  useEffect(() => {
    getMedicamentos().then(r => setTodos(r.data.medicamentos || [])).catch(() => {})
    getClimaActual().then(r => setClimaActual(r.data)).catch(() => {})
  }, [])

  const filtrar = (texto) => {
    setBusqueda(texto); setMedicamento('')
    if (texto.length < 2) { setSugerencias([]); setMostrarLista(false); return }
    setSugerencias(todos.filter(m => m.toLowerCase().includes(texto.toLowerCase())).slice(0, 12))
    setMostrarLista(true)
  }

  const seleccionar = (med) => {
    setMedicamento(med); setBusqueda(med); setSugerencias([]); setMostrarLista(false)
    setResultado(null); setError('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const med = medicamento || busqueda.trim()
    if (!med) { setError('Selecciona o escribe el nombre del medicamento'); return }
    setError(''); setCargando(true); setResultado(null)
    postPrediccion({ medicamento: med, meses: Number(meses), usar_prophet: true })
      .then(r => { setResultado(r.data); setMedicamento(med) })
      .catch(e => setError(e?.response?.data?.detail || e?.response?.data?.error || 'Error al conectar con el backend.'))
      .finally(() => setCargando(false))
  }

  const datosGrafica = (() => {
    if (!resultado) return []
    const hist = (resultado.historial || []).map(h => ({ mes: h.mes, real: h.unidades_reales, prediccion: null, min: null, max: null }))
    const pred = (resultado.predicciones || []).map(p => ({ mes: p.mes, real: null, prediccion: p.unidades, min: p.minimo, max: p.maximo }))
    return [...hist, ...pred]
  })()

  const metricas = resultado?.metricas_modelo
  const esLluvias = climaActual?.temporada === 'lluvias'

  return (
    <Box className="page-enter">
      <PageHeader badge="Prophet · Series de Tiempo" title="Predicción de Demanda"
        subtitle="Predice la demanda mensual por medicamento usando Prophet, que detecta tendencias y estacionalidad automáticamente" />

      <Grid container spacing={3} alignItems="flex-start">
        {/* Panel formulario */}
        <Grid item xs={12} md={4} lg={3.5}>
          <Card elevation={2}>
            <CardContent sx={{ p: '28px 24px !important' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2.5 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: '9px', bgcolor: 'rgba(192,57,43,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <SearchRoundedIcon sx={{ color: 'primary.main', fontSize: 18 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Parámetros</Typography>
                  <Typography variant="caption" color="text.secondary">Configura la consulta</Typography>
                </Box>
              </Box>

              <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {/* Buscador con autocomplete */}
                <Box sx={{ position: 'relative' }}>
                  <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>Medicamento</Typography>
                  <TextField
                    inputRef={inputRef}
                    fullWidth size="small"
                    placeholder="Buscar medicamento..."
                    value={busqueda}
                    onChange={e => filtrar(e.target.value)}
                    onFocus={() => busqueda.length >= 2 && setMostrarLista(true)}
                    onBlur={() => setTimeout(() => setMostrarLista(false), 150)}
                    autoComplete="off"
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ fontSize: 16, color: 'text.disabled' }} /></InputAdornment>,
                      sx: { borderColor: medicamento ? 'success.main' : undefined }
                    }}
                    sx={medicamento ? { '& .MuiOutlinedInput-notchedOutline': { borderColor: 'success.main !important' } } : {}}
                  />

                  {mostrarLista && sugerencias.length > 0 && (
                    <Paper elevation={4} sx={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200, mt: 0.5, borderRadius: 2, overflow: 'hidden', maxHeight: 240, overflowY: 'auto' }}>
                      {sugerencias.map(s => (
                        <Box
                          key={s}
                          onMouseDown={() => seleccionar(s)}
                          sx={{
                            px: 1.75, py: 1.25, fontSize: '0.8125rem', cursor: 'pointer',
                            color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider',
                            '&:hover': { bgcolor: 'rgba(192,57,43,0.05)' },
                            '&:last-child': { borderBottom: 0 },
                          }}
                        >
                          {s}
                        </Box>
                      ))}
                    </Paper>
                  )}

                  {medicamento && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.75 }}>
                      <CheckCircleRoundedIcon sx={{ fontSize: 13, color: 'success.main' }} />
                      <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 700 }}>Medicamento seleccionado</Typography>
                    </Box>
                  )}
                  <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
                    Escribe al menos 2 caracteres para buscar
                  </Typography>
                </Box>

                {/* Meses */}
                <Box>
                  <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>Meses a predecir</Typography>
                  <ToggleButtonGroup value={meses} exclusive fullWidth size="small"
                    onChange={(_, v) => { if (v) setMeses(v) }}>
                    {[1, 2, 3, 6].map(m => (
                      <ToggleButton key={m} value={m} sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                        {m} {m === 1 ? 'mes' : 'meses'}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </Box>

                {error && <Alert severity="error" sx={{ py: 0.5, fontSize: '0.8rem' }}>{error}</Alert>}

                {/* Widget clima */}
                {climaActual && (
                  <Box sx={{
                    bgcolor: esLluvias ? '#EFF6FF' : '#FFFBEB',
                    border: `1px solid ${esLluvias ? '#BFDBFE' : '#FDE68A'}`,
                    borderRadius: 2, p: '12px 14px',
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <span style={{ fontSize: 18 }}>{climaActual.temporada_emoji}</span>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>Clima Bucaramanga hoy</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, mb: 0.75 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <ThermostatRoundedIcon sx={{ color: '#ef4444', fontSize: 14 }} />
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{climaActual.temperatura_media}°C</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <WaterDropRoundedIcon sx={{ color: '#3b82f6', fontSize: 14 }} />
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{climaActual.precipitacion_acumulada_mes} mm</Typography>
                      </Box>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {climaActual.temporada_label} · {climaActual.impacto_farmaceutico?.variacion_esperada}
                    </Typography>
                  </Box>
                )}

                <Button
                  type="submit" variant="contained" color="primary" fullWidth size="large"
                  disabled={cargando}
                  startIcon={cargando ? <CircularProgress size={16} color="inherit" /> : <TrendingUpRoundedIcon />}
                >
                  {cargando ? 'Calculando...' : 'Generar predicción'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Panel resultados */}
        <Grid item xs={12} md={8} lg={8.5}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

            {/* Vacío */}
            {!resultado && !cargando && (
              <Card elevation={2}>
                <CardContent sx={{ textAlign: 'center', py: 8 }}>
                  <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                    <TrendingUpRoundedIcon sx={{ fontSize: 28, color: 'text.disabled' }} />
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>Sin predicción aún</Typography>
                  <Typography variant="body2" color="text.secondary">Busca un medicamento y selecciona cuántos meses predecir</Typography>
                </CardContent>
              </Card>
            )}

            {resultado && !resultado.error && (
              <>
                {/* Header resultado */}
                <Card elevation={2} sx={{ borderLeft: '4px solid', borderLeftColor: 'primary.main' }}>
                  <CardContent sx={{ p: '18px 24px !important' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ width: 42, height: 42, borderRadius: '10px', bgcolor: 'rgba(192,57,43,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <CheckCircleRoundedIcon sx={{ color: 'primary.main', fontSize: 22 }} />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.25 }}>{resultado.medicamento}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Modelo: <strong>Prophet</strong> · {resultado.metricas_modelo?.periodos_entrenamiento} período(s) de historial
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>

                {/* KPIs */}
                <Grid container spacing={2}>
                  {[
                    { label: 'Total predicho', valor: resultado.total_unidades_predichas, unidad: 'unidades', color: 'primary.main' },
                    { label: 'Promedio mensual', valor: resultado.promedio_mensual, unidad: 'uds / mes', color: 'secondary.main' },
                    { label: 'Meses predichos', valor: resultado.meses_predichos, unidad: 'meses', color: 'text.secondary' },
                  ].map(k => (
                    <Grid item xs={4} key={k.label}>
                      <Card elevation={2}>
                        <CardContent sx={{ textAlign: 'center', p: '20px !important' }}>
                          <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1.25 }}>{k.label}</Typography>
                          <Typography variant="h3" sx={{ fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.valor}</Typography>
                          <Typography variant="caption" color="text.secondary">{k.unidad}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                {/* Clima contexto */}
                {resultado.clima_contexto && (
                  <Card elevation={2} sx={{ bgcolor: resultado.clima_contexto.temporada_dominante === 'lluvias' ? '#EFF6FF' : '#FFFBEB', border: `1px solid ${resultado.clima_contexto.temporada_dominante === 'lluvias' ? '#BFDBFE' : '#FDE68A'}` }}>
                    <CardContent sx={{ p: '20px 24px !important' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.75 }}>
                        <CloudRoundedIcon sx={{ color: resultado.clima_contexto.temporada_dominante === 'lluvias' ? '#3b82f6' : '#f59e0b' }} />
                        <Typography variant="subtitle2">Contexto climático — Bucaramanga</Typography>
                        <Typography sx={{ ml: 'auto', fontSize: 20 }}>{resultado.clima_contexto.temporada_emoji}</Typography>
                      </Box>
                      <Grid container spacing={1.25} sx={{ mb: 1.5 }}>
                        {[
                          { label: 'Temporada dominante', valor: resultado.clima_contexto.temporada_label },
                          { label: 'Clima en modelo', valor: resultado.clima_contexto.clima_usado_en_modelo ? 'Integrado ✓' : 'Climatología base' },
                        ].map(k => (
                          <Grid item xs={6} key={k.label}>
                            <Box sx={{ bgcolor: 'rgba(255,255,255,0.7)', borderRadius: 2, p: '12px 14px' }}>
                              <Typography variant="overline" color="text.secondary">{k.label}</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>{k.valor}</Typography>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                      {resultado.clima_contexto.impacto && (
                        <Box sx={{ bgcolor: 'rgba(255,255,255,0.6)', borderRadius: 2, p: '12px 14px' }}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>{resultado.clima_contexto.impacto.descripcion}</Typography>
                          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                            {resultado.clima_contexto.impacto.categorias_alta_demanda?.map(cat => (
                              <Chip key={cat} label={cat} size="small"
                                sx={{ fontWeight: 600, fontSize: '0.7rem', bgcolor: resultado.clima_contexto.temporada_dominante === 'lluvias' ? '#DBEAFE' : '#FEF3C7', color: resultado.clima_contexto.temporada_dominante === 'lluvias' ? '#1D4ED8' : '#92400E' }} />
                            ))}
                          </Box>
                          <Typography variant="caption" sx={{ display: 'block', mt: 1, fontWeight: 600, color: 'text.secondary' }}>
                            {resultado.clima_contexto.impacto.variacion_esperada}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Gráfica */}
                {datosGrafica.length > 0 && (
                  <Card elevation={2}>
                    <CardContent sx={{ p: '24px !important' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2.25 }}>Historial + Proyección</Typography>
                      <ResponsiveContainer width="100%" height={270}>
                        <ComposedChart data={datosGrafica} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F7" />
                          <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                          <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
                            formatter={(v, name) => [v !== null ? `${v} uds` : '—', name]} />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                          {resultado.historial?.length > 0 && (
                            <ReferenceLine x={resultado.historial[resultado.historial.length - 1]?.mes}
                              stroke="#CBD2DC" strokeDasharray="4 4"
                              label={{ value: 'hoy', fontSize: 10, fill: '#9CA3AF' }} />
                          )}
                          <Bar dataKey="real" name="Ventas reales" fill="rgba(192,57,43,0.15)" radius={[3, 3, 0, 0]} />
                          <Line dataKey="prediccion" name="Predicción" stroke="#C0392B" strokeWidth={2.5} dot={{ r: 4, fill: '#C0392B' }} connectNulls={false} />
                          <Line dataKey="min" name="Mínimo" stroke="#CBD2DC" strokeWidth={1} dot={false} strokeDasharray="4 4" connectNulls={false} />
                          <Line dataKey="max" name="Máximo" stroke="#CBD2DC" strokeWidth={1} dot={false} strokeDasharray="4 4" connectNulls={false} />
                        </ComposedChart>
                      </ResponsiveContainer>
                      <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1 }}>
                        Las líneas punteadas muestran el intervalo de confianza de la predicción
                      </Typography>
                    </CardContent>
                  </Card>
                )}

                {/* Tabla mes a mes */}
                {resultado.predicciones?.length > 0 && (
                  <Card elevation={2}>
                    <CardContent sx={{ p: '24px !important' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Detalle por mes</Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {resultado.predicciones.map((p, i) => (
                          <Box key={i} sx={{
                            display: 'grid', gridTemplateColumns: '1fr auto auto auto',
                            alignItems: 'center', gap: 2,
                            px: 2, py: 1.5, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'divider',
                          }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{p.mes}</Typography>
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>mínimo</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>{p.minimo}</Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>predicción</Typography>
                              <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>{p.unidades}</Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>máximo</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>{p.maximo}</Typography>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                )}

                {/* Métricas modelo */}
                {metricas && (
                  <Card elevation={2}>
                    <CardContent sx={{ p: '20px 24px !important' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <InfoOutlinedIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                        <Typography variant="subtitle2" color="text.secondary">
                          Métricas del modelo Prophet · {metricas.metodo === 'cross_validation' ? 'Validación cruzada temporal' : 'Fitted vs real'}
                        </Typography>
                      </Box>
                      <Grid container spacing={1.5}>
                        {[
                          { label: 'MAE', valor: metricas.mae, meta: '< 10 uds', ok: metricas.mae_aceptable },
                          { label: 'RMSE', valor: metricas.rmse, meta: '< 20 uds', ok: metricas.rmse_aceptable },
                          { label: 'Períodos entrenados', valor: metricas.periodos_entrenamiento, meta: 'meses de historia', ok: metricas.periodos_entrenamiento >= 6 },
                        ].map(m => (
                          <Grid item xs={4} key={m.label}>
                            <Box sx={{ bgcolor: 'grey.50', borderRadius: 2, p: '14px 16px', border: '1px solid', borderColor: 'divider' }}>
                              <Typography variant="overline" color="text.secondary">{m.label}</Typography>
                              <Typography variant="h5" sx={{ fontWeight: 800, color: m.ok ? 'success.main' : 'warning.main', lineHeight: 1, my: 0.5 }}>{m.valor}</Typography>
                              <Typography variant="caption" color="text.disabled">{m.meta}</Typography>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                      {metricas.periodos_entrenamiento < 6 && (
                        <Alert severity="warning" sx={{ mt: 1.5, fontSize: '0.8rem' }}>
                          Con {metricas.periodos_entrenamiento} período(s) las predicciones son orientativas. Prophet mejora significativamente con 6+ meses de historial.
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Error medicamento */}
            {resultado?.error && (
              <Card elevation={2}>
                <CardContent sx={{ p: '28px !important' }}>
                  <Alert severity="error" sx={{ mb: resultado?.sugerencia?.length ? 2 : 0 }}>
                    {resultado.error}
                  </Alert>
                  {resultado?.sugerencia?.length > 0 && (
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.25 }}>¿Quisiste decir?</Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                        {resultado.sugerencia.map(s => (
                          <Button key={s} variant="outlined" color="inherit" onClick={() => seleccionar(s)}
                            sx={{ justifyContent: 'flex-start', fontWeight: 500, color: 'text.secondary', borderColor: 'divider',
                              '&:hover': { borderColor: 'primary.main', color: 'primary.main', bgcolor: 'rgba(192,57,43,0.04)' } }}>
                            {s}
                          </Button>
                        ))}
                      </Box>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </Box>
        </Grid>
      </Grid>
    </Box>
  )
}
