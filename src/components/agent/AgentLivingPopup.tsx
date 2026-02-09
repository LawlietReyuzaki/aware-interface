import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { AgentPresenceCore, type AgentState } from './AgentPresenceCore';
import { TimeFlowRing } from './TimeFlowRing';
import { CognitiveStream, type CognitiveThought } from './CognitiveStream';
import { InterventionLayer } from './InterventionLayer';
import { useAgentApi } from '@/hooks/useAgentApi';

interface AgentLivingPopupProps {
  open: boolean;
  onClose: () => void;
}

// Simulated agent state machine
const AGENT_STATES: AgentState[] = ['idle', 'thinking', 'executing', 'idle', 'thinking', 'idle'];
const COGNITIVE_THOUGHTS: Omit<CognitiveThought, 'id' | 'timestamp'>[] = [
  { text: 'Session initialized. Loading context from last activity...', type: 'observation' },
  { text: 'Task deadline approaching in 2 hours', type: 'observation' },
  { text: 'Evaluating priority against current focus state', type: 'evaluation' },
  { text: 'User appears to be in productive flow', type: 'observation' },
  { text: 'Deferring interruption — focus preservation takes priority', type: 'decision' },
  { text: 'Scheduling reminder for natural break point', type: 'action' },
  { text: 'Monitoring spending pattern from last 48 hours', type: 'observation' },
  { text: 'Threshold exceeded. Preparing intervention.', type: 'evaluation' },
  { text: 'Financial review queued for next idle period', type: 'decision' },
  { text: 'Health check-in window approaching', type: 'observation' },
  { text: 'Waiting for user acknowledgment', type: 'waiting' },
];

