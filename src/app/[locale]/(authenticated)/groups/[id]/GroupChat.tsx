'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import SendIcon from '@mui/icons-material/Send';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { createClient } from '@/lib/supabase/client';
import { getContrastTextColor } from '@/lib/utils/colors';
import type { GroupMember } from './GroupDetailContent';

interface Message {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

interface GroupChatProps {
  groupId: string;
  currentUserId: string;
  members: GroupMember[];
}

export default function GroupChat({ groupId, currentUserId, members }: GroupChatProps) {
  const t = useTranslations('chat');
  const locale = useLocale();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const memberMap = Object.fromEntries(
    members.map((m) => [m.user_id, m])
  );

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Load initial messages + subscribe to realtime
  useEffect(() => {
    const supabase = createClient();

    const loadMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('id, group_id, user_id, content, created_at')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true })
        .limit(200);

      setMessages(data ?? []);
      setLoading(false);
      // Scroll after render
      setTimeout(scrollToBottom, 50);
    };

    loadMessages();

    const channel = supabase
      .channel(`messages:${groupId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `group_id=eq.${groupId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          setTimeout(scrollToBottom, 50);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'messages', filter: `group_id=eq.${groupId}` },
        (payload) => {
          setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, scrollToBottom]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    setInput('');

    const supabase = createClient();
    await supabase.from('messages').insert({
      group_id: groupId,
      user_id: currentUserId,
      content: text,
    });

    setSending(false);
  };

  const handleDelete = async (messageId: string) => {
    const supabase = createClient();
    await supabase.from('messages').delete().eq('id', messageId);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateSeparator = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return t('today');
    if (date.toDateString() === yesterday.toDateString()) return t('yesterday');
    return date.toLocaleDateString(locale, { day: 'numeric', month: 'long' });
  };

  const shouldShowDateSeparator = (index: number) => {
    if (index === 0) return true;
    const prev = new Date(messages[index - 1].created_at).toDateString();
    const curr = new Date(messages[index].created_at).toDateString();
    return prev !== curr;
  };

  // Consecutive messages from same user within 2 min → grouped
  const isGrouped = (index: number) => {
    if (index === 0) return false;
    const prev = messages[index - 1];
    const curr = messages[index];
    if (prev.user_id !== curr.user_id) return false;
    const diff = new Date(curr.created_at).getTime() - new Date(prev.created_at).getTime();
    return diff < 120_000;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '60vh', minHeight: 300 }}>
      {/* Messages list */}
      <Box
        ref={listRef}
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: 1,
          py: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.25,
        }}
      >
        {messages.length === 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <Typography color="text.secondary" variant="body2">
              {t('empty')}
            </Typography>
          </Box>
        )}

        {messages.map((msg, i) => {
          const isMe = msg.user_id === currentUserId;
          const member = memberMap[msg.user_id];
          const grouped = isGrouped(i);
          const showDate = shouldShowDateSeparator(i);

          return (
            <Box key={msg.id}>
              {showDate && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ textAlign: 'center', display: 'block', my: 1.5 }}
                >
                  {formatDateSeparator(msg.created_at)}
                </Typography>
              )}

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: isMe ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-end',
                  gap: 0.75,
                  mt: grouped ? 0.25 : 1,
                }}
              >
                {/* Avatar (other users only, not grouped) */}
                {!isMe && !grouped && (
                  <Avatar
                    src={member?.profiles?.avatar_url ?? undefined}
                    sx={{
                      width: 28,
                      height: 28,
                      fontSize: '0.75rem',
                      bgcolor: member?.color ?? '#78909C',
                      color: getContrastTextColor(member?.color ?? '#78909C'),
                      flexShrink: 0,
                    }}
                  >
                    {member?.profiles?.display_name?.charAt(0).toUpperCase() ?? '?'}
                  </Avatar>
                )}
                {!isMe && grouped && <Box sx={{ width: 28, flexShrink: 0 }} />}

                <Box sx={{ maxWidth: '75%', minWidth: 0 }}>
                  {/* Name (other users, not grouped) */}
                  {!isMe && !grouped && (
                    <Typography
                      variant="caption"
                      sx={{ ml: 0.5, color: member?.color ?? 'text.secondary', fontWeight: 600 }}
                    >
                      {member?.profiles?.display_name ?? '?'}
                    </Typography>
                  )}

                  <Box
                    sx={{
                      position: 'relative',
                      bgcolor: isMe ? 'primary.main' : 'action.hover',
                      color: isMe ? 'primary.contrastText' : 'text.primary',
                      borderRadius: 2.5,
                      px: 1.5,
                      py: 0.75,
                      '&:hover .chat-delete': { opacity: 1 },
                    }}
                  >
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {msg.content}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        textAlign: 'right',
                        mt: 0.25,
                        opacity: 0.7,
                        fontSize: '0.65rem',
                        lineHeight: 1,
                      }}
                    >
                      {formatTime(msg.created_at)}
                    </Typography>

                    {/* Delete button (own messages) */}
                    {isMe && (
                      <IconButton
                        className="chat-delete"
                        size="small"
                        onClick={() => handleDelete(msg.id)}
                        sx={{
                          position: 'absolute',
                          top: -8,
                          left: -8,
                          opacity: 0,
                          transition: 'opacity 0.15s',
                          bgcolor: 'background.paper',
                          boxShadow: 1,
                          width: 22,
                          height: 22,
                          '&:hover': { bgcolor: 'error.light', color: 'error.contrastText' },
                        }}
                      >
                        <DeleteOutlineIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    )}
                  </Box>
                </Box>
              </Box>
            </Box>
          );
        })}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input */}
      <Box sx={{ display: 'flex', gap: 1, pt: 1, px: 0.5, alignItems: 'flex-end' }}>
        <TextField
          fullWidth
          size="small"
          multiline
          maxRows={3}
          placeholder={t('placeholder')}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
        />
        <IconButton
          color="primary"
          onClick={handleSend}
          disabled={!input.trim() || sending}
          sx={{ flexShrink: 0, mb: 0.25 }}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
}
