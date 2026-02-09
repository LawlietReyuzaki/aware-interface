import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export interface CognitiveThought {
  id: string;
  text: string;
  type: 'observation' | 'evaluation' | 'decision' | 'action' | 'waiting';
  timestamp: Date;
}

interface CognitiveStreamProps {
  thoughts: CognitiveThought[];
  maxVisible?: number;
}

const typeStyles: Record<CognitiveThought['type'], { color: string; prefix: string }> = {
  observation: { color: 'hsl(var(--muted-foreground))', prefix: '○' },
  evaluation: { color: 'hsl(var(--agent-thinking))', prefix: '◐' },
  decision: { color: 'hsl(var(--primary))', prefix: '◆' },
  action: { color: 'hsl(var(--accent))', prefix: '▸' },
  waiting: { color: 'hsl(var(--agent-concerned))', prefix: '◎' },
};

export function CognitiveStream({ thoughts, maxVisible = 5 }: CognitiveStreamProps) {
  const [visibleThoughts, setVisibleThoughts] = useState<CognitiveThought[]>([]);

  useEffect(() => {
    setVisibleThoughts(thoughts.slice(0, maxVisible));
  }, [thoughts, maxVisible]);

  return (
    <div className="relative h-full flex flex-col justify-end overflow-hidden">
      {/* Fade gradient at top */}
      <div 
        className="absolute top-0 left-0 right-0 h-12 pointer-events-none z-10"
        style={{
          background: 'linear-gradient(to bottom, hsl(var(--surface-sunken)), transparent)',
        }}
      />

      <div className="space-y-1 px-1">
        <AnimatePresence mode="popLayout">
          {visibleThoughts.map((thought, i) => {
            const style = typeStyles[thought.type];
            const isLatest = i === 0;
            const age = (Date.now() - thought.timestamp.getTime()) / 1000;
            const opacity = isLatest ? 1 : Math.max(0.3, 1 - (age / 120)); // Fade over 2 minutes

            return (
              <motion.div
                key={thought.id}
                layout
                initial={{ opacity: 0, x: -20, filter: 'blur(4px)' }}
                animate={{
                  opacity: opacity,
                  x: 0,
                  filter: 'blur(0px)',
                }}
                exit={{ opacity: 0, x: 20, filter: 'blur(4px)' }}
                transition={{
                  duration: 0.8,
                  ease: [0.25, 0.1, 0.25, 1],
                  layout: { duration: 0.4 },
                }}
                className="flex items-start gap-2 py-2"
              >
                <motion.span
                  className="text-sm font-mono mt-0.5 flex-shrink-0"
                  style={{ color: style.color }}
                  animate={
                    isLatest && thought.type === 'evaluation'
                      ? { opacity: [1, 0.5, 1] }
                      : {}
                  }
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                  }}
                >
                  {style.prefix}
                </motion.span>
                <p
                  className="text-sm leading-relaxed"
                  style={{
                    color: isLatest ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                  }}
                >
                  {thought.text}
                </p>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {visibleThoughts.length === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            className="text-sm text-muted-foreground text-center py-8"
          >
            Observing...
          </motion.p>
        )}
      </div>
    </div>
  );
}