export function AgentLivingPopup({ open, onClose }: AgentLivingPopupProps) {
  // Real API data
  const { agentState: apiState, thoughts: apiThoughts, isLoading } = useAgentApi();
  
  const [agentState, setAgentState] = useState<AgentState>('idle');
  const [thoughts, setThoughts] = useState<CognitiveThought[]>([]);
  const [interventionActive, setInterventionActive] = useState(false);
  const [interventionMessage, setInterventionMessage] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Sync API state to local state
  useEffect(() => {
    if (apiState && apiState !== agentState) {
      setAgentState(apiState);
    }
  }, [apiState]);

  // Merge API thoughts with local state
  useEffect(() => {
    if (apiThoughts.length > 0) {
      setThoughts(apiThoughts);
    }
  }, [apiThoughts]);

  // Time events for the ring
  const timeEvents = useMemo(() => [
    { id: '1', label: 'Session start', minutesFromNow: -45, type: 'past' as const, importance: 'low' as const },
    { id: '2', label: 'Task completed', minutesFromNow: -15, type: 'past' as const, importance: 'medium' as const },
    { id: '3', label: 'Now', minutesFromNow: 0, type: 'now' as const, importance: 'high' as const },
    { id: '4', label: 'Health check', minutesFromNow: 12, type: 'approaching' as const, importance: 'medium' as const },
    { id: '5', label: 'Task deadline', minutesFromNow: 45, type: 'approaching' as const, importance: 'high' as const },
    { id: '6', label: 'Finance review', minutesFromNow: 90, type: 'future' as const, importance: 'low' as const },
  ], []);

  // Fallback: simulate agent state transitions if API isn't returning data
  useEffect(() => {
    if (!open || apiThoughts.length > 0) return;

    // Only simulate if no real data
    const FALLBACK_THOUGHTS: Omit<CognitiveThought, 'id' | 'timestamp'>[] = [
      { text: 'Session initialized. Loading context from last activity...', type: 'observation' },
      { text: 'Task deadline approaching in 2 hours', type: 'observation' },
      { text: 'Evaluating priority against current focus state', type: 'evaluation' },
      { text: 'User appears to be in productive flow', type: 'observation' },
      { text: 'Deferring interruption — focus preservation takes priority', type: 'decision' },
    ];

    const initialThoughts = FALLBACK_THOUGHTS.slice(0, 3).map((t, i) => ({
      ...t,
      id: `initial-${i}`,
      timestamp: new Date(Date.now() - (3 - i) * 20000),
    }));
    setThoughts(initialThoughts);

    let idx = 3;
    const interval = setInterval(() => {
      const thought = FALLBACK_THOUGHTS[idx % FALLBACK_THOUGHTS.length];
      setThoughts((prev) => [
        { ...thought, id: `thought-${Date.now()}`, timestamp: new Date() },
        ...prev,
      ].slice(0, 12));
      idx++;
    }, 8000);

    return () => clearInterval(interval);
  }, [open, apiThoughts.length]);

  // Elapsed time counter
  useEffect(() => {
    if (!open) return;

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [open]);

  // Simulate intervention trigger
  useEffect(() => {
    if (!open) return;

    const timeout = setTimeout(() => {
      setInterventionActive(true);
      setAgentState('intervening');
      setInterventionMessage("I've noticed you've been working for over an hour. Would you like a brief wellness check, or should I schedule it for later?");
    }, 25000);

    return () => clearTimeout(timeout);
  }, [open]);

  const handleInterventionRespond = useCallback((response: string) => {
    console.log('User responded:', response);
    setInterventionActive(false);
    setAgentState('executing');
    
    setThoughts((prev): CognitiveThought[] => [
      { id: `response-${Date.now()}`, text: `User responded: "${response}"`, type: 'observation' as const, timestamp: new Date() },
      { id: `action-${Date.now()}`, text: 'Processing response and adjusting schedule...', type: 'action' as const, timestamp: new Date() },
      ...prev,
    ].slice(0, 12));

    setTimeout(() => setAgentState('idle'), 3000);
  }, []);

  const handleInterventionDismiss = useCallback(() => {
    setInterventionActive(false);
    setAgentState('idle');
    
    setThoughts((prev): CognitiveThought[] => [
      { id: `defer-${Date.now()}`, text: 'User deferred. Rescheduling for next opportunity.', type: 'decision' as const, timestamp: new Date() },
      ...prev,
    ].slice(0, 12));
  }, []);

  const formatElapsed = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Living Control Chamber */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative w-full max-w-2xl h-[85vh] max-h-[700px] rounded-3xl overflow-hidden"
            style={{ background: 'hsl(var(--surface-sunken))' }}
          >
            {/* Close button */}
            <motion.button
              onClick={onClose}
              className="absolute top-4 right-4 z-30 p-2 rounded-full bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <X size={16} />
            </motion.button>

            {/* Elapsed time indicator */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="absolute top-4 left-4 z-30"
            >
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                Session
              </p>
              <p className="text-sm font-mono text-foreground tabular-nums">{formatElapsed(elapsedSeconds)}</p>
            </motion.div>

            {/* State indicator */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-30"
            >
              <motion.p
                key={agentState}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs font-mono text-muted-foreground capitalize"
              >
                {agentState === 'idle' ? 'Observing' : agentState}
              </motion.p>
            </motion.div>

            {/* Main content - morphing layout */}
            <div className="relative h-full flex flex-col">
              {/* Upper zone: Presence + Time */}
              <motion.div
                className="flex-shrink-0 pt-16 pb-4"
                animate={{
                  height: interventionActive ? '30%' : '45%',
                }}
                transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <div className="h-full flex items-center justify-center relative">
                  {/* Time flow ring (behind) */}
                  <motion.div
                    className="absolute"
                    animate={{
                      opacity: interventionActive ? 0.2 : 0.8,
                      scale: interventionActive ? 0.8 : 1,
                    }}
                    transition={{ duration: 0.8 }}
                  >
                    <TimeFlowRing events={timeEvents} size={320} />
                  </motion.div>

                  {/* Agent presence core (front) */}
                  <motion.div
                    className="relative z-10"
                    animate={{
                      scale: agentState === 'intervening' ? 1.2 : 1,
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    <AgentPresenceCore state={agentState} size={interventionActive ? 120 : 160} />
                  </motion.div>
                </div>
              </motion.div>

              {/* Lower zone: Cognitive stream */}
              <motion.div
                className="flex-1 px-6 pb-6 overflow-hidden"
                animate={{
                  opacity: interventionActive ? 0.3 : 1,
                }}
                transition={{ duration: 0.5 }}
              >
                <div className="h-full rounded-2xl border border-border p-4 overflow-hidden" style={{ background: 'hsl(var(--card))' }}>
                  <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-3">
                    Cognitive Activity
                  </p>
                  <div className="h-[calc(100%-24px)]">
                    <CognitiveStream thoughts={thoughts} maxVisible={6} />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Intervention layer (overlays everything when active) */}
            <InterventionLayer
              active={interventionActive}
              message={interventionMessage}
              onRespond={handleInterventionRespond}
              onDismiss={handleInterventionDismiss}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
