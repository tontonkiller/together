'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { locales, type Locale } from '@/lib/i18n/config';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from '@/lib/i18n/navigation';

interface ProfileContentProps {
  profile: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    preferred_locale: string;
  } | null;
  email: string;
}

export default function ProfileContent({ profile, email }: ProfileContentProps) {
  const t = useTranslations('profile');
  const tAuth = useTranslations('auth');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();

  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [preferredLocale, setPreferredLocale] = useState(
    profile?.preferred_locale ?? locale
  );
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!profile) {
      setError(tCommon('error'));
      return;
    }

    if (!displayName.trim()) {
      setError(t('displayNameRequired'));
      return;
    }

    setLoading(true);
    setError('');
    setSaved(false);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim(),
        preferred_locale: preferredLocale,
      })
      .eq('id', profile.id);

    setLoading(false);

    if (updateError) {
      setError(tCommon('error'));
    } else {
      setSaved(true);
      const validLocale = locales.find((l) => l === preferredLocale);
      if (validLocale && validLocale !== locale) {
        router.replace('/profile', { locale: validLocale });
      }
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <AuthenticatedLayout>
      <Container maxWidth="sm" sx={{ py: 2 }}>
        <Typography variant="h2" sx={{ mb: 3 }}>
          {t('title')}
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Avatar
            sx={{ width: 80, height: 80, fontSize: '2rem', bgcolor: 'primary.main' }}
            alt={t('avatarAlt')}
          >
            {displayName.charAt(0).toUpperCase() || '?'}
          </Avatar>
        </Box>

        {saved && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {t('saved')}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          label={t('displayName')}
          placeholder={t('displayNamePlaceholder')}
          fullWidth
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          sx={{ mb: 2 }}
        />

        <TextField
          label={t('email')}
          fullWidth
          value={email}
          disabled
          sx={{ mb: 2 }}
        />

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>{t('language')}</InputLabel>
          <Select
            value={preferredLocale}
            label={t('language')}
            onChange={(e) => setPreferredLocale(e.target.value)}
          >
            <MenuItem value="fr">Français</MenuItem>
            <MenuItem value="en">English</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="contained"
          fullWidth
          onClick={handleSave}
          disabled={loading || !profile}
          sx={{ mb: 2 }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : tCommon('save')}
        </Button>

        <Divider sx={{ my: 3 }} />

        <Button
          variant="outlined"
          color="error"
          fullWidth
          onClick={handleLogout}
        >
          {tAuth('logout')}
        </Button>
      </Container>
    </AuthenticatedLayout>
  );
}
