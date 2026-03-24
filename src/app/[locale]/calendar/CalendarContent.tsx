'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LockIcon from '@mui/icons-material/Lock';
import { getContrastTextColor } from '@/lib/utils/colors';
import EventDialog from '@/app/[locale]/groups/[id]/EventDialog';
import EventDetailDialog from '@/app/[locale]/groups/[id]/EventDetailDialog';
import type { CalendarEvent, EventType } from '@/lib/types/events';
import type { GroupMember } from '@/app/[locale]/groups/[id]/GroupDetailContent';
import { createClient } from '@/lib/supabase/client';

// Color map for system event types (keyed by DB name)
const EVENT_TYPE_COLORS: Record<string, string> = {
  Vacances: '#D32F2F',
  Disponible: '#388E3C',
  Voyage: '#F57C00',
};

const DEFAULT_EVENT_COLOR = '#1976D2';

function getEventColor(event: CalendarEvent): string {
  if (!event.event_types) return DEFAULT_EVENT_COLOR;
  return EVENT_TYPE_COLORS[event.event_types.name] ?? DEFAULT_EVENT_COLOR;
}

interface UserGroup {
  id: string;
  name: string;
}

interface CalendarContentProps {
  events: CalendarEvent[];
  eventTypes: EventType[];
  userGroups?: UserGroup[];
  currentUserId?: string;
  googleEventIds?: string[];
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function formatDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function isEventOnDay(event: CalendarEvent, dateStr: string): boolean {
  return event.start_date <= dateStr && event.end_date >= dateStr;
}

function getTodayStr(): string {
  const now = new Date();
  return formatDateStr(now.getFullYear(), now.getMonth(), now.getDate());
}

const MONTH_NAMES_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_NAMES_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const DAY_NAMES_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CalendarContent({ events, eventTypes, userGroups = [], currentUserId, googleEventIds = [] }: CalendarContentProps) {
  const tEvents = useTranslations('events');
  const t = useTranslations('calendar');
  const locale = useLocale();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const googleEventIdSet = useMemo(() => new Set(googleEventIds), [googleEventIds]);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [myEvents, setMyEvents] = useState<CalendarEvent[]>(events);

  // Group mode state
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groupEvents, setGroupEvents] = useState<CalendarEvent[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [groupLoading, setGroupLoading] = useState(false);

  // Dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [createDate, setCreateDate] = useState<string | null>(null);
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);
  const [detailEvent, setDetailEvent] = useState<CalendarEvent | null>(null);

  const monthNames = locale === 'fr' ? MONTH_NAMES_FR : MONTH_NAMES_EN;
  const dayNames = locale === 'fr' ? DAY_NAMES_FR : DAY_NAMES_EN;

  const isGroupMode = selectedGroupId !== null;
  const displayEvents = isGroupMode ? groupEvents : myEvents;

  // Fetch group events & members when a group is selected
  useEffect(() => {
    if (!selectedGroupId) return;

    let cancelled = false;

    async function fetchGroupData() {
      const supabase = createClient();

      // Fetch members
      const { data: members } = await supabase
        .from('group_members')
        .select('id, user_id, role, color, joined_at, profiles(display_name, avatar_url)')
        .eq('group_id', selectedGroupId!)
        .order('joined_at', { ascending: true });

      // Get member user_ids
      const memberIds = (members ?? []).map((m) => m.user_id);

      // Fetch events for all group members
      const { data: events } = await supabase
        .from('events')
        .select('id, title, description, location, start_date, end_date, start_time, end_time, is_all_day, is_private, user_id, event_type_id, event_types(name, icon)')
        .in('user_id', memberIds)
        .order('start_date', { ascending: true });

      if (cancelled) return;

      const normalizedMembers = (members ?? []).map((m) => ({
        ...m,
        profiles: Array.isArray(m.profiles) ? m.profiles[0] ?? null : m.profiles,
      })) as GroupMember[];

      const normalizedEvents = (events ?? []).map((e) => ({
        ...e,
        event_types: Array.isArray(e.event_types) ? e.event_types[0] ?? null : e.event_types,
      })) as CalendarEvent[];

      setGroupMembers(normalizedMembers);
      setGroupEvents(normalizedEvents);
      setGroupLoading(false);
    }

    fetchGroupData();
    return () => { cancelled = true; };
  }, [selectedGroupId]);

