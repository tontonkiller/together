'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { validatePlanInput } from '@/lib/plans/validation';
import type { PlanInput } from '@/lib/types/plans';

interface PlanDialogProps {
  open: boolean;
  onClose: () => void;
  groupId: string;
  memberCount: number;
  onPlanCreated: () => void;
}

interface SlotDraft {
  startDate: string;
  endDate: string;
  withTime: boolean;
  startTime: string;
  endTime: string;
}

function todayStr(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

function makeEmptySlot(startOffset = 0): SlotDraft {
  const start = todayStr(startOffset);
  return { startDate: start, endDate: start, withTime: false, startTime: '19:00', endTime: '22:00' };
}

export default function PlanDialog({
  open,
  onClose,
  groupId,
  memberCount,
  onPlanCreated,
}: PlanDialogProps) {
  const t = useTranslations('plans');
  const tCommon = useTranslations('common');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [quorum, setQuorum] = useState(Math.min(2, memberCount));
  const [slots, setSlots] = useState<SlotDraft[]>([makeEmptySlot(7), makeEmptySlot(14)]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setTitle('');
    setDescription('');
    setQuorum(Math.min(2, memberCount));
    setSlots([makeEmptySlot(7), makeEmptySlot(14)]);
    setError('');
  };

  const handleClose = () => {
    if (loading) return;
    reset();
    onClose();
  };

  const addSlot = () => setSlots((s) => [...s, makeEmptySlot(s.length * 7 + 7)]);
  const removeSlot = (idx: number) =>
    setSlots((s) => (s.length > 2 ? s.filter((_, i) => i !== idx) : s));
  const updateSlot = (idx: number, patch: Partial<SlotDraft>) =>
    setSlots((s) =>
      s.map((slot, i) => {
        if (i !== idx) return slot;
        const next = { ...slot, ...patch };
        // If startDate moved after endDate, snap endDate forward
        if (patch.startDate && next.endDate < patch.startDate) {
          next.endDate = patch.startDate;
        }
        return next;
      }),
    );

  const handleSubmit = async () => {
    setError('');

    const input: PlanInput = {
      title: title.trim(),
      description: description.trim() || null,
      quorum,
      slots: slots.map((s, i) => ({
        start_date: s.startDate,
        end_date: s.endDate,
        start_time: s.withTime ? s.startTime : null,
        end_time: s.withTime ? s.endTime : null,
        position: i,
      })),
    };

    const check = validatePlanInput(input, memberCount);
    if (!check.valid) {
      setError(t(`errors.${check.errorKey}` as 'errors.titleRequired'));
      return;
    }

    setLoading(true);
    const res = await fetch(`/api/groups/${groupId}/plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    setLoading(false);

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      const errKey = body.error ?? 'createFailed';
      const knownKeys = [
        'titleRequired',
        'titleTooLong',
        'invalidQuorum',
        'quorumExceedsMembers',
        'minTwoSlots',
        'invalidSlotDate',
        'invalidSlotTime',
        'slotEndBeforeStart',
        'invalidBody',
        'createFailed',
        'notAGroupMember',
      ];
      setError(
        knownKeys.includes(errKey)
          ? t(`errors.${errKey}` as 'errors.createFailed')
          : t('errors.createFailed'),
      );
      return;
    }

    onPlanCreated();
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" fullScreen={isMobile}>
      <DialogTitle>{t('create')}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
            {error}
          </Alert>
        )}

        <TextField
          autoFocus
          label={t('form.title')}
          placeholder={t('form.titlePlaceholder')}
          fullWidth
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          sx={{ mt: 1, mb: 2 }}
        />

        <TextField
          label={t('form.description')}
          fullWidth
          multiline
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          sx={{ mb: 2 }}
        />

        <TextField
          label={t('form.quorum')}
          type="number"
          fullWidth
          value={quorum}
          onChange={(e) => setQuorum(Math.max(1, parseInt(e.target.value, 10) || 1))}
          helperText={t('form.quorumHint')}
          slotProps={{ htmlInput: { min: 1, max: memberCount } }}
          sx={{ mb: 2 }}
        />

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {t('form.slots')}
        </Typography>

        <Stack spacing={2}>
          {slots.map((slot, idx) => (
            <Box
              key={idx}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                p: 1.5,
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <Typography variant="caption" sx={{ minWidth: 20 }}>
                  #{idx + 1}
                </Typography>
                <Box sx={{ flexGrow: 1 }} />
                {slots.length > 2 && (
                  <IconButton
                    size="small"
                    onClick={() => removeSlot(idx)}
                    aria-label={t('form.removeSlot')}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Stack>

              <Stack direction={isMobile ? 'column' : 'row'} spacing={1} sx={{ mb: 1 }}>
                <TextField
                  label={t('form.slotStartDate')}
                  type="date"
                  fullWidth
                  size="small"
                  value={slot.startDate}
                  onChange={(e) => updateSlot(idx, { startDate: e.target.value })}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  label={t('form.slotEndDate')}
                  type="date"
                  fullWidth
                  size="small"
                  value={slot.endDate}
                  onChange={(e) => updateSlot(idx, { endDate: e.target.value })}
                  slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: slot.startDate } }}
                />
              </Stack>

              <FormControlLabel
                control={
                  <Switch
                    checked={slot.withTime}
                    onChange={(e) => updateSlot(idx, { withTime: e.target.checked })}
                    size="small"
                  />
                }
                label={t('form.slotWithTime')}
              />

              {slot.withTime && (
                <Stack direction={isMobile ? 'column' : 'row'} spacing={1} sx={{ mt: 1 }}>
                  <TextField
                    label={t('form.slotStartTime')}
                    type="time"
                    fullWidth
                    size="small"
                    value={slot.startTime}
                    onChange={(e) => updateSlot(idx, { startTime: e.target.value })}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                  <TextField
                    label={t('form.slotEndTime')}
                    type="time"
                    fullWidth
                    size="small"
                    value={slot.endTime}
                    onChange={(e) => updateSlot(idx, { endTime: e.target.value })}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Stack>
              )}
            </Box>
          ))}
        </Stack>

        <Button
          onClick={addSlot}
          startIcon={<AddIcon />}
          size="small"
          sx={{ mt: 1.5 }}
        >
          {t('form.addSlot')}
        </Button>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {tCommon('cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !title.trim()}
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : t('form.submit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
