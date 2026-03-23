'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { locales } from '@/lib/i18n/config';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

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
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import DeleteIcon from '@mui/icons-material/Delete';
import GoogleCalendarSelect from './GoogleCalendarSelect';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from '@/lib/i18n/navigation';
import { useSearchParams } from 'next/navigation';

interface GoogleAccount {
  id: string;
  google_email: string;
  created_at: string;
}

interface ProfileContentProps {
  profile: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    preferred_locale: string;
  } | null;
  email: string;
  googleAccounts: GoogleAccount[];
}

export default function ProfileContent({ profile, email, googleAccounts: initialGoogleAccounts }: ProfileContentProps) {
  const t = useTranslations('profile');
  const tAuth = useTranslations('auth');
  const tCommon = useTranslations('common');
  const tGoogle = useTranslations('googleSync');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [preferredLocale, setPreferredLocale] = useState(
    profile?.preferred_locale ?? locale
  );
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Google Calendar state
  const [googleAccounts, setGoogleAccounts] = useState<GoogleAccount[]>(initialGoogleAccounts);
  const [googleConnecting, setGoogleConnecting] = useState(false);
  const [googleError, setGoogleError] = useState('');
  const [googleSuccess, setGoogleSuccess] = useState('');
  const [disconnectDialogId, setDisconnectDialogId] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  // Show feedback from Google OAuth redirect
  const googleParam = searchParams.get('google');
  const showGoogleSuccess = googleParam === 'success' && !googleSuccess && !googleError;
  const showGoogleError = googleParam === 'error' && !googleSuccess && !googleError;

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

  const handleGoogleConnect = async () => {
    setGoogleConnecting(true);
    setGoogleError('');
    setGoogleSuccess('');

    try {
      const res = await fetch('/api/google/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale }),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        setGoogleError(tGoogle('connectError'));
        setGoogleConnecting(false);
        return;
      }

      // Redirect to Google OAuth
      window.location.href = data.url;
    } catch {
      setGoogleError(tGoogle('connectError'));
      setGoogleConnecting(false);
    }
  };

  const handleGoogleDisconnect = async () => {
    if (!disconnectDialogId) return;

    setDisconnecting(true);

    try {
      const res = await fetch('/api/google/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: disconnectDialogId }),
      });

      if (!res.ok) {
        setGoogleError(tGoogle('disconnectError'));
      } else {
        setGoogleAccounts((prev) => prev.filter((a) => a.id !== disconnectDialogId));
        setGoogleSuccess(tGoogle('disconnectSuccess'));
      }
    } catch {
      setGoogleError(tGoogle('disconnectError'));
    }

    setDisconnecting(false);
    setDisconnectDialogId(null);
  };

  return (
    <AuthenticatedLayout>
      <Box sx={{ maxWidth: 'sm', mx: 'auto', py: 2 }}>
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

        {/* Google Calendar Section */}
        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" sx={{ mb: 2 }}>
          {tGoogle('sectionTitle')}
        </Typography>

        {(showGoogleSuccess || googleSuccess) && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {googleSuccess || tGoogle('connectSuccess')}
          </Alert>
        )}
        {(showGoogleError || googleError) && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {googleError || tGoogle('connectError')}
          </Alert>
        )}

        {googleAccounts.length > 0 && (
          <List disablePadding>
            {googleAccounts.map((account) => (
              <Box key={account.id}>
                <ListItem
                  secondaryAction={
                    <IconButton
                      edge="end"
                      color="error"
                      onClick={() => setDisconnectDialogId(account.id)}
                      aria-label={tGoogle('disconnect')}
                    >
                      <DeleteIcon />
                    </IconButton>
                  }
                  sx={{ pl: 0 }}
                >
                  <ListItemText primary={account.google_email} />
                </ListItem>
                <GoogleCalendarSelect
                  accountId={account.id}
                  accountEmail={account.google_email}
                />
              </Box>
            ))}
          </List>
        )}

        {googleAccounts.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {tGoogle('noAccounts')}
          </Typography>
        )}

        <Button
          variant="outlined"
          fullWidth
          onClick={handleGoogleConnect}
          disabled={googleConnecting}
          sx={{ mb: 2 }}
        >
          {googleConnecting ? (
            <CircularProgress size={20} sx={{ mr: 1 }} />
          ) : null}
          {googleConnecting ? tGoogle('connecting') : tGoogle('connect')}
        </Button>

        {/* Disconnect Confirmation Dialog */}
        <Dialog
          open={!!disconnectDialogId}
          onClose={() => setDisconnectDialogId(null)}
        >
          <DialogTitle>{tGoogle('disconnect')}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {tGoogle('disconnectConfirm')}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDisconnectDialogId(null)} disabled={disconnecting}>
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleGoogleDisconnect} color="error" disabled={disconnecting}>
              {disconnecting ? <CircularProgress size={20} /> : tGoogle('disconnect')}
            </Button>
          </DialogActions>
        </Dialog>

        <Divider sx={{ my: 3 }} />

        <Button
          variant="outlined"
          color="error"
          fullWidth
          onClick={handleLogout}
        >
          {tAuth('logout')}
        </Button>
      </Box>
    </AuthenticatedLayout>
  );
}
