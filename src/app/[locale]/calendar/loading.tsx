import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';

export default function CalendarLoading() {
  return (
    <Box sx={{ p: 2, mt: '64px', mb: '56px', maxWidth: 600, mx: 'auto' }}>
      {/* Month navigation */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Skeleton variant="circular" width={36} height={36} />
        <Skeleton variant="text" width={160} height={32} />
        <Skeleton variant="circular" width={36} height={36} />
      </Box>

      {/* Day-of-week headers */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mb: 1 }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} variant="text" width="100%" height={24} />
        ))}
      </Box>

      {/* Calendar grid (5 rows x 7 cols) */}
      {Array.from({ length: 5 }).map((_, row) => (
        <Box key={row} sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mb: 0.5 }}>
          {Array.from({ length: 7 }).map((_, col) => (
            <Skeleton key={col} variant="rounded" width="100%" height={48} />
          ))}
        </Box>
      ))}
    </Box>
  );
}
