import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';

export default function ProfileLoading() {
  return (
    <Box>
      {/* Avatar */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <Skeleton variant="circular" width={80} height={80} />
      </Box>

      {/* Form fields */}
      <Skeleton variant="rounded" width="100%" height={56} sx={{ mb: 2 }} />
      <Skeleton variant="rounded" width="100%" height={56} sx={{ mb: 2 }} />
      <Skeleton variant="rounded" width="100%" height={56} sx={{ mb: 3 }} />

      {/* Save button */}
      <Skeleton variant="rounded" width="100%" height={42} />
    </Box>
  );
}
