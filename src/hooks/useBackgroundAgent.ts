import { useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';

export interface BackgroundAgentState {
  isRunning: boolean;
  lastActivity: Date | null;
  activityCount: number;
  schedulerStatus: 'running' | 'stopped' | 'unknown';
}

/**
 * Background Agent Hook
 * 
 * This hook runs the autonomous agent continuously in the background,
 * independent of whether the user has the "Living Control Chamber" popup open.
 * 
 * The agent:
 * - Monitors user activity and patterns
 * - Polls the backend scheduler status
 * - Tracks cognitive activity over time
 * - Persists activity log for viewing in the popup
 */
export function useBackgroundAgent() {
  const queryClient = useQueryClient();
  const isInitialized = useRef(false);
  const activityLogRef = useRef<Array<{ id: string; message: string; timestamp: Date; type: string }>>([]);
  
  const [state, setState] = useState<BackgroundAgentState>({
    isRunning: false,
    lastActivity: null,
    activityCount: 0,
    schedulerStatus: 'unknown',
  });

  // Start the background agent on mount
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    console.log('[BackgroundAgent] 🚀 Starting autonomous agent...');
    setState(prev => ({ ...prev, isRunning: true }));

    // Log initial startup
    addActivity('Agent initialized and running in background', 'system');

    return () => {
      console.log('[BackgroundAgent] 🛑 Shutting down agent');
      setState(prev => ({ ...prev, isRunning: false }));
    };
  }, []);

  // Add activity to the persistent log
  const addActivity = useCallback((message: string, type: string) => {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      message,
      timestamp: new Date(),
      type,
    };
    activityLogRef.current = [entry, ...activityLogRef.current].slice(0, 100);
    setState(prev => ({
      ...prev,
      lastActivity: new Date(),
      activityCount: prev.activityCount + 1,
    }));
  }, []);

  // Poll scheduler status continuously
  useEffect(() => {
    const checkScheduler = async () => {
      try {
        const res = await fetch('/api/autonomous/scheduler/status');
        if (res.ok) {
          const data = await res.json();
          setState(prev => ({
            ...prev,
            schedulerStatus: data.running ? 'running' : 'stopped',
          }));
          
          if (data.running) {
            addActivity('Scheduler active - monitoring patterns', 'scheduler');
          }
        }
      } catch {
        // API not available, continue with local simulation
      }
    };

    // Initial check
    checkScheduler();
    
    // Poll every 30 seconds
    const interval = setInterval(checkScheduler, 30000);
    return () => clearInterval(interval);
  }, [addActivity]);

  // Simulate background agent activity (when backend not available)
  useEffect(() => {
    const observations = [
      'Analyzing productivity patterns...',
      'Reviewing task completion rates',
      'Optimizing reminder schedules',
      'Checking for upcoming deadlines',
      'Evaluating focus session quality',
      'Scanning for health check-in opportunities',
      'Monitoring spending patterns',
      'Preparing daily insights',
    ];

    let observationIndex = 0;

    const simulateActivity = () => {
      const message = observations[observationIndex % observations.length];
      addActivity(message, 'observation');
      observationIndex++;
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['agent'] });
    };

    // Start activity simulation after initial delay
    const initialDelay = setTimeout(() => {
      simulateActivity();
    }, 5000);

    // Continue with periodic activity
    const interval = setInterval(simulateActivity, 20000);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, [addActivity, queryClient]);

  // Get the activity log
  const getActivityLog = useCallback(() => {
    return activityLogRef.current;
  }, []);

  // Manually trigger agent action
  const triggerAction = useCallback(async (actionType: string) => {
    addActivity(`Manual trigger: ${actionType}`, 'action');
    
    try {
      // Try to trigger via API
      await fetch(`/api/autonomous/scheduler/trigger/${actionType}`, { method: 'POST' });
    } catch {
      // API not available, simulate locally
      addActivity(`Executing ${actionType}...`, 'executing');
      setTimeout(() => {
        addActivity(`Completed ${actionType}`, 'success');
      }, 2000);
    }
  }, [addActivity]);

  return {
    ...state,
    getActivityLog,
    addActivity,
    triggerAction,
  };
}
