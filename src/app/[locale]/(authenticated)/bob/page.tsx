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
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) {
    return redirect({ href: '/login', locale });
  }

  return <BobContent locale={locale} />;
}
