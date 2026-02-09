import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, Brain, Dumbbell, Apple, Plus, Smile, Meh, Frown } from 'lucide-react';
import { api } from '@/services/api';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function HealthPage() {
  const queryClient = useQueryClient();
  const [mentalOpen, setMentalOpen] = useState(false);
  const [workoutOpen, setWorkoutOpen] = useState(false);
  const [mentalMood, setMentalMood] = useState<number>(7);
  const [mentalNotes, setMentalNotes] = useState('');
  const [workoutType, setWorkoutType] = useState('');
  const [workoutDuration, setWorkoutDuration] = useState('30');

  const summaryQuery = useQuery({
    queryKey: ['health', 'summary'],
    queryFn: api.health.summary,
    staleTime: 60_000,
  });

  const mentalQuery = useQuery({
    queryKey: ['health', 'mental'],
    queryFn: api.health.mental,
    staleTime: 60_000,
  });

  const createMentalMutation = useMutation({
    mutationFn: (data: { mood_score: number; notes?: string }) => api.health.createMental(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health'] });
      setMentalOpen(false);
      setMentalNotes('');
      setMentalMood(7);
    },
  });

  const createWorkoutMutation = useMutation({
    mutationFn: (data: { workout_type: string; duration_minutes: number }) => api.health.createWorkout(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health'] });
      setWorkoutOpen(false);
      setWorkoutType('');
      setWorkoutDuration('30');
    },
  });

  const summary = summaryQuery.data;
  const mentalEntries = mentalQuery.data ?? [];

  const getMoodIcon = (score: number) => {
    if (score >= 7) return <Smile className="text-green-500" size={16} />;
    if (score >= 4) return <Meh className="text-yellow-500" size={16} />;
    return <Frown className="text-red-500" size={16} />;
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
          <h1 className="text-2xl font-display font-bold text-foreground">Wellness</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your mental and physical health</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={mentalOpen} onOpenChange={setMentalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-2">
                <Brain size={14} />
                Mental Check-In
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Mental Health Check-In</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>How are you feeling? (1-10): {mentalMood}</Label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={mentalMood}
                    onChange={(e) => setMentalMood(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Struggling</span>
                    <span>Great</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Textarea
                    placeholder="How are you feeling today?"
                    value={mentalNotes}
                    onChange={(e) => setMentalNotes(e.target.value)}
                  />
                </div>
                <Button
                  onClick={() => createMentalMutation.mutate({ mood_score: mentalMood, notes: mentalNotes || undefined })}
                  disabled={createMentalMutation.isPending}
                  className="w-full"
                >
                  {createMentalMutation.isPending ? 'Saving...' : 'Log Check-In'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={workoutOpen} onOpenChange={setWorkoutOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Dumbbell size={14} />
                Log Workout
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log Workout</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Workout Type</Label>
                  <Select value={workoutType} onValueChange={setWorkoutType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cardio">Cardio</SelectItem>
                      <SelectItem value="strength">Strength Training</SelectItem>
                      <SelectItem value="yoga">Yoga</SelectItem>
                      <SelectItem value="running">Running</SelectItem>
                      <SelectItem value="cycling">Cycling</SelectItem>
                      <SelectItem value="swimming">Swimming</SelectItem>
                      <SelectItem value="hiit">HIIT</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={workoutDuration}
                    onChange={(e) => setWorkoutDuration(e.target.value)}
                    min="1"
                  />
                </div>
                <Button
                  onClick={() => createWorkoutMutation.mutate({
                    workout_type: workoutType,
                    duration_minutes: Number(workoutDuration),
                  })}
                  disabled={createWorkoutMutation.isPending || !workoutType}
                  className="w-full"
                >
                  {createWorkoutMutation.isPending ? 'Saving...' : 'Log Workout'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-xl border border-border bg-card"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <Heart size={18} className="text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{summary?.health_score ?? 0}%</p>
              <p className="text-xs text-muted-foreground">Health Score</p>
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
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Brain size={18} className="text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{summary?.mental_checkins ?? 0}</p>
              <p className="text-xs text-muted-foreground">Mental Check-Ins</p>
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
              <Dumbbell size={18} className="text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{summary?.workouts_count ?? 0}</p>
              <p className="text-xs text-muted-foreground">Workouts This Week</p>
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
            <div className="p-2 rounded-lg bg-green-500/10">
              <Apple size={18} className="text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{summary?.avg_mood?.toFixed(1) ?? 0}</p>
              <p className="text-xs text-muted-foreground">Avg Mood (7 days)</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mental Health Log */}
        <div className="p-5 rounded-xl border border-border bg-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Recent Mental Check-Ins</h3>
          <div className="space-y-3">
            {mentalEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No check-ins yet. Start tracking your mental health!</p>
            ) : (
              mentalEntries.slice(0, 5).map((entry: any) => (
                <div key={entry.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                  {getMoodIcon(entry.mood_score)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">Mood: {entry.mood_score}/10</p>
                    {entry.notes && (
                      <p className="text-xs text-muted-foreground truncate">{entry.notes}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Health Summary */}
        <div className="p-5 rounded-xl border border-border bg-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Health Summary</h3>
          {summary ? (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Overall Health</span>
                  <span className="text-foreground font-medium">{summary.health_score}%</span>
                </div>
                <Progress value={summary.health_score} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Mental Wellness</span>
                  <span className="text-foreground font-medium">{(summary.avg_mood / 10 * 100).toFixed(0)}%</span>
                </div>
                <Progress value={summary.avg_mood * 10} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Exercise Goal</span>
                  <span className="text-foreground font-medium">{summary.workouts_count}/5 workouts</span>
                </div>
                <Progress value={(summary.workouts_count / 5) * 100} className="h-2" />
              </div>
              {summary.streak && (
                <div className="pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    🔥 {summary.streak} day check-in streak!
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Loading summary...</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
