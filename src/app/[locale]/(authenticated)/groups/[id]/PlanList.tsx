'use client';

import { useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import type { PlanSlot, PlanWithSlots } from '@/lib/types/plans';
import { countYesVotes, daysUntilExpiry } from '@/lib/plans/resolveHelpers';
import PlanResolveConfirm from './PlanResolveConfirm';

interface MemberLite {
  user_id: string;
  color: string;
  profiles: { display_name: string; avatar_url: string | null } | null;
}

interface PlanListProps {
  plans: PlanWithSlots[];
  currentUserId: string;
  members: MemberLite[];
  onRefresh: () => void;
}

function formatSlotLabel(slot: PlanSlot, locale: string): string {
  const d = new Date(`${slot.date}T${slot.time ?? '00:00'}:00`);
  const dateStr = d.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  if (slot.time) return `${dateStr} — ${slot.time.slice(0, 5)}`;
  return dateStr;
}

export default function PlanList({ plans, currentUserId, members, onRefresh }: PlanListProps) {
  if (plans.length === 0) return null;

  return (
    <Stack spacing={2}>
      {plans.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          currentUserId={currentUserId}
          members={members}
          onRefresh={onRefresh}
        />
      ))}
    </Stack>
  );
}

interface PlanCardProps {
  plan: PlanWithSlots;
  currentUserId: string;
  members: MemberLite[];
  onRefresh: () => void;
}

