import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

export default function GroupDetailLoading() {
  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Skeleton variant="circular" width={56} height={56} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="60%" height={32} />
          <Skeleton variant="text" width="40%" height={20} />
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Skeleton variant="rounded" width={80} height={32} />
        <Skeleton variant="rounded" width={80} height={32} />
        <Skeleton variant="rounded" width={80} height={32} />
      </Box>

      {/* Content cards */}
      {[0, 1, 2].map((i) => (
        <Card key={i} variant="outlined" sx={{ mb: 1.5 }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Skeleton variant="circular" width={36} height={36} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="50%" height={22} />
              <Skeleton variant="text" width="30%" height={18} />
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
