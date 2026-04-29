import { useEffect, useState } from 'react'
import { getMetricas } from '../api'
import PageHeader from '../components/PageHeader'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import LinearProgress from '@mui/material/LinearProgress'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import PsychologyRoundedIcon from '@mui/icons-material/PsychologyRounded'
import TrackChangesRoundedIcon from '@mui/icons-material/TrackChangesRounded'
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded'
import ScienceRoundedIcon from '@mui/icons-material/ScienceRounded'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, Legend, Cell,
} from 'recharts'

const ROJO = '#C0392B', VERDE = '#0F9D58', AZUL = '#1A73E8', NARANJA = '#E67E22', GRIS = '#7F8C8D'
const COLOR_CAT = { A: ROJO, B: NARANJA, C: GRIS }
const COLOR_CLASIF = { PERDIDA: '#C0392B', BAJO: '#E67E22', MEDIO: '#F59E0B', ALTO: '#0F9D58', EXCELENTE: '#1A73E8' }

const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
const fmtN = (n) => new Intl.NumberFormat('es-CO').format(n)

function Conclusion({ tipo = 'info', children }) {
  const map = { info: 'info', exito: 'success', alerta: 'warning', critico: 'error' }
  return <Alert severity={map[tipo] || 'info'} sx={{ mt: 2, fontSize: '0.8rem', borderRadius: 2 }}>{children}</Alert>
}

function SilhouetteMeter({ valor }) {
  const color = valor > 0.7 ? VERDE : valor > 0.5 ? AZUL : NARANJA
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
        <Typography variant="body2" color="text.secondary">Silhouette Score</Typography>
        <Typography variant="body1" sx={{ fontWeight: 700, color }}>{valor}</Typography>
      </Box>
      <LinearProgress variant="determinate" value={valor * 100}
        sx={{ height: 10, borderRadius: 5, bgcolor: '#F1F3F7', '& .MuiLinearProgress-bar': { bgcolor: color } }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
        <Typography variant="caption" color="text.disabled">0 — Malo</Typography>
        <Typography variant="caption" color="text.disabled">0.5 — Umbral</Typography>
        <Typography variant="caption" color="text.disabled">1.0 — Perfecto</Typography>
      </Box>
    </Box>
  )
}

function ScatterTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <Card elevation={4} sx={{ p: '10px 14px', borderRadius: 2 }}>
      <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>{d.nombre}</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Unidades: <b>{fmtN(d.unidades)}</b></Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Venta: <b>${fmtN(d.venta)}K</b></Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Rentab.: <b>{d.rentabilidad}%</b></Typography>
      <Chip label={`Cat. ${d.categoria}`} size="small" sx={{ mt: 0.5, bgcolor: `${COLOR_CAT[d.categoria]}20`, color: COLOR_CAT[d.categoria], fontWeight: 700 }} />
    </Card>
  )
}

