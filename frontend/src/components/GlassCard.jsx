// Alias — ya no es "glass", simplemente Paper con elevation 1
import Paper from '@mui/material/Paper'
export default function GlassCard({ children, sx = {}, hover, ...props }) {
  return <Paper elevation={1} sx={{ borderRadius:'12px', ...sx }} {...props}>{children}</Paper>
}
