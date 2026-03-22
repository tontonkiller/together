'use client';

import { useTranslations } from 'next-intl';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import AddIcon from '@mui/icons-material/Add';
import GroupsIcon from '@mui/icons-material/Groups';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import { useRouter } from '@/lib/i18n/navigation';

export interface DashboardContentProps {
  profile: { display_name: string } | null;
  groups: Array<{
    group_id: string;
    role: string;
    groups: { id: string; name: string; description: string | null }[] | null;
  }>;
}

export default function DashboardContent({ profile, groups }: DashboardContentProps) {
  const t = useTranslations('dashboard');
  const router = useRouter();

  return (
    <AuthenticatedLayout>
      <Typography variant="h2" sx={{ mb: 3 }}>
        {t('greeting', { name: profile?.display_name ?? 'User' })}
      </Typography>

      <Typography variant="h3" sx={{ mb: 2 }}>
        {t('myGroups')}
      </Typography>

      {groups.length === 0 ? (
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <GroupsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body1" color="text.secondary">
              {t('noGroups')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t('noGroupsHint')}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={1.5} sx={{ mb: 2 }}>
          {groups.map((gm) => (
            <Card key={gm.group_id} variant="outlined">
              <CardActionArea
                onClick={() => router.push(`/groups/${gm.group_id}`)}
              >
                <CardContent
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <GroupsIcon color="primary" />
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {gm.groups?.[0]?.name}
                      </Typography>
                      {gm.groups?.[0]?.description && (
                        <Typography variant="body2" color="text.secondary">
                          {gm.groups[0].description}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <ChevronRightIcon color="action" />
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Stack>
      )}

      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        fullWidth
        onClick={() => router.push('/groups/new')}
      >
        {t('createGroup')}
      </Button>
    </AuthenticatedLayout>
  );
}
