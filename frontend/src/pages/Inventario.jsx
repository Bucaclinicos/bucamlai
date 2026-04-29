import { useEffect, useState } from 'react'
import { getClusters } from '../api'
import PageHeader from '../components/PageHeader'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
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
import LinearProgress from '@mui/material/LinearProgress'
import CircularProgress from '@mui/material/CircularProgress'
import SearchIcon from '@mui/icons-material/SearchRounded'
import TrendingUpIcon from '@mui/icons-material/TrendingUpRounded'
import TrendingDownIcon from '@mui/icons-material/TrendingDownRounded'
import RemoveIcon from '@mui/icons-material/RemoveRounded'

const CAT = {
  A: { color:'#38A169', bg:'#F0FFF4', label:'Alta rotación',  Icon:TrendingUpIcon },
  B: { color:'#D69E2E', bg:'#FFFFF0', label:'Media rotación', Icon:RemoveIcon },
  C: { color:'#E53E3E', bg:'#FFF5F5', label:'Baja rotación',  Icon:TrendingDownIcon },
}
const fmt = n => new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(n)

export default function Inventario() {
  const [datos, setDatos]       = useState([])
  const [sil, setSil]           = useState(null)
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro]     = useState('')
  const [cat, setCat]           = useState('TODOS')
  const [page, setPage]         = useState(0)
  const PER = 25

  useEffect(() => {
    getClusters()
      .then(r => { setDatos(r.data.productos||[]); setSil(r.data.silhouette_score) })
      .catch(()=>setDatos([]))
      .finally(()=>setCargando(false))
  }, [])

  const filtrados = datos.filter(p =>
    p.DESCRIPCION?.toLowerCase().includes(filtro.toLowerCase()) &&
    (cat==='TODOS' || p.categoria===cat)
  )
  const totales = { A:datos.filter(p=>p.categoria==='A').length, B:datos.filter(p=>p.categoria==='B').length, C:datos.filter(p=>p.categoria==='C').length }
  const paginados = filtrados.slice(page*PER, page*PER+PER)

  return (
    <Box className="page-enter">
      <PageHeader badge="KMeans k=3" title="Clasificación de Inventario"
        subtitle="Segmentación automática de 1.593 productos por rotación, venta y rentabilidad" />

      {/* Tarjetas de categoría */}
      <Grid container spacing={2} sx={{ mb:2.5 }}>
        {['A','B','C'].map(k => {
          const c = CAT[k], on = cat===k
          return (
            <Grid item xs={12} sm={4} md={3} key={k}>
              <Paper elevation={1} onClick={()=>{ setCat(on?'TODOS':k); setPage(0) }} sx={{
                p:'18px 20px', borderRadius:'12px', cursor:'pointer',
                borderTop:`3px solid ${c.color}`,
                outline: on ? `2px solid ${c.color}` : 'none', outlineOffset:2,
                '&:hover':{ boxShadow:'0 4px 12px rgba(0,0,0,0.08)' },
                transition:'box-shadow 0.15s',
              }}>
                <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:1.5 }}>
                  <Chip label={`Cat. ${k}`} size="small" sx={{ fontWeight:600, bgcolor:c.bg, color:c.color }} />
                  <c.Icon sx={{ fontSize:18, color:c.color }} />
                </Box>
                <Typography sx={{ fontSize:'1.8rem', fontWeight:700, color:'#1A202C', lineHeight:1, mb:0.5 }}>
                  {totales[k].toLocaleString('es-CO')}
                </Typography>
                <Typography sx={{ fontSize:'0.775rem', color:'#718096' }}>{c.label}</Typography>
              </Paper>
            </Grid>
          )
        })}

        {sil!==null && (
          <Grid item xs={12} sm={4} md={3}>
            <Paper elevation={1} sx={{ p:'18px 20px', borderRadius:'12px', borderTop:`3px solid #3182CE` }}>
              <Typography sx={{ fontSize:'0.68rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px', color:'#718096', mb:1.5 }}>
                Silhouette Score
              </Typography>
              <Typography sx={{ fontSize:'1.8rem', fontWeight:700, color:sil>0.5?'#38A169':'#D69E2E', lineHeight:1, mb:1 }}>
                {sil}
              </Typography>
              <LinearProgress variant="determinate" value={sil*100}
                sx={{ mb:0.75, '& .MuiLinearProgress-bar':{ bgcolor:sil>0.5?'#38A169':'#D69E2E' } }} />
              <Typography sx={{ fontSize:'0.72rem', fontWeight:600, color:sil>0.5?'#38A169':'#D69E2E' }}>
                {sil>0.5 ? '✓ Bien definido' : '⚠ Solapados'} · Meta &gt;0.5
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Filtros */}
      <Paper elevation={1} sx={{ p:'10px 14px', borderRadius:'12px', mb:2, display:'flex', gap:2, alignItems:'center', flexWrap:'wrap' }}>
        <TextField size="small" placeholder="Buscar medicamento…" value={filtro}
          onChange={e=>{ setFiltro(e.target.value); setPage(0) }}
          InputProps={{ startAdornment:<InputAdornment position="start"><SearchIcon sx={{ fontSize:17, color:'#A0AEC0' }} /></InputAdornment> }}
          sx={{ flex:1, minWidth:200 }} />
        <ToggleButtonGroup value={cat} exclusive size="small"
          onChange={(_,v)=>{ if(v){setCat(v);setPage(0)} }}>
          {['TODOS','A','B','C'].map(c=>(
            <ToggleButton key={c} value={c}>{c==='TODOS'?'Todos':`Cat. ${c}`}</ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Typography sx={{ fontSize:'0.775rem', color:'#718096', whiteSpace:'nowrap' }}>
          {filtrados.length.toLocaleString('es-CO')} productos
        </Typography>
      </Paper>

      {/* Tabla */}
      <Paper elevation={1} sx={{ borderRadius:'12px', overflow:'hidden' }}>
        {cargando && <LinearProgress sx={{ '& .MuiLinearProgress-bar':{ bgcolor:'#E53E3E' } }} />}
        {cargando ? (
          <Box sx={{ display:'flex', flexDirection:'column', alignItems:'center', py:10, gap:2 }}>
            <CircularProgress sx={{ color:'#E53E3E' }} size={32} />
            <Typography sx={{ color:'#718096', fontSize:'0.875rem' }}>Cargando inventario…</Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {['#','Medicamento','Unidades','Venta Total','Rentabilidad','Categoría'].map(col=>(
                      <TableCell key={col} align={col==='#'||col==='Categoría'?'center':'left'}>{col}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginados.map((p,i)=>{
                    const c = CAT[p.categoria]||CAT.C
                    return (
                      <TableRow key={i} hover>
                        <TableCell align="center">
                          <Typography sx={{ fontSize:'0.72rem', color:'#A0AEC0' }}>{page*PER+i+1}</Typography>
                        </TableCell>
                        <TableCell sx={{ maxWidth:320 }}>
                          <Typography sx={{ fontSize:'0.8125rem', fontWeight:500 }} noWrap>{p.DESCRIPCION}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize:'0.8125rem', fontWeight:600 }}>{p.unidades?.toLocaleString('es-CO')}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize:'0.8125rem', color:'#718096' }}>{fmt(p.venta)}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize:'0.8125rem', fontWeight:600,
                            color:p.rentabilidad<0?'#E53E3E':p.rentabilidad>25?'#38A169':'#D69E2E' }}>
                            {p.rentabilidad>0?'+':''}{p.rentabilidad}%
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={`${p.categoria} · ${c.label}`} size="small"
                            sx={{ fontWeight:600, bgcolor:c.bg, color:c.color, fontSize:'0.7rem' }} />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination component="div" count={filtrados.length} page={page}
              onPageChange={(_,p)=>setPage(p)} rowsPerPage={PER} rowsPerPageOptions={[PER]}
              labelDisplayedRows={({from,to,count})=>`${from}–${to} de ${count.toLocaleString('es-CO')}`} />
          </>
        )}
      </Paper>
    </Box>
  )
}
