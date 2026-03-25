import { redirect } from '@/lib/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import BobContent from './BobContent';

export default async function BobPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect({ href: '/login', locale });
  }

  return <BobContent locale={locale} />;
}
