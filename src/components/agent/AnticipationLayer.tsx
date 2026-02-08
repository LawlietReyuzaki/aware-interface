import { motion, AnimatePresence } from 'framer-motion';
import { Clock, AlertTriangle, Zap } from 'lucide-react';
import type { AnticipationItem } from '@/hooks/useAgentState';

interface AnticipationLayerProps {
  items: AnticipationItem[];
}

const typeConfig: Record<AnticipationItem['type'], { icon: any; color: string }> = {
  action: { icon: Zap, color: 'hsl(var(--primary))' },
  reminder: { icon: Clock, color: 'hsl(var(--agent-thinking))' },
  warning: { icon: AlertTriangle, color: 'hsl(var(--agent-concerned))' },
};

export function AnticipationLayer({ items }: AnticipationLayerProps) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
        <span className="w-1 h-1 rounded-full bg-primary pulse-subtle" />
        Approaching
      </p>
      <div className="grid grid-cols-3 gap-2">
        <AnimatePresence>
          {items.map((item, i) => {
            const config = typeConfig[item.type];
            const Icon = config.icon;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 6, filter: 'blur(4px)' }}
                animate={{
                  opacity: item.confidence,
                  y: 0,
                  filter: 'blur(0px)',
                }}
                exit={{ opacity: 0, y: -4 }}
                transition={{
                  duration: 1.2,
                  delay: i * 0.15,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                className="rounded-xl border border-border p-3 transition-colors hover:bg-secondary/50"
                style={{
                  background: `linear-gradient(135deg, hsl(var(--card)), hsl(var(--card)) 80%, ${config.color}08)`,
                }}
              >
                <div className="flex items-start gap-2">
                  <div
                    className="p-1.5 rounded-lg mt-0.5"
                    style={{ background: `${config.color}12` }}
                  >
                    <Icon size={12} style={{ color: config.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-secondary-foreground leading-snug">{item.message}</p>
                    <p className="text-[10px] font-mono mt-1.5" style={{ color: config.color }}>
                      in {item.timeUntil}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
