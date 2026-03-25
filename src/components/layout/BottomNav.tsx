'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/lib/i18n/navigation';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Paper from '@mui/material/Paper';
import GroupsIcon from '@mui/icons-material/Groups';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SyncIcon from '@mui/icons-material/Sync';
import MicIcon from '@mui/icons-material/Mic';
import PersonIcon from '@mui/icons-material/Person';

export default function BottomNav() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const router = useRouter();

  const value = useMemo(() => {
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/groups')) return 0;
    if (pathname.startsWith('/calendar')) return 1;
    if (pathname.startsWith('/google-sync')) return 2;
    if (pathname.startsWith('/bob')) return 3;
    if (pathname.startsWith('/profile')) return 4;
    return 0;
  }, [pathname]);

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    switch (newValue) {
      case 0:
        router.push('/dashboard');
        break;
      case 1:
        router.push('/calendar');
        break;
      case 2:
        router.push('/google-sync');
        break;
      case 3:
        router.push('/bob');
        break;
      case 4:
        router.push('/profile');
        break;
    }
  };

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
      }}
      elevation={0}
    >
      <BottomNavigation value={value} onChange={handleChange} showLabels sx={{ bgcolor: 'transparent' }}>
        <BottomNavigationAction
          label={t('groups')}
          icon={<GroupsIcon />}
        />
        <BottomNavigationAction
          label={t('calendar')}
          icon={<CalendarMonthIcon />}
        />
        <BottomNavigationAction
          label={t('googleSync')}
          icon={<SyncIcon />}
        />
        <BottomNavigationAction
          label={t('bob')}
          icon={<MicIcon />}
        />
        <BottomNavigationAction
          label={t('profile')}
          icon={<PersonIcon />}
        />
      </BottomNavigation>
    </Paper>
  );
}
