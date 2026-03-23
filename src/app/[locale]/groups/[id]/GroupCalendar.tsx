'use client';

import { useState, useMemo, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LockIcon from '@mui/icons-material/Lock';
import { getContrastTextColor } from '@/lib/utils/colors';
import type { CalendarEvent, EventType } from '@/lib/types/events';
import type { GroupMember } from './GroupDetailContent';
import EventDetailDialog from './EventDetailDialog';

interface GroupCalendarProps {
  events: CalendarEvent[];
  members: GroupMember[];
  currentUserId: string;
  eventTypes: EventType[];
  onEventUpdated: (event: CalendarEvent) => void;
  onEventDeleted: (eventId: string) => void;
  onDayClick?: (date: string) => void;
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

function getTodayStr(): string {
  const now = new Date();
  return formatDateStr(now.getFullYear(), now.getMonth(), now.getDate());
}

function isEventOnDay(event: CalendarEvent, dateStr: string): boolean {
  return event.start_date <= dateStr && event.end_date >= dateStr;
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

export default function GroupCalendar({ events, members, currentUserId, eventTypes, onEventUpdated, onEventDeleted, onDayClick, googleEventIds = [] }: GroupCalendarProps) {
  const t = useTranslations('groupCalendar');
  const tEvents = useTranslations('events');
  const locale = useLocale();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const googleEventIdSet = useMemo(() => new Set(googleEventIds), [googleEventIds]);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const monthNames = locale === 'fr' ? MONTH_NAMES_FR : MONTH_NAMES_EN;
  const dayNames = locale === 'fr' ? DAY_NAMES_FR : DAY_NAMES_EN;

  // Member filter state: set of visible user_ids (all visible by default)
  const [visibleMembers, setVisibleMembers] = useState<Set<string>>(() =>
    new Set(members.map((m) => m.user_id))
  );

  const allSelected = visibleMembers.size === members.length;

  const toggleMember = useCallback((userId: string) => {
    setVisibleMembers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (allSelected) {
      setVisibleMembers(new Set());
    } else {
      setVisibleMembers(new Set(members.map((m) => m.user_id)));
    }
  }, [allSelected, members]);

  // Build member color map: user_id → color
  const memberColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const m of members) {
      map[m.user_id] = m.color;
    }
    return map;
  }, [members]);


  // Filter events by visible members
  const filteredEvents = useMemo(
    () => events.filter((e) => visibleMembers.has(e.user_id)),
    [events, visibleMembers]
  );

  const goToPrev = useCallback(() => {
    setMonth((m) => {
      if (m === 0) { setYear((y) => y - 1); return 11; }
      return m - 1;
    });
  }, [setMonth, setYear]);

  const goToNext = useCallback(() => {
    setMonth((m) => {
      if (m === 11) { setYear((y) => y + 1); return 0; }
      return m + 1;
    });
  }, [setMonth, setYear]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOffset = getFirstDayOfWeek(year, month);

  const calendarDays = useMemo(() => {
    const days: Array<{ day: number; dateStr: string } | null> = [];
    for (let i = 0; i < firstDayOffset; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ day: d, dateStr: formatDateStr(year, month, d) });
    }
    return days;
  }, [year, month, daysInMonth, firstDayOffset]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const cell of calendarDays) {
      if (!cell) continue;
      const dayEvents = filteredEvents.filter((e) => isEventOnDay(e, cell.dateStr));
      if (dayEvents.length > 0) {
        map[cell.dateStr] = dayEvents;
      }
    }
    return map;
  }, [calendarDays, filteredEvents]);

  const todayStr = getTodayStr();

  // Determine display title: private events from others show as "Busy"
  // Timed events get a time prefix (e.g. "10:00 Meeting")
  function getDisplayTitle(event: CalendarEvent): string {
    if (event.is_private && event.user_id !== currentUserId) {
      return tEvents('busy');
    }
    if (!event.is_all_day && event.start_time) {
      const time = event.start_time.slice(0, 5); // "HH:MM"
      return `${time} ${event.title}`;
    }
    return event.title;
  }

  return (
    <Box>
      <Typography variant="h3" sx={{ mb: 1 }}>{t('title')}</Typography>

      {/* Month navigation */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <IconButton onClick={goToPrev} aria-label={t('previousMonth')} size="small">
          <ChevronLeftIcon />
        </IconButton>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {monthNames[month]} {year}
        </Typography>
        <IconButton onClick={goToNext} aria-label={t('nextMonth')} size="small">
          <ChevronRightIcon />
        </IconButton>
      </Box>

      {/* Member filter chips */}
      <Box
        sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1.5 }}
        role="group"
        aria-label={t('filterByMember')}
      >
        <Chip
          label={t('allMembers')}
          size="small"
          variant={allSelected ? 'filled' : 'outlined'}
          onClick={toggleAll}
          color={allSelected ? 'primary' : 'default'}
          sx={{ fontWeight: 600, fontSize: '0.75rem' }}
        />
        {members.map((member) => {
          const selected = visibleMembers.has(member.user_id);
          return (
            <Chip
              key={member.user_id}
              label={member.profiles?.display_name ?? '?'}
              size="small"
              variant={selected ? 'filled' : 'outlined'}
              onClick={() => toggleMember(member.user_id)}
              sx={{
                fontSize: '0.75rem',
                borderColor: member.color,
                ...(selected
                  ? {
                      bgcolor: member.color,
                      color: getContrastTextColor(member.color),
                      '&:hover': { bgcolor: member.color, opacity: 0.85 },
                    }
                  : {
                      color: member.color,
                    }),
              }}
            />
          );
        })}
      </Box>

      {/* Day names */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 0.5 }} role="row">
        {dayNames.map((name) => (
          <Typography
            key={name}
            variant="caption"
            align="center"
            role="columnheader"
            sx={{ fontWeight: 600, color: 'text.secondary', py: 0.25, fontSize: isMobile ? '0.6rem' : undefined }}
          >
            {name}
          </Typography>
        ))}
      </Box>

      {/* Calendar grid */}
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
            return <Box key={`empty-${idx}`} sx={{ bgcolor: 'background.default', minHeight: isMobile ? 32 : 56 }} />;
          }

          const dayEvents = eventsByDate[cell.dateStr] ?? [];
          const isToday = cell.dateStr === todayStr;
          const maxVisible = isMobile ? 2 : 3;

          return (
            <Box
              key={cell.dateStr}
              role="gridcell"
              aria-label={`${cell.day} ${monthNames[month]}${dayEvents.length > 0 ? ` — ${dayEvents.length} ${tEvents('title').toLowerCase()}` : ''}`}
              onClick={() => onDayClick?.(cell.dateStr)}
              sx={{
                bgcolor: 'background.paper',
                minHeight: isMobile ? 40 : 56,
                p: isMobile ? 0.25 : 0.5,
                position: 'relative',
                cursor: onDayClick ? 'pointer' : undefined,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: isToday ? 700 : 400,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: isMobile ? 18 : 22,
                  height: isMobile ? 18 : 22,
                  borderRadius: '50%',
                  bgcolor: isToday ? 'primary.main' : 'transparent',
                  color: isToday ? 'primary.contrastText' : 'text.primary',
                  fontSize: isMobile ? '0.6rem' : '0.7rem',
                }}
              >
                {cell.day}
              </Typography>

              <Box sx={{ mt: 0.25 }}>
                {dayEvents.slice(0, maxVisible).map((event) => {
                  const memberColor = memberColorMap[event.user_id] ?? '#999';
                  const isPrivateOther = event.is_private && event.user_id !== currentUserId;

                  return (
                    <Box
                      key={event.id}
                      role="button"
                      tabIndex={0}
                      aria-label={getDisplayTitle(event)}
                      onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedEvent(event);
                        }
                      }}
                      sx={{
                        ...(event.is_all_day
                          ? { bgcolor: memberColor, color: getContrastTextColor(memberColor) }
                          : {
                              bgcolor: `${memberColor}22`,
                              color: 'text.primary',
                              borderLeft: `3px solid ${memberColor}`,
                            }),
                        borderRadius: 0.5,
                        px: 0.5,
                        py: 0.25,
                        mb: 0.25,
                        fontSize: isMobile ? '0.5rem' : '0.6rem',
                        lineHeight: 1.2,
                        minHeight: isMobile ? 20 : 16,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.25,
                        opacity: isPrivateOther ? 0.7 : 1,
                        cursor: 'pointer',
                        '&:hover': { opacity: 0.85 },
                        '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: -1 },
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
                  <Typography variant="caption" sx={{ fontSize: '0.55rem', color: 'text.secondary' }}>
                    +{dayEvents.length - maxVisible}
                  </Typography>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Event detail dialog */}
      {selectedEvent && (
        <EventDetailDialog
          open
          onClose={() => setSelectedEvent(null)}
          event={selectedEvent}
          currentUserId={currentUserId}
          members={members}
          eventTypes={eventTypes}
          onEventUpdated={(updated) => {
            onEventUpdated(updated);
            setSelectedEvent(null);
          }}
          onEventDeleted={(id) => {
            onEventDeleted(id);
            setSelectedEvent(null);
          }}
          isGoogleImported={googleEventIdSet.has(selectedEvent.id)}
        />
      )}
    </Box>
  );
}
