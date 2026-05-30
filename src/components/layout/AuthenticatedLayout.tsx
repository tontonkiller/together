// Server component: contains no hooks or event handlers, so the layout shell
// (Box, Container) renders on the server. Only its children (TopBar, BottomNav,
// AutoSync) cross the client boundary.
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import AutoSync from '@/components/google/AutoSync';
import { createClient } from '@/lib/supabase/server';

export const TOPBAR_HEIGHT = 64;
export const BOTTOMNAV_HEIGHT = 64;

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Only mount AutoSync (which POSTs /api/google/sync on app open) for users who
  // actually have a Google account connected — otherwise every user pays a sync
  // request they can't benefit from.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let hasGoogleAccounts = false;
  if (user) {
    const { count } = await supabase
      .from('google_accounts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);
    hasGoogleAccounts = (count ?? 0) > 0;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopBar />
      {hasGoogleAccounts && <AutoSync />}
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
