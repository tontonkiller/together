'use client';

import { useTranslations } from 'next-intl';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

export default function NotFound() {
  const t = useTranslations('common');

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
      <Typography variant="h2" component="h1">
        404
      </Typography>
      <Typography variant="body1" color="text.secondary" textAlign="center">
        {t('notFoundMessage')}
      </Typography>
      <Button variant="contained" href="/dashboard">
        {t('goHome')}
      </Button>
    </Box>
  );
}
