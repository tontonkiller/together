import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { TOPBAR_HEIGHT, BOTTOMNAV_HEIGHT } from '@/components/layout/AuthenticatedLayout';

export default function DashboardLoading() {
  return (
    <Box sx={{ p: 2, mt: `${TOPBAR_HEIGHT}px`, mb: `${BOTTOMNAV_HEIGHT}px`, maxWidth: 600, mx: 'auto' }}>
      {/* Welcome heading */}
      <Skeleton variant="text" width={200} height={40} sx={{ mb: 1 }} />
      <Skeleton variant="text" width={160} height={24} sx={{ mb: 3 }} />

      {/* Upcoming events section */}
      <Skeleton variant="text" width={180} height={32} sx={{ mb: 1 }} />
      {[0, 1].map((i) => (
        <Card key={i} variant="outlined" sx={{ mb: 1.5 }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5 }}>
            <Skeleton variant="circular" width={32} height={32} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" height={24} />
              <Skeleton variant="text" width="40%" height={20} />
            </Box>
          </CardContent>
        </Card>
      ))}

      {/* Groups section */}
      <Skeleton variant="text" width={120} height={32} sx={{ mt: 3, mb: 1 }} />
      {[0, 1, 2].map((i) => (
        <Card key={i} variant="outlined" sx={{ mb: 1.5 }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Skeleton variant="circular" width={40} height={40} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="50%" height={24} />
              <Skeleton variant="text" width="30%" height={20} />
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
