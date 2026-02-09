import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, User, Clock, Download, Upload, Database, Moon, Sun, Bell, Shield } from 'lucide-react';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [workStart, setWorkStart] = useState('09:00');
  const [workEnd, setWorkEnd] = useState('17:00');
  const [timezone, setTimezone] = useState('UTC');
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);

  const userQuery = useQuery({
    queryKey: ['user', 'me'],
    queryFn: api.users.me,
    staleTime: 60_000,
  });

  const dataStatsQuery = useQuery({
    queryKey: ['data', 'stats'],
    queryFn: api.data.stats,
    staleTime: 120_000,
  });

  const updateUserMutation = useMutation({
    mutationFn: (data: any) => api.users.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const exportMutation = useMutation({
    mutationFn: () => api.data.export(),
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nebunex-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });

  // Load user data into form
  useEffect(() => {
    if (userQuery.data) {
      setName(userQuery.data.name || '');
      setEmail(userQuery.data.email || '');
      setWorkStart(userQuery.data.work_start || '09:00');
      setWorkEnd(userQuery.data.work_end || '17:00');
      setTimezone(userQuery.data.timezone || 'UTC');
      setNotifications(userQuery.data.notifications_enabled ?? true);
    }
  }, [userQuery.data]);

  // Check system dark mode
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);

  const handleSaveProfile = () => {
    updateUserMutation.mutate({
      name,
      email,
      work_start: workStart,
      work_end: workEnd,
      timezone,
      notifications_enabled: notifications,
    });
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.documentElement.classList.toggle('dark', newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  const stats = dataStatsQuery.data;

  const timezones = [
    'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai',
    'Asia/Kolkata', 'Australia/Sydney', 'Pacific/Auckland',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 max-w-4xl"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your profile and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="gap-2">
            <User size={14} />
            Profile
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2">
            <Settings size={14} />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="data" className="gap-2">
            <Database size={14} />
            Data
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <div className="p-6 rounded-xl border border-border bg-card">
            <h3 className="text-sm font-semibold text-foreground mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                />
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={16} className="text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Working Hours</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Work Start</Label>
                <Input
                  type="time"
                  value={workStart}
                  onChange={(e) => setWorkStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Work End</Label>
                <Input
                  type="time"
                  value={workEnd}
                  onChange={(e) => setWorkEnd(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map(tz => (
                      <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Button
            onClick={handleSaveProfile}
            disabled={updateUserMutation.isPending}
          >
            {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <div className="p-6 rounded-xl border border-border bg-card space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {darkMode ? <Moon size={18} className="text-primary" /> : <Sun size={18} className="text-yellow-500" />}
                <div>
                  <p className="text-sm font-medium text-foreground">Dark Mode</p>
                  <p className="text-xs text-muted-foreground">Use dark theme throughout the app</p>
                </div>
              </div>
              <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
            </div>

            <div className="h-px bg-border" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell size={18} className="text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">Notifications</p>
                  <p className="text-xs text-muted-foreground">Receive agent alerts and reminders</p>
                </div>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>

            <div className="h-px bg-border" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield size={18} className="text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">Agent Interventions</p>
                  <p className="text-xs text-muted-foreground">Allow agent to intervene in your workflow</p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </TabsContent>

        {/* Data Tab */}
        <TabsContent value="data" className="space-y-6">
          <div className="p-6 rounded-xl border border-border bg-card">
            <h3 className="text-sm font-semibold text-foreground mb-4">Data Overview</h3>
            {stats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-secondary/30">
                  <p className="text-2xl font-bold text-foreground">{stats.projects ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Projects</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/30">
                  <p className="text-2xl font-bold text-foreground">{stats.tasks ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Tasks</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/30">
                  <p className="text-2xl font-bold text-foreground">{stats.transactions ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Transactions</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/30">
                  <p className="text-2xl font-bold text-foreground">{stats.vault_items ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Vault Items</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Loading stats...</p>
            )}
          </div>

          <div className="p-6 rounded-xl border border-border bg-card">
            <h3 className="text-sm font-semibold text-foreground mb-4">Export & Import</h3>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => exportMutation.mutate()}
                disabled={exportMutation.isPending}
                className="gap-2"
              >
                <Download size={14} />
                {exportMutation.isPending ? 'Exporting...' : 'Export All Data'}
              </Button>
              <Button variant="outline" className="gap-2" disabled>
                <Upload size={14} />
                Import Data
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Export your data as JSON for backup or migration purposes.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-border bg-card">
            <h3 className="text-sm font-semibold text-foreground mb-4">Module Exports</h3>
            <div className="flex flex-wrap gap-2">
              {['projects', 'tasks', 'productivity', 'health', 'finances', 'knowledge', 'vault', 'freelance'].map(module => (
                <Button
                  key={module}
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    api.data.exportModule(module).then(data => {
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `nebunex-${module}-${new Date().toISOString().split('T')[0]}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    });
                  }}
                  className="capitalize"
                >
                  {module}
                </Button>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
