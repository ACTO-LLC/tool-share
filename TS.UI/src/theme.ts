import { createTheme } from '@mui/material/styles';

// Responsive breakpoints per spec:
// - Mobile: < 600px (single column)
// - Tablet: 600-960px (two columns)
// - Desktop: > 960px (full layout)
export const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,  // Mobile breakpoint
      md: 960,  // Tablet breakpoint
      lg: 1280, // Desktop
      xl: 1920, // Large desktop
    },
  },
  palette: {
    primary: {
      main: '#1976d2', // MUI default blue
    },
    secondary: {
      main: '#9c27b0', // MUI default purple
    },
    success: {
      main: '#2e7d32', // Green (available, confirmed)
    },
    warning: {
      main: '#ed6c02', // Orange (pending)
    },
    error: {
      main: '#d32f2f', // Red (declined, issues)
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  spacing: 8, // MUI default spacing system (8px base)
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});
