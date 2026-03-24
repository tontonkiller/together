'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import Collapse from '@mui/material/Collapse';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

interface CalendarItem {
  id: string;
  name: string;
  color: string | null;
  primary: boolean;
  is_enabled: boolean;
}

interface GoogleCalendarSelectProps {
  accountId: string;
  accountEmail: string;
}

export default function GoogleCalendarSelect({ accountId, accountEmail }: GoogleCalendarSelectProps) {
  const t = useTranslations('googleSync');
  const tCommon = useTranslations('common');
  const [calendars, setCalendars] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [autoExpanded, setAutoExpanded] = useState(false);

  const fetchCalendars = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/google/calendars?accountId=${accountId}`);
      if (res.ok) {
        const data = await res.json();
        setCalendars(data.calendars);
        setLoaded(true);
        // Auto-expand on first connection (no calendars enabled yet)
        const hasAnyEnabled = data.calendars.some((c: CalendarItem) => c.is_enabled);
        if (!hasAnyEnabled && !autoExpanded) {
          setExpanded(true);
          setAutoExpanded(true);
        }
      }
    } catch {
      // Silently fail — user can retry
    }
    setLoading(false);
  }, [accountId, autoExpanded]);

  // Fetch calendars on mount to check if we need to auto-expand
  useEffect(() => {
    if (!loaded) {
      fetchCalendars();
    }
  }, [loaded, fetchCalendars]);

  const handleToggle = (calendarId: string) => {
    setCalendars((prev) =>
      prev.map((c) => (c.id === calendarId ? { ...c, is_enabled: !c.is_enabled } : c)),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/google/calendars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, calendars }),
      });
    } catch {
      // Silently fail
    }
    setSaving(false);
  };

  return (
    <Box sx={{ mb: 1 }}>
      <Button
        size="small"
        onClick={() => setExpanded(!expanded)}
        endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        sx={{ textTransform: 'none', color: 'text.secondary', pl: 0 }}
      >
        {t('selectCalendars')} ({accountEmail})
      </Button>

      <Collapse in={expanded}>
        <Box sx={{ pl: 1, pt: 1 }}>
          {loading && <CircularProgress size={20} />}

          {!loading && calendars.length === 0 && loaded && (
            <Typography variant="body2" color="text.secondary">
              {t('noCalendars')}
            </Typography>
          )}

          {calendars.map((cal) => (
            <FormControlLabel
              key={cal.id}
              control={
                <Switch
                  checked={cal.is_enabled}
                  onChange={() => handleToggle(cal.id)}
                  size="small"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {cal.color && (
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: cal.color,
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <Typography variant="body2">{cal.name}</Typography>
                </Box>
              }
              sx={{ display: 'flex', mb: 0.5 }}
            />
          ))}

          {calendars.length > 0 && (
            <Button
              size="small"
              variant="outlined"
              onClick={handleSave}
              disabled={saving}
              sx={{ mt: 1 }}
            >
              {saving ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
              {tCommon('save')}
            </Button>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}
