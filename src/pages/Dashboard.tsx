import { motion } from 'framer-motion';
import {
  Check, Flame, Target, Clock, FolderKanban, Zap, TrendingUp,
  ArrowUpRight, ArrowDownRight, Heart, ListTodo, Bot
} from 'lucide-react';
import { AnticipationLayer } from '@/components/agent/AnticipationLayer';
import { AgentOrb } from '@/components/agent/AgentOrb';
import type { AgentEmotion, AnticipationItem } from '@/hooks/useAgentState';
import type { BehaviorState } from '@/hooks/useBehaviorTracking';

interface DashboardProps {
  agentEmotion: AgentEmotion;
  anticipations: AnticipationItem[];
  behavior: BehaviorState;
}

// Score ring component
function ScoreRing({ score, size = 100 }: { score: number; size?: number }) {
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color = score >= 70 ? 'hsl(var(--accent))' : score >= 40 ? 'hsl(var(--agent-thinking))' : 'hsl(var(--destructive))';

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        strokeLinecap="round"
      />
      <text
        x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
        fill={color} fontSize={size * 0.28} fontWeight="bold" fontFamily="Space Grotesk"
        transform={`rotate(90 ${size / 2} ${size / 2})`}
      >
        {Math.round(score)}
      </text>
    </svg>
  );
}

// Stat card
function StatCard({ label, value, icon: Icon, trend, color }: {
  label: string; value: string | number; icon: any; trend?: number; color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl border border-border p-4 bg-card"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">{label}</p>
          <p className="text-xl font-display font-bold" style={{ color }}>{value}</p>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-1 text-xs ${trend >= 0 ? 'text-accent' : 'text-destructive'}`}>
              {trend >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
              <span className="font-mono">{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
        <div className="p-2 rounded-lg" style={{ background: `${color}12` }}>
          <Icon size={17} style={{ color }} />
        </div>
      </div>
    </motion.div>
  );
}

export default function DashboardPage({ agentEmotion, anticipations, behavior }: DashboardProps) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Mock data
  const mockScore = 73;
  const streakDays = 12;

  return (
    <div className="space-y-6 max-w-[1200px]">
      {/* Hero — Greeting + Agent Presence */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-2xl border border-border p-6 living-surface"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground mb-1">
              {greeting} <span className="text-primary">⚡</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              {behavior.isInFlow
                ? 'You\'re in deep focus. I\'ll keep things quiet.'
                : behavior.sessionMood === 'productive'
                  ? 'Strong session. Your systems are aligned.'
                  : 'Ready when you are. Let\'s build something.'}
            </p>
            {behavior.isInFlow && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-accent mt-2 font-mono"
              >
                ● Flow state — {behavior.focusDuration}m focused
              </motion.p>
            )}
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="flex items-center gap-1.5 text-agent-thinking">
                <Flame size={16} />
                <span className="text-xl font-display font-bold">{streakDays}</span>
              </div>
              <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mt-0.5">Day Streak</p>
            </div>
            <ScoreRing score={mockScore} size={80} />
          </div>
        </div>
      </motion.div>

      {/* Anticipation Layer */}
      <AnticipationLayer items={anticipations} />

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Tasks Today" value={6} icon={Check} trend={15} color="hsl(var(--accent))" />
        <StatCard label="Week Tasks" value={23} icon={ListTodo} trend={8} color="hsl(var(--primary))" />
        <StatCard label="Goals Met" value="4/5" icon={Target} color="hsl(var(--agent-thinking))" />
        <StatCard label="Check-ins" value={3} icon={Clock} color="hsl(var(--primary))" />
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Active Projects */}
        <div className="col-span-2 space-y-4">
          <h2 className="text-sm font-display font-semibold text-secondary-foreground flex items-center gap-2">
            <FolderKanban size={15} className="text-primary" /> Active Projects
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'NEBUNEX Core', status: 'In Development', progress: 68, color: 'hsl(var(--primary))' },
              { name: 'Client Portal', status: 'Production', progress: 92, color: 'hsl(var(--accent))' },
              { name: 'AI Training Pipeline', status: 'Planning', progress: 25, color: 'hsl(var(--agent-thinking))' },
              { name: 'Mobile App', status: 'Ideation', progress: 10, color: 'hsl(var(--muted-foreground))' },
            ].map((p, i) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="rounded-xl border border-border p-4 bg-card hover:border-muted-foreground/20 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-display font-bold"
                    style={{ background: `${p.color}15`, color: p.color }}
                  >
                    {p.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                    style={{ background: `${p.color}12`, color: p.color }}
                  >
                    {p.status}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-2 truncate">{p.name}</h3>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: p.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${p.progress}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">{p.progress}%</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right column — Goals + AI Insights */}
        <div className="space-y-4">
          <h2 className="text-sm font-display font-semibold text-secondary-foreground flex items-center gap-2">
            <Target size={15} className="text-agent-thinking" /> Today's Goals
          </h2>
          <div className="rounded-xl border border-border p-4 bg-card space-y-2.5">
            {[
              { title: 'Complete API integration', done: true },
              { title: 'Review pull requests', done: true },
              { title: 'Health check-in', done: false },
              { title: 'Finance weekly review', done: false },
              { title: 'Read 30 pages', done: false },
            ].map((g, i) => (
              <div key={i} className="flex items-center gap-3 py-1">
                <div
                  className={`w-4.5 h-4.5 rounded-full border-[1.5px] flex items-center justify-center flex-shrink-0 transition-all ${
                    g.done
                      ? 'bg-accent border-accent'
                      : 'border-muted-foreground/30 hover:border-primary'
                  }`}
                  style={{ width: 18, height: 18 }}
                >
                  {g.done && <Check size={10} className="text-background" />}
                </div>
                <span className={`text-sm ${g.done ? 'line-through text-muted-foreground' : 'text-secondary-foreground'}`}>
                  {g.title}
                </span>
              </div>
            ))}
          </div>

          <h2 className="text-sm font-display font-semibold text-secondary-foreground flex items-center gap-2 pt-2">
            <Bot size={15} className="text-primary" /> AI Insights
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Productivity', icon: TrendingUp, color: 'hsl(var(--primary))' },
              { label: 'Daily Plan', icon: Target, color: 'hsl(var(--accent))' },
              { label: 'Health', icon: Heart, color: 'hsl(var(--agent-concerned))' },
              { label: 'Finance', icon: Zap, color: 'hsl(var(--agent-thinking))' },
            ].map((a) => (
              <button
                key={a.label}
                className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-card hover:bg-secondary/50 transition-colors text-left"
              >
                <a.icon size={13} style={{ color: a.color }} />
                <span className="text-xs text-secondary-foreground">{a.label}</span>
              </button>
            ))}
          </div>

          {/* Agent presence indicator */}
          <div className="rounded-xl border border-border p-4 bg-card mt-4">
            <div className="flex items-center gap-3">
              <AgentOrb emotion={agentEmotion} size="md" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground font-mono">Agent Status</p>
                <p className="text-sm text-secondary-foreground capitalize">{agentEmotion}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
