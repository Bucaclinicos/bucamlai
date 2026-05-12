import { useState, useEffect, useCallback } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Tooltip from '@mui/material/Tooltip'
import Divider from '@mui/material/Divider'
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded'
import ToggleOnRoundedIcon from '@mui/icons-material/ToggleOnRounded'
import ToggleOffRoundedIcon from '@mui/icons-material/ToggleOffRounded'
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded'
import PageHeader from '../components/PageHeader'
import { getAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser } from '../api'
import { useAuth } from '../context/AuthContext'

const ROLES = ['admin', 'analista']
const EMPTY_FORM = { username: '', email: '', nombre: '', password: '', role: 'analista' }

const roleColor = { admin: 'error', analista: 'primary' }

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function AdminPanel() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Diálogo crear/editar
  const [dlgOpen, setDlgOpen] = useState(false)
  const [editing, setEditing] = useState(null) // null = crear, objeto = editar
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  // Diálogo confirmar eliminar
  const [delTarget, setDelTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await getAdminUsers()
      setUsers(data)
    } catch (e) {
      setError(e?.response?.data?.detail || 'Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  // ── Abrir diálogos ──────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setDlgOpen(true)
  }

  const openEdit = (u) => {
    setEditing(u)
    setForm({ username: u.username, email: u.email, nombre: u.nombre, password: '', role: u.role })
    setFormError('')
    setDlgOpen(true)
  }

  // ── Guardar (crear o editar) ─────────────────────────────────────────────────
  const handleSave = async () => {
    setFormError('')
    setSaving(true)
    try {
      if (editing) {
        const payload = { email: form.email, nombre: form.nombre, role: form.role }
        if (form.password) payload.password = form.password
        await updateAdminUser(editing.id, payload)
      } else {
        await createAdminUser(form)
      }
      setDlgOpen(false)
      fetchUsers()
    } catch (e) {
      setFormError(e?.response?.data?.detail || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  // ── Activar / desactivar ────────────────────────────────────────────────────
  const toggleActive = async (u) => {
    try {
      await updateAdminUser(u.id, { is_active: !u.is_active })
      fetchUsers()
    } catch (e) {
      setError(e?.response?.data?.detail || 'Error al actualizar estado')
    }
  }

  // ── Eliminar ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteAdminUser(delTarget.id)
      setDelTarget(null)
      fetchUsers()
    } catch (e) {
      setError(e?.response?.data?.detail || 'Error al eliminar usuario')
    } finally {
      setDeleting(false)
    }
  }

  // ── Contadores resumen ──────────────────────────────────────────────────────
  const totalAdmin    = users.filter(u => u.role === 'admin').length
  const totalAnalista = users.filter(u => u.role === 'analista').length
  const totalActivos  = users.filter(u => u.is_active).length

  return (
    <Box className="page-enter">
      <PageHeader
        badge="Administración"
        title="Panel de Administrador"
        subtitle="Gestiona los usuarios del sistema: crea, edita, activa o elimina cuentas"
      />

      {/* Tarjetas resumen */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {[
          { label: 'Total usuarios', value: users.length, color: '#2D3748' },
          { label: 'Administradores', value: totalAdmin, color: '#C0392B' },
          { label: 'Analistas', value: totalAnalista, color: '#2B6CB0' },
          { label: 'Activos', value: totalActivos, color: '#276749' },
        ].map(k => (
          <Card key={k.label} elevation={2} sx={{ flex: '1 1 140px', minWidth: 130, borderRadius: 3 }}>
            <CardContent sx={{ p: '16px 20px !important' }}>
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {k.label}
              </Typography>
              <Typography sx={{ fontSize: '2rem', fontWeight: 800, color: k.color, lineHeight: 1.2 }}>
                {k.value}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Tabla principal */}
      <Card elevation={2} sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 0 }}>

          {/* Cabecera tabla */}
          <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid #EDF2F7' }}>
            <PeopleRoundedIcon sx={{ color: '#C0392B', fontSize: 20 }} />
            <Typography sx={{ fontWeight: 700, color: '#2D3748', fontSize: '0.95rem', flex: 1 }}>
              Usuarios registrados
            </Typography>
            <Button
              variant="contained"
              startIcon={<PersonAddRoundedIcon />}
              onClick={openCreate}
              sx={{ bgcolor: '#C0392B', '&:hover': { bgcolor: '#a93226' }, borderRadius: 2, fontWeight: 600, textTransform: 'none' }}
            >
              Nuevo usuario
            </Button>
          </Box>

          {error && (
            <Box sx={{ px: 3, pt: 2 }}>
              <Alert severity="error" onClose={() => setError('')}>{error}</Alert>
            </Box>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress sx={{ color: '#C0392B' }} />
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#F7FAFC' }}>
                    {['Nombre', 'Usuario', 'Correo electrónico', 'Rol', 'Estado', 'Creado', 'Acciones'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#718096', py: 1.5, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4, color: '#A0AEC0' }}>
                        No hay usuarios registrados
                      </TableCell>
                    </TableRow>
                  )}
                  {users.map(u => {
                    const isMe = u.username === currentUser?.username
                    return (
                      <TableRow
                        key={u.id}
                        sx={{
                          opacity: u.is_active ? 1 : 0.55,
                          '&:hover': { bgcolor: '#FFF5F5' },
                          borderBottom: '1px solid #EDF2F7',
                        }}
                      >
                        <TableCell sx={{ py: 1.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                            <Box sx={{
                              width: 32, height: 32, borderRadius: '8px',
                              bgcolor: u.role === 'admin' ? '#FFF5F5' : '#EBF8FF',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 700, fontSize: '0.8rem',
                              color: u.role === 'admin' ? '#C0392B' : '#2B6CB0',
                              flexShrink: 0,
                            }}>
                              {u.nombre?.[0]?.toUpperCase() ?? 'U'}
                            </Box>
                            <Box>
                              <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#2D3748', lineHeight: 1.2 }}>
                                {u.nombre}
                              </Typography>
                              {isMe && (
                                <Typography sx={{ fontSize: '0.65rem', color: '#A0AEC0' }}>Tú</Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.82rem', color: '#4A5568', fontFamily: 'monospace' }}>
                          {u.username}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.82rem', color: '#4A5568' }}>
                          {u.email}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={u.role}
                            size="small"
                            color={roleColor[u.role] ?? 'default'}
                            variant="outlined"
                            sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'capitalize' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={u.is_active ? 'Activo' : 'Inactivo'}
                            size="small"
                            color={u.is_active ? 'success' : 'default'}
                            sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.78rem', color: '#718096' }}>
                          {formatDate(u.created_at)}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.25 }}>
                            <Tooltip title="Editar">
                              <IconButton size="small" onClick={() => openEdit(u)} sx={{ color: '#718096', '&:hover': { color: '#2B6CB0' } }}>
                                <EditRoundedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={u.is_active ? 'Desactivar' : 'Activar'}>
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => toggleActive(u)}
                                  disabled={isMe}
                                  sx={{ color: u.is_active ? '#276749' : '#A0AEC0', '&:hover': { color: u.is_active ? '#C0392B' : '#276749' } }}
                                >
                                  {u.is_active
                                    ? <ToggleOnRoundedIcon fontSize="small" />
                                    : <ToggleOffRoundedIcon fontSize="small" />}
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Eliminar">
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => setDelTarget(u)}
                                  disabled={isMe}
                                  sx={{ color: '#A0AEC0', '&:hover': { color: '#C0392B' } }}
                                >
                                  <DeleteRoundedIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Diálogo Crear / Editar ─────────────────────────────────────────── */}
      <Dialog open={dlgOpen} onClose={() => setDlgOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#2D3748', pb: 0 }}>
          {editing ? 'Editar usuario' : 'Nuevo usuario'}
        </DialogTitle>
        <Divider sx={{ mt: 2 }} />
        <DialogContent sx={{ pt: 2.5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Nombre completo"
              value={form.nombre}
              onChange={e => setForm({ ...form, nombre: e.target.value })}
              required
              fullWidth
              size="small"
            />
            <TextField
              label="Usuario"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              required
              fullWidth
              size="small"
              disabled={!!editing}
              helperText={editing ? 'El nombre de usuario no se puede cambiar' : ''}
            />
            <TextField
              label="Correo electrónico"
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
              fullWidth
              size="small"
            />
            <TextField
              label={editing ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña'}
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required={!editing}
              fullWidth
              size="small"
              helperText="Mínimo 6 caracteres"
            />
            <TextField
              select
              label="Rol"
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}
              required
              fullWidth
              size="small"
            >
              {ROLES.map(r => (
                <MenuItem key={r} value={r} sx={{ textTransform: 'capitalize' }}>{r}</MenuItem>
              ))}
            </TextField>

            {formError && <Alert severity="error" sx={{ py: 0 }}>{formError}</Alert>}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setDlgOpen(false)} color="inherit" sx={{ textTransform: 'none' }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            sx={{ bgcolor: '#C0392B', '&:hover': { bgcolor: '#a93226' }, textTransform: 'none', fontWeight: 600 }}
          >
            {saving ? <CircularProgress size={18} color="inherit" /> : editing ? 'Guardar cambios' : 'Crear usuario'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Diálogo Confirmar Eliminar ─────────────────────────────────────── */}
      <Dialog open={!!delTarget} onClose={() => setDelTarget(null)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#C0392B' }}>Eliminar usuario</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#4A5568' }}>
            ¿Estás seguro de eliminar a <strong>{delTarget?.nombre}</strong> ({delTarget?.username})?
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setDelTarget(null)} color="inherit" sx={{ textTransform: 'none' }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleting}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {deleting ? <CircularProgress size={18} color="inherit" /> : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
