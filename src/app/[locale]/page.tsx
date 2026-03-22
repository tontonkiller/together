'use client';

import { useTranslations } from 'next-intl';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import GroupsIcon from '@mui/icons-material/Groups';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import { useRouter } from '@/lib/i18n/navigation';

export default function LandingPage() {
  const t = useTranslations('landing');
  const router = useRouter();

  const steps = [
    { icon: <GroupsIcon sx={{ fontSize: 40 }} />, title: t('step1Title'), desc: t('step1Desc') },
    { icon: <BeachAccessIcon sx={{ fontSize: 40 }} />, title: t('step2Title'), desc: t('step2Desc') },
    { icon: <EventAvailableIcon sx={{ fontSize: 40 }} />, title: t('step3Title'), desc: t('step3Desc') },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        py: 4,
      }}
    >
      <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
        <CalendarMonthIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />

        <Typography variant="h1" gutterBottom>
          {t('title')}
        </Typography>

        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
          {t('subtitle')}
        </Typography>

        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={() => router.push('/login')}
          sx={{ mb: 6, py: 1.5 }}
        >
          {t('cta')}
        </Button>

        <Stack spacing={2}>
          {steps.map((step, i) => (
            <Card key={i} variant="outlined">
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
                <Box sx={{ color: 'primary.main' }}>{step.icon}</Box>
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {step.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {step.desc}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Container>
    </Box>
  );
}