function PlanCard({ plan, currentUserId, members, onRefresh }: PlanCardProps) {
  const t = useTranslations('plans');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const [votingSlotId, setVotingSlotId] = useState<string | null>(null);
  const [resolveSlot, setResolveSlot] = useState<PlanSlot | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isCreator = plan.created_by === currentUserId;
  const membersById = useMemo(() => {
    const m = new Map<string, MemberLite>();
    members.forEach((mem) => m.set(mem.user_id, mem));
    return m;
  }, [members]);

  const totalMembers = members.length;
  const daysLeft = daysUntilExpiry(plan.expires_at);
  const canVote = plan.status === 'open';

  const myVoteFor = (slotId: string): boolean | null => {
    const slot = plan.slots.find((s) => s.id === slotId);
    if (!slot) return null;
    const myVote = slot.votes.find((v) => v.user_id === currentUserId);
    return myVote ? myVote.available : null;
  };

  const handleVote = async (slotId: string, available: boolean) => {
    if (!canVote) return;
    setVotingSlotId(slotId);
    await fetch(`/api/plans/${plan.id}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ votes: [{ slot_id: slotId, available }] }),
    });
    setVotingSlotId(null);
    onRefresh();
  };

  const handleDelete = async () => {
    setDeleting(true);
    await fetch(`/api/plans/${plan.id}`, { method: 'DELETE' });
    setDeleting(false);
    setDeleteConfirm(false);
    onRefresh();
  };

  const statusColor: 'default' | 'primary' | 'success' | 'warning' = {
    open: 'primary',
    pending_tiebreak: 'warning',
    resolved: 'success',
    expired: 'default',
  }[plan.status] as 'default' | 'primary' | 'success' | 'warning';

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" alignItems="flex-start" spacing={1} sx={{ mb: 1 }}>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {plan.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('createdBy', { name: plan.creator_profile?.display_name ?? '—' })}
              {' · '}
              {t(`duration.${plan.duration}` as 'duration.1h')}
              {plan.status === 'open' && (
                <>
                  {' · '}
                  {daysLeft === 0 ? t('expiresToday') : t('expiresIn', { days: daysLeft })}
                </>
              )}
            </Typography>
          </Box>
          <Chip
            size="small"
            label={t(`status.${plan.status}` as 'status.open')}
            color={statusColor}
          />
          {isCreator && plan.status === 'open' && (
            <IconButton
              size="small"
              onClick={() => setDeleteConfirm((v) => !v)}
              disabled={deleting}
              aria-label={t('delete.confirm')}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>

        {deleteConfirm && (
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <Typography variant="caption" color="error">
              {t('delete.confirmMessage')}
            </Typography>
            <Button
              size="small"
              color="error"
              variant="contained"
              onClick={handleDelete}
              disabled={deleting}
            >
              {t('delete.confirm')}
            </Button>
            <Button size="small" onClick={() => setDeleteConfirm(false)} disabled={deleting}>
              {tCommon('cancel')}
            </Button>
          </Stack>
        )}

        {plan.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            {plan.description}
          </Typography>
        )}

        {plan.status === 'pending_tiebreak' && (
          <Box
            sx={{
              bgcolor: 'warning.light',
              color: 'warning.contrastText',
              p: 1,
              borderRadius: 1,
              mb: 1.5,
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {t('tiebreak.title')}
            </Typography>
            <Typography variant="caption" display="block">
              {t('tiebreak.message')}
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 1 }} />

        <Stack spacing={1.5} sx={{ mt: 1.5 }}>
          {plan.slots
            .slice()
            .sort((a, b) => a.position - b.position)
            .map((slot) => {
              const yesCount = countYesVotes(slot);
              const progress = totalMembers > 0 ? (yesCount / totalMembers) * 100 : 0;
              const myVote = myVoteFor(slot.id);
              const avatars = slot.votes
                .filter((v) => v.available)
                .map((v) => membersById.get(v.user_id))
                .filter((m): m is MemberLite => !!m);
              const isResolved = plan.resolved_slot_id === slot.id;

              return (
                <Box key={slot.id} sx={{ opacity: plan.status === 'expired' ? 0.6 : 1 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, flexGrow: 1 }}>
                      {formatSlotLabel(slot, locale)}
                    </Typography>
                    {isResolved && (
                      <Chip
                        size="small"
                        icon={<CheckCircleIcon />}
                        label={t('status.resolved')}
                        color="success"
                      />
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {yesCount > 0 ? t('voteCount', { count: yesCount }) : t('noVotesYet')}
                    </Typography>
                  </Stack>

                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{ height: 6, borderRadius: 3, mb: 0.5 }}
                  />

                  <Stack direction="row" alignItems="center" spacing={1}>
                    {avatars.length > 0 && (
                      <AvatarGroup
                        max={5}
                        sx={{
                          '& .MuiAvatar-root': { width: 22, height: 22, fontSize: 11 },
                        }}
                      >
                        {avatars.map((m) => (
                          <Avatar
                            key={m.user_id}
                            src={m.profiles?.avatar_url ?? undefined}
                            alt={m.profiles?.display_name ?? ''}
                            sx={{ bgcolor: m.color }}
                          >
                            {(m.profiles?.display_name ?? '?').charAt(0).toUpperCase()}
                          </Avatar>
                        ))}
                      </AvatarGroup>
                    )}

                    <Box sx={{ flexGrow: 1 }} />

                    {canVote && (
                      <ToggleButtonGroup
                        size="small"
                        exclusive
                        value={myVote}
                        disabled={votingSlotId === slot.id}
                        onChange={(_, val) => {
                          if (val === null) return;
                          handleVote(slot.id, val === true);
                        }}
                      >
                        <ToggleButton value={true} color="success" aria-label={t('vote.available')}>
                          {votingSlotId === slot.id ? (
                            <CircularProgress size={14} />
                          ) : (
                            <CheckCircleIcon fontSize="small" />
                          )}
                        </ToggleButton>
                        <ToggleButton
                          value={false}
                          color="error"
                          aria-label={t('vote.unavailable')}
                        >
                          <CancelIcon fontSize="small" />
                        </ToggleButton>
                      </ToggleButtonGroup>
                    )}

                    {isCreator &&
                      (plan.status === 'open' || plan.status === 'pending_tiebreak') && (
                        <Button
                          size="small"
                          variant={plan.status === 'pending_tiebreak' ? 'contained' : 'outlined'}
                          onClick={() => setResolveSlot(slot)}
                          disabled={votingSlotId !== null}
                        >
                          {t('resolve.button')}
                        </Button>
                      )}
                  </Stack>
                </Box>
              );
            })}
        </Stack>
      </CardContent>

      <PlanResolveConfirm
        open={resolveSlot !== null}
        onClose={() => setResolveSlot(null)}
        planId={plan.id}
        slot={resolveSlot}
        onResolved={onRefresh}
      />
    </Card>
  );
}
