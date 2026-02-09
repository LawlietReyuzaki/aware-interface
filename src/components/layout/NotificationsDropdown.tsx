import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Trash2, X, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  created_at: string;
}

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch notification count
  const { data: countData } = useQuery({
    queryKey: ['notifications', 'count'],
    queryFn: api.notifications.count,
    refetchInterval: 30000,
    staleTime: 10000,
  });

  // Fetch notifications when open
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: () => api.notifications.list(),
    enabled: open,
    staleTime: 10000,
  });

  // Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.notifications.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read
  const markAllReadMutation = useMutation({
    mutationFn: api.notifications.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Clear read notifications
  const clearReadMutation = useMutation({
    mutationFn: api.notifications.clearRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unreadCount = countData?.unread ?? 0;
  const notificationList: Notification[] = notifications ?? [];

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  const typeColors = {
    info: 'hsl(var(--primary))',
    warning: 'hsl(var(--agent-thinking))',
    success: 'hsl(var(--accent))',
    error: 'hsl(var(--destructive))',
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors relative"
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-[10px] font-bold text-white flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border shadow-xl z-50 overflow-hidden"
              style={{ background: 'hsl(var(--card))' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
                <div className="flex items-center gap-1">
                  {notificationList.some(n => !n.read) && (
                    <button
                      onClick={() => markAllReadMutation.mutate()}
                      className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
                      title="Mark all as read"
                    >
                      <Check size={14} />
                    </button>
                  )}
                  {notificationList.some(n => n.read) && (
                    <button
                      onClick={() => clearReadMutation.mutate()}
                      className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
                      title="Clear read"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => setOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="max-h-[320px] overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={16} className="animate-spin text-muted-foreground" />
                  </div>
                ) : notificationList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Bell size={24} className="text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No notifications</p>
                  </div>
                ) : (
                  <div className="py-1">
                    {notificationList.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`px-4 py-3 border-b border-border/50 last:border-0 cursor-pointer transition-colors ${
                          notification.read ? 'opacity-60' : 'hover:bg-secondary/50'
                        }`}
                        onClick={() => !notification.read && markReadMutation.mutate(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                            style={{ background: typeColors[notification.type] }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{notification.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                              {formatTime(notification.created_at)}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
