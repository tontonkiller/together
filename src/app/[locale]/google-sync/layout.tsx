import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';

export default function GoogleSyncLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
