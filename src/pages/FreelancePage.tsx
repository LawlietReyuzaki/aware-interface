import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, DollarSign, Briefcase, TrendingUp, Plus, Trash2, Mail, Globe } from 'lucide-react';
import { api } from '@/services/api';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function FreelancePage() {
  const queryClient = useQueryClient();
  const [clientOpen, setClientOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPlatform, setClientPlatform] = useState('');
  const [clientRate, setClientRate] = useState('');

  const clientsQuery = useQuery({
    queryKey: ['freelance', 'clients'],
    queryFn: api.freelance.clients,
    staleTime: 60_000,
  });

  const statsQuery = useQuery({
    queryKey: ['freelance', 'stats'],
    queryFn: api.freelance.stats,
    staleTime: 60_000,
  });

  const createClientMutation = useMutation({
    mutationFn: (data: { name: string; email?: string; platform?: string; hourly_rate?: number }) =>
      fetch('/api/freelance/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['freelance'] });
      setClientOpen(false);
      setClientName('');
      setClientEmail('');
      setClientPlatform('');
      setClientRate('');
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/freelance/clients/${id}`, { method: 'DELETE' }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['freelance'] });
    },
  });

  const clients = clientsQuery.data ?? [];
  const stats = statsQuery.data;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const platforms = ['upwork', 'fiverr', 'toptal', 'freelancer', 'direct', 'other'];

  const getPlatformColor = (platform: string) => {
    switch (platform?.toLowerCase()) {
      case 'upwork': return 'bg-green-500/20 text-green-500';
      case 'fiverr': return 'bg-emerald-500/20 text-emerald-500';
      case 'toptal': return 'bg-blue-500/20 text-blue-500';
      case 'freelancer': return 'bg-cyan-500/20 text-cyan-500';
      case 'direct': return 'bg-purple-500/20 text-purple-500';
      default: return 'bg-secondary text-muted-foreground';
    }
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
          <h1 className="text-2xl font-display font-bold text-foreground">Freelance</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage clients and track earnings</p>
        </div>
        <Dialog open={clientOpen} onOpenChange={setClientOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus size={14} />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Client</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Client Name</Label>
                <Input
                  placeholder="Client or company name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Email (optional)</Label>
                <Input
                  type="email"
                  placeholder="client@email.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Platform</Label>
                <Select value={clientPlatform} onValueChange={setClientPlatform}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.map(p => (
                      <SelectItem key={p} value={p}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Hourly Rate (optional)</Label>
                <Input
                  type="number"
                  placeholder="50"
                  value={clientRate}
                  onChange={(e) => setClientRate(e.target.value)}
                  min="0"
                />
              </div>
              <Button
                onClick={() => createClientMutation.mutate({
                  name: clientName,
                  email: clientEmail || undefined,
                  platform: clientPlatform || undefined,
                  hourly_rate: clientRate ? Number(clientRate) : undefined,
                })}
                disabled={createClientMutation.isPending || !clientName}
                className="w-full"
              >
                {createClientMutation.isPending ? 'Saving...' : 'Add Client'}
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
              <Users size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats?.total_clients ?? clients.length}</p>
              <p className="text-xs text-muted-foreground">Total Clients</p>
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
              <DollarSign size={18} className="text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(stats?.total_earnings ?? 0)}</p>
              <p className="text-xs text-muted-foreground">Total Earnings</p>
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
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Briefcase size={18} className="text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats?.active_projects ?? 0}</p>
              <p className="text-xs text-muted-foreground">Active Projects</p>
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
              <TrendingUp size={18} className="text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(stats?.avg_rate ?? 0)}/hr</p>
              <p className="text-xs text-muted-foreground">Avg Hourly Rate</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Earnings by Platform */}
      {stats?.by_platform && Object.keys(stats.by_platform).length > 0 && (
        <div className="p-5 rounded-xl border border-border bg-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Earnings by Platform</h3>
          <div className="space-y-3">
            {Object.entries(stats.by_platform).map(([platform, earnings]: [string, any]) => (
              <div key={platform}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground capitalize">{platform}</span>
                  <span className="text-foreground font-medium">{formatCurrency(earnings)}</span>
                </div>
                <Progress
                  value={(earnings / stats.total_earnings) * 100}
                  className="h-2"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clients List */}
      <div className="p-5 rounded-xl border border-border bg-card">
        <h3 className="text-sm font-semibold text-foreground mb-4">Clients</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.length === 0 ? (
            <p className="text-sm text-muted-foreground col-span-full text-center py-8">
              No clients yet. Add your first client to start tracking!
            </p>
          ) : (
            clients.map((client: any) => (
              <div
                key={client.id}
                className="p-4 rounded-lg bg-secondary/30 group hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{client.name}</p>
                    {client.platform && (
                      <span className={`inline-block text-xs px-2 py-0.5 rounded mt-1 ${getPlatformColor(client.platform)}`}>
                        {client.platform}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => deleteClientMutation.mutate(client.id)}
                    className="p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {client.email && (
                    <div className="flex items-center gap-1">
                      <Mail size={12} />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  {client.hourly_rate && (
                    <div className="flex items-center gap-1">
                      <DollarSign size={12} />
                      <span>{formatCurrency(client.hourly_rate)}/hr</span>
                    </div>
                  )}
                  {client.projects_count !== undefined && (
                    <div className="flex items-center gap-1">
                      <Briefcase size={12} />
                      <span>{client.projects_count} projects</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
