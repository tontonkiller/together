import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Together - Calendrier Famille',
  description: 'Synchronisez vos calendriers en famille, simplement.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
