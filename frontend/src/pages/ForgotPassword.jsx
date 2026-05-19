import { useState } from 'react'
import { Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import { forgotPassword } from '../api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await forgotPassword(email.trim().toLowerCase())
      setSent(true)
    } catch {
      setError('No se pudo procesar la solicitud. Intenta más tarde.')
    } finally {
      setLoading(false)
    }
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
            <Typography variant="h6" fontWeight={700} color="#2D3748">Recuperar contraseña</Typography>
            <Typography variant="body2" color="text.secondary">
              Ingresa tu correo y te enviaremos un enlace
            </Typography>
          </Box>

          {sent ? (
            <Box sx={{ textAlign: 'center' }}>
              <Alert severity="success" sx={{ mb: 2 }}>
                Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.
              </Alert>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Revisa también tu carpeta de spam.
              </Typography>
              <Button
                component={Link}
                to="/login"
                variant="outlined"
                fullWidth
                sx={{ borderColor: '#C0392B', color: '#C0392B', '&:hover': { borderColor: '#a93226', bgcolor: '#FFF5F5' }, textTransform: 'none', fontWeight: 600 }}
              >
                Volver al inicio de sesión
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Correo electrónico"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                fullWidth
                size="small"
                autoFocus
              />
              {error && <Alert severity="error" sx={{ py: 0 }}>{error}</Alert>}
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                sx={{ bgcolor: '#C0392B', '&:hover': { bgcolor: '#a93226' }, mt: 0.5, py: 1.2, textTransform: 'none', fontWeight: 600 }}
              >
                {loading ? <CircularProgress size={20} color="inherit" /> : 'Enviar enlace'}
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
