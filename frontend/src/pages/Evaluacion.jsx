import { useEffect, useState } from 'react'
import { getEvaluacion } from '../api'
import PageHeader from '../components/PageHeader'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardActionArea from '@mui/material/CardActionArea'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Collapse from '@mui/material/Collapse'
import LinearProgress from '@mui/material/LinearProgress'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import CancelRoundedIcon from '@mui/icons-material/CancelRounded'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded'
import PsychologyRoundedIcon from '@mui/icons-material/PsychologyRounded'
import TrackChangesRoundedIcon from '@mui/icons-material/TrackChangesRounded'
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded'
import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded'
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded'
import LayersRoundedIcon from '@mui/icons-material/LayersRounded'
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded'

const ROJO = '#C0392B', VERDE = '#0F9D58', AZUL = '#1A73E8', NARANJA = '#E67E22', AMARILLO = '#F59E0B'

const VEREDICTO = {
  APROBADO:                { color: VERDE,   bg: '#F0FBF5', borde: 'rgba(15,157,88,0.3)',    icon: CheckCircleRoundedIcon,  label: 'APROBADO',               badgeBg: '#D1FAE5', badgeColor: '#065F46', severity: 'success' },
  EN_REVISION:             { color: AMARILLO, bg: '#FFFBEB', borde: 'rgba(245,158,11,0.3)',   icon: AccessTimeRoundedIcon,   label: 'EN REVISIÓN',            badgeBg: '#FEF3C7', badgeColor: '#92400E', severity: 'warning' },
  APROBADO_CON_LIMITACION: { color: AZUL,    bg: '#EFF6FF', borde: 'rgba(26,115,232,0.25)',   icon: WarningAmberRoundedIcon, label: 'APROBADO CON LIMITACIÓN', badgeBg: '#DBEAFE', badgeColor: '#1E40AF', severity: 'info'    },
  RECHAZADO:               { color: ROJO,    bg: '#FEF2F2', borde: 'rgba(192,57,43,0.25)',    icon: CancelRoundedIcon,       label: 'RECHAZADO',              badgeBg: '#FEE2E2', badgeColor: '#991B1B', severity: 'error'   },
}

const ICONO_MODELO = {
  random_forest: PsychologyRoundedIcon,
  kmeans:        TrackChangesRoundedIcon,
  pareto:        BarChartRoundedIcon,
  apriori:       AccountTreeRoundedIcon,
}

function fmtVal(v, unidad) {
  if (typeof v === 'boolean') return v ? 'Sí' : 'No'
  if (typeof v === 'number') return `${v}${unidad ? ' ' + unidad : ''}`
  return String(v)
}

function ViabilidadGauge({ valor, umbral = 80 }) {
  const v = Number(valor) || 0
  const color = v >= 80 ? VERDE : v >= 60 ? AMARILLO : ROJO
  const radio = 38, circ = 2 * Math.PI * radio
  const relleno = (v / 100) * circ
  const offset = circ * 0.25
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75 }}>
      <Box sx={{ position: 'relative', width: 96, height: 96 }}>
        <svg width="96" height="96" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r={radio} fill="none" stroke="#F1F3F7" strokeWidth="9" />
          <circle cx="48" cy="48" r={radio} fill="none" stroke={color} strokeWidth="9"
            strokeLinecap="round" strokeDasharray={`${relleno} ${circ}`} strokeDashoffset={offset}
            style={{ transition: 'stroke-dasharray 0.7s ease' }} />
          <circle cx="48" cy="48" r={radio} fill="none" stroke="#9CA3AF" strokeWidth="2"
            strokeDasharray={`3 ${circ - 3}`} strokeDashoffset={offset - (umbral / 100) * circ} />
          <text x="48" y="44" textAnchor="middle" dominantBaseline="middle"
            fontSize="16" fontWeight="800" fill={color} fontFamily="Inter, sans-serif">{v}%</text>
          <text x="48" y="60" textAnchor="middle" dominantBaseline="middle"
            fontSize="9" fontWeight="600" fill="#9CA3AF" fontFamily="Inter, sans-serif" letterSpacing="0.5">VIABILIDAD</text>
        </svg>
      </Box>
      <Chip label={v >= umbral ? `≥ ${umbral}% ✓` : `< ${umbral}% ✗`} size="small"
        sx={{ fontWeight: 700, fontSize: '0.7rem', bgcolor: v >= umbral ? '#D1FAE5' : '#FEE2E2', color: v >= umbral ? '#065F46' : '#991B1B' }} />
    </Box>
  )
}

