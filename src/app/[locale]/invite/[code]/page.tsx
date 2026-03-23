'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import GroupsIcon from '@mui/icons-material/Groups';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from '@/lib/i18n/navigation';

export default function InvitePage() {
  const t = useTranslations('invite');
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const joinAttempted = useRef(false);

  const [status, setStatus] = useState<'loading' | 'joining' | 'joined' | 'already-member' | 'need-login' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    if (joinAttempted.current) return;
    joinAttempted.current = true;

    async function autoJoin() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setStatus('need-login');
        return;
      }

      // Auto-join: call the API immediately
      setStatus('joining');

      try {
        const response = await fetch(`/api/invite/${params.code}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
        });

        const result = await response.json();

        if (!response.ok) {
          setError(result.error || t('invalidLink'));
          setStatus('error');
          return;
        }

        if (result.alreadyMember) {
          setStatus('already-member');
        } else {
          setStatus('joined');
        }

        // Redirect to the group after a short delay
        setTimeout(() => {
          router.push(`/groups/${result.groupId}`);
        }, 1500);
      } catch {
        setError(t('invalidLink'));
        setStatus('error');
      }
    }

    autoJoin();
  }, [params.code, router, t]);

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
        <Card variant="outlined">
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <GroupsIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />

            <Typography variant="h2" sx={{ mb: 1 }}>
              {t('title')}
            </Typography>

            {status === 'loading' || status === 'joining' ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <CircularProgress />
                <Typography variant="body1" color="text.secondary">
                  {t('joining')}
                </Typography>
              </Box>
            ) : status === 'need-login' ? (
              <>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  {t('loginFirst')}
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => router.push('/login')}
                >
                  {t('joining')}
                </Button>
              </>
            ) : status === 'joined' ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Alert severity="success">{t('joined')}</Alert>
                <CircularProgress size={20} />
              </Box>
            ) : status === 'already-member' ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Typography variant="body1" color="text.secondary">
                  {t('alreadyMember')}
                </Typography>
                <CircularProgress size={20} />
              </Box>
            ) : status === 'error' ? (
              <>
                <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>
                  {error}
                </Alert>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => router.push('/')}
                >
                  {t('joining')}
                </Button>
              </>
            ) : null}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
