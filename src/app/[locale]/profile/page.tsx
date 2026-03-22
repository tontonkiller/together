import { redirect } from '@/lib/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import ProfileContent from './ProfileContent';

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

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  if (profileError) {
    console.error('[profile] Profile fetch failed:', profileError.message);
  }

  return <ProfileContent profile={profile} email={user.email ?? ''} />;
}
