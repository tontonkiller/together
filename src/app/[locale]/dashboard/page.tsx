import { redirect } from '@/lib/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardContent, { type DashboardContentProps } from './DashboardContent';

export default async function DashboardPage({
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
    console.error('[dashboard] Profile fetch failed:', profileError.message);
  }

  const { data: groups, error: groupsError } = await supabase
    .from('group_members')
    .select('group_id, role, groups(id, name, description)')
    .eq('user_id', user.id);
  if (groupsError) {
    console.error('[dashboard] Groups fetch failed:', groupsError.message);
  }

  // Supabase JS types joins as arrays, but many-to-one returns an object at runtime.
  // Map to normalize the shape.
  const normalizedGroups = (groups ?? []).map((gm) => ({
    group_id: gm.group_id,
    role: gm.role,
    groups: Array.isArray(gm.groups) ? gm.groups[0] ?? null : gm.groups,
  }));

  return (
    <DashboardContent
      profile={profile}
      groups={normalizedGroups}
    />
  );
}
