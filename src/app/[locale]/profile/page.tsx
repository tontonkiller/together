import { redirect } from '@/lib/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import ProfileContent from './ProfileContent';

export const dynamic = 'force-dynamic';

export default async function ProfilePage({
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

  const [profileResult, googleAccountsResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('google_accounts').select('id, google_email, created_at').eq('user_id', user.id).order('created_at'),
  ]);

  if (profileResult.error) {
    console.error('[profile] Profile fetch failed:', profileResult.error.message);
  }

  return (
    <ProfileContent
      profile={profileResult.data}
      email={user.email ?? ''}
      googleAccounts={googleAccountsResult.data ?? []}
    />
  );
}
