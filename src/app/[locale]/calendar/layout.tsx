import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';

export default function CalendarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