  // Build member color map for group mode
  const memberColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const m of groupMembers) {
      map[m.user_id] = m.color;
    }
    return map;
  }, [groupMembers]);

  const goToPrev = useCallback(() => {
    setMonth((m) => {
      if (m === 0) {
        setYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }, [setMonth, setYear]);

  const goToNext = useCallback(() => {
    setMonth((m) => {
      if (m === 11) {
        setYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }, [setMonth, setYear]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOffset = getFirstDayOfWeek(year, month);

  const calendarDays = useMemo(() => {
    const days: Array<{ day: number; dateStr: string } | null> = [];
    for (let i = 0; i < firstDayOffset; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ day: d, dateStr: formatDateStr(year, month, d) });
    }
    return days;
  }, [year, month, daysInMonth, firstDayOffset]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const cell of calendarDays) {
      if (!cell) continue;
      const dayEvents = displayEvents.filter((e) => isEventOnDay(e, cell.dateStr));
      if (dayEvents.length > 0) {
        map[cell.dateStr] = dayEvents;
      }
    }
    return map;
  }, [calendarDays, displayEvents]);

  const todayStr = getTodayStr();

  const handleDayClick = (dateStr: string) => {
    if (isGroupMode) return; // No creation from group view
    setCreateDate(dateStr);
    setCreateOpen(true);
  };

  const handleEventCreated = (event: CalendarEvent) => {
    setMyEvents((prev) => [...prev, event].sort((a, b) => a.start_date.localeCompare(b.start_date)));
  };

  const handleEventUpdated = (event: CalendarEvent) => {
    if (isGroupMode) {
      setGroupEvents((prev) => prev.map((e) => (e.id === event.id ? event : e)));
    } else {
      setMyEvents((prev) => prev.map((e) => (e.id === event.id ? event : e)));
    }
  };

  const handleEventDeleted = (eventId: string) => {
    if (isGroupMode) {
      setGroupEvents((prev) => prev.filter((e) => e.id !== eventId));
    } else {
      setMyEvents((prev) => prev.filter((e) => e.id !== eventId));
    }
  };

  function getEventPillColor(event: CalendarEvent): string {
    if (isGroupMode) {
      return memberColorMap[event.user_id] ?? '#999';
    }
    return getEventColor(event);
  }

  function getDisplayTitle(event: CalendarEvent): string {
    if (isGroupMode && event.is_private && event.user_id !== currentUserId) {
      return tEvents('busy');
    }
    const title = event.title;
    if (!event.is_all_day && event.start_time) {
      return `${event.start_time.slice(0, 5)} ${title}`;
    }
    return title;
  }

  function handleEventClick(event: CalendarEvent) {
    if (isGroupMode) {
      setDetailEvent(event);
    } else {
      setEditEvent(event);
    }
  }

  return (
    <>
      <Box sx={{ maxWidth: 600, mx: 'auto' }}>
        {/* Group selector chips */}
        {userGroups.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }} role="group" aria-label={t('selectGroup')}>
            <Chip
              label={t('myEvents')}
              size="small"
              variant={!isGroupMode ? 'filled' : 'outlined'}
              onClick={() => setSelectedGroupId(null)}
              color={!isGroupMode ? 'primary' : 'default'}
              sx={{ fontWeight: 600, fontSize: '0.75rem' }}
            />
            {userGroups.map((group) => (
              <Chip
                key={group.id}
                label={group.name}
                size="small"
                variant={selectedGroupId === group.id ? 'filled' : 'outlined'}
                onClick={() => { setGroupLoading(true); setSelectedGroupId(group.id); }}
                color={selectedGroupId === group.id ? 'primary' : 'default'}
                sx={{ fontSize: '0.75rem' }}
              />
            ))}
          </Box>
        )}

        {/* Loading indicator for group data */}
        {groupLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {/* Header: month navigation */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <IconButton onClick={goToPrev} aria-label={t('previousMonth')}>
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="h3" component="h1">
            {monthNames[month]} {year}
          </Typography>
          <IconButton onClick={goToNext} aria-label={t('nextMonth')}>
            <ChevronRightIcon />
          </IconButton>
        </Box>

        {/* Member legend in group mode */}
        {isGroupMode && !groupLoading && groupMembers.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
            {groupMembers.map((member) => (
              <Box key={member.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: member.color,
                    flexShrink: 0,
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  {member.profiles?.display_name ?? '?'}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* Day names header */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 0,
            mb: 0.5,
          }}
          role="row"
        >
          {dayNames.map((name) => (
            <Typography
              key={name}
              variant="caption"
              align="center"
              role="columnheader"
              sx={{ fontWeight: 600, color: 'text.secondary', py: 0.5, fontSize: isMobile ? '0.6rem' : undefined }}
            >
              {name}
            </Typography>
          ))}
        </Box>

        {/* Calendar grid */}
        {!groupLoading && (
          <Box
            role="grid"
            aria-label={t('title')}
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '1px',
              bgcolor: 'divider',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              overflow: 'hidden',
            }}
          >
            {calendarDays.map((cell, idx) => {
              if (!cell) {
                return <Box key={`empty-${idx}`} sx={{ bgcolor: 'background.default', minHeight: isMobile ? 40 : 64 }} />;
              }

              const dayEvents = eventsByDate[cell.dateStr] ?? [];
              const isToday = cell.dateStr === todayStr;
              const maxVisible = isMobile ? 2 : 3;

              return (
                <Box
                  key={cell.dateStr}
                  role="gridcell"
                  tabIndex={0}
                  aria-label={`${cell.day} ${monthNames[month]}${dayEvents.length > 0 ? ` — ${dayEvents.length} ${tEvents('title').toLowerCase()}` : ''}`}
                  onClick={() => handleDayClick(cell.dateStr)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleDayClick(cell.dateStr);
                    }
                  }}
                  sx={{
                    bgcolor: 'background.paper',
                    minHeight: isMobile ? 40 : 64,
                    minWidth: 0,
                    overflow: 'hidden',
                    p: isMobile ? 0.25 : 0.5,
                    cursor: isGroupMode ? 'default' : 'pointer',
                    ...(!isGroupMode && { '&:hover': { bgcolor: 'action.hover' } }),
                    '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: -2 },
                    position: 'relative',
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: isToday ? 700 : 400,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: isMobile ? 18 : 24,
                      height: isMobile ? 18 : 24,
                      borderRadius: '50%',
                      bgcolor: isToday ? 'primary.main' : 'transparent',
                      color: isToday ? 'primary.contrastText' : 'text.primary',
                    }}
                  >
                    {cell.day}
                  </Typography>

                  {/* Event indicators */}
                  <Box sx={{ mt: 0.25 }}>
                    {dayEvents.slice(0, maxVisible).map((event) => {
                      const pillColor = getEventPillColor(event);
                      const isPrivateOther = isGroupMode && event.is_private && event.user_id !== currentUserId;

                      return (
                        <Box
                          key={event.id}
                          role="button"
                          tabIndex={0}
                          aria-label={getDisplayTitle(event)}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(event);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              e.stopPropagation();
                              handleEventClick(event);
                            }
                          }}
                          sx={{
                            ...(event.is_all_day
                              ? { bgcolor: pillColor, color: getContrastTextColor(pillColor) }
                              : {
                                  bgcolor: `${pillColor}22`,
                                  color: 'text.primary',
                                  borderLeft: `3px solid ${pillColor}`,
                                }),
                            borderRadius: 0.5,
                            px: 0.5,
                            py: 0.25,
                            mb: 0.25,
                            fontSize: isMobile ? '0.55rem' : '0.65rem',
                            lineHeight: 1.3,
                            minHeight: isMobile ? 20 : 18,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.25,
                            opacity: isPrivateOther ? 0.7 : 1,
                            '&:hover': { opacity: 0.85 },
                            '&:focus-visible': { outline: '2px solid #fff', outlineOffset: -1 },
                          }}
                        >
                          {isPrivateOther && <LockIcon sx={{ fontSize: 9 }} />}
                          {googleEventIdSet.has(event.id) && (
                            <Box
                              component="span"
                              sx={{
                                fontSize: '0.5rem',
                                fontWeight: 700,
                                bgcolor: 'rgba(255,255,255,0.3)',
                                borderRadius: 0.5,
                                px: 0.3,
                                lineHeight: 1,
                              }}
                            >
                              G
                            </Box>
                          )}
                          {getDisplayTitle(event)}
                        </Box>
                      );
                    })}
                    {dayEvents.length > maxVisible && (
                      <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                        +{dayEvents.length - maxVisible}
                      </Typography>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}

        {/* Hint (only in personal mode) */}
        {!isGroupMode && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
            {t('clickToCreate')}
          </Typography>
        )}
      </Box>

      {/* Create dialog (personal mode only) */}
      {createOpen && !isGroupMode && (
        <EventDialog
          open
          onClose={() => {
            setCreateOpen(false);
            setCreateDate(null);
          }}
          event={null}
          eventTypes={eventTypes}
          onEventCreated={handleEventCreated}
          onEventUpdated={handleEventUpdated}
          defaultDate={createDate ?? undefined}
        />
      )}

      {/* Edit dialog (personal mode) */}
      {editEvent && !isGroupMode && (
        <EventDialog
          key={editEvent.id}
          open
          onClose={() => setEditEvent(null)}
          event={editEvent}
          eventTypes={eventTypes}
          onEventCreated={handleEventCreated}
          onEventUpdated={handleEventUpdated}
          onEventDeleted={(eventId) => {
            handleEventDeleted(eventId);
            setEditEvent(null);
          }}
        />
      )}

      {/* Detail dialog (group mode) */}
      {detailEvent && isGroupMode && currentUserId && (
        <EventDetailDialog
          open
          onClose={() => setDetailEvent(null)}
          event={detailEvent}
          currentUserId={currentUserId}
          members={groupMembers}
          eventTypes={eventTypes}
          onEventUpdated={handleEventUpdated}
          onEventDeleted={handleEventDeleted}
          isGoogleImported={googleEventIdSet.has(detailEvent.id)}
        />
      )}
    </>
  );
}
