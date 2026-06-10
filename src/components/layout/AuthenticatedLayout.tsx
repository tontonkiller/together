// Server component: contains no hooks or event handlers, so the layout shell
// (Box, Container) renders on the server. Only its children (TopBar, BottomNav,
// AutoSync) cross the client boundary.
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import AutoSync from '@/components/google/AutoSync';

export const TOPBAR_HEIGHT = 64;
export const BOTTOMNAV_HEIGHT = 64;

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // AutoSync is mounted unconditionally: it already debounces to once per 5 min
  // (localStorage) and /api/google/sync early-returns after a single indexed
  // SELECT for users with no connected account, so gating it here would add a
  // per-render auth + count roundtrip to every page to save a near-free request.
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopBar />
      <AutoSync />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mt: 0,
          mb: '64px', // BottomNavigation height
          p: 2.5,
          pt: 3,
        }}
      >
        <Container maxWidth="md" disableGutters>
          {children}
        </Container>
      </Box>
      <BottomNav />
    </Box>
  );
}
