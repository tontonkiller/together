'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';

export default function RouteErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('common');

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
        {t('errorMessage')}
      </Alert>
      <Button variant="contained" onClick={reset}>
        {t('tryAgain')}
      </Button>
    </Box>
  );
}
