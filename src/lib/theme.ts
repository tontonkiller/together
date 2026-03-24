import { createTheme, type ThemeOptions } from '@mui/material/styles';

// Soft coastal shadows — tinted with ocean tones
const shadow = {
  sm: '0 1px 3px rgba(15,80,90,0.06), 0 1px 2px rgba(15,80,90,0.04)',
  md: '0 2px 8px rgba(15,80,90,0.07), 0 4px 16px rgba(15,80,90,0.03)',
  lg: '0 4px 12px rgba(15,80,90,0.09), 0 8px 32px rgba(15,80,90,0.05)',
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
          boxShadow: shadow.sm,
          '&:hover': { boxShadow: shadow.md },
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
          boxShadow: shadow.md,
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
          boxShadow: shadow.lg,
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

// Mediterranean — azure sea, olive groves, golden sun
const defaultTheme = createTheme({
  ...baseThemeOptions,
  palette: {
    primary: { main: '#0891B2', contrastText: '#FFFFFF' },
    secondary: { main: '#F59E0B' },
    background: { default: '#F0FAFB', paper: '#FFFFFF' },
    text: { primary: '#1E293B', secondary: '#64748B' },
    error: { main: '#EF4444' },
    success: { main: '#10B981' },
    warning: { main: '#F59E0B' },
    divider: 'rgba(15,80,90,0.08)',
  },
});

// Eva — sunset rose, warm and romantic
const evaTheme = createTheme({
  ...baseThemeOptions,
  palette: {
    primary: { main: '#E8578A', contrastText: '#FFFFFF' },
    secondary: { main: '#A78BFA' },
    background: { default: '#FDF2F6', paper: '#FFFFFF' },
    text: { primary: '#1E293B', secondary: '#64748B' },
    error: { main: '#EF4444' },
    success: { main: '#10B981' },
    warning: { main: '#F59E0B' },
    divider: 'rgba(150,50,80,0.08)',
  },
});

export { defaultTheme, evaTheme };
export default defaultTheme;
