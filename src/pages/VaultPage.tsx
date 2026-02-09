import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Key, Eye, EyeOff, Copy, Plus, Trash2, RefreshCw, Check } from 'lucide-react';
import { api } from '@/services/api';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function VaultPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const vaultQuery = useQuery({
    queryKey: ['vault'],
    queryFn: api.vault.list,
    staleTime: 60_000,
  });

  const statsQuery = useQuery({
    queryKey: ['vault', 'stats'],
    queryFn: api.vault.stats,
    staleTime: 120_000,
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; username?: string; password: string; url?: string }) =>
      api.vault.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault'] });
      setCreateOpen(false);
      setNewName('');
      setNewUsername('');
      setNewPassword('');
      setNewUrl('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.vault.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault'] });
    },
  });

  const generatePasswordMutation = useMutation({
    mutationFn: (length: number) => api.vault.generatePassword(length),
    onSuccess: (data) => {
      setNewPassword(data.password);
    },
  });

  const items = vaultQuery.data ?? [];
  const stats = statsQuery.data;

  const toggleVisibility = (id: string) => {
    setVisibleIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getSecurityColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Vault</h1>
          <p className="text-sm text-muted-foreground mt-1">Secure credential storage</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus size={14} />
              Add Credential
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Credential</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Name / Service</Label>
                <Input
                  placeholder="e.g., GitHub, Gmail"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Username / Email (optional)</Label>
                <Input
                  placeholder="username@email.com"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Enter or generate password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => generatePasswordMutation.mutate(20)}
                    disabled={generatePasswordMutation.isPending}
                  >
                    <RefreshCw size={14} className={generatePasswordMutation.isPending ? 'animate-spin' : ''} />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>URL (optional)</Label>
                <Input
                  placeholder="https://..."
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                />
              </div>
              <Button
                onClick={() => createMutation.mutate({
                  name: newName,
                  username: newUsername || undefined,
                  password: newPassword,
                  url: newUrl || undefined,
                })}
                disabled={createMutation.isPending || !newName || !newPassword}
                className="w-full"
              >
                {createMutation.isPending ? 'Saving...' : 'Save Credential'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-xl border border-border bg-card"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats?.total_items ?? items.length}</p>
              <p className="text-xs text-muted-foreground">Total Credentials</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
          className="p-4 rounded-xl border border-border bg-card"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Key size={18} className="text-green-500" />
            </div>
            <div>
              <p className={`text-2xl font-bold ${getSecurityColor(stats?.security_score ?? 0)}`}>
                {stats?.security_score ?? 0}%
              </p>
              <p className="text-xs text-muted-foreground">Security Score</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-xl border border-border bg-card"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Shield size={18} className="text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats?.weak_passwords ?? 0}</p>
              <p className="text-xs text-muted-foreground">Weak Passwords</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="p-4 rounded-xl border border-border bg-card"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <RefreshCw size={18} className="text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats?.reused_passwords ?? 0}</p>
              <p className="text-xs text-muted-foreground">Reused Passwords</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Security Score Bar */}
      {stats?.security_score !== undefined && (
        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Overall Security</span>
            <span className={`font-semibold ${getSecurityColor(stats.security_score)}`}>
              {stats.security_score}%
            </span>
          </div>
          <Progress value={stats.security_score} className="h-2" />
        </div>
      )}

      {/* Credentials List */}
      <div className="p-5 rounded-xl border border-border bg-card">
        <h3 className="text-sm font-semibold text-foreground mb-4">Stored Credentials</h3>
        <div className="space-y-3">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No credentials stored yet. Add your first credential securely!
            </p>
          ) : (
            items.map((item: any) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30 group"
              >
                <div className="p-2 rounded-lg bg-primary/10">
                  <Key size={16} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{item.name}</p>
                  {item.username && (
                    <p className="text-xs text-muted-foreground">{item.username}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-secondary px-2 py-1 rounded font-mono">
                    {visibleIds.has(item.id) ? item.password : '••••••••••'}
                  </code>
                  <button
                    onClick={() => toggleVisibility(item.id)}
                    className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {visibleIds.has(item.id) ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    onClick={() => copyToClipboard(item.password, item.id)}
                    className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {copiedId === item.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(item.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
