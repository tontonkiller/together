import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Together',
    short_name: 'Together',
    description: 'Family calendar app',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#F0FAFB',
    theme_color: '#0891B2',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
