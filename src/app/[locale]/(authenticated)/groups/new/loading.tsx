import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';

export default function GroupNewLoading() {
  return (
    <Box>
      <Skeleton variant="text" width={180} height={36} sx={{ mb: 3 }} />
      <Skeleton variant="rounded" width="100%" height={56} sx={{ mb: 2 }} />
      <Skeleton variant="rounded" width="100%" height={120} sx={{ mb: 2 }} />
      <Skeleton variant="rounded" width={140} height={40} />
    </Box>
  );
}
