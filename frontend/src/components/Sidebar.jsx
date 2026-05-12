import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

import DashboardRoundedIcon    from '@mui/icons-material/DashboardRounded'
import InventoryRoundedIcon    from '@mui/icons-material/InventoryRounded'
import BarChartRoundedIcon     from '@mui/icons-material/BarChartRounded'
import AssessmentRoundedIcon   from '@mui/icons-material/AssessmentRounded'
import FactCheckRoundedIcon    from '@mui/icons-material/FactCheckRounded'
import AutoGraphRoundedIcon    from '@mui/icons-material/AutoGraphRounded'
import WbCloudyRoundedIcon     from '@mui/icons-material/WbCloudyRounded'
import SmartToyRoundedIcon     from '@mui/icons-material/SmartToyRounded'
import UploadFileRoundedIcon   from '@mui/icons-material/UploadFileRounded'
import ManageAccountsRoundedIcon from '@mui/icons-material/ManageAccountsRounded'

const NAV_BASE = [
  {
    group: 'Análisis',
    items: [
      { to: '/',           Icon: DashboardRoundedIcon,  label: 'Dashboard'    },
      { to: '/inventario', Icon: InventoryRoundedIcon,  label: 'Inventario'   },
      { to: '/pareto',     Icon: BarChartRoundedIcon,   label: 'Análisis ABC' },
      { to: '/metricas',   Icon: AssessmentRoundedIcon, label: 'Métricas'     },
      { to: '/evaluacion', Icon: FactCheckRoundedIcon,  label: 'Evaluación'   },
    ],
  },
  {
    group: 'IA',
    items: [
      { to: '/prediccion',    Icon: AutoGraphRoundedIcon, label: 'Predicción'    },
      { to: '/alertas-clima', Icon: WbCloudyRoundedIcon,  label: 'Alertas Clima' },
      { to: '/chatbot',       Icon: SmartToyRoundedIcon,  label: 'Consultas IA'  },
    ],
  },
]

const NAV_ADMIN = [
  {
    group: 'Administración',
    items: [
      { to: '/cargar', Icon: UploadFileRoundedIcon,    label: 'Cargar Datos'  },
      { to: '/admin',  Icon: ManageAccountsRoundedIcon, label: 'Usuarios'      },
    ],
  },
]

const W = 240

export default function Sidebar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const active = (to) => to === '/' ? pathname === '/' : pathname.startsWith(to)

  const NAV = user?.role === 'admin' ? [...NAV_BASE, ...NAV_ADMIN] : NAV_BASE

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: W, flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: W,
          background: '#fff',
          borderRight: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        },
      }}
    >
      {/* Logo */}
      <Box sx={{ px: 2, py: 1.75, borderBottom: '1px solid #EDF2F7' }}>
        <Box component="img"
          src="/logo.png"
          alt="BUCAMLAI"
          sx={{ height: 80, width: 'auto', display: 'block', mx: 'auto' }}
        />
      </Box>

      <Divider />

      {/* Nav */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 2, px: 1.5, '&::-webkit-scrollbar': { width: 0 } }}>
        {NAV.map(({ group, items }) => (
          <Box key={group} sx={{ mb: 3 }}>
            <Typography sx={{
              fontSize: '0.65rem', fontWeight: 700,
              letterSpacing: '1px', textTransform: 'uppercase',
              color: '#CBD5E0', px: 1.5, mb: 0.75,
            }}>
              {group}
            </Typography>

            <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {items.map(({ to, Icon, label }) => {
                const on = active(to)
                return (
                  <ListItemButton
                    key={to}
                    component={NavLink}
                    to={to}
                    end={to === '/'}
                    sx={{
                      borderRadius: '10px',
                      py: 1.25, px: 1.5,
                      textDecoration: 'none',
                      background: on ? '#FFF5F5' : 'transparent',
                      '&:hover': { background: on ? '#FFF5F5' : '#F7FAFC' },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 38 }}>
                      <Icon sx={{ fontSize: 20, color: on ? '#E53E3E' : '#A0AEC0' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={label}
                      primaryTypographyProps={{
                        fontSize: '0.875rem',
                        fontWeight: on ? 600 : 400,
                        color: on ? '#E53E3E' : '#4A5568',
                      }}
                    />
                    {on && (
                      <Box sx={{ width: 3, height: 20, borderRadius: 99, bgcolor: '#E53E3E', flexShrink: 0 }} />
                    )}
                  </ListItemButton>
                )
              })}
            </List>
          </Box>
        ))}
      </Box>

      <Divider />

      {/* Footer */}
      <Box sx={{ px: 2, py: 1.75, display: 'flex', alignItems: 'center', gap: 1.25 }}>
        <Box sx={{
          width: 30, height: 30, borderRadius: '8px',
          background: '#EDF2F7', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.72rem', fontWeight: 700, color: '#718096',
        }}>
          {user?.nombre?.[0]?.toUpperCase() ?? 'U'}
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ fontSize: '0.775rem', fontWeight: 600, color: '#2D3748', lineHeight: 1.2 }} noWrap>
            {user?.nombre ?? 'Usuario'}
          </Typography>
          <Typography sx={{ fontSize: '0.65rem', color: '#A0AEC0', mt: 0.2, textTransform: 'capitalize' }}>
            {user?.role ?? ''}
          </Typography>
        </Box>
        <Tooltip title="Cerrar sesión">
          <IconButton size="small" onClick={handleLogout} sx={{ color: '#A0AEC0', '&:hover': { color: '#C0392B' } }}>
            <LogoutRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Drawer>
  )
}
