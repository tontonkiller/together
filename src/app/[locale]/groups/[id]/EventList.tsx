'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Alert from '@mui/material/Alert';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EventIcon from '@mui/icons-material/Event';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LockIcon from '@mui/icons-material/Lock';
import { createClient } from '@/lib/supabase/client';
import EventDialog from './EventDialog';
import type { CalendarEvent, EventType } from '@/lib/types/events';

interface EventListProps {
  events: CalendarEvent[];
  eventTypes: EventType[];
  groupId: string;
  currentUserId: string;
  onEventCreated: (event: CalendarEvent) => void;
  onEventUpdated: (event: CalendarEvent) => void;
  onEventDeleted: (eventId: string) => void;
}

function formatDateRange(startDate: string, endDate: string, isAllDay: boolean, startTime: string | null, endTime: string | null, allDayLabel: string): string {
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  const sameDay = startDate === endDate;

  const dateOpts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };

  if (sameDay) {
    const dateStr = start.toLocaleDateString(undefined, dateOpts);
    if (isAllDay) return `${dateStr} — ${allDayLabel}`;
    return `${dateStr} ${startTime?.slice(0, 5) ?? ''} - ${endTime?.slice(0, 5) ?? ''}`;
  }

  const startStr = start.toLocaleDateString(undefined, dateOpts);
  const endStr = end.toLocaleDateString(undefined, dateOpts);
  return `${startStr} → ${endStr}`;
}

export default function EventList({
  events,
  eventTypes,
  groupId,
  currentUserId,
  onEventCreated,
  onEventUpdated,
  onEventDeleted,
}: EventListProps) {
  const t = useTranslations('events');
  const tCommon = useTranslations('common');

  const [createOpen, setCreateOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    setDeleteError('');

    const supabase = createClient();
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', deleteId);

    setDeleteLoading(false);
    if (error) {
      setDeleteError(t('deleteError'));
    } else {
      onEventDeleted(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h3">{t('title')}</Typography>
        <Button
          startIcon={<AddIcon />}
          size="small"
          onClick={() => setCreateOpen(true)}
        >
          {t('createEvent')}
        </Button>
      </Box>

      {events.length === 0 ? (
        <Card variant="outlined">
          <CardContent sx={{ textAlign: 'center', py: 3 }}>
            <EventIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              {t('noEvents')}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={1}>
          {events.map((event) => {
            const isOwner = event.user_id === currentUserId;
            return (
              <Card key={event.id} variant="outlined">
                <CardActionArea
                  onClick={() => isOwner && setEditEvent(event)}
                  disabled={!isOwner}
                >
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
                          <Typography variant="subtitle2" noWrap>
                            {event.title}
                          </Typography>
                          {event.is_private && (
                            <LockIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          )}
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {formatDateRange(
                            event.start_date,
                            event.end_date,
                            event.is_all_day,
                            event.start_time,
                            event.end_time,
                            t('allDayLabel'),
                          )}
                        </Typography>
                        {event.location && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, mt: 0.25 }}>
                            <LocationOnIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {event.location}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {event.event_types && (
                          <Chip label={event.event_types.name} size="small" variant="outlined" />
                        )}
                        {isOwner && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteId(event.id);
                            }}
                            aria-label={t('deleteEvent')}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            );
          })}
        </Stack>
      )}

      {/* Create dialog — key forces remount to reset form */}
      {createOpen && (
        <EventDialog
          open
          onClose={() => setCreateOpen(false)}
          event={null}
          eventTypes={eventTypes}
          groupId={groupId}
          onEventCreated={onEventCreated}
          onEventUpdated={onEventUpdated}
        />
      )}

      {/* Edit dialog — key on event id forces remount with correct initial values */}
      {editEvent && (
        <EventDialog
          key={editEvent.id}
          open
          onClose={() => setEditEvent(null)}
          event={editEvent}
          eventTypes={eventTypes}
          groupId={groupId}
          onEventCreated={onEventCreated}
          onEventUpdated={onEventUpdated}
        />
      )}

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>{t('deleteEvent')}</DialogTitle>
        <DialogContent>
          {deleteError && (
            <Alert severity="error" sx={{ mb: 1 }}>
              {deleteError}
            </Alert>
          )}
          <Typography>{t('deleteConfirm')}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>{tCommon('cancel')}</Button>
          <Button onClick={handleDelete} disabled={deleteLoading} color="error" variant="contained">
            {tCommon('delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
