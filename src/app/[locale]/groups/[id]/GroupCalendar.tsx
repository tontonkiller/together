'use client';

import { useState, useMemo, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LockIcon from '@mui/icons-material/Lock';
import type { CalendarEvent } from '@/lib/types/events';
import type { GroupMember } from './GroupDetailContent';

interface GroupCalendarProps {
  events: CalendarEvent[];
  members: GroupMember[];
  currentUserId: string;
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

export default function GroupCalendar({ events, members, currentUserId }: GroupCalendarProps) {
  const t = useTranslations('groupCalendar');
  const tEvents = useTranslations('events');
  const locale = useLocale();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const monthNames = locale === 'fr' ? MONTH_NAMES_FR : MONTH_NAMES_EN;
  const dayNames = locale === 'fr' ? DAY_NAMES_FR : DAY_NAMES_EN;

  // Build member color map: user_id → color
  const memberColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const m of members) {
      map[m.user_id] = m.color;
    }
    return map;
  }, [members]);

  // Build member name map: user_id → display_name
  const memberNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const m of members) {
      map[m.user_id] = m.profiles?.display_name ?? '?';
    }
    return map;
  }, [members]);

  const goToPrev = useCallback(() => {
    setMonth((m) => {
      if (m === 0) { setYear((y) => y - 1); return 11; }
      return m - 1;
    });
  }, []);

  const goToNext = useCallback(() => {
    setMonth((m) => {
      if (m === 11) { setYear((y) => y + 1); return 0; }
      return m + 1;
    });
  }, []);

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
      const dayEvents = events.filter((e) => isEventOnDay(e, cell.dateStr));
      if (dayEvents.length > 0) {
        map[cell.dateStr] = dayEvents;
      }
    }
    return map;
  }, [calendarDays, events]);

  const todayStr = getTodayStr();

  // Determine display title: private events from others show as "Busy"
  function getDisplayTitle(event: CalendarEvent): string {
    if (event.is_private && event.user_id !== currentUserId) {
      return tEvents('busy');
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

      {/* Day names */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 0.5 }} role="row">
        {dayNames.map((name) => (
          <Typography
            key={name}
            variant="caption"
            align="center"
            role="columnheader"
            sx={{ fontWeight: 600, color: 'text.secondary', py: 0.25 }}
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
            return <Box key={`empty-${idx}`} sx={{ bgcolor: 'background.default', minHeight: 56 }} />;
          }

          const dayEvents = eventsByDate[cell.dateStr] ?? [];
          const isToday = cell.dateStr === todayStr;

          return (
            <Box
              key={cell.dateStr}
              role="gridcell"
              sx={{
                bgcolor: 'background.paper',
                minHeight: 56,
                p: 0.5,
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
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  bgcolor: isToday ? 'primary.main' : 'transparent',
                  color: isToday ? 'primary.contrastText' : 'text.primary',
                  fontSize: '0.7rem',
                }}
              >
                {cell.day}
              </Typography>

              <Box sx={{ mt: 0.25 }}>
                {dayEvents.slice(0, 3).map((event) => {
                  const memberColor = memberColorMap[event.user_id] ?? '#999';
                  const isPrivateOther = event.is_private && event.user_id !== currentUserId;

                  return (
                    <Box
                      key={event.id}
                      sx={{
                        bgcolor: memberColor,
                        color: '#fff',
                        borderRadius: 0.5,
                        px: 0.5,
                        py: 0.25,
                        mb: 0.25,
                        fontSize: '0.6rem',
                        lineHeight: 1.2,
                        minHeight: 16,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.25,
                        opacity: isPrivateOther ? 0.7 : 1,
                      }}
                    >
                      {isPrivateOther && <LockIcon sx={{ fontSize: 9 }} />}
                      {getDisplayTitle(event)}
                    </Box>
                  );
                })}
                {dayEvents.length > 3 && (
                  <Typography variant="caption" sx={{ fontSize: '0.55rem', color: 'text.secondary' }}>
                    +{dayEvents.length - 3}
                  </Typography>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Member color legend */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 1.5 }}>
        {members.map((member) => (
          <Box key={member.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: member.color,
                flexShrink: 0,
              }}
            />
            <Typography variant="caption" color="text.secondary">
              {member.profiles?.display_name ?? '?'}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
