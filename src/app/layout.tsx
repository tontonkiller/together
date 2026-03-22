import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Together',
  description: 'Sync your family calendars, simply.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
