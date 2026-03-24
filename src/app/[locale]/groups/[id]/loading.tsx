import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

export default function GroupDetailLoading() {
  return (
    <Box>
      {/* Group name */}
      <Skeleton variant="text" width={220} height={40} sx={{ mb: 2 }} />

      {/* Members section */}
      <Skeleton variant="text" width={100} height={28} sx={{ mb: 1 }} />
      {[0, 1, 2].map((i) => (
        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <Skeleton variant="circular" width={36} height={36} />
          <Skeleton variant="text" width={140} height={24} />
          <Skeleton variant="rounded" width={60} height={24} sx={{ ml: 'auto' }} />
        </Box>
      ))}

      {/* Events section */}
      <Skeleton variant="text" width={120} height={28} sx={{ mt: 3, mb: 1 }} />
      {[0, 1].map((i) => (
        <Card key={i} sx={{ mb: 1.5 }}>
          <CardContent>
            <Skeleton variant="text" width="70%" height={24} />
            <Skeleton variant="text" width="45%" height={20} />
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
