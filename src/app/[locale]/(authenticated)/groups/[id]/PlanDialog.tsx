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
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
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
import type { PlanDuration, PlanInput } from '@/lib/types/plans';

interface PlanDialogProps {
  open: boolean;
  onClose: () => void;
  groupId: string;
  memberCount: number;
  onPlanCreated: () => void;
}

interface SlotDraft {
  date: string;
  withTime: boolean;
  time: string;
}

const DURATIONS: PlanDuration[] = ['30min', '1h', '2h', '3h', 'half_day', 'full_day'];

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function makeEmptySlot(): SlotDraft {
  return { date: todayStr(), withTime: false, time: '19:00' };
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
  const [duration, setDuration] = useState<PlanDuration>('1h');
  const [quorum, setQuorum] = useState(Math.min(2, memberCount));
  const [slots, setSlots] = useState<SlotDraft[]>([makeEmptySlot(), makeEmptySlot()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setTitle('');
    setDescription('');
    setDuration('1h');
    setQuorum(Math.min(2, memberCount));
    setSlots([makeEmptySlot(), makeEmptySlot()]);
    setError('');
  };

  const handleClose = () => {
    if (loading) return;
    reset();
    onClose();
  };

  const addSlot = () => setSlots((s) => [...s, makeEmptySlot()]);
  const removeSlot = (idx: number) =>
    setSlots((s) => (s.length > 2 ? s.filter((_, i) => i !== idx) : s));
  const updateSlot = (idx: number, patch: Partial<SlotDraft>) =>
    setSlots((s) => s.map((slot, i) => (i === idx ? { ...slot, ...patch } : slot)));

  const handleSubmit = async () => {
    setError('');

    const input: PlanInput = {
      title: title.trim(),
      description: description.trim() || null,
      duration,
      quorum,
      slots: slots.map((s, i) => ({
        date: s.date,
        time: s.withTime ? s.time : null,
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
      const hasKey = [
        'titleRequired',
        'titleTooLong',
        'invalidDuration',
        'invalidQuorum',
        'quorumExceedsMembers',
        'minTwoSlots',
        'invalidSlotDate',
        'invalidSlotTime',
        'invalidBody',
        'createFailed',
        'notAGroupMember',
      ].includes(errKey);
      setError(hasKey ? t(`errors.${errKey}` as 'errors.createFailed') : t('errors.createFailed'));
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

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>{t('form.duration')}</InputLabel>
          <Select
            value={duration}
            label={t('form.duration')}
            onChange={(e) => setDuration(e.target.value as PlanDuration)}
          >
            {DURATIONS.map((d) => (
              <MenuItem key={d} value={d}>
                {t(`duration.${d}` as 'duration.1h')}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

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

              <TextField
                label={t('form.slotDate')}
                type="date"
                fullWidth
                size="small"
                value={slot.date}
                onChange={(e) => updateSlot(idx, { date: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ mb: 1 }}
              />

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
                <TextField
                  label={t('form.slotTime')}
                  type="time"
                  fullWidth
                  size="small"
                  value={slot.time}
                  onChange={(e) => updateSlot(idx, { time: e.target.value })}
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={{ mt: 1 }}
                />
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
