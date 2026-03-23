'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
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
  const [googleLoading, setGoogleLoading] = useState(false);
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

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/${locale}/auth/callback`,
      },
    });

    if (oauthError) {
      setGoogleLoading(false);
      setError(oauthError.message);
    }
    // On success, the browser redirects to Google — no need to setGoogleLoading(false)
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
          <>
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

            {/* Google OAuth */}
            <Button
              variant="outlined"
              fullWidth
              size="large"
              disabled={googleLoading || loading}
              onClick={handleGoogleLogin}
              sx={{
                py: 1.5,
                textTransform: 'none',
                fontWeight: 500,
                borderColor: 'divider',
                color: 'text.primary',
                '&:hover': { borderColor: 'text.secondary', bgcolor: 'action.hover' },
              }}
              startIcon={
                googleLoading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                )
              }
            >
              {t('continueWithGoogle')}
            </Button>

            <Divider sx={{ my: 2.5 }}>
              <Typography variant="caption" color="text.secondary">
                {t('or')}
              </Typography>
            </Divider>

            {/* Magic link */}
            <form onSubmit={handleSubmit}>
              <TextField
                label={t('emailLabel')}
                placeholder={t('emailPlaceholder')}
                type="email"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ mb: 2 }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading || googleLoading}
                sx={{ py: 1.5 }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : t('sendLink')}
              </Button>
            </form>
          </>
        )}
      </Container>
    </Box>
  );
}
