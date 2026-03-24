import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';

export default function AuthenticatedRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
