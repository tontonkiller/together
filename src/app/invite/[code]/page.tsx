import { redirect } from 'next/navigation';
import { defaultLocale } from '@/lib/i18n/config';

export default async function InviteRedirect({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  redirect(`/${defaultLocale}/invite/${code}`);
}
