'use client';

import { useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';

export default function RouteErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[route error]', error);
  }, [error]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        p: 3,
        mt: '64px',
        mb: '56px',
        minHeight: 'calc(100vh - 120px)',
      }}
    >
      <Alert severity="error" sx={{ maxWidth: 400 }}>
        Something went wrong loading this page.
      </Alert>
      <Button variant="contained" onClick={reset}>
        Try again
      </Button>
    </Box>
  );
}
