import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'

export default function PageHeader({ badge, title, subtitle }) {
  return (
    <Box sx={{ mb: 3 }}>
      {badge && (
        <Typography sx={{
          display: 'inline-block', mb: 0.75,
          fontSize: '0.67rem', fontWeight: 600,
          letterSpacing: '0.6px', textTransform: 'uppercase',
          color: '#E53E3E', background: '#FFF5F5',
          border: '1px solid #FED7D7', borderRadius: '5px',
          px: 1, py: 0.35,
        }}>
          {badge}
        </Typography>
      )}
      <Typography variant="h5" sx={{ color: '#1A202C', mb: subtitle ? 0.5 : 0 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography sx={{ fontSize: '0.875rem', color: '#718096', lineHeight: 1.55 }}>
          {subtitle}
        </Typography>
      )}
      <Divider sx={{ mt: 2 }} />
    </Box>
  )
}
