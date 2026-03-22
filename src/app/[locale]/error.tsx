'use client';

import { useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[error boundary]', error);
  }, [error]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        p: 3,
      }}
    >
      <Typography variant="h2">Oops!</Typography>
      <Typography variant="body1" color="text.secondary" textAlign="center">
        Something went wrong.
      </Typography>
      <Button variant="contained" onClick={reset}>
        Try again
      </Button>
    </Box>
  );
}
