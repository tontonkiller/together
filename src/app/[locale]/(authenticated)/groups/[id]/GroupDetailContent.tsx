'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import GroupsIcon from '@mui/icons-material/Groups';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useRouter } from '@/lib/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import { useImageUpload } from '@/lib/hooks/useImageUpload';
import InviteDialog from './InviteDialog';
import EventList from './EventList';
import EventDialog from './EventDialog';
import GroupCalendar from './GroupCalendar';

export interface GroupMember {
  id: string;
  user_id: string;
  role: string;
  color: string;
  joined_at: string;
  profiles: { display_name: string; avatar_url: string | null } | null;
}

export interface PendingInvitation {
  id: string;
  invited_email: string;
  status: string;
  expires_at: string;
  created_at: string;
  invited_by_profile: { display_name: string } | null;
}

import type { CalendarEvent as GroupEvent, EventType } from '@/lib/types/events';
export type { CalendarEvent as GroupEvent, EventType } from '@/lib/types/events';

interface GroupDetailContentProps {
  group: { id: string; name: string; description: string | null; invite_code: string | null; avatar_url: string | null };
  members: GroupMember[];
  currentUserId: string;
  currentUserRole: string;
  invitations: PendingInvitation[];
  events: GroupEvent[];
  eventTypes: EventType[];
  googleEventIds?: string[];
}

