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
    <AppBar
      position="sticky"
      sx={{
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar>
        <Typography
          variant="h6"
          component="div"
          sx={{
            flexGrow: 1,
            fontWeight: 800,
            cursor: 'pointer',
            color: 'primary.main',
            letterSpacing: '-0.02em',
          }}
          onClick={() => router.push('/dashboard')}
        >
          Together
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <IconButton
            onClick={toggleEvaMode}
            aria-label="Mode Eva"
            size="small"
            sx={{
              color: evaMode ? 'primary.main' : 'text.secondary',
              transition: 'color 0.2s ease, transform 0.2s ease',
              '&:hover': { transform: 'scale(1.1)' },
            }}
          >
            {evaMode ? <FavoriteIcon /> : <FavoriteBorderIcon />}
          </IconButton>
          <IconButton
            onClick={toggleLocale}
            aria-label={t('toggleLanguage')}
            sx={{
              fontSize: '0.8rem',
              fontWeight: 700,
              borderRadius: 2,
              px: 1.5,
              color: 'text.secondary',
              '&:hover': { color: 'primary.main' },
              transition: 'color 0.2s ease',
            }}
          >
            {locale === 'fr' ? 'EN' : 'FR'}
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
