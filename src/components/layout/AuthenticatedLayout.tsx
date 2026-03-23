'use client';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import AutoSync from '@/components/google/AutoSync';

export const TOPBAR_HEIGHT = 64;
export const BOTTOMNAV_HEIGHT = 56;

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopBar />
      <AutoSync />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mt: 0,
          mb: '56px', // BottomNavigation height
          p: 2,
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
