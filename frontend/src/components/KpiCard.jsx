import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

export default function KpiCard({ titulo, valor, subtitulo, icon: Icon, color = '#E53E3E', trend }) {
  return (
    <Paper elevation={1} sx={{ p: '20px 22px', borderRadius: '12px', height: '100%' }}>
      {/* Fila superior: label + ícono */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
        <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#718096' }}>
          {titulo}
        </Typography>
        {Icon && (
          <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon sx={{ fontSize: 18, color }} />
          </Box>
        )}
      </Box>

      {/* Valor */}
      <Typography sx={{ fontSize: '1.8rem', fontWeight: 700, color: '#1A202C', lineHeight: 1, letterSpacing: '-0.5px', mb: subtitulo ? 0.5 : 0 }}>
        {valor}
      </Typography>

      {subtitulo && (
        <Typography sx={{ fontSize: '0.775rem', color: '#A0AEC0' }}>{subtitulo}</Typography>
      )}

      {trend && (
        <Typography sx={{
          mt: 1.25, pt: 1.25,
          borderTop: '1px solid #EDF2F7',
          fontSize: '0.74rem', fontWeight: 600,
          color: trend.positivo ? '#38A169' : '#E53E3E',
        }}>
          {trend.positivo ? '↑' : '↓'} {trend.texto}
        </Typography>
      )}
    </Paper>
  )
}
