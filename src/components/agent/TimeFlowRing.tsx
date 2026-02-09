import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface TimeEvent {
  id: string;
  label: string;
  minutesFromNow: number; // negative = past, positive = future
  type: 'past' | 'now' | 'approaching' | 'future';
  importance: 'low' | 'medium' | 'high';
}

interface TimeFlowRingProps {
  events: TimeEvent[];
  size?: number;
}

export function TimeFlowRing({ events, size = 280 }: TimeFlowRingProps) {
  const radius = size / 2 - 40;
  const centerX = size / 2;
  const centerY = size / 2;

  // Generate flowing arc path
  const arcPath = useMemo(() => {
    const startAngle = -Math.PI * 0.75; // 7 o'clock position
    const endAngle = Math.PI * 0.75; // 5 o'clock position
    
    const startX = centerX + radius * Math.cos(startAngle);
    const startY = centerY + radius * Math.sin(startAngle);
    const endX = centerX + radius * Math.cos(endAngle);
    const endY = centerY + radius * Math.sin(endAngle);

    return `M ${startX} ${startY} A ${radius} ${radius} 0 1 1 ${endX} ${endY}`;
  }, [radius, centerX, centerY]);

  // Position events along the arc
  const positionedEvents = useMemo(() => {
    return events.map((event) => {
      // Map minutes to position on arc (-60 to +120 minutes = full arc)
      const normalizedPos = (event.minutesFromNow + 60) / 180;
      const clampedPos = Math.max(0, Math.min(1, normalizedPos));
      
      const startAngle = -Math.PI * 0.75;
      const angleRange = Math.PI * 1.5;
      const angle = startAngle + clampedPos * angleRange;
      
      const eventRadius = radius + (event.type === 'now' ? 0 : event.type === 'approaching' ? 5 : 10);
      const x = centerX + eventRadius * Math.cos(angle);
      const y = centerY + eventRadius * Math.sin(angle);

      return { ...event, x, y, angle };
    });
  }, [events, radius, centerX, centerY]);

  const getEventColor = (type: TimeEvent['type'], importance: TimeEvent['importance']) => {
    if (type === 'now') return 'hsl(var(--primary))';
    if (type === 'approaching') {
      if (importance === 'high') return 'hsl(var(--agent-concerned))';
      return 'hsl(var(--agent-thinking))';
    }
    if (type === 'past') return 'hsl(var(--muted-foreground))';
    return 'hsl(var(--secondary-foreground))';
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0">
        {/* Background arc track */}
        <motion.path
          d={arcPath}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.5 }}
          transition={{ duration: 2, ease: 'easeOut' }}
        />

        {/* Flowing time indicator */}
        <motion.path
          d={arcPath}
          fill="none"
          stroke="url(#timeGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="8 12"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 3, ease: 'easeOut' }}
        />

        {/* Gradient definition */}
        <defs>
          <linearGradient id="timeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.3" />
            <stop offset="40%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
            <stop offset="60%" stopColor="hsl(var(--agent-thinking))" stopOpacity="0.6" />
            <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* "Now" marker pulse */}
        <motion.circle
          cx={centerX + radius * Math.cos(-Math.PI * 0.25)}
          cy={centerY + radius * Math.sin(-Math.PI * 0.25)}
          r="6"
          fill="hsl(var(--primary))"
          animate={{
            r: [5, 8, 5],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </svg>

      {/* Event markers */}
      {positionedEvents.map((event, i) => (
        <motion.div
          key={event.id}
          className="absolute flex flex-col items-center"
          style={{
            left: event.x,
            top: event.y,
            transform: 'translate(-50%, -50%)',
          }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1 + 0.5, duration: 0.5 }}
        >
          {/* Event dot */}
          <motion.div
            className="rounded-full"
            style={{
              width: event.type === 'now' ? 12 : event.importance === 'high' ? 8 : 6,
              height: event.type === 'now' ? 12 : event.importance === 'high' ? 8 : 6,
              background: getEventColor(event.type, event.importance),
              boxShadow: event.type === 'approaching' && event.importance === 'high'
                ? `0 0 12px ${getEventColor(event.type, event.importance)}`
                : 'none',
            }}
            animate={
              event.type === 'approaching'
                ? { scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }
                : {}
            }
            transition={{
              duration: event.importance === 'high' ? 1.5 : 2.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Event label (only for important or approaching events) */}
          {(event.type === 'now' || event.type === 'approaching' || event.importance === 'high') && (
            <motion.span
              className="absolute whitespace-nowrap text-[9px] font-mono mt-4"
              style={{
                color: getEventColor(event.type, event.importance),
                top: '100%',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: event.type === 'past' ? 0.4 : 0.9 }}
              transition={{ delay: i * 0.1 + 0.8 }}
            >
              {event.label}
            </motion.span>
          )}
        </motion.div>
      ))}

      {/* Center time display */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <motion.p
            className="text-2xl font-display font-bold text-foreground tabular-nums"
            animate={{ opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
          </motion.p>
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mt-1">
            now
          </p>
        </div>
      </div>
    </div>
  );
}
