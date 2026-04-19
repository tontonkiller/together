'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

export default function CalendarReconnectBanner() {
  const t = useTranslations('calendar');
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleReconnect = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/google/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale }),
      });
      const data = (await res.json()) as { url?: string };
      if (!res.ok || !data.url) {
        setError(t('reconnectBanner.error'));
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError(t('reconnectBanner.error'));
      setLoading(false);
    }
  };

  return (
    <Alert
      severity="warning"
      sx={{ mb: 3 }}
      action={
        <Button
          color="inherit"
          size="small"
          onClick={handleReconnect}
          disabled={loading}
        >
          {loading ? <CircularProgress size={16} color="inherit" /> : t('reconnectBanner.cta')}
        </Button>
      }
    >
      {error || t('reconnectBanner.message')}
    </Alert>
  );
}
