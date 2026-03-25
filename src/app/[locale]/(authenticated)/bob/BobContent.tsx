'use client';

import { useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import MicIcon from '@mui/icons-material/Mic';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LockIcon from '@mui/icons-material/Lock';
import { keyframes } from '@mui/material/styles';

interface ParsedEvent {
  title: string;
  description: string | null;
  location: string | null;
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  is_all_day: boolean;
  is_private: boolean;
}

type BobState = 'idle' | 'listening' | 'processing' | 'confirm' | 'success' | 'error';

const pulse = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(8,145,178,0.4); }
  50% { transform: scale(1.05); box-shadow: 0 0 0 20px rgba(8,145,178,0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(8,145,178,0); }
`;

interface BobContentProps {
  locale: string;
}

export default function BobContent({ locale }: BobContentProps) {
  const t = useTranslations('bob');
  const tCommon = useTranslations('common');
  const [state, setState] = useState<BobState>('idle');
  const [parsedEvent, setParsedEvent] = useState<ParsedEvent | null>(null);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(() => {
    setError('');
    setParsedEvent(null);
    setTranscript('');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError(t('micPermission'));
      setState('error');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = locale === 'fr' ? 'fr-FR' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onresult = async (event: { results: { transcript: string }[][] }) => {
      const result = event.results[0][0].transcript;
      setTranscript(result);
      setState('processing');

      try {
        const res = await fetch('/api/bob/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: result, locale }),
        });

        if (!res.ok) {
          setError(t('error'));
          setState('error');
          return;
        }

        const data = await res.json();
        setParsedEvent(data.event);
        setState('confirm');
      } catch {
        setError(t('apiError'));
        setState('error');
      }
    };

    recognition.onerror = (event: { error: string }) => {
      if (event.error === 'not-allowed') {
        setError(t('micPermission'));
      } else if (event.error === 'no-speech') {
        setError(t('noSpeech'));
      } else {
        setError(t('error'));
      }
      setState('error');
    };

    recognition.onend = () => {
      // If still in listening state (no result), show no-speech error
      setState((prev) => {
        if (prev === 'listening') {
          setError(t('noSpeech'));
          return 'error';
        }
        return prev;
      });
    };

    recognition.start();
    setState('listening');
  }, [locale, t]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const handleConfirm = async () => {
    if (!parsedEvent) return;
    setState('processing');

    try {
      const res = await fetch('/api/bob/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: parsedEvent }),
      });

      if (!res.ok) {
        setError(t('apiError'));
        setState('error');
        return;
      }

      setState('success');
      // Reset after 2 seconds
      setTimeout(() => {
        setState('idle');
        setParsedEvent(null);
        setTranscript('');
      }, 2000);
    } catch {
      setError(t('apiError'));
      setState('error');
    }
  };

  const handleCancel = () => {
    setState('idle');
    setParsedEvent(null);
    setTranscript('');
    setError('');
  };

  const formatDate = (event: ParsedEvent) => {
    const start = event.start_date;
    const end = event.end_date;
    if (event.is_all_day) {
      return start === end ? start : `${start} → ${end}`;
    }
    const time = event.start_time && event.end_time
      ? ` ${event.start_time}–${event.end_time}`
      : event.start_time ? ` ${event.start_time}` : '';
    return start === end ? `${start}${time}` : `${start} → ${end}${time}`;
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 200px)',
        gap: 3,
        px: 2,
      }}
    >
      {/* Title */}
      <Typography variant="h2" sx={{ fontWeight: 700 }}>
        Bob
      </Typography>
      {(state === 'idle' || state === 'error') && (
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 300 }}>
          {t('subtitle')}
        </Typography>
      )}

      {/* Mic button */}
      {(state === 'idle' || state === 'error') && (
        <>
          <IconButton
            onClick={startListening}
            aria-label={t('tapToSpeak')}
            sx={{
              width: 96,
              height: 96,
              bgcolor: 'primary.main',
              color: '#fff',
              '&:hover': { bgcolor: 'primary.dark' },
              transition: 'all 0.2s ease',
            }}
          >
            <MicIcon sx={{ fontSize: 48 }} />
          </IconButton>
          <Typography variant="body2" color="text.secondary">
            {t('tapToSpeak')}
          </Typography>
          {error && (
            <Alert severity="warning" sx={{ maxWidth: 360 }}>
              {error}
            </Alert>
          )}
        </>
      )}

      {/* Listening state */}
      {state === 'listening' && (
        <>
          <IconButton
            onClick={stopListening}
            aria-label={t('listening')}
            sx={{
              width: 96,
              height: 96,
              bgcolor: 'error.main',
              color: '#fff',
              animation: `${pulse} 1.5s ease-in-out infinite`,
              '&:hover': { bgcolor: 'error.dark' },
            }}
          >
            <MicIcon sx={{ fontSize: 48 }} />
          </IconButton>
          <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
            {t('listening')}
          </Typography>
        </>
      )}

      {/* Processing state */}
      {state === 'processing' && (
        <>
          <CircularProgress size={64} />
          <Typography variant="body1" color="text.secondary">
            {t('processing')}
          </Typography>
          {transcript && (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', maxWidth: 360, textAlign: 'center' }}>
              &ldquo;{transcript}&rdquo;
            </Typography>
          )}
        </>
      )}

      {/* Confirmation state */}
      {state === 'confirm' && parsedEvent && (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            &ldquo;{transcript}&rdquo;
          </Typography>

          <Card variant="outlined" sx={{ width: '100%', maxWidth: 400 }}>
            <CardContent>
              <Typography variant="h3" sx={{ mb: 1 }}>
                {parsedEvent.title}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <CalendarMonthIcon fontSize="small" color="action" />
                <Typography variant="body2">
                  {formatDate(parsedEvent)}
                </Typography>
                {parsedEvent.is_all_day && (
                  <Typography variant="caption" color="text.secondary">
                    ({t('allDay')})
                  </Typography>
                )}
              </Box>

              {parsedEvent.location && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <LocationOnIcon fontSize="small" color="action" />
                  <Typography variant="body2">{parsedEvent.location}</Typography>
                </Box>
              )}

              {parsedEvent.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {parsedEvent.description}
                </Typography>
              )}

              {parsedEvent.is_private && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                  <LockIcon fontSize="small" color="action" />
                  <Typography variant="caption" color="text.secondary">
                    {t('private')}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          <Typography variant="body2" color="text.secondary">
            {t('confirm')}
          </Typography>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="outlined" onClick={handleCancel}>
              {t('cancel')}
            </Button>
            <Button variant="contained" onClick={handleConfirm}>
              {t('create')}
            </Button>
          </Box>
        </>
      )}

      {/* Success state */}
      {state === 'success' && (
        <>
          <CheckCircleOutlineIcon sx={{ fontSize: 64, color: 'success.main' }} />
          <Typography variant="h3" color="success.main">
            {t('confirmed')}
          </Typography>
        </>
      )}
    </Box>
  );
}

// TypeScript declarations for Web Speech API
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SpeechRecognition: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webkitSpeechRecognition: any;
  }
}
