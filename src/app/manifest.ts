import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Together - Calendrier Famille',
    short_name: 'Together',
    description: 'Synchronisez vos calendriers en famille, simplement.',
    start_url: '/fr/dashboard',
    display: 'standalone',
    background_color: '#FAFAFA',
    theme_color: '#1976D2',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
