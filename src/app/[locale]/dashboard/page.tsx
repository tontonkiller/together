import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardContent from './DashboardContent';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const { data: groups } = await supabase
    .from('group_members')
    .select('group_id, role, groups(id, name, description)')
    .eq('user_id', user.id);

  return (
    <DashboardContent
      profile={profile}
      groups={groups ?? []}
    />
  );
}
