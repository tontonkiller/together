import { redirect } from '@/lib/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import Typography from '@mui/material/Typography';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import { getTranslations } from 'next-intl/server';

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect({ href: '/login', locale });
  }

  const { data: group } = await supabase
    .from('groups')
    .select('*')
    .eq('id', id)
    .single();

  const t = await getTranslations('groups');

  if (!group) {
    return redirect({ href: '/dashboard', locale });
  }

  return (
    <AuthenticatedLayout>
      <Typography variant="h2" sx={{ mb: 3 }}>
        {group.name}
      </Typography>
      {group.description && (
        <Typography variant="body1" color="text.secondary">
          {group.description}
        </Typography>
      )}
      <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
        {t('comingSoon')}
      </Typography>
    </AuthenticatedLayout>
  );
}
