import { useState, useEffect, useCallback } from 'react';

export type AgentEmotion = 'calm' | 'thinking' | 'concerned' | 'firm' | 'success';

export interface AgentState {
  emotion: AgentEmotion;
  currentTask: string | null;
  activationReason: string | null;
  isActive: boolean;
  trustLevel: number; // 0-100, internal metric
}

export interface CognitiveEntry {
  id: string;
  type: 'noticed' | 'compared' | 'decided' | 'waiting' | 'adjusted' | 'intervened';
  message: string;
  timestamp: Date;
  emotion: AgentEmotion;
}

export interface AnticipationItem {
  id: string;
  message: string;
  timeUntil: string;
  type: 'action' | 'reminder' | 'warning';
  confidence: number; // 0-1
}

// Mock data for demonstration - in production this would come from the API
const MOCK_COGNITIVE_ENTRIES: CognitiveEntry[] = [
  { id: '1', type: 'noticed', message: 'Sustained focus detected — 47 minutes uninterrupted', timestamp: new Date(Date.now() - 180000), emotion: 'calm' },
  { id: '2', type: 'compared', message: 'Productivity 23% higher than weekly average', timestamp: new Date(Date.now() - 360000), emotion: 'success' },
  { id: '3', type: 'decided', message: 'Deferring health check-in — you\'re in deep work', timestamp: new Date(Date.now() - 540000), emotion: 'calm' },
  { id: '4', type: 'adjusted', message: 'Reduced notification frequency based on flow state', timestamp: new Date(Date.now() - 900000), emotion: 'calm' },
  { id: '5', type: 'noticed', message: 'Task completion rate improved 3 days running', timestamp: new Date(Date.now() - 1800000), emotion: 'success' },
  { id: '6', type: 'waiting', message: 'Pending your review on "API Integration" task', timestamp: new Date(Date.now() - 2700000), emotion: 'thinking' },
  { id: '7', type: 'decided', message: 'Scheduled finance review for after lunch', timestamp: new Date(Date.now() - 3600000), emotion: 'thinking' },
];

const MOCK_ANTICIPATION: AnticipationItem[] = [
  { id: '1', message: 'Health check-in approaching', timeUntil: '12 min', type: 'reminder', confidence: 0.85 },
  { id: '2', message: 'Spending pattern review ready', timeUntil: '45 min', type: 'action', confidence: 0.7 },
  { id: '3', message: 'Task deadline: API Integration', timeUntil: '2h', type: 'warning', confidence: 0.95 },
];

export function useAgentState() {
  const [state, setState] = useState<AgentState>({
    emotion: 'calm',
    currentTask: null,
    activationReason: null,
    isActive: true,
    trustLevel: 65,
  });

  const [cognitiveTimeline, setCognitiveTimeline] = useState<CognitiveEntry[]>(MOCK_COGNITIVE_ENTRIES);
  const [anticipations, setAnticipations] = useState<AnticipationItem[]>(MOCK_ANTICIPATION);

  // Simulate agent state transitions
  useEffect(() => {
    const emotions: AgentEmotion[] = ['calm', 'calm', 'calm', 'thinking', 'calm', 'success'];
    let idx = 0;

    const interval = setInterval(() => {
      idx = (idx + 1) % emotions.length;
      setState(prev => ({
        ...prev,
        emotion: emotions[idx],
        currentTask: emotions[idx] === 'thinking' ? 'Analyzing productivity patterns...' : null,
      }));
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  // Simulate new cognitive entries appearing
  useEffect(() => {
    const messages = [
      { type: 'noticed' as const, message: 'You\'ve been consistent today', emotion: 'success' as const },
      { type: 'adjusted' as const, message: 'Optimizing reminder timing', emotion: 'thinking' as const },
      { type: 'decided' as const, message: 'Prioritizing project deadlines', emotion: 'calm' as const },
    ];

    const interval = setInterval(() => {
      const msg = messages[Math.floor(Math.random() * messages.length)];
      const entry: CognitiveEntry = {
        id: Date.now().toString(),
        ...msg,
        timestamp: new Date(),
      };
      setCognitiveTimeline(prev => [entry, ...prev].slice(0, 20));
    }, 25000);

    return () => clearInterval(interval);
  }, []);

  const setEmotion = useCallback((emotion: AgentEmotion) => {
    setState(prev => ({ ...prev, emotion }));
  }, []);

  return {
    ...state,
    cognitiveTimeline,
    anticipations,
    setEmotion,
    setAnticipations,
  };
}
