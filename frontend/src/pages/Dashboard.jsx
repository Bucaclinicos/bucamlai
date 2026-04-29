import { useEffect, useState } from 'react'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts'
import { getResumen } from '../api'
import KpiCard from '../components/KpiCard'
import PageHeader from '../components/PageHeader'
import ListAltIcon       from '@mui/icons-material/ListAltRounded'
import MedicationIcon    from '@mui/icons-material/MedicationRounded'
import BusinessIcon      from '@mui/icons-material/BusinessRounded'
import WarningAmberIcon  from '@mui/icons-material/WarningAmberRounded'
import MonetizationOnIcon from '@mui/icons-material/MonetizationOnRounded'
import TrendingUpIcon    from '@mui/icons-material/TrendingUpRounded'
import PercentIcon       from '@mui/icons-material/PercentRounded'

const COLORS = { EXCELENTE:'#38A169', BUENO:'#3182CE', MEDIO:'#D69E2E', BAJO:'#DD6B20', 'PÉRDIDA':'#E53E3E', PERDIDA:'#E53E3E', ALTO:'#805AD5' }
const fmt  = n => new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(n)
const fmtM = n => n>=1e9?`$${(n/1e9).toFixed(1)}B`:n>=1e6?`$${(n/1e6).toFixed(1)}M`:fmt(n)

