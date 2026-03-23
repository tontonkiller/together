import { createTheme, type ThemeOptions } from '@mui/material/styles';

// Warm shadow palette — slightly tinted, not pure grey
const warmShadow = {
  sm: '0 1px 3px rgba(44,40,37,0.08), 0 1px 2px rgba(44,40,37,0.06)',
  md: '0 2px 8px rgba(44,40,37,0.08), 0 4px 16px rgba(44,40,37,0.04)',
  lg: '0 4px 12px rgba(44,40,37,0.10), 0 8px 32px rgba(44,40,37,0.06)',
};

const baseThemeOptions: ThemeOptions = {
  typography: {
    fontFamily: 'var(--font-roboto), "Roboto", -apple-system, BlinkMacSystemFont, sans-serif',
    h1: { fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontSize: '1.2rem', fontWeight: 700 },
    subtitle1: { fontSize: '1rem', fontWeight: 600 },
    body1: { fontSize: '0.95rem', lineHeight: 1.6 },
    body2: { fontSize: '0.85rem', lineHeight: 1.5 },
    caption: { fontSize: '0.75rem', fontWeight: 500 },
    button: { fontSize: '0.875rem', fontWeight: 500, letterSpacing: '0.01em' },
  },
  shape: { borderRadius: 14 },
  spacing: 8,
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 22,
          padding: '10px 24px',
          transition: 'all 0.2s ease',
        },
        contained: {
          boxShadow: warmShadow.sm,
          '&:hover': { boxShadow: warmShadow.md },
        },
        outlined: {
          borderWidth: 1.5,
          '&:hover': { borderWidth: 1.5 },
        },
      },
    },
    MuiCard: {
      defaultProps: { variant: 'elevation', elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: warmShadow.md,
          transition: 'box-shadow 0.2s ease, transform 0.2s ease',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          boxShadow: warmShadow.lg,
        },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0 },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: { height: 64 },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          transition: 'color 0.2s ease',
          '&.Mui-selected': { fontWeight: 700 },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': { borderRadius: 12 },
        },
      },
    },
  },
};

const defaultTheme = createTheme({
  ...baseThemeOptions,
  palette: {
    primary: { main: '#D4726A', contrastText: '#FFFFFF' },
    secondary: { main: '#8B9E82' },
    background: { default: '#F9F5F0', paper: '#FFFFFF' },
    text: { primary: '#2C2825', secondary: '#8A7F78' },
    error: { main: '#C4564A' },
    success: { main: '#6B9B7D' },
    warning: { main: '#D4A054' },
    divider: 'rgba(44,40,37,0.08)',
  },
});

const evaTheme = createTheme({
  ...baseThemeOptions,
  palette: {
    primary: { main: '#C75B8F', contrastText: '#FFFFFF' },
    secondary: { main: '#9B8EC4' },
    background: { default: '#FDF5F8', paper: '#FFFFFF' },
    text: { primary: '#2C2825', secondary: '#8A7F78' },
    error: { main: '#C4564A' },
    success: { main: '#6B9B7D' },
    warning: { main: '#D4A054' },
    divider: 'rgba(44,40,37,0.08)',
  },
});

export { defaultTheme, evaTheme };
export default defaultTheme;
