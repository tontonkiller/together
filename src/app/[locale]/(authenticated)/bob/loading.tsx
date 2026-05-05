import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';

export default function BobLoading() {
  return (
    <Box>
      <Skeleton variant="text" width={140} height={36} sx={{ mb: 2 }} />
      <Skeleton variant="rounded" width="100%" height={120} sx={{ mb: 2 }} />
      <Skeleton variant="rounded" width="100%" height={48} sx={{ mb: 1 }} />
      <Skeleton variant="rounded" width="100%" height={48} sx={{ mb: 1 }} />
      <Skeleton variant="rounded" width="100%" height={48} />
    </Box>
  );
}
