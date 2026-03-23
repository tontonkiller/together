'use client';

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
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import { useRouter } from '@/lib/i18n/navigation';

export interface UpcomingEvent {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  is_all_day: boolean;
  start_time: string | null;
  end_time: string | null;
  event_type_id: string | null;
  event_types: { name: string; icon: string | null } | null;
}

export interface DashboardContentProps {
  profile: { display_name: string } | null;
  groups: Array<{
    group_id: string;
    role: string;
    groups: { id: string; name: string; description: string | null }[] | null;
  }>;
  upcomingEvents: UpcomingEvent[];
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

export default function DashboardContent({ profile, groups, upcomingEvents }: DashboardContentProps) {
  const t = useTranslations('dashboard');
  const router = useRouter();

  return (
    <AuthenticatedLayout>
      <Typography variant="h2" sx={{ mb: 3 }}>
        {t('greeting', { name: profile?.display_name ?? 'User' })}
      </Typography>

      {/* Upcoming events */}
      {upcomingEvents.length > 0 && (
        <>
          <Typography variant="h3" sx={{ mb: 1.5 }}>
            {t('upcomingEvents')}
          </Typography>
          <Stack spacing={1} sx={{ mb: 3 }}>
            {upcomingEvents.map((event) => (
              <Card key={event.id} variant="outlined">
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                      <EventIcon color="primary" sx={{ fontSize: 20 }} />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" noWrap>
                          {event.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatEventDate(event.start_date, event.end_date, event.is_all_day, event.start_time)}
                        </Typography>
                      </Box>
                    </Box>
                    {event.event_types && (
                      <Chip label={event.event_types.name} size="small" variant="outlined" />
                    )}
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </>
      )}

      {/* Groups */}
      <Typography variant="h3" sx={{ mb: 2 }}>
        {t('myGroups')}
      </Typography>

      {groups.length === 0 ? (
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <GroupsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
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
            <Card key={gm.group_id} variant="outlined">
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
                    <GroupsIcon color="primary" />
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {gm.groups?.[0]?.name}
                      </Typography>
                      {gm.groups?.[0]?.description && (
                        <Typography variant="body2" color="text.secondary">
                          {gm.groups[0].description}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <ChevronRightIcon color="action" />
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
      >
        {t('createGroup')}
      </Button>
    </AuthenticatedLayout>
  );
}
