'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import type { PlanSlot } from '@/lib/types/plans';

interface PlanResolveConfirmProps {
  open: boolean;
  onClose: () => void;
  planId: string;
  slot: PlanSlot | null;
  onResolved: () => void;
}

function formatSlotDate(slot: PlanSlot, locale: string): string {
  const d = new Date(`${slot.date}T${slot.time ?? '00:00'}:00`);
  const dateStr = d.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  if (slot.time) {
    return `${dateStr} — ${slot.time.slice(0, 5)}`;
  }
  return dateStr;
}

export default function PlanResolveConfirm({
  open,
  onClose,
  planId,
  slot,
  onResolved,
}: PlanResolveConfirmProps) {
  const t = useTranslations('plans');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    if (!slot) return;
    setLoading(true);
    setError('');

    const res = await fetch(`/api/plans/${planId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slot_id: slot.id }),
    });
    setLoading(false);

    if (!res.ok) {
      setError(t('errors.resolveFailed'));
      return;
    }

    onResolved();
    onClose();
  };

  if (!slot) return null;

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>{t('resolve.confirmTitle')}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Typography>{t('resolve.confirmMessage', { date: formatSlotDate(slot, locale) })}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {tCommon('cancel')}
        </Button>
        <Button onClick={handleConfirm} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={20} color="inherit" /> : t('resolve.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
