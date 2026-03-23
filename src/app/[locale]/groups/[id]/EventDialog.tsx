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
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Switch from '@mui/material/Switch';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { createClient } from '@/lib/supabase/client';
import type { CalendarEvent, EventType } from '@/lib/types/events';

interface EventDialogProps {
  open: boolean;
  onClose: () => void;
  event: CalendarEvent | null; // null = create mode
  eventTypes: EventType[];
  groupId?: string;
  onEventCreated: (event: CalendarEvent) => void;
  onEventUpdated: (event: CalendarEvent) => void;
  onEventDeleted?: (eventId: string) => void;
  defaultDate?: string;
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export default function EventDialog({
  open,
  onClose,
  event,
  eventTypes,
  onEventCreated,
  onEventUpdated,
  onEventDeleted,
  defaultDate,
}: EventDialogProps) {
  const t = useTranslations('events');
  const tCommon = useTranslations('common');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isEdit = !!event;

  const [title, setTitle] = useState(event?.title ?? '');
  const [description, setDescription] = useState(event?.description ?? '');
  const [location, setLocation] = useState(event?.location ?? '');
  const [startDate, setStartDate] = useState(event?.start_date ?? defaultDate ?? todayStr());
  const [endDate, setEndDate] = useState(event?.end_date ?? defaultDate ?? todayStr());
  const [isAllDay, setIsAllDay] = useState(event?.is_all_day ?? true);
  const [startTime, setStartTime] = useState(event?.start_time ?? '09:00');
  const [endTime, setEndTime] = useState(event?.end_time ?? '17:00');
  const [eventTypeId, setEventTypeId] = useState(event?.event_type_id ?? '');
  const [isPrivate, setIsPrivate] = useState(event?.is_private ?? false);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    if (!event || !onEventDeleted) return;
    setDeleteLoading(true);
    const supabase = createClient();
    const { error: deleteError } = await supabase.from('events').delete().eq('id', event.id);
    setDeleteLoading(false);
    if (deleteError) {
      setError(t('deleteError'));
    } else {
      onEventDeleted(event.id);
      onClose();
    }
  };

  const validate = (): boolean => {
    if (!title.trim()) {
      setError(t('titleRequired'));
      return false;
    }
    if (!startDate || !endDate) {
      setError(t('dateRequired'));
      return false;
    }
    if (endDate < startDate) {
      setError(t('dateOrderError'));
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

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

    const eventData = {
      title: title.trim(),
      description: description.trim() || null,
      location: location.trim() || null,
      start_date: startDate,
      end_date: endDate,
      start_time: isAllDay ? null : startTime,
      end_time: isAllDay ? null : endTime,
      is_all_day: isAllDay,
      is_private: isPrivate,
      event_type_id: eventTypeId || null,
      user_id: user.id,
    };

    if (isEdit && event) {
      const { data, error: updateError } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', event.id)
        .select('*, event_types(name, icon)')
        .single();

      setLoading(false);
      if (updateError) {
        setError(t('updateError'));
      } else if (data) {
        onEventUpdated(data as CalendarEvent);
        onClose();
      }
    } else {
      const { data, error: createError } = await supabase
        .from('events')
        .insert(eventData)
        .select('*, event_types(name, icon)')
        .single();

      setLoading(false);
      if (createError) {
        setError(t('createError'));
      } else if (data) {
        onEventCreated(data as CalendarEvent);
        onClose();
      }
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" fullScreen={isMobile}>
      <DialogTitle>{isEdit ? t('editEvent') : t('createEvent')}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
            {error}
          </Alert>
        )}

        <TextField
          autoFocus
          label={t('eventTitle')}
          placeholder={t('eventTitlePlaceholder')}
          fullWidth
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          sx={{ mt: 1, mb: 2 }}
        />

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>{t('eventType')}</InputLabel>
          <Select
            value={eventTypeId}
            label={t('eventType')}
            onChange={(e) => setEventTypeId(e.target.value)}
          >
            <MenuItem value="">—</MenuItem>
            {eventTypes.map((et) => (
              <MenuItem key={et.id} value={et.id}>
                {et.is_system ? t(`type${et.name}` as 'typeVacances' | 'typeDisponible' | 'typeVoyage') : et.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label={t('description')}
          fullWidth
          multiline
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          sx={{ mb: 2 }}
        />

        <TextField
          label={t('location')}
          placeholder={t('locationPlaceholder')}
          fullWidth
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          sx={{ mb: 2 }}
        />

        <FormControlLabel
          control={
            <Switch checked={isAllDay} onChange={(e) => setIsAllDay(e.target.checked)} />
          }
          label={t('allDay')}
          sx={{ mb: 2 }}
        />

        <TextField
          label={t('startDate')}
          type="date"
          fullWidth
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ mb: 2 }}
        />

        <TextField
          label={t('endDate')}
          type="date"
          fullWidth
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ mb: 2 }}
        />

        {!isAllDay && (
          <>
            <TextField
              label={t('startTime')}
              type="time"
              fullWidth
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ mb: 2 }}
            />
            <TextField
              label={t('endTime')}
              type="time"
              fullWidth
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ mb: 2 }}
            />
          </>
        )}

        <FormControlLabel
          control={
            <Checkbox checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
          }
          label={t('private')}
        />
        {isPrivate && (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 4, mt: -0.5 }}>
            {t('privateHint')}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        {isEdit && onEventDeleted && (
          <Button
            color="error"
            onClick={handleDelete}
            disabled={deleteLoading || loading}
            size="small"
            sx={{ mr: 'auto' }}
          >
            {t('deleteEvent')}
          </Button>
        )}
        <Button onClick={onClose}>{tCommon('cancel')}</Button>
        <Button
          onClick={handleSubmit}
          disabled={loading || !title.trim()}
          variant="contained"
        >
          {loading ? (
            <CircularProgress size={20} color="inherit" />
          ) : isEdit ? (
            t('save')
          ) : (
            t('create')
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