const Tip = ({ active, payload, label }) => active && payload?.length ? (
  <Paper elevation={3} sx={{ px:1.75, py:1.25, borderRadius:'8px' }}>
    <Typography sx={{ fontWeight:600, fontSize:'0.8rem', mb:0.25 }}>{label}</Typography>
    <Typography sx={{ fontSize:'0.75rem', color:'#718096' }}>{payload[0]?.value?.toLocaleString('es-CO')} productos</Typography>
  </Paper>
) : null

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getResumen().then(r => setData(r.data)).catch(()=>setData(null)).finally(()=>setLoading(false))
  }, [])

  if (loading) return (
    <Box sx={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', flexDirection:'column', gap:2 }}>
      <CircularProgress sx={{ color:'#E53E3E' }} size={32} />
      <Typography sx={{ color:'#718096', fontSize:'0.875rem' }}>Cargando datos...</Typography>
    </Box>
  )

  if (!data) return (
    <Box sx={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh' }}>
      <Alert severity="error" sx={{ maxWidth:440 }}>No se pudo conectar con el backend en el puerto 8080.</Alert>
    </Box>
  )

  const entries  = Object.entries(data.clasificacion || {})
  const pieData  = entries.map(([name, value]) => ({ name, value }))
  const barData  = entries.map(([name, value]) => ({ name, productos: value }))
  const margen   = data.venta_total ? ((data.utilidad_total/data.venta_total)*100).toFixed(1) : 0
  const perdidas = data.clasificacion?.['PÉRDIDA'] || data.clasificacion?.['PERDIDA'] || 0

  return (
    <Box className="page-enter">
      <PageHeader badge="CRISP-DM · Fase 2" title="Dashboard General"
        subtitle="Resumen ejecutivo del inventario y rentabilidad de Bucaclínicos S.A.S. — Enero a Marzo 2026" />

      <Grid container spacing={2} sx={{ mb:2.5 }}>
        {[
          { titulo:'Total Registros',    valor:data.total_registros?.toLocaleString('es-CO'),     subtitulo:'3 períodos analizados',      icon:ListAltIcon,       color:'#E53E3E' },
          { titulo:'Productos Únicos',   valor:data.productos_unicos?.toLocaleString('es-CO'),    subtitulo:'Referencias en catálogo',    icon:MedicationIcon,    color:'#3182CE' },
          { titulo:'Laboratorios',       valor:data.laboratorios_unicos?.toLocaleString('es-CO'), subtitulo:'Proveedores activos',        icon:BusinessIcon,      color:'#38A169' },
          { titulo:'En Pérdida',         valor:perdidas,                                           subtitulo:'Requieren acción inmediata', icon:WarningAmberIcon,  color:'#D69E2E',
            trend: perdidas>0 ? { positivo:false, texto:`${perdidas} productos bajo costo` } : null },
        ].map(k => <Grid item xs={12} sm={6} md={3} key={k.titulo}><KpiCard {...k} /></Grid>)}
      </Grid>

      <Grid container spacing={2} sx={{ mb:2.5 }}>
        {[
          { titulo:'Venta Total Acumulada', valor:fmtM(data.venta_total),    subtitulo:'Ene – Mar 2026',              icon:MonetizationOnIcon, color:'#E53E3E' },
          { titulo:'Utilidad Total',        valor:fmtM(data.utilidad_total), subtitulo:'Ganancia neta del período',   icon:TrendingUpIcon,     color:'#38A169',
            trend:{ positivo:true, texto:`${margen}% de margen sobre ventas` } },
          { titulo:'Margen General',        valor:`${margen}%`,              subtitulo:'Rentabilidad promedio',       icon:PercentIcon,        color:'#3182CE' },
        ].map(k => <Grid item xs={12} md={4} key={k.titulo}><KpiCard {...k} /></Grid>)}
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <Paper elevation={1} sx={{ p:'22px 24px', borderRadius:'12px' }}>
            <Typography sx={{ fontWeight:600, fontSize:'0.9rem', color:'#1A202C', mb:0.25 }}>
              Productos por Clasificación de Rentabilidad
            </Typography>
            <Typography sx={{ fontSize:'0.775rem', color:'#A0AEC0', mb:2.5 }}>
              Distribución según umbrales de margen — Bucaclínicos
            </Typography>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={barData} margin={{ top:0, right:0, left:-20, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDF2F7" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize:11, fill:'#718096' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:11, fill:'#A0AEC0' }} axisLine={false} tickLine={false} />
                <Tooltip content={<Tip />} cursor={{ fill:'rgba(0,0,0,0.02)' }} />
                <Bar dataKey="productos" radius={[5,5,0,0]} maxBarSize={52}>
                  {barData.map(e => <Cell key={e.name} fill={COLORS[e.name]||'#CBD5E0'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper elevation={1} sx={{ p:'22px 24px', borderRadius:'12px' }}>
            <Typography sx={{ fontWeight:600, fontSize:'0.9rem', color:'#1A202C', mb:0.25 }}>
              Distribución de Rentabilidad
            </Typography>
            <Typography sx={{ fontSize:'0.775rem', color:'#A0AEC0', mb:2 }}>
              Participación porcentual por categoría
            </Typography>
            <ResponsiveContainer width="100%" height={186}>
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={78} innerRadius={44} paddingAngle={2}>
                  {pieData.map(e => <Cell key={e.name} fill={COLORS[e.name]||'#CBD5E0'} />)}
                </Pie>
                <Tooltip formatter={(v,n)=>[v.toLocaleString('es-CO'),n]}
                  contentStyle={{ borderRadius:8, fontSize:12, border:'1px solid #E2E8F0', boxShadow:'0 4px 12px rgba(0,0,0,0.08)' }} />
              </PieChart>
            </ResponsiveContainer>
            <Box sx={{ display:'flex', flexDirection:'column', gap:0.7, mt:1.5 }}>
              {pieData.map(({ name, value }) => (
                <Box key={name} sx={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <Box sx={{ display:'flex', alignItems:'center', gap:0.875 }}>
                    <Box sx={{ width:8, height:8, borderRadius:'2px', bgcolor:COLORS[name]||'#CBD5E0', flexShrink:0 }} />
                    <Typography sx={{ fontSize:'0.775rem', color:'#718096' }}>{name}</Typography>
                  </Box>
                  <Typography sx={{ fontSize:'0.775rem', fontWeight:600, color:'#1A202C' }}>
                    {value.toLocaleString('es-CO')}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
