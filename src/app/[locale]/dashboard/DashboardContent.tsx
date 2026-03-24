'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import AddIcon from '@mui/icons-material/Add';
import GroupsIcon from '@mui/icons-material/Groups';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import EventIcon from '@mui/icons-material/Event';
import EventDialog from '@/app/[locale]/groups/[id]/EventDialog';
import { useRouter } from '@/lib/i18n/navigation';
import type { CalendarEvent, EventType } from '@/lib/types/events';

export type UpcomingEvent = CalendarEvent;

export interface DashboardContentProps {
  profile: { display_name: string } | null;
  groups: Array<{
    group_id: string;
    role: string;
    groups: { id: string; name: string; description: string | null } | null;
  }>;
  upcomingEvents: UpcomingEvent[];
  eventTypes: EventType[];
}

function formatEventDate(startDate: string, endDate: string, isAllDay: boolean, startTime: string | null): string {
  const start = new Date(startDate + 'T00:00:00');
  const dateOpts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  const dateStr = start.toLocaleDateString(undefined, dateOpts);

  if (startDate !== endDate) {
    const end = new Date(endDate + 'T00:00:00');
    return `${dateStr} → ${end.toLocaleDateString(undefined, dateOpts)}`;
  }
  if (!isAllDay && startTime) {
    return `${dateStr} ${startTime.slice(0, 5)}`;
  }
  return dateStr;
}

export default function DashboardContent({ profile, groups, upcomingEvents, eventTypes }: DashboardContentProps) {
  const t = useTranslations('dashboard');
  const router = useRouter();
  const [events, setEvents] = useState(upcomingEvents);
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);

  const handleEventUpdated = (updated: CalendarEvent) => {
    setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  };

  const handleEventDeleted = (eventId: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  };

  return (
    <>
      <Typography variant="h2" sx={{ mb: 3 }}>
        {t('greeting', { name: profile?.display_name ?? 'User' })}
      </Typography>

      {/* Groups first */}
      <Typography variant="h3" sx={{ mb: 1.5, color: 'text.secondary' }}>
        {t('myGroups')}
      </Typography>

      {groups.length === 0 ? (
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <GroupsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1, opacity: 0.5 }} />
            <Typography variant="body1" color="text.secondary">
              {t('noGroups')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t('noGroupsHint')}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={1.5} sx={{ mb: 2 }}>
          {groups.map((gm) => (
            <Card key={gm.group_id} sx={{ '&:hover': { transform: 'translateY(-1px)' } }}>
              <CardActionArea
                onClick={() => router.push(`/groups/${gm.group_id}`)}
              >
                <CardContent
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 3,
                        bgcolor: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        flexShrink: 0,
                      }}
                    >
                      <GroupsIcon sx={{ fontSize: 22 }} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700}>
                        {gm.groups?.name}
                      </Typography>
                      {gm.groups?.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                          {gm.groups.description}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <ChevronRightIcon sx={{ color: 'text.secondary', opacity: 0.5 }} />
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Stack>
      )}

      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        fullWidth
        onClick={() => router.push('/groups/new')}
        sx={{ mb: 4 }}
      >
        {t('createGroup')}
      </Button>

      {/* Upcoming events below */}
      <Typography variant="h3" sx={{ mb: 1.5, color: 'text.secondary' }}>
        {t('upcomingEvents')}
      </Typography>
      {events.length === 0 ? (
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ textAlign: 'center', py: 3 }}>
            <EventIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1, opacity: 0.5 }} />
            <Typography variant="body2" color="text.secondary">
              {t('noEvents')}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={1}>
          {events.map((event) => (
            <Card key={event.id} sx={{ '&:hover': { transform: 'translateY(-1px)' } }}>
              <CardActionArea onClick={() => setEditEvent(event)}>
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                      <Box
                        sx={{
                          width: 8,
                          height: 32,
                          borderRadius: 4,
                          bgcolor: 'primary.main',
                          flexShrink: 0,
                          opacity: 0.7,
                        }}
                      />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" noWrap fontWeight={700}>
                          {event.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatEventDate(event.start_date, event.end_date, event.is_all_day, event.start_time)}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {event.event_types && (
                        <Chip label={event.event_types.name} size="small" variant="outlined" />
                      )}
                      <ChevronRightIcon sx={{ color: 'text.secondary', opacity: 0.4, fontSize: 20 }} />
                    </Box>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Stack>
      )}

      {/* Edit event dialog */}
      {editEvent && (
        <EventDialog
          key={editEvent.id}
          open
          onClose={() => setEditEvent(null)}
          event={editEvent}
          eventTypes={eventTypes}
          onEventCreated={() => {}}
          onEventUpdated={(updated) => {
            handleEventUpdated(updated);
            setEditEvent(null);
          }}
          onEventDeleted={handleEventDeleted}
        />
      )}
    </>
  );
}
