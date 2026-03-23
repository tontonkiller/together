'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import LockIcon from '@mui/icons-material/Lock';
import PlaceIcon from '@mui/icons-material/Place';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import type { CalendarEvent, EventType } from '@/lib/types/events';
import type { GroupMember } from './GroupDetailContent';
import EventDialog from './EventDialog';

interface EventDetailDialogProps {
  open: boolean;
  onClose: () => void;
  event: CalendarEvent;
  currentUserId: string;
  members: GroupMember[];
  eventTypes: EventType[];
  onEventUpdated: (event: CalendarEvent) => void;
  onEventDeleted: (eventId: string) => void;
  isGoogleImported?: boolean;
}

export default function EventDetailDialog({
  open,
  onClose,
  event,
  currentUserId,
  members,
  eventTypes,
  onEventUpdated,
  onEventDeleted,
  isGoogleImported = false,
}: EventDetailDialogProps) {
  const t = useTranslations('events');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [editOpen, setEditOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const isOwner = event.user_id === currentUserId;
  const isPrivateOther = event.is_private && !isOwner;

  // Find creator member
  const creator = members.find((m) => m.user_id === event.user_id);
  const creatorName = creator?.profiles?.display_name ?? '?';
  const creatorInitial = creatorName.charAt(0).toUpperCase();

  // Format date range
  const formatDateRange = () => {
    const start = event.start_date;
    const end = event.end_date;
    if (start === end) {
      if (event.is_all_day) return `${start} — ${t('allDayLabel')}`;
      return `${start} ${event.start_time?.slice(0, 5) ?? ''} – ${event.end_time?.slice(0, 5) ?? ''}`;
    }
    return `${start} → ${end}`;
  };

  // Event type label
  const typeLabel = event.event_types
    ? (event.event_types.name === 'Vacances' || event.event_types.name === 'Disponible' || event.event_types.name === 'Voyage'
        ? t(`type${event.event_types.name}` as 'typeVacances' | 'typeDisponible' | 'typeVoyage')
        : event.event_types.name)
    : null;

  const handleDelete = async () => {
    setDeleteLoading(true);
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    const { error } = await supabase.from('events').delete().eq('id', event.id);
    setDeleteLoading(false);
    if (!error) {
      onEventDeleted(event.id);
      onClose();
    }
  };

  // If editing, delegate to EventDialog
  if (editOpen) {
    return (
      <EventDialog
        open
        onClose={() => {
          setEditOpen(false);
          onClose();
        }}
        event={event}
        eventTypes={eventTypes}
        onEventCreated={() => {}}
        onEventUpdated={(updated) => {
          onEventUpdated(updated);
          setEditOpen(false);
          onClose();
        }}
      />
    );
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" fullScreen={isMobile}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {isPrivateOther ? t('busy') : event.title}
        {event.is_private && <LockIcon fontSize="small" color="action" />}
      </DialogTitle>
      <DialogContent>
        {!isPrivateOther && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 0.5 }}>
            {/* Date */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarTodayIcon fontSize="small" color="action" />
              <Typography variant="body2">{formatDateRange()}</Typography>
            </Box>

            {/* Time (for multi-day timed events) */}
            {!event.is_all_day && event.start_date !== event.end_date && event.start_time && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTimeIcon fontSize="small" color="action" />
                <Typography variant="body2">
                  {event.start_time.slice(0, 5)} – {event.end_time?.slice(0, 5) ?? ''}
                </Typography>
              </Box>
            )}

            {/* Location */}
            {event.location && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PlaceIcon fontSize="small" color="action" />
                <Typography variant="body2">{event.location}</Typography>
              </Box>
            )}

            {/* Event type */}
            {typeLabel && (
              <Chip label={typeLabel} size="small" sx={{ alignSelf: 'flex-start' }} />
            )}

            {/* Description */}
            {event.description && (
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                {event.description}
              </Typography>
            )}

            {/* Creator */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <Avatar
                sx={{
                  width: 28,
                  height: 28,
                  fontSize: '0.8rem',
                  bgcolor: creator?.color ?? 'grey.400',
                }}
              >
                {creatorInitial}
              </Avatar>
              <Typography variant="caption" color="text.secondary">
                {t('createdBy')} {creatorName}
              </Typography>
            </Box>
          </Box>
        )}
        {isGoogleImported && (
          <Chip
            label="Google Calendar"
            size="small"
            variant="outlined"
            sx={{ mt: 1, fontSize: '0.7rem' }}
          />
        )}
      </DialogContent>
      <DialogActions>
        {isOwner && (
          <>
            <Button
              color="error"
              onClick={handleDelete}
              disabled={deleteLoading}
              size="small"
            >
              {t('deleteEvent')}
            </Button>
            <Button onClick={() => setEditOpen(true)} size="small">
              {t('edit')}
            </Button>
          </>
        )}
        <Button onClick={onClose}>{t('close')}</Button>
      </DialogActions>
    </Dialog>
  );
}
