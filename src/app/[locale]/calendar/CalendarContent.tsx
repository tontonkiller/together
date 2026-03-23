'use client';

import { useState, useMemo, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import EventDialog from '@/app/[locale]/groups/[id]/EventDialog';
import type { CalendarEvent, EventType } from '@/lib/types/events';

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

interface CalendarContentProps {
  events: CalendarEvent[];
  eventTypes: EventType[];
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

export default function CalendarContent({ events, eventTypes }: CalendarContentProps) {
  const tEvents = useTranslations('events');
  const t = useTranslations('calendar');
  const locale = useLocale();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [allEvents, setAllEvents] = useState<CalendarEvent[]>(events);

  // Dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [createDate, setCreateDate] = useState<string | null>(null);
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);

  const monthNames = locale === 'fr' ? MONTH_NAMES_FR : MONTH_NAMES_EN;
  const dayNames = locale === 'fr' ? DAY_NAMES_FR : DAY_NAMES_EN;

  const goToPrev = useCallback(() => {
    setMonth((m) => {
      if (m === 0) {
        setYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }, []);

  const goToNext = useCallback(() => {
    setMonth((m) => {
      if (m === 11) {
        setYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }, []);

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
      const dayEvents = allEvents.filter((e) => isEventOnDay(e, cell.dateStr));
      if (dayEvents.length > 0) {
        map[cell.dateStr] = dayEvents;
      }
    }
    return map;
  }, [calendarDays, allEvents]);

  const todayStr = getTodayStr();

  const handleDayClick = (dateStr: string) => {
    // Always open create dialog when clicking the day cell
    // Individual events can be clicked directly via their pill
    setCreateDate(dateStr);
    setCreateOpen(true);
  };

  const handleEventCreated = (event: CalendarEvent) => {
    setAllEvents((prev) => [...prev, event].sort((a, b) => a.start_date.localeCompare(b.start_date)));
  };

  const handleEventUpdated = (event: CalendarEvent) => {
    setAllEvents((prev) => prev.map((e) => (e.id === event.id ? event : e)));
  };

  return (
    <AuthenticatedLayout>
      <Box sx={{ maxWidth: 600, mx: 'auto' }}>
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
              sx={{ fontWeight: 600, color: 'text.secondary', py: 0.5 }}
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
              return <Box key={`empty-${idx}`} sx={{ bgcolor: 'background.default', minHeight: 64 }} />;
            }

            const dayEvents = eventsByDate[cell.dateStr] ?? [];
            const isToday = cell.dateStr === todayStr;

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
                  minHeight: 64,
                  p: 0.5,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' },
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
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    bgcolor: isToday ? 'primary.main' : 'transparent',
                    color: isToday ? 'primary.contrastText' : 'text.primary',
                  }}
                >
                  {cell.day}
                </Typography>

                {/* Event indicators */}
                <Box sx={{ mt: 0.25 }}>
                  {dayEvents.slice(0, 3).map((event) => (
                    <Box
                      key={event.id}
                      role="button"
                      tabIndex={0}
                      aria-label={event.title}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditEvent(event);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          setEditEvent(event);
                        }
                      }}
                      sx={{
                        bgcolor: getEventColor(event),
                        color: '#fff',
                        borderRadius: 0.5,
                        px: 0.5,
                        py: 0.25,
                        mb: 0.25,
                        fontSize: '0.65rem',
                        lineHeight: 1.3,
                        minHeight: 18,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        '&:hover': { opacity: 0.85 },
                        '&:focus-visible': { outline: '2px solid #fff', outlineOffset: -1 },
                      }}
                    >
                      {event.title}
                    </Box>
                  ))}
                  {dayEvents.length > 3 && (
                    <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                      +{dayEvents.length - 3}
                    </Typography>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* Hint */}
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
          {t('clickToCreate')}
        </Typography>
      </Box>

      {/* Create dialog */}
      {createOpen && (
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

      {/* Edit dialog */}
      {editEvent && (
        <EventDialog
          key={editEvent.id}
          open
          onClose={() => setEditEvent(null)}
          event={editEvent}
          eventTypes={eventTypes}
          onEventCreated={handleEventCreated}
          onEventUpdated={handleEventUpdated}
        />
      )}
    </AuthenticatedLayout>
  );
}
