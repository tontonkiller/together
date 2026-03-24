'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import SyncIcon from '@mui/icons-material/Sync';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import RepeatIcon from '@mui/icons-material/Repeat';
import { useRouter } from '@/lib/i18n/navigation';

interface SyncedEvent {
  id: string;
  google_event_id: string;
  event_id: string | null;
  status: 'pending' | 'accepted' | 'refused';
  visibility: 'details' | 'busy';
  title: string | null;
  description: string | null;
  location: string | null;
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  is_all_day: boolean;
  is_recurring: boolean;
  google_calendars: {
    name: string;
    color: string | null;
  };
}

type FilterStatus = 'all' | 'pending' | 'accepted' | 'refused';

interface GoogleSyncContentProps {
  hasAccounts: boolean;
}

export default function GoogleSyncContent({ hasAccounts }: GoogleSyncContentProps) {
  const t = useTranslations('googleSync');
  const tCommon = useTranslations('common');
  const router = useRouter();

  const [events, setEvents] = useState<SyncedEvent[]>([]);
  const [loading, setLoading] = useState(() => hasAccounts);
  const [syncing, setSyncing] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<FilterStatus>('pending');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/google/sync/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events);
      }
    } catch {
      // Silently fail
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!hasAccounts) return;
    let cancelled = false;
    fetch('/api/google/sync/events')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setEvents(data.events);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [hasAccounts]);

  const handleSync = async () => {
    setSyncing(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/google/sync', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setSuccessMsg(
          t('syncResult', { newPending: data.newPending, updated: data.updated, deleted: data.deleted }),
        );
        // Refresh events list
        await fetchEvents();
      } else {
        setError(tCommon('error'));
      }
    } catch {
      setError(tCommon('error'));
    }

    setSyncing(false);
  };

  const handleToggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const filtered = filteredEvents;
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((e) => e.id)));
    }
  };

  const handleAction = async (action: 'accept' | 'refuse', visibility?: 'details' | 'busy') => {
    if (selected.size === 0) return;

    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/google/sync/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          ids: Array.from(selected),
          visibility,
        }),
      });

      if (res.ok) {
        setSelected(new Set());
        await fetchEvents();
      } else {
        setError(tCommon('error'));
      }
    } catch {
      setError(tCommon('error'));
    }
  };

  const filteredEvents = events.filter((e) => filter === 'all' || e.status === filter);

  const pendingCount = events.filter((e) => e.status === 'pending').length;
  const acceptedCount = events.filter((e) => e.status === 'accepted').length;
  const refusedCount = events.filter((e) => e.status === 'refused').length;

  const formatDate = (e: SyncedEvent) => {
    const start = e.start_date;
    const end = e.end_date;
    const time = e.start_time && e.end_time
      ? ` ${e.start_time.slice(0, 5)}–${e.end_time.slice(0, 5)}`
      : '';
    return start === end ? `${start}${time}` : `${start} → ${end}${time}`;
  };

  if (!hasAccounts) {
    return (
      <>
        <Box sx={{ py: 3 }}>
          <Typography variant="h2" sx={{ mb: 2 }}>
            {t('sectionTitle')}
          </Typography>
          <Alert severity="info">
            {t('noAccounts')}
          </Alert>
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => router.push('/profile')}
          >
            {t('connect')}
          </Button>
        </Box>
      </>
    );
  }

  return (
    <>
      <Box sx={{ py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h2">
            {t('sectionTitle')}
          </Typography>
          <Button
            variant="contained"
            startIcon={syncing ? <CircularProgress size={16} color="inherit" /> : <SyncIcon />}
            onClick={handleSync}
            disabled={syncing}
          >
            {syncing ? t('syncing') : t('sync')}
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {successMsg && <Alert severity="success" sx={{ mb: 2 }}>{successMsg}</Alert>}

        {/* Filter chips */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Chip
            label={`${t('allEvents')} (${events.length})`}
            onClick={() => setFilter('all')}
            color={filter === 'all' ? 'primary' : 'default'}
            variant={filter === 'all' ? 'filled' : 'outlined'}
          />
          <Chip
            label={`${t('pending')} (${pendingCount})`}
            onClick={() => setFilter('pending')}
            color={filter === 'pending' ? 'warning' : 'default'}
            variant={filter === 'pending' ? 'filled' : 'outlined'}
          />
          <Chip
            label={`${t('accepted')} (${acceptedCount})`}
            onClick={() => setFilter('accepted')}
            color={filter === 'accepted' ? 'success' : 'default'}
            variant={filter === 'accepted' ? 'filled' : 'outlined'}
          />
          <Chip
            label={`${t('refused')} (${refusedCount})`}
            onClick={() => setFilter('refused')}
            color={filter === 'refused' ? 'error' : 'default'}
            variant={filter === 'refused' ? 'filled' : 'outlined'}
          />
        </Box>

        {/* Action bar for pending events */}
        {filter === 'pending' && pendingCount > 0 && (
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button size="small" onClick={handleSelectAll} variant="text">
              {selected.size === filteredEvents.length ? t('deselectAll') : t('selectAll')}
            </Button>
            <Button
              size="small"
              variant="contained"
              color="success"
              disabled={selected.size === 0}
              onClick={() => handleAction('accept', 'details')}
            >
              {t('acceptDetails')}
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="success"
              disabled={selected.size === 0}
              onClick={() => handleAction('accept', 'busy')}
            >
              {t('acceptBusy')}
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              disabled={selected.size === 0}
              onClick={() => handleAction('refuse')}
            >
              {t('refuse')}
            </Button>
          </Box>
        )}

        {/* Events list */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredEvents.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            {t('noEvents')}
          </Typography>
        ) : (
          <List disablePadding>
            {filteredEvents.map((event) => (
              <ListItem
                key={event.id}
                disablePadding
                secondaryAction={
                  <Chip
                    size="small"
                    label={
                      event.status === 'pending' ? t('pending') :
                      event.status === 'accepted' ? t('accepted') :
                      t('refused')
                    }
                    color={
                      event.status === 'pending' ? 'warning' :
                      event.status === 'accepted' ? 'success' :
                      'error'
                    }
                    variant="outlined"
                  />
                }
              >
                <ListItemButton
                  onClick={() => event.status === 'pending' && handleToggle(event.id)}
                  dense
                  disabled={event.status !== 'pending'}
                >
                  {event.status === 'pending' && (
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Checkbox
                        edge="start"
                        checked={selected.has(event.id)}
                        tabIndex={-1}
                        disableRipple
                        size="small"
                      />
                    </ListItemIcon>
                  )}
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {event.google_calendars?.color && (
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: event.google_calendars.color,
                              flexShrink: 0,
                            }}
                          />
                        )}
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {event.title ?? '(No title)'}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box component="span" sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="caption" component="span">
                          {formatDate(event)}
                        </Typography>
                        {event.location && (
                          <Typography variant="caption" component="span" color="text.secondary">
                            <LocationOnIcon sx={{ fontSize: 14, verticalAlign: 'middle' }} /> {event.location}
                          </Typography>
                        )}
                        {event.is_recurring && (
                          <Typography variant="caption" component="span" color="text.secondary">
                            <RepeatIcon sx={{ fontSize: 14, verticalAlign: 'middle' }} />
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </>
  );
}
