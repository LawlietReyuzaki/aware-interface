import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, GitCompare, Lightbulb, Clock, Settings, Zap } from 'lucide-react';
import type { CognitiveEntry } from '@/hooks/useAgentState';
import { AgentOrb } from './AgentOrb';

interface CognitiveTimelineProps {
  entries: CognitiveEntry[];
  open: boolean;
  onClose: () => void;
  agentEmotion: 'calm' | 'thinking' | 'concerned' | 'firm' | 'success';
}

const typeConfig: Record<CognitiveEntry['type'], { icon: any; label: string; color: string }> = {
  noticed: { icon: Eye, label: 'Noticed', color: 'hsl(var(--agent-calm))' },
  compared: { icon: GitCompare, label: 'Compared', color: 'hsl(var(--agent-thinking))' },
  decided: { icon: Lightbulb, label: 'Decided', color: 'hsl(var(--agent-success))' },
  waiting: { icon: Clock, label: 'Waiting', color: 'hsl(var(--muted-foreground))' },
  adjusted: { icon: Settings, label: 'Adjusted', color: 'hsl(var(--primary))' },
  intervened: { icon: Zap, label: 'Intervened', color: 'hsl(var(--agent-concerned))' },
};

function formatTime(date: Date) {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString();
}

export function CognitiveTimeline({ entries, open, onClose, agentEmotion }: CognitiveTimelineProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="fixed top-0 right-0 h-screen w-[380px] z-50 flex flex-col border-l border-border"
          style={{ background: 'hsl(var(--surface-sunken))' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <AgentOrb emotion={agentEmotion} size="sm" />
              <div>
                <h3 className="text-sm font-display font-semibold text-foreground">Agent Mind</h3>
                <p className="text-xs text-muted-foreground">Decision breadcrumbs</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Timeline entries */}
          <div className="flex-1 overflow-auto px-5 py-4">
            <div className="space-y-1">
              <AnimatePresence initial={false}>
                {entries.map((entry, i) => {
                  const config = typeConfig[entry.type];
                  const Icon = config.icon;

                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: -10, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3, delay: i === 0 ? 0 : 0 }}
                      className="relative flex gap-3 py-3"
                    >
                      {/* Timeline line */}
                      {i < entries.length - 1 && (
                        <div className="absolute left-[11px] top-10 bottom-0 w-px bg-border" />
                      )}

                      {/* Icon */}
                      <div
                        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5"
                        style={{
                          background: `${config.color}15`,
                          border: `1px solid ${config.color}30`,
                        }}
                      >
                        <Icon size={12} style={{ color: config.color }} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span
                            className="text-[10px] font-mono font-medium uppercase tracking-wider"
                            style={{ color: config.color }}
                          >
                            {config.label}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {formatTime(entry.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-secondary-foreground leading-relaxed">
                          {entry.message}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {entries.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-sm text-muted-foreground">
                    Agent is observing. Decisions will appear here.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-border">
            <p className="text-[10px] text-muted-foreground text-center">
              {entries.length} decisions tracked this session
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
