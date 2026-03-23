import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';

export default function Loading() {
  return (
    <AuthenticatedLayout>
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    </AuthenticatedLayout>
  );
}
