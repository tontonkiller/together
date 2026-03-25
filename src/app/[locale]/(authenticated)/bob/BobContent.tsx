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
import StopIcon from '@mui/icons-material/Stop';
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
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
  50% { transform: scale(1.05); box-shadow: 0 0 0 20px rgba(239,68,68,0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239,68,68,0); }
`;

interface BobContentProps {
  locale: string;
}

export default function BobContent({ locale }: BobContentProps) {
  const t = useTranslations('bob');
  const [state, setState] = useState<BobState>('idle');
  const [parsedEvent, setParsedEvent] = useState<ParsedEvent | null>(null);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startListening = useCallback(async () => {
    setError('');
    setParsedEvent(null);
    setTranscript('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks to release mic
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size < 1000) {
          setError(t('noSpeech'));
          setState('error');
          return;
        }

        setState('processing');

        try {
          // Step 1: Transcribe audio via Whisper
          const formData = new FormData();
          formData.append('audio', audioBlob);
          formData.append('locale', locale);

          const transcribeRes = await fetch('/api/bob/transcribe', {
            method: 'POST',
            body: formData,
          });

          if (!transcribeRes.ok) {
            setError(t('apiError'));
            setState('error');
            return;
          }

          const { transcript: text } = await transcribeRes.json();
          if (!text || text.trim().length === 0) {
            setError(t('noSpeech'));
            setState('error');
            return;
          }

          setTranscript(text);

          // Step 2: Parse transcript via Claude
          const parseRes = await fetch('/api/bob/parse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcript: text, locale }),
          });

          if (!parseRes.ok) {
            setError(t('error'));
            setState('error');
            return;
          }

          const data = await parseRes.json();
          setParsedEvent(data.event);
          setState('confirm');
        } catch {
          setError(t('apiError'));
          setState('error');
        }
      };

      mediaRecorder.start();
      setState('listening');
    } catch {
      setError(t('micPermission'));
      setState('error');
    }
  }, [locale, t]);

  const stopListening = useCallback(() => {
    mediaRecorderRef.current?.stop();
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

      {/* Mic button — idle */}
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

      {/* Listening state — tap to stop */}
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
            <StopIcon sx={{ fontSize: 48 }} />
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
