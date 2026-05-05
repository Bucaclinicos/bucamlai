import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const api = axios.create({ baseURL: 'http://localhost:8080' })

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', form)
      login(data)
      navigate('/')
    } catch {
      setError('Usuario o contraseña incorrectos')
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
      <Card sx={{ width: 380, borderRadius: 3, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box component="img" src="/logo.png" alt="BUCAMLAI" sx={{ height: 80, mb: 1 }} />
            <Typography variant="h6" fontWeight={700} color="#2D3748">Iniciar sesión</Typography>
            <Typography variant="body2" color="text.secondary">Sistema analítico de inventario</Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Usuario"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              fullWidth
              size="small"
            />
            <TextField
              label="Contraseña"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
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
              sx={{ bgcolor: '#C0392B', '&:hover': { bgcolor: '#a93226' }, mt: 1, py: 1.2 }}
            >
              {loading ? <CircularProgress size={20} color="inherit" /> : 'Ingresar'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
