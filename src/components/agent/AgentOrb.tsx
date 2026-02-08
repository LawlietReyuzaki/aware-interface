import { motion } from 'framer-motion';
import type { AgentEmotion } from '@/hooks/useAgentState';

interface AgentOrbProps {
  emotion: AgentEmotion;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  showPulse?: boolean;
}

const emotionConfig: Record<AgentEmotion, {
  gradient: string[];
  shadow: string;
  breatheDuration: number;
  scale: [number, number];
}> = {
  calm: {
    gradient: ['hsl(200, 70%, 50%)', 'hsl(210, 65%, 40%)', 'hsl(190, 60%, 55%)'],
    shadow: 'hsla(200, 70%, 50%, 0.25)',
    breatheDuration: 4,
    scale: [1, 1.06],
  },
  thinking: {
    gradient: ['hsl(38, 92%, 55%)', 'hsl(32, 85%, 48%)', 'hsl(45, 88%, 58%)'],
    shadow: 'hsla(38, 92%, 55%, 0.3)',
    breatheDuration: 1.8,
    scale: [0.97, 1.05],
  },
  concerned: {
    gradient: ['hsl(12, 80%, 58%)', 'hsl(8, 75%, 50%)', 'hsl(18, 82%, 55%)'],
    shadow: 'hsla(12, 80%, 58%, 0.25)',
    breatheDuration: 2.5,
    scale: [0.99, 1.04],
  },
  firm: {
    gradient: ['hsl(220, 15%, 72%)', 'hsl(220, 20%, 60%)', 'hsl(215, 12%, 78%)'],
    shadow: 'hsla(220, 15%, 72%, 0.2)',
    breatheDuration: 1,
    scale: [1, 1.02],
  },
  success: {
    gradient: ['hsl(160, 55%, 42%)', 'hsl(165, 50%, 36%)', 'hsl(155, 60%, 48%)'],
    shadow: 'hsla(160, 55%, 42%, 0.25)',
    breatheDuration: 3,
    scale: [1, 1.05],
  },
};

const sizeMap = {
  sm: { container: 32, inner: 20 },
  md: { container: 44, inner: 28 },
  lg: { container: 64, inner: 40 },
};

export function AgentOrb({ emotion, size = 'md', onClick, showPulse = true }: AgentOrbProps) {
  const config = emotionConfig[emotion];
  const dims = sizeMap[size];

  return (
    <motion.button
      onClick={onClick}
      className="relative flex items-center justify-center cursor-pointer group"
      style={{ width: dims.container, height: dims.container }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      title={`Agent is ${emotion}`}
    >
      {/* Outer glow ring */}
      {showPulse && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${config.shadow}, transparent 70%)`,
          }}
          animate={{
            scale: config.scale,
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: config.breatheDuration,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Main orb */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: dims.inner,
          height: dims.inner,
          background: `radial-gradient(circle at 35% 35%, ${config.gradient[2]}, ${config.gradient[0]}, ${config.gradient[1]})`,
          boxShadow: `0 0 ${dims.inner * 0.6}px ${config.shadow}`,
        }}
        animate={{
          scale: config.scale,
        }}
        transition={{
          duration: config.breatheDuration,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Inner highlight */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: dims.inner * 0.4,
          height: dims.inner * 0.4,
          background: `radial-gradient(circle, hsla(0, 0%, 100%, 0.35), transparent)`,
          top: dims.container * 0.28,
          left: dims.container * 0.32,
        }}
        animate={{
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: config.breatheDuration * 0.8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.button>
  );
}
