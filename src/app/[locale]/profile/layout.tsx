import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