function TarjetaModelo({ modelo }) {
  const [abierto, setAbierto] = useState(false)
  const v = VEREDICTO[modelo.veredicto] || VEREDICTO.EN_REVISION
  const IconoModelo = ICONO_MODELO[modelo.id] || PsychologyRoundedIcon
  const IconoVeredicto = v.icon
  const cumplidos = modelo.criterios.filter(c => c.cumple).length
  const total = modelo.criterios.length

  return (
    <Card elevation={2} sx={{ border: `1px solid ${v.borde}`, overflow: 'hidden' }}>
      {/* Cabecera */}
      <Box sx={{ bgcolor: v.bg, borderBottom: `1px solid ${v.borde}`, p: '20px 24px' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.75, mb: 1.75 }}>
          <Box sx={{ width: 46, height: 46, borderRadius: '12px', bgcolor: '#fff', border: `1px solid ${v.borde}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 1, flexShrink: 0 }}>
            <IconoModelo sx={{ color: v.color, fontSize: 22 }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap', mb: 0.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>{modelo.modelo}</Typography>
              <Chip
                icon={<IconoVeredicto sx={{ fontSize: '14px !important', color: `${v.badgeColor} !important` }} />}
                label={v.label}
                size="small"
                sx={{ fontWeight: 700, fontSize: '0.7rem', letterSpacing: 0.4, bgcolor: v.badgeBg, color: v.badgeColor }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary">
              {modelo.libreria} · {modelo.fase_crisp}
            </Typography>
          </Box>
          <ViabilidadGauge valor={modelo.viabilidad ?? 0} umbral={modelo.viabilidad_umbral ?? 80} />
        </Box>

        {/* Barra criterios */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
            Criterios: {cumplidos}/{total}
          </Typography>
          <LinearProgress variant="determinate" value={(cumplidos / total) * 100}
            sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: '#E4E8EF', '& .MuiLinearProgress-bar': { bgcolor: v.color } }} />
        </Box>

        {/* PKL */}
        <Box sx={{ mt: 1.25, display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <TaskAltRoundedIcon sx={{ fontSize: 13, color: v.color }} />
          <Typography variant="caption" sx={{ color: v.color }}>
            PKL: <b>{modelo.pkl_generado}</b>
          </Typography>
          {modelo.aprobado_produccion && (
            <Chip label="✓ LISTO PARA PRODUCCIÓN" size="small"
              sx={{ ml: 1, fontWeight: 700, fontSize: '0.68rem', bgcolor: '#D1FAE5', color: '#065F46' }} />
          )}
        </Box>
      </Box>

      {/* Objetivo y veredicto */}
      <CardContent sx={{ p: '16px 24px 0 !important' }}>
        <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
          Objetivo de negocio (Fase 1 CRISP-DM)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65, mb: 2 }}>
          {modelo.objetivo_negocio}
        </Typography>

        <Alert severity={v.severity} icon={<IconoVeredicto fontSize="small" />} sx={{ mb: 0, borderRadius: 2, fontSize: '0.8rem' }}>
          <b>Conclusión CRISP-DM:</b> {modelo.veredicto_razon}
        </Alert>
      </CardContent>

      {/* Botón expandir */}
      <Box
        onClick={() => setAbierto(a => !a)}
        sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          px: 3, py: 1.5, mt: 1,
          bgcolor: 'grey.50', borderTop: '1px solid', borderColor: 'divider',
          cursor: 'pointer', userSelect: 'none',
          '&:hover': { bgcolor: 'grey.100' },
          transition: 'background 0.15s',
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
          Ver criterios de evaluación y técnicas aplicadas
        </Typography>
        {abierto ? <ExpandLessRoundedIcon sx={{ fontSize: 18, color: 'text.secondary' }} /> : <ExpandMoreRoundedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />}
      </Box>

      {/* Detalle expandible */}
      <Collapse in={abierto}>
        <CardContent sx={{ p: '0 24px 24px !important' }}>
          {/* Criterios */}
          <Box sx={{ mt: 2.5 }}>
            <Typography variant="overline" color="text.disabled" sx={{ display: 'block', mb: 0.5 }}>Criterios de aprobación</Typography>
            {modelo.criterios.map((c, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, bgcolor: c.cumple ? '#D1FAE5' : '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 0.25 }}>
                  {c.cumple
                    ? <CheckCircleRoundedIcon sx={{ fontSize: 14, color: VERDE }} />
                    : <AccessTimeRoundedIcon sx={{ fontSize: 14, color: AMARILLO }} />}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{c.nombre}</Typography>
                    <Chip label={fmtVal(c.valor_obtenido, c.unidad)} size="small"
                      sx={{ fontWeight: 700, fontSize: '0.75rem', bgcolor: c.cumple ? '#D1FAE5' : '#FEF3C7', color: c.cumple ? VERDE : AMARILLO }} />
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, lineHeight: 1.55 }}>
                    {c.descripcion}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>

          {/* Técnicas */}
          <Box sx={{ mt: 2.5 }}>
            <Typography variant="overline" color="text.disabled" sx={{ display: 'block', mb: 1 }}>Técnicas de evaluación aplicadas</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              {modelo.tecnicas_evaluacion.map((t, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 1.5, py: 1, borderRadius: 2, bgcolor: 'grey.50', border: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: v.color, flexShrink: 0 }} />
                  <Typography variant="body2" color="text.secondary">{t}</Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Desglose viabilidad */}
          {(modelo.viabilidad_componentes || []).length > 0 && (
            <Box sx={{ mt: 2.5 }}>
              <Typography variant="overline" color="text.disabled" sx={{ display: 'block', mb: 1.25 }}>
                Desglose del índice de viabilidad ({modelo.viabilidad}% / umbral {modelo.viabilidad_umbral}%)
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {modelo.viabilidad_componentes.map((c, i) => {
                  const esPen = c.puntaje < 0
                  const pctBarra = c.maximo > 0 ? (c.puntaje / c.maximo) * 100 : 0
                  return (
                    <Box key={i} sx={{ bgcolor: esPen ? '#FEF2F2' : 'grey.50', border: '1px solid', borderColor: esPen ? 'rgba(192,57,43,0.15)' : 'divider', borderRadius: 2, p: '10px 14px' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: esPen ? 0.5 : 0.75 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: esPen ? ROJO : 'text.primary' }}>
                          {esPen ? '⚠ ' : ''}{c.tecnica}
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, flexShrink: 0, color: esPen ? ROJO : (c.puntaje >= c.maximo * 0.7 ? VERDE : NARANJA) }}>
                          {esPen ? c.puntaje : `+${c.puntaje}`} / {c.maximo === 0 ? '—' : c.maximo} pts
                        </Typography>
                      </Box>
                      {!esPen && c.maximo > 0 && (
                        <LinearProgress variant="determinate" value={pctBarra}
                          sx={{ mb: 0.75, height: 5, borderRadius: 3, bgcolor: '#E4E8EF', '& .MuiLinearProgress-bar': { bgcolor: pctBarra >= 70 ? VERDE : NARANJA } }} />
                      )}
                      <Typography variant="caption" color="text.secondary">{c.descripcion}</Typography>
                    </Box>
                  )
                })}
              </Box>

              <Alert
                severity={modelo.viabilidad_supera_umbral ? 'success' : 'error'}
                icon={modelo.viabilidad_supera_umbral ? <CheckCircleRoundedIcon /> : <WarningAmberRoundedIcon />}
                sx={{ mt: 1.75, borderRadius: 2, fontSize: '0.8rem' }}
              >
                {modelo.viabilidad_supera_umbral
                  ? <><b>Viabilidad técnica confirmada ({modelo.viabilidad}%).</b> Supera el umbral mínimo del {modelo.viabilidad_umbral}% — confiable para automatizar decisiones.</>
                  : <><b>Viabilidad técnica insuficiente ({modelo.viabilidad}%).</b> No alcanza el {modelo.viabilidad_umbral}%. Usar como orientativo hasta tener más datos históricos.</>}
              </Alert>
            </Box>
          )}
        </CardContent>
      </Collapse>
    </Card>
  )
}

export default function Evaluacion() {
  const [data, setData] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getEvaluacion()
      .then(r => setData(r.data))
      .catch(() => setError('No se pudo conectar con el servidor.'))
      .finally(() => setCargando(false))
  }, [])

  if (cargando) return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 340, gap: 2 }}>
      <CircularProgress color="primary" />
      <Typography color="text.secondary" variant="body2">Evaluando modelos...</Typography>
    </Box>
  )

  if (error) return <Box sx={{ p: 5 }}><Alert severity="error">{error}</Alert></Box>

  const { aprobados = 0, en_revision = 0, total_modelos = 0, viabilidad_promedio = 0 } = data

  return (
    <Box className="page-enter">
      <PageHeader
        title="Evaluación de Modelos — Fase 5 CRISP-DM"
        subtitle="Aprobación formal de cada modelo de Machine Learning para producción"
        badge="CRISP-DM Fase 5"
      />

      {/* KPIs resumen */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Modelos evaluados', valor: total_modelos, icon: LayersRoundedIcon, color: AZUL, desc: 'Total de modelos ML del sistema' },
          { label: 'Aptos para producción', valor: aprobados, icon: CheckCircleRoundedIcon, color: VERDE, desc: 'Cumplen criterios de negocio' },
          { label: 'En revisión', valor: en_revision, icon: AccessTimeRoundedIcon, color: AMARILLO, desc: 'Mejoran con más datos históricos' },
          { label: 'Viabilidad promedio', valor: `${viabilidad_promedio}%`, icon: VerifiedRoundedIcon,
            color: viabilidad_promedio >= 80 ? VERDE : viabilidad_promedio >= 60 ? AMARILLO : ROJO,
            desc: viabilidad_promedio >= 80 ? 'Sistema confiable para producción' : 'Requiere más datos históricos' },
        ].map(({ label, valor, icon: Ic, color, desc }) => (
          <Grid item xs={12} sm={6} md={3} key={label}>
            <Card elevation={2} sx={{ borderTop: `3px solid ${color}` }}>
              <CardContent sx={{ p: '20px 22px !important' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.25 }}>
                  <Typography variant="overline" color="text.secondary">{label}</Typography>
                  <Ic sx={{ color, fontSize: 18 }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1, mb: 0.5 }}>{valor}</Typography>
                <Typography variant="caption" color="text.secondary">{desc}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Contexto CRISP-DM */}
      <Card elevation={2} sx={{ mb: 3, borderLeft: `4px solid ${AZUL}` }}>
        <CardContent sx={{ p: '20px 24px !important' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>¿Qué es la Fase 5 en CRISP-DM?</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.75, mb: 2.5 }}>
            En la metodología <b>CRISP-DM</b>, la Fase 5 se llama <b>"Evaluación"</b>. Su objetivo no es solo
            medir métricas — es responder formalmente si cada modelo <b>satisface los objetivos de negocio
            definidos en la Fase 1</b>. Esta página traza la línea directa entre cada requisito de negocio
            y la evidencia estadística que demuestra si el modelo lo cumple.
            Las <b>68 pruebas automatizadas</b> (pytest) son la evidencia formal.
          </Typography>

          {/* Línea CRISP-DM */}
          <Box sx={{ display: 'flex', alignItems: 'center', overflowX: 'auto', gap: 0 }}>
            {[
              { n: '1', label: 'Comprensión\ndel negocio', activo: false },
              { n: '2', label: 'Comprensión\nde datos',    activo: false },
              { n: '3', label: 'Preparación\nde datos',    activo: false },
              { n: '4', label: 'Modelado',                 activo: false },
              { n: '5', label: 'Evaluación',               activo: true  },
              { n: '6', label: 'Despliegue',               activo: false },
            ].map((f, i, arr) => (
              <Box key={f.n} sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  <Box sx={{
                    width: 36, height: 36, borderRadius: '50%',
                    bgcolor: f.activo ? AZUL : '#E4E8EF',
                    color: f.activo ? '#fff' : '#9CA3AF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 800,
                    boxShadow: f.activo ? `0 0 0 4px ${AZUL}30` : 'none',
                  }}>
                    {f.n}
                  </Box>
                  <Typography variant="caption" sx={{ mt: 0.75, textAlign: 'center', lineHeight: 1.4, whiteSpace: 'pre-line', color: f.activo ? AZUL : 'text.disabled', fontWeight: f.activo ? 700 : 400 }}>
                    {f.label}
                  </Typography>
                </Box>
                {i < arr.length - 1 && (
                  <Box sx={{ height: 2, flex: 0.5, bgcolor: '#E4E8EF', mb: 3 }} />
                )}
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Tarjetas por modelo */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {(data.modelos || []).map(m => (
          <TarjetaModelo key={m.id} modelo={m} />
        ))}
      </Box>

      {/* Nota trazabilidad */}
      <Card elevation={2} sx={{ mt: 3, borderLeft: `4px solid ${VERDE}` }}>
        <CardContent sx={{ p: '20px 24px !important' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
            Trazabilidad completa IEEE 830 + CRISP-DM
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.75 }}>
            Cada modelo tiene un <b>requisito funcional en la Fase 1</b> que lo originó,
            un <b>pipeline de procesamiento (Fase 3)</b> que preparó sus datos,
            y una <b>métrica de evaluación (Fase 5)</b> que demuestra si lo cumple.
            Las <b>68 pruebas automatizadas con pytest</b> cubren: 36 pruebas unitarias y 34 de integración —
            incluyendo validaciones de seguridad (HTTP 400, 422, 404, 405).
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}
