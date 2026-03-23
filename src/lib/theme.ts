import { createTheme, type ThemeOptions } from '@mui/material/styles';

const baseThemeOptions: ThemeOptions = {
  typography: {
    fontFamily: 'var(--font-roboto), Arial, sans-serif',
    h1: { fontSize: '2rem', fontWeight: 700 },
    h2: { fontSize: '1.5rem', fontWeight: 600 },
    h3: { fontSize: '1.25rem', fontWeight: 600 },
    body1: { fontSize: '1rem' },
    body2: { fontSize: '0.875rem' },
    button: { fontSize: '0.875rem', fontWeight: 500 },
  },
  shape: { borderRadius: 8 },
  spacing: 8,
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', borderRadius: 8, padding: '10px 24px' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
  },
};

const defaultTheme = createTheme({
  ...baseThemeOptions,
  palette: {
    primary: { main: '#1976D2' },
    background: { default: '#FAFAFA', paper: '#FFFFFF' },
    text: { primary: '#212121', secondary: '#757575' },
    error: { main: '#D32F2F' },
    success: { main: '#388E3C' },
  },
});

const evaTheme = createTheme({
  ...baseThemeOptions,
  palette: {
    primary: { main: '#E91E90' },
    background: { default: '#FFF0F5', paper: '#FFFFFF' },
    text: { primary: '#212121', secondary: '#757575' },
    error: { main: '#D32F2F' },
    success: { main: '#388E3C' },
  },
});

export { defaultTheme, evaTheme };
export default defaultTheme;
