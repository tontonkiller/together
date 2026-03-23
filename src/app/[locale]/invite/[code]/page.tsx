'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import GroupsIcon from '@mui/icons-material/Groups';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from '@/lib/i18n/navigation';

export default function InvitePage() {
  const t = useTranslations('invite');
  const params = useParams<{ code: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [group, setGroup] = useState<{ id: string; name: string; description: string | null } | null>(null);
  const [alreadyMember, setAlreadyMember] = useState(false);
  const [needLogin, setNeedLogin] = useState(false);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    async function checkInvite() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setNeedLogin(true);
        setLoading(false);
        return;
      }

      // Find group by invite_code — we need a direct query
      // Since RLS on groups only allows members to see their groups,
      // we query invitations or use the invite_code approach.
      // The invite_code is on the groups table, but non-members can't see it.
      // So we use a workaround: look for the group via a public-like approach.
      // Actually, for invite links we need to handle this server-side or with an RPC.
      // For now, let's try a direct query — if RLS blocks it, we'll need a different approach.

      // Try to find group. If user is not a member, RLS will block this.
      // We need to use the invite code differently.
      // Option: query invitations table with the user's email to find a matching group.
      // But invite_code is simpler if we can access it.

      // Let's try an approach: fetch all groups where user is a member first,
      // then if not found, we accept the invite blindly (the group_members INSERT policy
      // already checks for pending invitations or creator status).

      // Alternative: We'll use supabase RPC or a different strategy.
      // For MVP: Let's attempt to look up via a workaround -
      // since we can't query groups we're not a member of,
      // we show the invite page with the code and let the user click join.
      // The join action will try to insert into group_members and rely on RLS.

      // Actually the simplest: use the invite_code in a client-side approach.
      // We need to know the group_id to join. Since we can't query groups table,
      // we need a function or to relax the RLS slightly for invite_code lookups.
      // For now, let's try the query and handle the null case gracefully.

      const { data: groupData } = await supabase
        .from('groups')
        .select('id, name, description')
        .eq('invite_code', params.code)
        .single();

      if (groupData) {
        // User can see the group = already a member
        setGroup(groupData);
        setAlreadyMember(true);
        setLoading(false);
        return;
      }

      // Can't see the group via RLS — this means user is NOT a member.
      // We'll show a generic join page and attempt the join.
      // We need group_id though. Let's use an edge function or RPC in production.
      // For MVP: we store the code and try to join via a different strategy.
      setGroup(null);
      setLoading(false);
    }

    checkInvite();
  }, [params.code]);

  const handleJoin = async () => {
    setJoining(true);
    setError('');

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setNeedLogin(true);
      setJoining(false);
      return;
    }

    // If we already know the group (user was already a member), redirect
    if (alreadyMember && group) {
      router.push(`/groups/${group.id}`);
      return;
    }

    // Try to find and join using RPC or direct approach
    // Since we can't query the group, we need a server-side approach.
    // Let's call a Supabase RPC function if available, or use a Next.js API route.
    // For MVP, we'll call the join-by-invite-code API route.
    const response = await fetch(`/api/invite/${params.code}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const result = await response.json();
    setJoining(false);

    if (!response.ok) {
      setError(result.error || t('invalidLink'));
    } else {
      setJoined(true);
      setTimeout(() => {
        router.push(`/groups/${result.groupId}`);
      }, 1000);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
      }}
    >
      <Container maxWidth="xs">
        <Card variant="outlined">
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <GroupsIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />

            <Typography variant="h2" sx={{ mb: 1 }}>
              {t('title')}
            </Typography>

            {needLogin ? (
              <>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  {t('loginFirst')}
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => router.push('/login')}
                >
                  {t('joining')}
                </Button>
              </>
            ) : joined ? (
              <Alert severity="success">{t('joined')}</Alert>
            ) : alreadyMember && group ? (
              <>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {t('alreadyMember')}
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => router.push(`/groups/${group.id}`)}
                  sx={{ mt: 2 }}
                >
                  {t('joining')}
                </Button>
              </>
            ) : (
              <>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  {t('joinDescription')}
                </Typography>

                {error && (
                  <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>
                    {error}
                  </Alert>
                )}

                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleJoin}
                  disabled={joining}
                  size="large"
                >
                  {joining ? <CircularProgress size={24} color="inherit" /> : t('join')}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
