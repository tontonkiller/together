'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { useRouter } from '@/lib/i18n/navigation';
import { createClient } from '@/lib/supabase/client';

export default function NewGroupPage() {
  const t = useTranslations('groups');
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError('');

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      router.push('/login');
      return;
    }

    const { data: group, error: createError } = await supabase
      .from('groups')
      .insert({
        name: name.trim(),
        description: description.trim() || null,
        created_by: user.id,
      })
      .select('id')
      .single();

    if (createError || !group) {
      setError(createError?.message ?? t('createError'));
      setLoading(false);
      return;
    }

    // Add creator as admin member with first palette color
    const { getMemberColor } = await import('@/lib/utils/colors');
    const { error: memberError } = await supabase
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: user.id,
        role: 'admin',
        color: getMemberColor(0),
      });

    if (memberError) {
      // Clean up orphaned group
      const { error: deleteError } = await supabase.from('groups').delete().eq('id', group.id);
      if (deleteError) {
        console.error('[groups/new] Failed to clean up orphaned group:', group.id, deleteError.message);
      }
      setError(memberError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push(`/groups/${group.id}`);
  };

  return (
    <>
      <Typography variant="h2" sx={{ mb: 3 }}>
        {t('createGroup')}
      </Typography>

      <form onSubmit={handleSubmit}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          label={t('groupName')}
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          sx={{ mb: 2 }}
        />

        <TextField
          label={t('groupDescription')}
          fullWidth
          multiline
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          sx={{ mb: 3 }}
        />

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => router.push('/dashboard')}
            disabled={loading}
          >
            {t('cancel')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !name.trim()}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : t('create')}
          </Button>
        </Box>
      </form>
    </>
  );
}
