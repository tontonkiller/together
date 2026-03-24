import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';

export default function GroupsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
