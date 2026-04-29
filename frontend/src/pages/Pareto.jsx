import { useEffect, useState } from 'react'
import { getPareto } from '../api'
import PageHeader from '../components/PageHeader'
import GlassCard from '../components/GlassCard'
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import ToggleButton from '@mui/material/ToggleButton'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TablePagination from '@mui/material/TablePagination'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import SearchIcon from '@mui/icons-material/SearchRounded'

const COLOR_CAT = { A: '#C0392B', B: '#E67E22', C: '#7F8C8D' }
const GRAD_CAT  = {
  A: 'linear-gradient(135deg,#C0392B,#922B21)',
  B: 'linear-gradient(135deg,#E67E22,#CA6F1E)',
  C: 'linear-gradient(135deg,#7F8C8D,#5D6D7E)',
}

const fmt = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

export default function Pareto() {
  const [data, setData] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [filtro, setFiltro] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [page, setPage] = useState(0)
  const rowsPerPage = 20

  useEffect(() => {
    getPareto()
      .then(r => setData(r.data))
      .catch(() => setError('No se pudo conectar con el servidor.'))
      .finally(() => setCargando(false))
  }, [])

  if (cargando) return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, flexDirection: 'column', gap: 2 }}>
      <CircularProgress sx={{ color: '#C0392B' }} />
      <Typography sx={{ color: '#5A6785', fontSize: '0.875rem' }}>Calculando análisis Pareto...</Typography>
    </Box>
  )
  if (error) return <Box sx={{ p: 4 }}><Alert severity="error">{error}</Alert></Box>

  const graficaData = (data.productos || []).slice(0, 30).map(p => ({
    nombre: p.DESCRIPCION.length > 20 ? p.DESCRIPCION.slice(0, 20) + '…' : p.DESCRIPCION,
    venta: p.venta_total, acumulado: p.acumulado,
  }))

  const productos = (data.productos || [])
    .filter(p => filtro === 'todos' || p.categoria_abc === filtro)
    .filter(p => p.DESCRIPCION.toLowerCase().includes(busqueda.toLowerCase()))

  return (
    <Box className="page-enter">
      <PageHeader title="Análisis Pareto / ABC"
        subtitle={`${data.total_productos} productos · Venta total: ${fmt(data.venta_total_global)}`} />

      {/* Tarjetas ABC */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {(data.resumen_abc || []).sort((a, b) => a.categoria_abc.localeCompare(b.categoria_abc)).map(cat => (
          <Grid item xs={12} md={4} key={cat.categoria_abc}>
            <GlassCard>
              <Box sx={{ height: 4, background: GRAD_CAT[cat.categoria_abc] }} />
              <Box sx={{ p: '20px 22px' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Chip label={`Cat. ${cat.categoria_abc}`} size="small"
                    sx={{ fontWeight: 700, bgcolor: `${COLOR_CAT[cat.categoria_abc]}15`, color: COLOR_CAT[cat.categoria_abc] }} />
                  <Typography sx={{ fontSize: '0.775rem', color: '#5A6785' }}>
                    {cat.categoria_abc === 'A' ? 'Alta rotación' : cat.categoria_abc === 'B' ? 'Media rotación' : 'Baja rotación'}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: '2rem', fontWeight: 800, color: '#0F1729', lineHeight: 1, mb: 0.5 }}>
                  {cat.cantidad_productos}
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: '#5A6785', display: 'block', mb: 1 }}>productos</Typography>
                <Typography sx={{ fontWeight: 700, color: COLOR_CAT[cat.categoria_abc], fontSize: '0.875rem' }}>
                  {cat.porcentaje_venta}% de las ventas
                </Typography>
                <Typography sx={{ fontSize: '0.775rem', color: '#9AA3B2', mt: 0.25 }}>{fmt(cat.venta_categoria)}</Typography>
              </Box>
            </GlassCard>
          </Grid>
        ))}
      </Grid>

      {/* Gráfica Pareto */}
      <GlassCard sx={{ mb: 3 }}>
        <Box sx={{ p: '24px' }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#0F1729', mb: 0.4 }}>
            Curva de Pareto — Top 30 productos
          </Typography>
          <Typography sx={{ fontSize: '0.775rem', color: '#5A6785', mb: 2.5 }}>
            Barras: venta individual · Línea: % acumulado de ventas
          </Typography>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={graficaData} margin={{ top: 0, right: 30, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="nombre" tick={{ fontSize: 10, fill: '#5A6785' }} angle={-45} textAnchor="end" interval={0} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#9AA3B2' }} tickFormatter={v => `$${(v / 1e6).toFixed(0)}M`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#9AA3B2' }} tickFormatter={v => `${v}%`} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ borderRadius: 10, fontSize: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.14)', background: '#fff' }}
                formatter={(value, name) => name === 'acumulado' ? [`${value}%`, '% Acumulado'] : [fmt(value), 'Venta']}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar yAxisId="left" dataKey="venta" name="Venta" fill="#C0392B" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" dataKey="acumulado" name="% Acumulado" type="monotone" stroke="#0F1729" strokeWidth={2.5} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </Box>
      </GlassCard>

      {/* Tabla */}
      <GlassCard hover={false}>
        <Box sx={{ p: '18px 22px 0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#0F1729', flex: 1 }}>Detalle de productos</Typography>
            <ToggleButtonGroup value={filtro} exclusive size="small"
              onChange={(_, v) => { if (v) { setFiltro(v); setPage(0) } }}>
              {['todos', 'A', 'B', 'C'].map(f => (
                <ToggleButton key={f} value={f} sx={{ px: 1.5 }}>
                  {f === 'todos' ? 'Todos' : `Cat. ${f}`}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            <TextField size="small" placeholder="Buscar producto..." value={busqueda}
              onChange={e => { setBusqueda(e.target.value); setPage(0) }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 17, color: '#9AA3B2' }} /></InputAdornment> }}
              sx={{ width: 200 }} />
          </Box>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {['#', 'Producto', 'Venta total', 'Unidades', 'Rentabilidad', '% Acumulado', 'Cat.'].map(col => (
                  <TableCell key={col} align={['Venta total','Unidades','Rentabilidad','% Acumulado'].includes(col) ? 'right' : col === 'Cat.' ? 'center' : 'left'}>
                    {col}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {productos.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((p, i) => (
                <TableRow key={p.DESCRIPCION} hover sx={{ bgcolor: i % 2 === 0 ? 'transparent' : 'rgba(15,23,41,0.015)' }}>
                  <TableCell><Typography sx={{ fontSize: '0.72rem', color: '#9AA3B2' }}>{page * rowsPerPage + i + 1}</Typography></TableCell>
                  <TableCell><Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, color: '#0F1729' }}>{p.DESCRIPCION}</Typography></TableCell>
                  <TableCell align="right"><Typography sx={{ fontSize: '0.8125rem', color: '#2D3A52' }}>{fmt(p.venta_total)}</Typography></TableCell>
                  <TableCell align="right"><Typography sx={{ fontSize: '0.8125rem', color: '#2D3A52' }}>{p.unidades_total.toLocaleString('es-CO')}</Typography></TableCell>
                  <TableCell align="right">
                    <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700, color: p.rentabilidad_promedio < 0 ? '#C0392B' : '#0F9D58' }}>
                      {p.rentabilidad_promedio.toFixed(1)}%
                    </Typography>
                  </TableCell>
                  <TableCell align="right"><Typography sx={{ fontSize: '0.8125rem', color: '#5A6785' }}>{p.acumulado.toFixed(2)}%</Typography></TableCell>
                  <TableCell align="center">
                    <Chip label={p.categoria_abc} size="small"
                      sx={{ fontWeight: 700, fontSize: '0.7rem', bgcolor: `${COLOR_CAT[p.categoria_abc]}15`, color: COLOR_CAT[p.categoria_abc] }} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div" count={productos.length} page={page}
          onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage} rowsPerPageOptions={[rowsPerPage]}
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count.toLocaleString('es-CO')}`}
          sx={{ borderTop: '1px solid rgba(0,0,0,0.05)', bgcolor: 'rgba(15,23,41,0.02)' }}
        />
      </GlassCard>
    </Box>
  )
}
