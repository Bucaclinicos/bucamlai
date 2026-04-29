import { createTheme } from '@mui/material/styles'

const RED   = '#E53E3E'
const GREEN = '#38A169'
const BLUE  = '#3182CE'
const AMB   = '#D69E2E'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary:    { main: RED,   light: '#FC8181', dark: '#C53030', contrastText: '#fff' },
    secondary:  { main: BLUE,  light: '#63B3ED', dark: '#2C5282', contrastText: '#fff' },
    success:    { main: GREEN, light: '#68D391', dark: '#276749', contrastText: '#fff' },
    warning:    { main: AMB,   light: '#F6E05E', dark: '#B7791F' },
    error:      { main: RED,   contrastText: '#fff' },
    background: { default: '#F1F5F9', paper: '#FFFFFF' },
    text: { primary: '#1A202C', secondary: '#718096', disabled: '#A0AEC0' },
    divider: '#E2E8F0',
    grey: {
      50:  '#F7FAFC', 100: '#EDF2F7', 200: '#E2E8F0',
      300: '#CBD5E0', 400: '#A0AEC0', 500: '#718096',
      600: '#4A5568', 700: '#2D3748', 800: '#1A202C',
    },
  },

  typography: {
    fontFamily: '"Inter", "Segoe UI", sans-serif',
    h4:       { fontWeight: 700, letterSpacing: '-0.4px', lineHeight: 1.2 },
    h5:       { fontWeight: 700, letterSpacing: '-0.3px' },
    h6:       { fontWeight: 600, letterSpacing: '-0.1px' },
    subtitle1:{ fontWeight: 600 },
    subtitle2:{ fontWeight: 600, fontSize: '0.8125rem' },
    body1:    { fontSize: '0.9375rem', lineHeight: 1.6 },
    body2:    { fontSize: '0.8125rem', lineHeight: 1.6 },
    caption:  { fontSize: '0.74rem'  },
    overline: { fontWeight: 700, letterSpacing: '1px', fontSize: '0.68rem' },
    button:   { fontWeight: 600, textTransform: 'none', letterSpacing: '0.01em' },
  },

  shape: { borderRadius: 10 },

  shadows: [
    'none',
    '0 1px 3px rgba(0,0,0,0.06)',
    '0 1px 6px rgba(0,0,0,0.07)',
    '0 2px 10px rgba(0,0,0,0.08)',
    '0 4px 16px rgba(0,0,0,0.09)',
    '0 8px 24px rgba(0,0,0,0.10)',
    ...Array(19).fill('0 12px 32px rgba(0,0,0,0.12)'),
  ],

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*, *::before, *::after': { boxSizing: 'border-box', margin: 0, padding: 0 },
        body: { background: '#F1F5F9', WebkitFontSmoothing: 'antialiased' },
        '#root': { minHeight: '100vh', display: 'flex' },
        '::-webkit-scrollbar': { width: 4 },
        '::-webkit-scrollbar-track': { background: 'transparent' },
        '::-webkit-scrollbar-thumb': { background: '#CBD5E0', borderRadius: 8 },
        '@keyframes fadeUp': {
          from: { opacity: 0, transform: 'translateY(10px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
        '.page-enter': { animation: 'fadeUp 0.2s ease both' },
      },
    },

    MuiCard: {
      defaultProps: { elevation: 1 },
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundImage: 'none',
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 12, backgroundImage: 'none' },
        elevation1: { boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)' },
        elevation2: { boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
      },
    },

    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, borderRadius: 8, fontSize: '0.875rem' },
        containedPrimary: {
          background: RED,
          '&:hover': { background: '#C53030' },
        },
        outlined: {
          borderColor: '#E2E8F0',
          color: '#4A5568',
          '&:hover': { borderColor: '#CBD5E0', background: '#F7FAFC' },
        },
        text: {
          color: '#4A5568',
          '&:hover': { background: '#F7FAFC' },
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, fontSize: '0.72rem', borderRadius: 6, height: 24 },
      },
    },

    MuiDivider: {
      styleOverrides: { root: { borderColor: '#E2E8F0' } },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontSize: '0.875rem',
          backgroundColor: '#fff',
          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#CBD5E0' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: RED, borderWidth: 1.5 },
        },
      },
    },

    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            background: '#F7FAFC',
            fontWeight: 600,
            fontSize: '0.68rem',
            textTransform: 'uppercase',
            letterSpacing: '0.7px',
            color: '#718096',
            borderBottom: '1px solid #E2E8F0',
            padding: '10px 16px',
          },
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: '#EDF2F7', padding: '11px 16px', fontSize: '0.8125rem' },
      },
    },

    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background 0.1s',
          '&:hover': { background: '#F7FAFC' },
          '&:last-child td': { borderBottom: 0 },
        },
      },
    },

    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 99, height: 6, backgroundColor: '#EDF2F7' },
      },
    },

    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 10, fontSize: '0.8125rem', fontWeight: 500 },
        standardSuccess: { background: '#F0FFF4', border: '1px solid #C6F6D5', color: '#276749' },
        standardError:   { background: '#FFF5F5', border: '1px solid #FED7D7', color: '#C53030' },
        standardWarning: { background: '#FFFFF0', border: '1px solid #FAF089', color: '#B7791F' },
        standardInfo:    { background: '#EBF8FF', border: '1px solid #BEE3F8', color: '#2C5282' },
      },
    },

    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.8125rem',
          border: '1px solid #E2E8F0 !important',
          borderRadius: '8px !important',
          color: '#718096',
          padding: '5px 14px',
          '&.Mui-selected': {
            background: RED,
            color: '#fff',
            border: `1px solid ${RED} !important`,
            fontWeight: 600,
            '&:hover': { background: '#C53030' },
          },
          '&:hover': { background: '#F7FAFC' },
        },
      },
    },

    MuiToggleButtonGroup: {
      styleOverrides: { root: { gap: 4 } },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: { background: '#1A202C', borderRadius: 6, fontSize: '0.75rem', padding: '5px 10px' },
        arrow: { color: '#1A202C' },
      },
    },

    MuiTablePagination: {
      styleOverrides: {
        root: { color: '#718096', fontSize: '0.8rem', borderTop: '1px solid #EDF2F7' },
        selectLabel: { fontSize: '0.8rem' },
        displayedRows: { fontSize: '0.8rem' },
      },
    },

    MuiIconButton: {
      styleOverrides: { root: { borderRadius: 8 } },
    },
  },
})

export default theme
