'use client';

import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { useRouter, usePathname } from '@/lib/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useEvaMode } from './ThemeRegistry';

export default function TopBar() {
  const t = useTranslations('nav');
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const { evaMode, toggleEvaMode } = useEvaMode();

  const toggleLocale = () => {
    const newLocale = locale === 'fr' ? 'en' : 'fr';
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <AppBar position="sticky" color="primary" elevation={1}>
      <Toolbar>
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, fontWeight: 700, cursor: 'pointer' }}
          onClick={() => router.push('/dashboard')}
        >
          Together
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <IconButton
            color="inherit"
            onClick={toggleEvaMode}
            aria-label="Mode Eva"
            size="small"
          >
            {evaMode ? <FavoriteIcon /> : <FavoriteBorderIcon />}
          </IconButton>
          <IconButton
            color="inherit"
            onClick={toggleLocale}
            aria-label={t('toggleLanguage')}
            sx={{
              fontSize: '0.875rem',
              fontWeight: 600,
              borderRadius: 2,
              px: 1.5,
            }}
          >
            {locale === 'fr' ? 'EN' : 'FR'}
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
