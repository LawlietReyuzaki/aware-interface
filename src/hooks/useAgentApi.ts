import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { CognitiveThought } from '@/components/agent/CognitiveStream';

interface AgentStatus {
  state: 'idle' | 'thinking' | 'executing' | 'intervening' | 'waiting';
  current_task?: string;
  emotion?: string;
  trust_level?: number;
}

interface TimelineEntry {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

const mapTimelineToThought = (entry: TimelineEntry): CognitiveThought => {
  const typeMap: Record<string, CognitiveThought['type']> = {
    observation: 'observation',
    evaluation: 'evaluation',
    decision: 'decision',
    action: 'action',
    waiting: 'waiting',
    noticed: 'observation',
    compared: 'evaluation',
    decided: 'decision',
    adjusted: 'action',
    intervened: 'action',
  };

  return {
    id: entry.id,
    text: entry.message,
    type: typeMap[entry.type] || 'observation',
    timestamp: new Date(entry.timestamp),
  };
};

export function useAgentStatus() {
  return useQuery<AgentStatus>({
    queryKey: ['agent', 'status'],
    queryFn: api.agent.status,
    refetchInterval: 5000,
    staleTime: 3000,
  });
}

export function useAgentTimeline(limit = 20) {
  return useQuery<CognitiveThought[]>({
    queryKey: ['activity', 'timeline', limit],
    queryFn: async () => {
      const entries: TimelineEntry[] = await api.activity.timeline(limit);
      return entries.map(mapTimelineToThought);
    },
    refetchInterval: 8000,
    staleTime: 5000,
  });
}

export function useAgentApi() {
  const statusQuery = useAgentStatus();
  const timelineQuery = useAgentTimeline();

  const mapStateToAgentState = (state?: string): 'idle' | 'thinking' | 'executing' | 'intervening' | 'waiting' => {
    if (!state) return 'idle';
    if (['idle', 'thinking', 'executing', 'intervening', 'waiting'].includes(state)) {
      return state as 'idle' | 'thinking' | 'executing' | 'intervening' | 'waiting';
    }
    return 'idle';
  };

  return {
    status: statusQuery.data,
    agentState: mapStateToAgentState(statusQuery.data?.state),
    thoughts: timelineQuery.data ?? [],
    isLoading: statusQuery.isLoading || timelineQuery.isLoading,
    error: statusQuery.error || timelineQuery.error,
    refetch: () => {
      statusQuery.refetch();
      timelineQuery.refetch();
    },
  };
}
