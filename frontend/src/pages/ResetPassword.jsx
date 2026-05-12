import { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import { resetPassword } from '../api'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token') || ''

  const [form, setForm] = useState({ password: '', confirm: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (form.password !== form.confirm) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)
    try {
      await resetPassword(token, form.password)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (e) {
      setError(e?.response?.data?.detail || 'Token inválido o expirado. Solicita un nuevo enlace.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <Box sx={{
        minHeight: '100vh', width: '100vw', bgcolor: '#F1F5F9',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'fixed', top: 0, left: 0,
      }}>
        <Card sx={{ width: 400, borderRadius: 3, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Alert severity="error" sx={{ mb: 2 }}>Enlace inválido o expirado.</Alert>
            <Button component={Link} to="/forgot-password" variant="outlined"
              sx={{ borderColor: '#C0392B', color: '#C0392B', textTransform: 'none', fontWeight: 600 }}>
              Solicitar nuevo enlace
            </Button>
          </CardContent>
        </Card>
      </Box>
    )
  }

  return (
    <Box sx={{
      minHeight: '100vh', width: '100vw', bgcolor: '#F1F5F9',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'fixed', top: 0, left: 0,
    }}>
      <Card sx={{ width: 400, borderRadius: 3, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box component="img" src="/logo.png" alt="BUCAMLAI" sx={{ height: 72, mb: 1.5 }} />
            <Typography variant="h6" fontWeight={700} color="#2D3748">Nueva contraseña</Typography>
            <Typography variant="body2" color="text.secondary">
              Ingresa tu nueva contraseña
            </Typography>
          </Box>

          {success ? (
            <Box sx={{ textAlign: 'center' }}>
              <Alert severity="success" sx={{ mb: 2 }}>
                ¡Contraseña restablecida! Redirigiendo al inicio de sesión…
              </Alert>
              <CircularProgress size={24} sx={{ color: '#C0392B' }} />
            </Box>
          ) : (
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Nueva contraseña"
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
                fullWidth
                size="small"
                helperText="Mínimo 6 caracteres"
                autoFocus
              />
              <TextField
                label="Confirmar contraseña"
                type="password"
                value={form.confirm}
                onChange={e => setForm({ ...form, confirm: e.target.value })}
                required
                fullWidth
                size="small"
              />
              {error && <Alert severity="error" sx={{ py: 0 }}>{error}</Alert>}
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                sx={{ bgcolor: '#C0392B', '&:hover': { bgcolor: '#a93226' }, mt: 0.5, py: 1.2, textTransform: 'none', fontWeight: 600 }}
              >
                {loading ? <CircularProgress size={20} color="inherit" /> : 'Restablecer contraseña'}
              </Button>
              <Typography variant="body2" sx={{ textAlign: 'center', color: '#718096' }}>
                <Link to="/login" style={{ color: '#C0392B', textDecoration: 'none', fontWeight: 600 }}>
                  Volver al inicio de sesión
                </Link>
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
