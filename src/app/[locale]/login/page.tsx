'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import CircularProgress from '@mui/material/CircularProgress';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const callbackError = searchParams.get('error') === 'auth';
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t('invalidEmail'));
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/${locale}/auth/callback`,
      },
    });

    setLoading(false);

    if (authError) {
      setError(authError.message);
    } else {
      setSent(true);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
      }}
    >
      <Container maxWidth="xs">
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <CalendarMonthIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
          <Typography variant="h2">{t('loginTitle')}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t('loginSubtitle')}
          </Typography>
        </Box>

        {sent ? (
          <Alert
            icon={<MailOutlineIcon />}
            severity="success"
            sx={{ textAlign: 'left' }}
          >
            <Typography variant="subtitle2">{t('linkSent')}</Typography>
            <Typography variant="body2">{t('linkSentDesc')}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {t('checkSpam')}
            </Typography>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit}>
            {callbackError && !error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {t('authError')}
              </Alert>
            )}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              label={t('emailLabel')}
              placeholder={t('emailPlaceholder')}
              type="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              sx={{ mb: 2 }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              sx={{ py: 1.5 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : t('sendLink')}
            </Button>
          </form>
        )}
      </Container>
    </Box>
  );
}
