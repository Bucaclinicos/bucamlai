import Box from '@mui/material/Box'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

const W = 240

export default function Layout() {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F1F5F9' }}>
      <Sidebar />
      <Box component="main" sx={{ flex: 1, p: '28px 32px', minHeight: '100vh', minWidth: 0 }}>
        <Outlet />
      </Box>
    </Box>
  )
}
