import { useState, useRef, useEffect } from 'react'
import { postCargar, getPeriodos } from '../api'
import PageHeader from '../components/PageHeader'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import ToggleButton from '@mui/material/ToggleButton'
import TextField from '@mui/material/TextField'
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import LinearProgress from '@mui/material/LinearProgress'
import Divider from '@mui/material/Divider'
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded'
import InsertDriveFileRoundedIcon from '@mui/icons-material/InsertDriveFileRounded'
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'
import StorageRoundedIcon from '@mui/icons-material/StorageRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import CancelRoundedIcon from '@mui/icons-material/CancelRounded'

const COLS_ESPERADAS = ['COD', 'DESCRIPCION', 'LABORATORIO', 'COSTO', 'UND_VEND', 'VLR_VENTA', 'UTILIDAD', 'RENTABILIDAD']
const MESES = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE']

export default function CargarDatos() {
  const [archivo, setArchivo] = useState(null)
  const [periodo, setPeriodo] = useState('')
  const [resultado, setResultado] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [arrastrar, setArrastrar] = useState(false)
  const [periodos, setPeriodos] = useState([])
  const [anio, setAnio] = useState(new Date().getFullYear())
  const inputRef = useRef()

  useEffect(() => { cargarPeriodos() }, [])

  const cargarPeriodos = async () => {
    try { const r = await getPeriodos(); setPeriodos(r.data.periodos || []) } catch { }
  }

  const seleccionar = (file) => {
    if (!file) return
    if (!file.name.match(/\.(csv|xlsx)$/i)) { alert('Solo se aceptan archivos .csv o .xlsx'); return }
    setArchivo(file); setResultado(null)
  }

  const seleccionarMes = (mes) => setPeriodo(`${mes}-${anio}`)

  const enviar = async () => {
    if (!archivo || !periodo.trim()) return
    const fd = new FormData()
    fd.append('archivo', archivo)
    fd.append('periodo', periodo.trim().toUpperCase())
    setCargando(true)
    try {
      const r = await postCargar(fd)
      setResultado({ ok: true, ...r.data })
      cargarPeriodos()
    } catch (e) {
      setResultado({ ok: false, mensaje: e?.response?.data?.detail || 'Error al procesar el archivo' })
    }
    setCargando(false)
  }

  const limpiar = () => { setArchivo(null); setResultado(null); setPeriodo('') }

  return (
    <Box className="page-enter">
      <PageHeader badge="Preparación de datos" title="Cargar Datos"
        subtitle="Sube el archivo de ventas de un período y se acumulará automáticamente al historial" />

      <Grid container spacing={3} alignItems="flex-start">
        {/* Columna principal */}
        <Grid item xs={12} md={8}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

            {/* Zona drop */}
            <Card
              elevation={2}
              onClick={() => inputRef.current.click()}
              onDragOver={e => { e.preventDefault(); setArrastrar(true) }}
              onDragLeave={() => setArrastrar(false)}
              onDrop={e => { e.preventDefault(); setArrastrar(false); seleccionar(e.dataTransfer.files[0]) }}
              sx={{
                border: '2px dashed',
                borderColor: arrastrar ? 'primary.main' : archivo ? 'success.main' : 'divider',
                bgcolor: arrastrar ? 'rgba(192,57,43,0.04)' : archivo ? 'rgba(15,157,88,0.04)' : 'background.paper',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': { borderColor: 'primary.light', bgcolor: 'rgba(192,57,43,0.02)' },
              }}
            >
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <input ref={inputRef} type="file" accept=".csv,.xlsx" style={{ display: 'none' }} onChange={e => seleccionar(e.target.files[0])} />
                <Box sx={{
                  width: 64, height: 64, borderRadius: '50%',
                  bgcolor: arrastrar ? 'rgba(192,57,43,0.1)' : archivo ? 'rgba(15,157,88,0.1)' : 'grey.100',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2,
                }}>
                  {archivo
                    ? <InsertDriveFileRoundedIcon sx={{ fontSize: 30, color: 'success.main' }} />
                    : <UploadFileRoundedIcon sx={{ fontSize: 30, color: arrastrar ? 'primary.main' : 'text.disabled' }} />}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.75 }}>
                  {archivo ? archivo.name : 'Arrastra tu archivo aquí'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {archivo ? `${(archivo.size / 1024).toFixed(1)} KB · Haz clic para cambiar` : 'o haz clic para seleccionar · .csv · .xlsx'}
                </Typography>
              </CardContent>
            </Card>

            {/* Selector de período */}
            {archivo && (
              <Card elevation={2}>
                <CardContent sx={{ p: '22px 24px !important' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                    <CalendarMonthRoundedIcon sx={{ color: 'primary.main', fontSize: 18 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>¿A qué período corresponde este archivo?</Typography>
                  </Box>

                  {/* Selector año */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Año:</Typography>
                    <ToggleButtonGroup value={anio} exclusive size="small"
                      onChange={(_, val) => { if (val) { setAnio(val); if (periodo) setPeriodo(periodo.split('-')[0] + '-' + val) } }}>
                      {[2024, 2025, 2026].map(a => (
                        <ToggleButton key={a} value={a} sx={{ fontWeight: 600, fontSize: '0.8rem', px: 2 }}>{a}</ToggleButton>
                      ))}
                    </ToggleButtonGroup>
                  </Box>

                  {/* Grilla meses */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 0.75, mb: 2 }}>
                    {MESES.map(mes => {
                      const valor = `${mes}-${anio}`
                      const activo = periodo === valor
                      const yaExiste = periodos.some(p => p.periodo === valor)
                      return (
                        <Button
                          key={mes}
                          size="small"
                          variant={activo ? 'contained' : 'outlined'}
                          color={activo ? 'primary' : yaExiste ? 'success' : 'inherit'}
                          onClick={() => seleccionarMes(mes)}
                          sx={{ fontSize: '0.7rem', py: 0.75, fontWeight: 600, minWidth: 0, flexDirection: 'column', height: 'auto', borderColor: activo ? undefined : yaExiste ? 'success.main' : 'divider' }}
                        >
                          {mes.slice(0, 3)}
                          {yaExiste && <Typography component="span" sx={{ fontSize: '0.6rem', mt: 0.25, opacity: 0.8 }}>cargado</Typography>}
                        </Button>
                      )
                    })}
                  </Box>

                  {/* Input manual */}
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">O escríbelo:</Typography>
                    <TextField
                      size="small"
                      placeholder="ej: AGOSTO-2025"
                      value={periodo}
                      onChange={e => setPeriodo(e.target.value.toUpperCase())}
                      sx={{ flex: 1 }}
                    />
                  </Box>

                  {periodo && (
                    <Alert severity="info" icon={false} sx={{ mt: 1.5, py: 0.75, bgcolor: 'rgba(192,57,43,0.06)', color: 'primary.main', border: '1px solid rgba(192,57,43,0.2)' }}>
                      Se cargará como período: <strong>{periodo}</strong>
                      {periodos.some(p => p.periodo === periodo) && ' — reemplazará los datos existentes'}
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Barra acción */}
            {archivo && (
              <Card elevation={2}>
                <CardContent sx={{ p: '14px 20px !important' }}>
                  {cargando && <LinearProgress sx={{ mb: 2 }} />}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <InsertDriveFileRoundedIcon sx={{ color: 'success.main', fontSize: 28, flexShrink: 0 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{archivo.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(archivo.size / 1024).toFixed(1)} KB · {periodo ? `Período: ${periodo}` : 'Sin período asignado'}
                      </Typography>
                    </Box>
                    <Button size="small" variant="outlined" color="inherit" onClick={limpiar} startIcon={<CancelRoundedIcon />}>
                      Quitar
                    </Button>
                    <Button
                      variant="contained" color="primary"
                      disabled={cargando || !periodo.trim()}
                      onClick={enviar}
                      startIcon={cargando ? undefined : <UploadFileRoundedIcon />}
                    >
                      {cargando ? 'Procesando...' : 'Cargar y entrenar'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Resultado */}
            {resultado && (
              <Card elevation={2} sx={{ borderLeft: `5px solid`, borderLeftColor: resultado.ok ? 'success.main' : 'error.main' }}>
                <CardContent sx={{ p: '24px 26px !important' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    {resultado.ok
                      ? <CheckCircleRoundedIcon color="success" sx={{ fontSize: 24 }} />
                      : <CancelRoundedIcon color="error" sx={{ fontSize: 24 }} />}
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {resultado.ok ? 'Archivo procesado correctamente' : 'Error al procesar'}
                    </Typography>
                  </Box>
                  {resultado.ok ? (
                    <Grid container spacing={1.5}>
                      {[
                        { label: 'Registros nuevos', valor: resultado.registros_nuevos?.toLocaleString('es-CO'), color: 'success.main' },
                        { label: 'Total acumulado', valor: resultado.total_registros_acumulados?.toLocaleString('es-CO'), color: 'primary.main' },
                        { label: 'Períodos en sistema', valor: resultado.total_periodos, color: 'text.primary' },
                      ].map(k => (
                        <Grid item xs={4} key={k.label}>
                          <Box sx={{ bgcolor: 'grey.50', borderRadius: 2, p: '14px 16px', border: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="overline" color="text.secondary">{k.label}</Typography>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: k.color }}>{k.valor}</Typography>
                          </Box>
                        </Grid>
                      ))}

                      {resultado.reentrenamiento?.random_forest && (
                        <Grid item xs={12}>
                          <Alert severity="success" icon={<CheckCircleRoundedIcon />}>
                            <AlertTitle>Modelos re-entrenados automáticamente</AlertTitle>
                            Random Forest — MAE: <strong>{resultado.reentrenamiento.random_forest.mae}</strong> · RMSE: <strong>{resultado.reentrenamiento.random_forest.rmse}</strong>
                          </Alert>
                        </Grid>
                      )}

                      {resultado.periodos_en_sistema?.length > 0 && (
                        <Grid item xs={12}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75, fontWeight: 600 }}>
                            Períodos en el sistema:
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                            {resultado.periodos_en_sistema.map(p => (
                              <Chip key={p} label={p} size="small" sx={{ fontWeight: 600, fontSize: '0.72rem' }} />
                            ))}
                          </Box>
                        </Grid>
                      )}
                    </Grid>
                  ) : (
                    <Alert severity="error">{resultado.mensaje}</Alert>
                  )}
                </CardContent>
              </Card>
            )}
          </Box>
        </Grid>

        {/* Columna lateral */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Historial */}
            <Card elevation={2}>
              <CardContent sx={{ p: '22px !important' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <StorageRoundedIcon sx={{ color: 'primary.main', fontSize: 18 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Historial cargado</Typography>
                  <Chip label={`${periodos.length} períodos`} size="small" color="primary" variant="outlined" sx={{ ml: 'auto', fontWeight: 700, fontSize: '0.7rem' }} />
                </Box>
                {periodos.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>Sin períodos cargados aún</Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    {periodos.map(p => (
                      <Box key={p.periodo} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.5, py: 1, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 7, height: 7, borderRadius: '2px', bgcolor: 'success.main' }} />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{p.periodo}</Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">{p.registros?.toLocaleString('es-CO')} reg.</Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Formato esperado */}
            <Card elevation={2}>
              <CardContent sx={{ p: '22px !important' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Formato esperado</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  {COLS_ESPERADAS.map(col => (
                    <Box key={col} sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 1.5, py: 0.75, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                      <Box sx={{ width: 7, height: 7, borderRadius: '2px', bgcolor: 'primary.main', flexShrink: 0 }} />
                      <Typography variant="caption" sx={{ fontWeight: 700, fontFamily: 'monospace', color: 'text.secondary' }}>{col}</Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>

            {/* Especificaciones */}
            <Card elevation={2} sx={{ bgcolor: '#1F2937' }}>
              <CardContent sx={{ p: '22px !important' }}>
                <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1.75 }}>Especificaciones</Typography>
                {[
                  { icono: '📂', texto: 'Formatos: .csv o .xlsx' },
                  { icono: '⚙️', texto: 'Separador CSV: punto y coma (;)' },
                  { icono: '🔤', texto: 'Codificación: UTF-8 o Latin-1' },
                  { icono: '🔢', texto: 'Números en formato colombiano (14.850,00)' },
                  { icono: '🏷️', texto: 'Encabezados de empresa ignorados' },
                  { icono: '🤖', texto: 'Los modelos se re-entrenan automáticamente' },
                ].map(r => (
                  <Box key={r.texto} sx={{ display: 'flex', gap: 1.25, mb: 1.25 }}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>{r.icono}</span>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{r.texto}</Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>
    </Box>
  )
}
