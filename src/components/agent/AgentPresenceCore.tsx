import { motion, useAnimation } from 'framer-motion';
import { useEffect, useMemo } from 'react';

export type AgentState = 'idle' | 'thinking' | 'executing' | 'intervening' | 'waiting' | 'listening';

interface AgentPresenceCoreProps {
  state: AgentState;
  size?: number;
}

const stateConfig: Record<AgentState, {
  colors: string[];
  breatheDuration: number;
  layerCount: number;
  rotationSpeed: number;
  pulseIntensity: number;
}> = {
  idle: {
    colors: ['hsla(200, 70%, 50%, 0.15)', 'hsla(200, 70%, 50%, 0.08)', 'hsla(200, 70%, 50%, 0.03)'],
    breatheDuration: 5,
    layerCount: 3,
    rotationSpeed: 60,
    pulseIntensity: 0.08,
  },
  thinking: {
    colors: ['hsla(38, 92%, 55%, 0.25)', 'hsla(38, 92%, 55%, 0.15)', 'hsla(38, 92%, 55%, 0.08)', 'hsla(32, 85%, 48%, 0.05)'],
    breatheDuration: 2,
    layerCount: 4,
    rotationSpeed: 20,
    pulseIntensity: 0.15,
  },
  executing: {
    colors: ['hsla(200, 70%, 55%, 0.3)', 'hsla(200, 70%, 50%, 0.2)', 'hsla(200, 70%, 45%, 0.1)'],
    breatheDuration: 1.2,
    layerCount: 3,
    rotationSpeed: 8,
    pulseIntensity: 0.12,
  },
  intervening: {
    colors: ['hsla(12, 80%, 58%, 0.35)', 'hsla(12, 80%, 58%, 0.2)', 'hsla(12, 80%, 58%, 0.1)'],
    breatheDuration: 1.5,
    layerCount: 3,
    rotationSpeed: 15,
    pulseIntensity: 0.18,
  },
  waiting: {
    colors: ['hsla(160, 55%, 45%, 0.2)', 'hsla(160, 55%, 45%, 0.1)', 'hsla(160, 55%, 45%, 0.05)'],
    breatheDuration: 3,
    layerCount: 3,
    rotationSpeed: 40,
    pulseIntensity: 0.1,
  },
  listening: {
    colors: ['hsla(280, 60%, 55%, 0.3)', 'hsla(280, 60%, 55%, 0.18)', 'hsla(280, 60%, 55%, 0.08)'],
    breatheDuration: 0.8,
    layerCount: 4,
    rotationSpeed: 12,
    pulseIntensity: 0.2,
  },
};

export function AgentPresenceCore({ state, size = 180 }: AgentPresenceCoreProps) {
  const config = stateConfig[state];
  const controls = useAnimation();

  useEffect(() => {
    controls.start({
      scale: [1, 1 + config.pulseIntensity, 1],
      transition: {
        duration: config.breatheDuration,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    });
  }, [state, config, controls]);

  const layers = useMemo(() => {
    return Array.from({ length: config.layerCount }, (_, i) => {
      const layerSize = size * (0.4 + (i * 0.2));
      const delay = i * 0.15;
      const direction = i % 2 === 0 ? 1 : -1;

      return (
        <motion.div
          key={`${state}-layer-${i}`}
          className="absolute rounded-full"
          style={{
            width: layerSize,
            height: layerSize,
            background: `radial-gradient(circle, ${config.colors[i] || config.colors[0]}, transparent 70%)`,
          }}
          animate={{
            scale: [1, 1 + config.pulseIntensity * (1 - i * 0.2), 1],
            rotate: [0, 360 * direction],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            scale: {
              duration: config.breatheDuration + delay,
              repeat: Infinity,
              ease: 'easeInOut',
            },
            rotate: {
              duration: config.rotationSpeed * (1 + i * 0.5),
              repeat: Infinity,
              ease: 'linear',
            },
            opacity: {
              duration: config.breatheDuration * 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay,
            },
          }}
        />
      );
    });
  }, [state, config, size]);

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Ambient glow */}
      <motion.div
        className="absolute rounded-full blur-3xl"
        style={{
          width: size * 1.2,
          height: size * 1.2,
          background: config.colors[0],
        }}
        animate={{
          scale: [0.9, 1.1, 0.9],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: config.breatheDuration * 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Rotating layers */}
      {layers}

      {/* Core orb */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size * 0.25,
          height: size * 0.25,
          background: `radial-gradient(circle at 35% 35%, 
            hsla(0, 0%, 100%, 0.25), 
            ${config.colors[0].replace(/[\d.]+\)$/, '0.8)')}, 
            ${config.colors[0].replace(/[\d.]+\)$/, '0.4)')}
          )`,
          boxShadow: `0 0 ${size * 0.2}px ${config.colors[0]}`,
        }}
        animate={controls}
      />

      {/* Inner highlight */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size * 0.12,
          height: size * 0.12,
          background: 'radial-gradient(circle, hsla(0, 0%, 100%, 0.5), transparent)',
          top: size * 0.42,
          left: size * 0.44,
        }}
        animate={{
          opacity: [0.3, 0.7, 0.3],
        }}
        transition={{
          duration: config.breatheDuration * 0.7,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}