export default function GroupDetailContent({
  group,
  members,
  currentUserId,
  currentUserRole,
  invitations,
  events: initialEvents,
  eventTypes,
  googleEventIds = [],
}: GroupDetailContentProps) {
  const t = useTranslations('groups');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();

  const isAdmin = currentUserRole === 'admin';
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [groupAvatarUrl, setGroupAvatarUrl] = useState(group.avatar_url);

  // Group avatar upload
  const { uploading: avatarUploading, upload: uploadGroupAvatar } = useImageUpload({
    bucket: 'group-avatars',
    path: `${group.id}/avatar.jpg`,
  });

  const handleGroupAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await uploadGroupAvatar(file);
    if (url) {
      const supabase = createClient();
      await supabase.from('groups').update({ avatar_url: url }).eq('id', group.id);
      setGroupAvatarUrl(url);
    }
    e.target.value = '';
  };

  // Rename dialog
  const [renameOpen, setRenameOpen] = useState(false);
  const [newName, setNewName] = useState(group.name);
  const [renameLoading, setRenameLoading] = useState(false);

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Leave dialog
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);

  // Invite dialog
  const [inviteOpen, setInviteOpen] = useState(false);

  // Events
  const [events, setEvents] = useState(initialEvents);
  const [createOpen, setCreateOpen] = useState(false);
  const [createDefaultDate, setCreateDefaultDate] = useState<string | undefined>(undefined);
  const [membersOpen, setMembersOpen] = useState(false);

  const handleRename = async () => {
    if (!newName.trim()) return;
    setRenameLoading(true);
    setError('');

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from('groups')
      .update({ name: newName.trim() })
      .eq('id', group.id);

    setRenameLoading(false);
    if (updateError) {
      setError(updateError.message);
    } else {
      setRenameOpen(false);
      router.refresh();
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    setError('');

    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from('groups')
      .delete()
      .eq('id', group.id);

    setDeleteLoading(false);
    if (deleteError) {
      setError(deleteError.message);
    } else {
      router.push('/dashboard');
    }
  };

  const handleLeave = async () => {
    setLeaveLoading(true);
    setError('');

    const supabase = createClient();

    // If admin and there are other members, transfer admin to oldest member
    if (isAdmin && members.length > 1) {
      const otherMembers = members
        .filter((m) => m.user_id !== currentUserId)
        .sort((a, b) => new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime());

      if (otherMembers.length > 0) {
        const { error: transferError } = await supabase
          .from('group_members')
          .update({ role: 'admin' })
          .eq('id', otherMembers[0].id);

        if (transferError) {
          setError(transferError.message);
          setLeaveLoading(false);
          return;
        }
      }
    }

    // Remove self from group
    const { error: leaveError } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', group.id)
      .eq('user_id', currentUserId);

    setLeaveLoading(false);
    if (leaveError) {
      setError(leaveError.message);
    } else {
      router.push('/dashboard');
    }
  };

  const handleEventCreated = (event: GroupEvent) => {
    setEvents((prev) => [...prev, event].sort(
      (a, b) => a.start_date.localeCompare(b.start_date)
    ));
  };

  const handleEventUpdated = (updated: GroupEvent) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === updated.id ? updated : e))
        .sort((a, b) => a.start_date.localeCompare(b.start_date))
    );
  };

  const handleEventDeleted = (eventId: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  };

  return (
    <Box>
      {/* Header with group avatar */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
        <Box sx={{ position: 'relative', flexShrink: 0 }}>
          <Avatar
            src={groupAvatarUrl ?? undefined}
            sx={{ width: 56, height: 56, bgcolor: 'primary.main', borderRadius: 3 }}
          >
            <GroupsIcon sx={{ fontSize: 28 }} />
          </Avatar>
          {isAdmin && (
            <IconButton
              component="label"
              size="small"
              disabled={avatarUploading}
              sx={{
                position: 'absolute',
                bottom: -4,
                right: -4,
                bgcolor: 'background.paper',
                boxShadow: 1,
                width: 26,
                height: 26,
                '&:hover': { bgcolor: 'background.paper' },
              }}
            >
              {avatarUploading ? (
                <CircularProgress size={12} />
              ) : (
                <CameraAltIcon sx={{ fontSize: 13 }} />
              )}
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleGroupAvatarChange}
              />
            </IconButton>
          )}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h2" noWrap>{group.name}</Typography>
            {isAdmin && (
              <IconButton onClick={() => setRenameOpen(true)} size="small" aria-label={t('rename')}>
                <EditIcon />
              </IconButton>
            )}
          </Box>
        </Box>
      </Box>

      {group.description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {group.description}
        </Typography>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Members section (collapsed by default) */}
      <Box
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 3, mb: 0.5, cursor: 'pointer' }}
        onClick={() => setMembersOpen((prev) => !prev)}
        role="button"
        aria-expanded={membersOpen}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="h3">
            {t('members')} ({members.length})
          </Typography>
          <ExpandMoreIcon
            sx={{
              fontSize: 20,
              color: 'text.secondary',
              transition: 'transform 0.2s',
              transform: membersOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </Box>
        {isAdmin && (
          <Button
            startIcon={<PersonAddIcon />}
            size="small"
            onClick={(e) => { e.stopPropagation(); setInviteOpen(true); }}
          >
            {t('invite')}
          </Button>
        )}
      </Box>

      <Collapse in={membersOpen}>
        <List disablePadding>
          {members.map((member) => (
            <ListItem key={member.id} disableGutters>
              <ListItemAvatar>
                <Avatar
                  src={member.profiles?.avatar_url ?? undefined}
                  sx={{ bgcolor: member.color, width: 36, height: 36, fontSize: '0.9rem' }}
                >
                  {member.profiles?.display_name?.charAt(0).toUpperCase() ?? '?'}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={member.profiles?.display_name ?? '?'}
              />
              <Chip
                label={member.role === 'admin' ? t('admin') : t('member')}
                size="small"
                color={member.role === 'admin' ? 'primary' : 'default'}
                variant={member.role === 'admin' ? 'filled' : 'outlined'}
              />
            </ListItem>
          ))}
        </List>

        {/* Pending invitations */}
        {isAdmin && invitations.length > 0 && (
          <>
            <Typography variant="h3" sx={{ mt: 3, mb: 1 }}>
              {t('pendingInvitations')}
            </Typography>
            <List disablePadding>
              {invitations.map((inv) => {
                const isExpired = new Date(inv.expires_at) < new Date();
                return (
                  <ListItem key={inv.id} disableGutters>
                    <ListItemText
                      primary={inv.invited_email}
                      secondary={isExpired ? t('expired') : t('expires', {
                        date: new Date(inv.expires_at).toLocaleDateString(locale),
                      })}
                    />
                    {isExpired && (
                      <Chip label={t('expired')} size="small" color="warning" variant="outlined" />
                    )}
                  </ListItem>
                );
              })}
            </List>
          </>
        )}
      </Collapse>

      <Divider sx={{ my: 3 }} />

      {/* Group Calendar (M6) */}
      <GroupCalendar
        events={events}
        members={members}
        currentUserId={currentUserId}
        eventTypes={eventTypes}
        onEventUpdated={handleEventUpdated}
        onEventDeleted={handleEventDeleted}
        onDayClick={(date) => {
          setCreateDefaultDate(date);
          setCreateOpen(true);
        }}
        googleEventIds={googleEventIds}
      />

      {/* Create event dialog (from calendar day click) */}
      <EventDialog
        open={createOpen}
        onClose={() => { setCreateOpen(false); setCreateDefaultDate(undefined); }}
        event={null}
        eventTypes={eventTypes}
        groupId={group.id}
        onEventCreated={handleEventCreated}
        onEventUpdated={handleEventUpdated}
        defaultDate={createDefaultDate}
      />

      <Divider sx={{ my: 3 }} />

      {/* Events list section (M4) */}
      <EventList
        events={events}
        eventTypes={eventTypes}
        groupId={group.id}
        currentUserId={currentUserId}
        onEventCreated={handleEventCreated}
        onEventUpdated={handleEventUpdated}
        onEventDeleted={handleEventDeleted}
      />

      <Divider sx={{ my: 3 }} />

      {/* Actions */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Button
          variant="outlined"
          color="warning"
          startIcon={<LogoutIcon />}
          onClick={() => setLeaveOpen(true)}
        >
          {t('leaveGroup')}
        </Button>
        {isAdmin && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteOpen(true)}
          >
            {t('deleteGroup')}
          </Button>
        )}
      </Box>

      {/* Rename Dialog */}
      <Dialog open={renameOpen} onClose={() => setRenameOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{t('renameGroup')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label={t('newName')}
            fullWidth
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameOpen(false)}>{tCommon('cancel')}</Button>
          <Button onClick={handleRename} disabled={renameLoading || !newName.trim()} variant="contained">
            {tCommon('save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>{t('deleteGroup')}</DialogTitle>
        <DialogContent>
          <Typography>{t('deleteConfirm')}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>{tCommon('cancel')}</Button>
          <Button onClick={handleDelete} disabled={deleteLoading} color="error" variant="contained">
            {tCommon('delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Leave Dialog */}
      <Dialog open={leaveOpen} onClose={() => setLeaveOpen(false)}>
        <DialogTitle>{t('leaveGroup')}</DialogTitle>
        <DialogContent>
          <Typography>{t('leaveConfirm')}</Typography>
          {isAdmin && members.length > 1 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              {t('leaveAdminWarning')}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLeaveOpen(false)}>{tCommon('cancel')}</Button>
          <Button onClick={handleLeave} disabled={leaveLoading} color="warning" variant="contained">
            {tCommon('confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invite Dialog (M3) */}
      <InviteDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        groupId={group.id}
        inviteCode={group.invite_code}
        onInviteSent={() => {
          setSuccess(t('inviteSent'));
          router.refresh();
        }}
      />
    </Box>
  );
}
