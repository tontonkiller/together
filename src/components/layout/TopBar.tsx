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
import { keyframes } from '@mui/material/styles';

const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

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
          onClick={() => router.push('/dashboard')}
          sx={{
            flexGrow: 1,
            fontWeight: 800,
            cursor: 'pointer',
            fontSize: '1.35rem',
            letterSpacing: '-0.02em',
            background: evaMode
              ? 'linear-gradient(135deg, #E8578A, #A78BFA, #F472B6, #C084FC, #E8578A)'
              : 'linear-gradient(135deg, #0891B2, #10B981, #F59E0B, #0EA5E9, #0891B2)',
            backgroundSize: '300% 300%',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: `${gradientShift} 4s ease infinite`,
          }}
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
              '&:hover': { transform: 'scale(1.15)' },
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
