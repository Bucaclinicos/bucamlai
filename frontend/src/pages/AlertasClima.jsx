import { useEffect, useState } from 'react'
import { getClimaAlertas } from '../api'
import PageHeader from '../components/PageHeader'
import GlassCard from '../components/GlassCard'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import ToggleButton from '@mui/material/ToggleButton'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import ThermostatRoundedIcon from '@mui/icons-material/ThermostatRounded'
import WaterDropRoundedIcon from '@mui/icons-material/WaterDropRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const fmt = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

export default function AlertasClima() {
  const [data, setData] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [tab, setTab] = useState('demanda')

  const cargar = () => {
    setCargando(true)
    getClimaAlertas().then(r => setData(r.data)).catch(() => setData(null)).finally(() => setCargando(false))
  }

  useEffect(() => { cargar() }, [])

  if (cargando) return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 2 }}>
      <CircularProgress sx={{ color: '#C0392B' }} />
      <Typography sx={{ color: '#5A6785', fontSize: '0.875rem' }}>Analizando clima y demanda...</Typography>
    </Box>
  )
  if (!data) return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <Alert severity="error" icon={<WarningAmberRoundedIcon />} sx={{ maxWidth: 420 }}>No se pudo conectar con el backend.</Alert>
    </Box>
  )

  const clima = data.clima_actual
  const esLluvias = data.temporada_actual === 'lluvias'
  const tabActiva = { demanda: data.top_demanda_temporada || [], incremento: data.top_incremento_vs_temporada_opuesta || [], caida: data.top_caida_vs_temporada_opuesta || [] }[tab]
  const datosGrafica = tabActiva.slice(0, 12).map(m => ({
    name: m.medicamento.length > 22 ? m.medicamento.slice(0, 22) + '…' : m.medicamento,
    valor: tab === 'demanda' ? m.unidades_en_temporada : m.unidades_temporada_actual,
  }))

  return (
    <Box className="page-enter">
      <PageHeader badge="Clima · Bucaramanga" title="Alertas de Demanda por Clima"
        subtitle="Medicamentos que más rotan según la temporada climática actual — cruzado con el historial de ventas" />

      {/* Bloque clima */}
      <Box sx={{
        mb: 3, borderRadius: '16px', overflow: 'hidden',
        background: esLluvias
          ? 'linear-gradient(135deg, rgba(219,234,254,0.9) 0%, rgba(239,246,255,0.95) 100%)'
          : 'linear-gradient(135deg, rgba(254,243,199,0.9) 0%, rgba(255,251,235,0.95) 100%)',
        border: `1px solid ${esLluvias ? 'rgba(147,197,253,0.5)' : 'rgba(252,211,77,0.5)'}`,
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 20px rgba(15,23,41,0.08)',
      }}>
        <Grid container spacing={3} alignItems="center" sx={{ p: '22px 28px' }}>
          <Grid item>
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: 52, lineHeight: 1 }}>{clima.temporada_emoji}</Typography>
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: esLluvias ? '#1D4ED8' : '#92400E', mt: 0.75, display: 'block' }}>
                {clima.temporada_label}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs>
            <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: '#0F1729', mb: 0.75 }}>
              Bucaramanga, Colombia — {new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <ThermostatRoundedIcon sx={{ color: '#ef4444', fontSize: 18 }} />
                <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>{clima.temperatura_media}°C</Typography>
                <Typography sx={{ fontSize: '0.775rem', color: '#5A6785' }}>temp. media</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <WaterDropRoundedIcon sx={{ color: '#3b82f6', fontSize: 18 }} />
                <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>{clima.precipitacion_acumulada_mes} mm</Typography>
                <Typography sx={{ fontSize: '0.775rem', color: '#5A6785' }}>precip. acumulada</Typography>
              </Box>
            </Box>
            <Typography sx={{ fontSize: '0.8125rem', color: '#5A6785', mb: 1 }}>{clima.impacto_farmaceutico?.descripcion}</Typography>
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
              {clima.impacto_farmaceutico?.categorias_alta_demanda?.map(cat => (
                <Chip key={cat} label={cat} size="small"
                  sx={{ fontWeight: 600, bgcolor: esLluvias ? '#DBEAFE' : '#FEF3C7', color: esLluvias ? '#1D4ED8' : '#92400E', fontSize: '0.72rem' }} />
              ))}
            </Box>
          </Grid>
          <Grid item>
            <Grid container spacing={1.25} sx={{ mb: 1.25 }}>
              {[
                { label: 'Con incremento', valor: data.resumen.medicamentos_con_incremento, color: '#0F9D58' },
                { label: 'Con caída',       valor: data.resumen.medicamentos_con_caida,      color: '#C0392B' },
              ].map(k => (
                <Grid item key={k.label}>
                  <Box sx={{ bgcolor: 'rgba(255,255,255,0.7)', borderRadius: '12px', p: '10px 14px', textAlign: 'center', minWidth: 88, backdropFilter: 'blur(8px)' }}>
                    <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.valor}</Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: '#5A6785', mt: 0.25 }}>{k.label}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
            <Button size="small" variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={cargar}
              sx={{ borderColor: esLluvias ? 'rgba(147,197,253,0.6)' : 'rgba(252,211,77,0.6)', color: esLluvias ? '#1D4ED8' : '#92400E', bgcolor: 'rgba(255,255,255,0.6)', fontSize: '0.775rem', borderRadius: '10px' }}>
              Actualizar
            </Button>
            <Typography sx={{ fontSize: '0.68rem', color: '#9AA3B2', display: 'block', mt: 0.75, textAlign: 'right' }}>
              {clima.fuente === 'real' ? 'Open-Meteo (datos reales)' : 'Climatología IDEAM'}
            </Typography>
          </Grid>
        </Grid>
      </Box>

      {/* Tabs */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, alignItems: 'center', flexWrap: 'wrap' }}>
        <ToggleButtonGroup value={tab} exclusive onChange={(_, v) => { if (v) setTab(v) }} size="small">
          {[
            { key: 'demanda',    label: 'Mayor demanda',  desc: 'Top en esta temporada' },
            { key: 'incremento', label: 'Subir stock',    desc: 'Más vs temporada opuesta' },
            { key: 'caida',      label: 'Revisar stock',  desc: 'Menos vs temporada opuesta' },
          ].map(t => (
            <ToggleButton key={t.key} value={t.key} sx={{ px: 2, py: 1, flexDirection: 'column', alignItems: 'flex-start', height: 'auto', textTransform: 'none' }}>
              <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', lineHeight: 1.2, color: 'inherit' }}>{t.label}</Typography>
              <Typography sx={{ fontSize: '0.68rem', opacity: 0.7, lineHeight: 1, color: 'inherit' }}>{t.desc}</Typography>
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        {!data.tiene_comparacion_historica && (
          <Alert severity="warning" icon={<WarningAmberRoundedIcon />} sx={{ py: 0.5, ml: 'auto', fontSize: '0.775rem' }}>
            Sin datos de temporada opuesta — carga más períodos
          </Alert>
        )}
      </Box>

      <Grid container spacing={2.5} alignItems="flex-start">
        {/* Gráfica */}
        <Grid item xs={12} md={7}>
          <GlassCard>
            <Box sx={{ p: '24px' }}>
              <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: '#0F1729', mb: 0.4 }}>
                {tab === 'demanda' && `Top 12 — mayor demanda en temporada ${data.temporada_actual}`}
                {tab === 'incremento' && 'Top 10 — mayor incremento vs temporada opuesta'}
                {tab === 'caida' && 'Top 10 — mayor caída vs temporada opuesta'}
              </Typography>
              <Typography sx={{ fontSize: '0.775rem', color: '#5A6785', mb: 2.5 }}>
                Basado en {data.periodos_en_dataset?.length} períodos: {data.periodos_en_dataset?.join(', ')}
              </Typography>
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={datosGrafica} layout="vertical" margin={{ left: 10, right: 30, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#9AA3B2' }} />
                  <YAxis type="category" dataKey="name" width={185} tick={{ fontSize: 10.5, fill: '#2D3A52' }} />
                  <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.14)', background: '#fff' }}
                    formatter={(v) => [`${v.toLocaleString('es-CO')} uds`, 'Unidades']} />
                  <Bar dataKey="valor" radius={[0, 6, 6, 0]} maxBarSize={22}>
                    {datosGrafica.map((_, i) => (
                      <Cell key={i} fill={tab === 'caida' ? `rgba(220,38,38,${0.9 - i * 0.06})` : `rgba(192,57,43,${0.9 - i * 0.06})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </GlassCard>
        </Grid>

        {/* Lista */}
        <Grid item xs={12} md={5}>
          <GlassCard hover={false} sx={{ maxHeight: 540, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: '20px 20px 12px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
              <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: '#0F1729' }}>
                {tab === 'demanda' ? '📦 Priorizar stock' : tab === 'incremento' ? '⬆️ Subir pedido' : '⬇️ Revisar exceso'}
              </Typography>
            </Box>
            <Box sx={{ overflowY: 'auto', p: '12px 16px', flex: 1 }}>
              {tabActiva.length === 0 ? (
                <Typography sx={{ textAlign: 'center', color: '#5A6785', fontSize: '0.8125rem', py: 4 }}>
                  No hay datos suficientes. Carga períodos de ambas temporadas.
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.85 }}>
                  {tabActiva.map((m, i) => {
                    const variacion = m.variacion_pct
                    const subiendo  = variacion > 0
                    return (
                      <Box key={i} sx={{ p: '10px 12px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)', bgcolor: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(4px)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mb: 0.75 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{
                              width: 22, height: 22, borderRadius: '6px', flexShrink: 0,
                              background: tab === 'caida' ? 'linear-gradient(135deg,#C0392B,#922B21)' : 'linear-gradient(135deg,#C0392B,#922B21)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.6rem', fontWeight: 800, color: '#fff',
                            }}>
                              {i + 1}
                            </Box>
                            <Typography sx={{ fontSize: '0.775rem', fontWeight: 600, color: '#0F1729', lineHeight: 1.3 }}>{m.medicamento}</Typography>
                          </Box>
                          {variacion !== 0 && (
                            <Chip size="small"
                              icon={subiendo ? <TrendingUpRoundedIcon sx={{ fontSize: '12px !important' }} /> : <TrendingDownRoundedIcon sx={{ fontSize: '12px !important' }} />}
                              label={`${subiendo ? '+' : ''}${variacion}%`}
                              sx={{ fontWeight: 700, fontSize: '0.7rem', bgcolor: subiendo ? 'rgba(15,157,88,0.1)' : 'rgba(192,57,43,0.1)', color: subiendo ? '#0F9D58' : '#C0392B' }} />
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2, pl: 3.5 }}>
                          <Box>
                            <Typography sx={{ fontSize: '0.68rem', color: '#9AA3B2', display: 'block' }}>
                              {tab === 'demanda' ? 'Uds. en temporada' : 'Uds. temporada actual'}
                            </Typography>
                            <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0F1729' }}>
                              {(tab === 'demanda' ? m.unidades_en_temporada : m.unidades_temporada_actual)?.toLocaleString('es-CO')}
                            </Typography>
                          </Box>
                          {tab === 'demanda' && m.venta_en_temporada > 0 && (
                            <Box>
                              <Typography sx={{ fontSize: '0.68rem', color: '#9AA3B2', display: 'block' }}>Venta</Typography>
                              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0F1729' }}>{fmt(m.venta_en_temporada)}</Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    )
                  })}
                </Box>
              )}
            </Box>
          </GlassCard>
        </Grid>
      </Grid>
    </Box>
  )
}
