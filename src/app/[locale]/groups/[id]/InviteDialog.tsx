'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CircularProgress from '@mui/material/CircularProgress';
import { createClient } from '@/lib/supabase/client';

interface InviteDialogProps {
  open: boolean;
  onClose: () => void;
  groupId: string;
  inviteCode: string | null;
  onInviteSent: () => void;
}

export default function InviteDialog({
  open,
  onClose,
  groupId,
  inviteCode,
  onInviteSent,
}: InviteDialogProps) {
  const t = useTranslations('groups');
  const tCommon = useTranslations('common');

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  const inviteLink = inviteCode
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${inviteCode}`
    : '';

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError('');

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError(tCommon('error'));
      setLoading(false);
      return;
    }

    const { error: inviteError } = await supabase.from('invitations').insert({
      group_id: groupId,
      invited_email: email.trim().toLowerCase(),
      invited_by: user.id,
    });

    setLoading(false);

    if (inviteError) {
      setError(inviteError.message);
    } else {
      setEmail('');
      onInviteSent();
      onClose();
    }
  };

  const handleCopyLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = inviteLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{t('inviteMembers')}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Invite by email */}
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {t('inviteByEmail')}
        </Typography>
        <form onSubmit={handleSendEmail}>
          <TextField
            label={t('inviteEmail')}
            placeholder={t('inviteEmailPlaceholder')}
            type="email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            size="small"
            sx={{ mb: 1.5 }}
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading || !email.trim()}
            size="small"
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : t('sendInvite')}
          </Button>
        </form>

        <Divider sx={{ my: 2.5 }} />

        {/* Invite by link */}
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {t('inviteByLink')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            value={inviteLink}
            fullWidth
            size="small"
            slotProps={{ input: { readOnly: true } }}
          />
          <Button
            variant="outlined"
            onClick={handleCopyLink}
            startIcon={<ContentCopyIcon />}
            sx={{ whiteSpace: 'nowrap' }}
            size="small"
          >
            {linkCopied ? t('linkCopied') : t('copyLink')}
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{tCommon('done')}</Button>
      </DialogActions>
    </Dialog>
  );
}