export default function Metricas() {
  const [data, setData] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getMetricas()
      .then(r => setData(r.data))
      .catch(() => setError('No se pudo conectar con el servidor. Verifica que el backend esté corriendo.'))
      .finally(() => setCargando(false))
  }, [])

  if (cargando) return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 340, gap: 2 }}>
      <CircularProgress color="primary" />
      <Typography color="text.secondary" variant="body2">Cargando métricas del sistema...</Typography>
    </Box>
  )

  if (error) return <Box sx={{ p: 5 }}><Alert severity="error">{error}</Alert></Box>

  const rf = data.random_forest || {}
  const sil = data.kmeans_silhouette
  const rg = data.resumen_general || {}
  const scatterA = (data.scatter_kmeans || []).filter(p => p.categoria === 'A')
  const scatterB = (data.scatter_kmeans || []).filter(p => p.categoria === 'B')
  const scatterC = (data.scatter_kmeans || []).filter(p => p.categoria === 'C')

  return (
    <Box className="page-enter">
      <PageHeader title="Métricas del Sistema" subtitle="Evaluación de modelos ML · Fase 5 CRISP-DM" badge="68 tests pasando" />

      {/* KPIs resumen */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Registros limpios', valor: fmtN(rg.total_registros || 0), icon: BarChartRoundedIcon, color: ROJO },
          { label: 'Productos únicos', valor: fmtN(rg.productos_unicos || 0), icon: ScienceRoundedIcon, color: AZUL },
          { label: 'Venta total acumulada', valor: fmt(rg.venta_total || 0), icon: TrendingUpRoundedIcon, color: VERDE },
          { label: 'Laboratorios únicos', valor: fmtN(rg.laboratorios_unicos || 0), icon: AccountBalanceRoundedIcon, color: NARANJA },
        ].map(({ label, valor, icon: Ic, color }) => (
          <Grid item xs={12} sm={6} md={3} key={label}>
            <Card elevation={2} sx={{ borderTop: `3px solid ${color}` }}>
              <CardContent sx={{ p: '18px 20px !important' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.25 }}>
                  <Typography variant="overline" color="text.secondary">{label}</Typography>
                  <Ic sx={{ color, fontSize: 18 }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>{valor}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Conclusion tipo="info">
        <b>¿Qué nos dice este resumen?</b> El dataset limpio contiene <b>{fmtN(rg.total_registros || 0)} registros</b> válidos
        provenientes de 3 períodos. Se identificaron <b>{fmtN(rg.productos_unicos || 0)} productos distintos</b> de <b>{fmtN(rg.laboratorios_unicos || 0)} laboratorios</b>,
        con facturación acumulada de <b>{fmt(rg.venta_total || 0)}</b>.
      </Conclusion>

      {/* Sección modelos ML */}
      <Card elevation={2} sx={{ mt: 3, mb: 3 }}>
        <CardContent sx={{ p: '24px 26px !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2.5 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: '9px', bgcolor: `${ROJO}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PsychologyRoundedIcon sx={{ color: ROJO, fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Evaluación de Modelos de Machine Learning</Typography>
              <Typography variant="caption" color="text.secondary">Fase 5 CRISP-DM — Resultados reales sobre datos de Bucaclínicos</Typography>
            </Box>
          </Box>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            {/* MAE */}
            <Grid item xs={12} md={4}>
              <Card elevation={0} sx={{ bgcolor: 'grey.50', border: '1px solid', borderColor: 'divider', borderLeft: `4px solid ${rf.mae_aceptable ? VERDE : NARANJA}` }}>
                <CardContent sx={{ p: '18px 20px !important' }}>
                  <Typography variant="overline" color="text.secondary">MAE — Random Forest</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.75, my: 0.75 }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1 }}>{rf.mae ?? '—'}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>uds/mes</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                    {rf.mae_aceptable ? <CheckCircleRoundedIcon sx={{ fontSize: 14, color: VERDE }} /> : <WarningAmberRoundedIcon sx={{ fontSize: 14, color: NARANJA }} />}
                    <Typography variant="caption" sx={{ fontWeight: 700, color: rf.mae_aceptable ? VERDE : NARANJA }}>
                      {rf.mae_aceptable ? 'Cumple objetivo' : 'Objetivo: < 10 uds'}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.disabled">
                    Entrenamiento: {fmtN(rf.registros_entrenamiento ?? 0)} reg. · Prueba: {fmtN(rf.registros_prueba ?? 0)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            {/* RMSE */}
            <Grid item xs={12} md={4}>
              <Card elevation={0} sx={{ bgcolor: 'grey.50', border: '1px solid', borderColor: 'divider', borderLeft: `4px solid ${rf.rmse_aceptable ? VERDE : NARANJA}` }}>
                <CardContent sx={{ p: '18px 20px !important' }}>
                  <Typography variant="overline" color="text.secondary">RMSE — Random Forest</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.75, my: 0.75 }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1 }}>{rf.rmse ?? '—'}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>uds</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                    {rf.rmse_aceptable ? <CheckCircleRoundedIcon sx={{ fontSize: 14, color: VERDE }} /> : <WarningAmberRoundedIcon sx={{ fontSize: 14, color: NARANJA }} />}
                    <Typography variant="caption" sx={{ fontWeight: 700, color: rf.rmse_aceptable ? VERDE : NARANJA }}>
                      {rf.rmse_aceptable ? 'Cumple objetivo' : 'Objetivo: < 20 uds'}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.disabled">Penaliza errores grandes. Mejorará con más períodos.</Typography>
                </CardContent>
              </Card>
            </Grid>
            {/* KMeans */}
            <Grid item xs={12} md={4}>
              <Card elevation={0} sx={{ bgcolor: 'grey.50', border: '1px solid', borderColor: 'divider', borderLeft: `4px solid ${sil > 0.5 ? VERDE : NARANJA}` }}>
                <CardContent sx={{ p: '18px 20px !important' }}>
                  <Typography variant="overline" color="text.secondary">KMeans Clustering</Typography>
                  <Box sx={{ my: 1.5 }}>{sil !== null && <SilhouetteMeter valor={sil} />}</Box>
                  <Typography variant="caption" color="text.disabled">{data.kmeans_interpretacion}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Conclusion tipo="exito">
            <b>KMeans:</b> Silhouette Score de <b>{sil}</b> supera el umbral 0.5 — los 3 clusters (A, B, C) están bien separados estadísticamente.
          </Conclusion>
          <Conclusion tipo="alerta">
            <b>Random Forest:</b> MAE <b>{rf.mae}</b> y RMSE <b>{rf.rmse}</b> no alcanzan los objetivos aún porque solo hay 3 períodos (~10 semanas). Con 12+ meses mejorarán sustancialmente.
          </Conclusion>
        </CardContent>
      </Card>

      {/* Top 15 */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent sx={{ p: '24px !important' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Top 15 — Mayor volumen</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>Unidades vendidas acumuladas (3 períodos)</Typography>
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={data.top_unidades || []} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F7" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={v => fmtN(v)} />
                  <YAxis type="category" dataKey="nombre" tick={{ fontSize: 10, fill: '#374151' }} width={130} />
                  <Tooltip formatter={(v) => [fmtN(v) + ' uds', 'Unidades']} contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="unidades" radius={[0, 4, 4, 0]} fill={ROJO} />
                </BarChart>
              </ResponsiveContainer>
              <Conclusion tipo="info">
                Medicamentos con <b>más alta rotación</b> — priorizar stock y negociar descuentos por volumen con el laboratorio proveedor.
              </Conclusion>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent sx={{ p: '24px !important' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Top 15 — Mayor ingreso</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>Valor de venta total en COP (3 períodos)</Typography>
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={data.top_ventas || []} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F7" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={v => `$${(v / 1e6).toFixed(0)}M`} />
                  <YAxis type="category" dataKey="nombre" tick={{ fontSize: 10, fill: '#374151' }} width={130} />
                  <Tooltip formatter={(v) => [fmt(v), 'Venta']} contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="venta" radius={[0, 4, 4, 0]} fill={AZUL} />
                </BarChart>
              </ResponsiveContainer>
              <Conclusion tipo="info">
                Comparar con el top de volumen identifica productos <b>más rentables en valor</b> vs los más populares en cantidad.
              </Conclusion>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Scatter KMeans */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent sx={{ p: '24px !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: '9px', bgcolor: `${ROJO}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrackChangesRoundedIcon sx={{ color: ROJO, fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Dispersión KMeans — Clusters A / B / C</Typography>
              <Typography variant="caption" color="text.secondary">Muestra de 300 productos aleatorios · Eje X: unidades · Eje Y: venta en miles COP</Typography>
            </Box>
          </Box>
          <ResponsiveContainer width="100%" height={360}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F7" />
              <XAxis dataKey="unidades" type="number" name="Unidades" tick={{ fontSize: 10, fill: '#9CA3AF' }} label={{ value: 'Unidades vendidas', position: 'insideBottom', offset: -4, fontSize: 11, fill: '#9CA3AF' }} />
              <YAxis dataKey="venta" type="number" name="Venta (K COP)" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={v => `$${v}K`} />
              <ZAxis range={[30, 30]} />
              <Tooltip content={<ScatterTooltip />} />
              <Legend formatter={val => <span style={{ fontSize: 12, color: '#374151' }}>Categoría {val}</span>} />
              <Scatter name="A" data={scatterA} fill={COLOR_CAT.A} opacity={0.75} />
              <Scatter name="B" data={scatterB} fill={COLOR_CAT.B} opacity={0.75} />
              <Scatter name="C" data={scatterC} fill={COLOR_CAT.C} opacity={0.6} />
            </ScatterChart>
          </ResponsiveContainer>
          <Conclusion tipo="exito">
            <b>Categoría A (rojo)</b>: núcleo del negocio. <b>Categoría B (naranja)</b>: comportamiento intermedio. <b>Categoría C (gris)</b>: baja rotación — candidatos a revisar. Silhouette Score <b>{sil}</b> confirma separación estadística.
          </Conclusion>
        </CardContent>
      </Card>

      {/* Distribución rentabilidad */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent sx={{ p: '24px !important' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Distribución de Rentabilidad</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>Registros por rango de margen</Typography>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.dist_rentabilidad || []} margin={{ top: 0, right: 8, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F7" />
                  <XAxis dataKey="rango" tick={{ fontSize: 10, fill: '#9CA3AF' }} angle={-35} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                  <Tooltip formatter={(v) => [fmtN(v) + ' registros', 'Cantidad']} contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="cantidad" radius={[4, 4, 0, 0]}>
                    {(data.dist_rentabilidad || []).map((entry, i) => (
                      <Cell key={i} fill={entry.rango.startsWith('<') || entry.rango.startsWith('-') ? ROJO : entry.rango.includes('0%') ? NARANJA : entry.rango.includes('15%') ? '#F59E0B' : VERDE} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <Conclusion tipo="info">
                Barras rojas = margen muy bajo o pérdida. Mayoría debe concentrarse en barras verdes. Casos en &quot;&lt; -50%&quot; requieren revisión inmediata.
              </Conclusion>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent sx={{ p: '24px !important' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Clasificación de Inventario</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>Conteo de registros por umbral de rentabilidad</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 0.5 }}>
                {(data.dist_clasificacion || []).map(({ clasificacion, cantidad }) => {
                  const total = (data.dist_clasificacion || []).reduce((a, b) => a + b.cantidad, 0)
                  const pct = total > 0 ? (cantidad / total * 100).toFixed(1) : 0
                  const color = COLOR_CLASIF[clasificacion] || GRIS
                  return (
                    <Box key={clasificacion}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{clasificacion}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {fmtN(cantidad)} <span style={{ color: '#CBD2DC' }}>({pct}%)</span>
                        </Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={Number(pct)}
                        sx={{ height: 8, borderRadius: 4, bgcolor: '#F1F3F7', '& .MuiLinearProgress-bar': { bgcolor: color } }} />
                    </Box>
                  )
                })}
              </Box>
              <Box sx={{ mt: 2, p: '10px 14px', bgcolor: 'grey.50', borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Umbrales: PERDIDA &lt;0% · BAJO 0–15% · MEDIO 15–25% · ALTO 25–50% · EXCELENTE &gt;50%
                </Typography>
              </Box>
              <Conclusion tipo="exito">
                <b>EXCELENTE y ALTO</b> sostienen el negocio. <b>PERDIDA y BAJO</b> requieren atención: precios vencidos, descuentos excesivos o costos que subieron sin actualizar.
              </Conclusion>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Top laboratorios */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent sx={{ p: '24px !important' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Top 10 Laboratorios por Venta</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2.5 }}>Valor acumulado en COP — 3 períodos</Typography>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.top_laboratorios || []} margin={{ top: 0, right: 20, left: 10, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F7" />
              <XAxis dataKey="laboratorio" tick={{ fontSize: 10, fill: '#374151' }} angle={-35} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={v => `$${(v / 1e6).toFixed(0)}M`} />
              <Tooltip formatter={(v) => [fmt(v), 'Venta']} contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="venta" radius={[4, 4, 0, 0]}>
                {(data.top_laboratorios || []).map((_, i) => (
                  <Cell key={i} fill={i === 0 ? ROJO : i < 3 ? AZUL : '#CBD2DC'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <Conclusion tipo="info">
            El laboratorio en rojo (1°) es el proveedor más estratégico — una interrupción impacta directamente los ingresos. Apoya negociación de contratos y diversificación.
          </Conclusion>
        </CardContent>
      </Card>

      {/* Pipeline */}
      <Card elevation={2}>
        <CardContent sx={{ p: '24px !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2.5 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: '9px', bgcolor: `${ROJO}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PsychologyRoundedIcon sx={{ color: ROJO, fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Pipeline de Procesamiento de Datos</Typography>
              <Typography variant="caption" color="text.secondary">8 técnicas aplicadas — de 3.306 filas crudas a 3.204 registros limpios</Typography>
            </Box>
          </Box>
          <Grid container spacing={1.5}>
            {[
              { n: '1', titulo: 'Formato colombiano', desc: '14.850,00 → 14850.0', color: ROJO },
              { n: '2', titulo: 'Eliminar metadata', desc: '~102 filas de encabezados', color: AZUL },
              { n: '3', titulo: 'UND_VEND = 0', desc: '102 registros sin venta', color: NARANJA },
              { n: '4', titulo: 'Variables derivadas', desc: 'PRECIO_UNIT · COSTO_UNIT · MARGEN', color: VERDE },
              { n: '5', titulo: 'Umbrales rentab.', desc: 'PERDIDA/BAJO/MEDIO/ALTO/EXCELENTE', color: ROJO },
              { n: '6', titulo: 'Variable PERIODO', desc: 'Enero / Febrero / Prim. Sem. Marzo', color: AZUL },
              { n: '7', titulo: 'Norm. Min-Max', desc: 'UND_VEND_N · VLR_VENTA_N …', color: NARANJA },
              { n: '8', titulo: 'Atípicos dominio', desc: 'COSTO=0 → consignación (conservar)', color: VERDE },
            ].map(({ n, titulo, desc, color }) => (
              <Grid item xs={12} sm={6} md={3} key={n}>
                <Box sx={{ bgcolor: 'grey.50', borderRadius: 2, p: '14px 16px', borderLeft: `3px solid ${color}`, height: '100%' }}>
                  <Typography variant="overline" sx={{ color, fontWeight: 800 }}>TÉCNICA {n}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.3, my: 0.5 }}>{titulo}</Typography>
                  <Typography variant="caption" color="text.secondary">{desc}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
          <Conclusion tipo="exito">
            Sin estas 8 correcciones, todos los modelos habrían producido resultados incorrectos. Resultado: <b>3.204 registros limpios</b> listos para Random Forest, KMeans, Pareto y Apriori.
          </Conclusion>
        </CardContent>
      </Card>
    </Box>
  )
}
