import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TrendingUp, Flame, Calendar, FileText, Plus, Check } from 'lucide-react';
import { api } from '@/services/api';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function ProductivityPage() {
  const queryClient = useQueryClient();
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [checkinNote, setCheckinNote] = useState('');
  const [checkinScore, setCheckinScore] = useState(75);

  // Queries
  const scoreQuery = useQuery({
    queryKey: ['productivity', 'today'],
    queryFn: api.productivity.todayScore,
    staleTime: 30_000,
  });

  const streakQuery = useQuery({
    queryKey: ['productivity', 'streak'],
    queryFn: api.productivity.streak,
    staleTime: 60_000,
  });

  const historyQuery = useQuery({
    queryKey: ['productivity', 'history'],
    queryFn: () => api.productivity.history(30),
    staleTime: 60_000,
  });

  const heatmapQuery = useQuery({
    queryKey: ['productivity', 'heatmap'],
    queryFn: api.productivity.heatmap,
    staleTime: 120_000,
  });

  const weeklyQuery = useQuery({
    queryKey: ['productivity', 'weekly'],
    queryFn: api.productivity.weeklyReport,
    staleTime: 120_000,
  });

  // Create check-in mutation
  const createCheckinMutation = useMutation({
    mutationFn: (data: { score: number; notes?: string }) =>
      fetch('/api/productivity/checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productivity'] });
      setCheckinOpen(false);
      setCheckinNote('');
      setCheckinScore(75);
    },
  });

  const score = scoreQuery.data?.score ?? 0;
  const streak = streakQuery.data?.current_streak ?? 0;
  const history = historyQuery.data ?? [];
  const heatmap = heatmapQuery.data ?? [];
  const weekly = weeklyQuery.data;

  const handleCreateCheckin = () => {
    createCheckinMutation.mutate({ score: checkinScore, notes: checkinNote || undefined });
  };

  // Generate heatmap grid (last 16 weeks, 7 days each)
  const generateHeatmapGrid = () => {
    const grid = [];
    const today = new Date();
    for (let week = 15; week >= 0; week--) {
      const weekData = [];
      for (let day = 0; day < 7; day++) {
        const date = new Date(today);
        date.setDate(date.getDate() - (week * 7 + (6 - day)));
        const dateStr = date.toISOString().split('T')[0];
        const entry = heatmap.find((h: any) => h.date === dateStr);
        weekData.push({
          date: dateStr,
          score: entry?.score ?? 0,
          count: entry?.count ?? 0,
        });
      }
      grid.push(weekData);
    }
    return grid;
  };

  const heatmapGrid = generateHeatmapGrid();

  const getHeatmapColor = (score: number) => {
    if (score === 0) return 'bg-secondary/50';
    if (score < 30) return 'bg-red-500/30';
    if (score < 50) return 'bg-orange-500/40';
    if (score < 70) return 'bg-yellow-500/50';
    if (score < 85) return 'bg-green-500/50';
    return 'bg-primary/70';
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
          <h1 className="text-2xl font-display font-bold text-foreground">Productivity</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your daily progress and build momentum</p>
        </div>
        <Dialog open={checkinOpen} onOpenChange={setCheckinOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus size={14} />
              Check In
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Daily Check-In</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>How productive do you feel today? ({checkinScore}%)</Label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={checkinScore}
                  onChange={(e) => setCheckinScore(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  placeholder="How was your day?"
                  value={checkinNote}
                  onChange={(e) => setCheckinNote(e.target.value)}
                />
              </div>
              <Button onClick={handleCreateCheckin} disabled={createCheckinMutation.isPending} className="w-full">
                {createCheckinMutation.isPending ? 'Saving...' : 'Submit Check-In'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-xl border border-border bg-card"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{score}%</p>
              <p className="text-xs text-muted-foreground">Today's Score</p>
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
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Flame size={18} className="text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{streak}</p>
              <p className="text-xs text-muted-foreground">Day Streak</p>
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
            <div className="p-2 rounded-lg bg-green-500/10">
              <Check size={18} className="text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{weekly?.tasks_completed ?? 0}</p>
              <p className="text-xs text-muted-foreground">Tasks This Week</p>
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
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Calendar size={18} className="text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{weekly?.avg_score?.toFixed(0) ?? 0}%</p>
              <p className="text-xs text-muted-foreground">Weekly Average</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heatmap */}
        <div className="lg:col-span-2 p-5 rounded-xl border border-border bg-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Contribution Heatmap</h3>
          <div className="flex gap-1 overflow-x-auto pb-2">
            {heatmapGrid.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((day, di) => (
                  <div
                    key={di}
                    className={`w-3 h-3 rounded-sm ${getHeatmapColor(day.score)}`}
                    title={`${day.date}: ${day.score}%`}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
            <span>Less</span>
            <div className="w-3 h-3 rounded-sm bg-secondary/50" />
            <div className="w-3 h-3 rounded-sm bg-orange-500/40" />
            <div className="w-3 h-3 rounded-sm bg-yellow-500/50" />
            <div className="w-3 h-3 rounded-sm bg-green-500/50" />
            <div className="w-3 h-3 rounded-sm bg-primary/70" />
            <span>More</span>
          </div>
        </div>

        {/* Weekly Report */}
        <div className="p-5 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={16} className="text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Weekly Report</h3>
          </div>
          {weekly ? (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Average Score</span>
                  <span className="text-foreground font-medium">{weekly.avg_score?.toFixed(0)}%</span>
                </div>
                <Progress value={weekly.avg_score} className="h-2" />
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tasks Completed</span>
                  <span className="text-foreground">{weekly.tasks_completed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Goals Met</span>
                  <span className="text-foreground">{weekly.goals_met}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Best Day</span>
                  <span className="text-foreground">{weekly.best_day || 'N/A'}</span>
                </div>
              </div>
              {weekly.insights && (
                <p className="text-xs text-muted-foreground border-t border-border pt-3 mt-3">
                  {weekly.insights}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Loading report...</p>
          )}
        </div>
      </div>

      {/* History Chart */}
      <div className="p-5 rounded-xl border border-border bg-card">
        <h3 className="text-sm font-semibold text-foreground mb-4">30-Day History</h3>
        <div className="h-32 flex items-end gap-1">
          {history.slice(-30).map((day: any, i: number) => (
            <div
              key={i}
              className="flex-1 bg-primary/60 rounded-t transition-all hover:bg-primary"
              style={{ height: `${day.score}%` }}
              title={`${day.date}: ${day.score}%`}
            />
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>30 days ago</span>
          <span>Today</span>
        </div>
      </div>
    </motion.div>
  );
}
