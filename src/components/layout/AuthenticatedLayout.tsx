'use client';

import Box from '@mui/material/Box';
import TopBar from './TopBar';
import BottomNav from './BottomNav';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopBar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mt: '64px', // AppBar height
          mb: '56px', // BottomNavigation height
          p: 2,
        }}
      >
        {children}
      </Box>
      <BottomNav />
    </Box>
  );
}
