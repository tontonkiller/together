import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/lib/i18n/request.ts');

const nextConfig: NextConfig = {
  experimental: {
    // Tree-shake MUI barrel imports so each page ships only what it uses.
    optimizePackageImports: [
      '@mui/material',
      '@mui/icons-material',
      '@mui/material-nextjs',
      '@emotion/react',
      '@emotion/styled',
      'next-intl',
    ],
  },
};

export default withNextIntl(nextConfig);
