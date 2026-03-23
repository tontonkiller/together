import { redirect } from '@/lib/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import GoogleSyncContent from './GoogleSyncContent';

export default async function GoogleSyncPage({
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

  // Check if user has any Google accounts connected
  const { data: accounts } = await supabase
    .from('google_accounts')
    .select('id')
    .eq('user_id', user.id);

  const hasAccounts = (accounts?.length ?? 0) > 0;

  return <GoogleSyncContent hasAccounts={hasAccounts} />;
}
