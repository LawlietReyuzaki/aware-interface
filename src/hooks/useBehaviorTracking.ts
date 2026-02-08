import { useState, useEffect, useRef, useCallback } from 'react';

export interface BehaviorState {
  isInFlow: boolean;
  focusDuration: number; // minutes
  consistency: number; // 0-100
  taskSkipCount: number;
  inactivityDuration: number; // seconds
  sessionMood: 'calm' | 'productive' | 'struggling' | 'neutral';
}

export function useBehaviorTracking() {
  const [behavior, setBehavior] = useState<BehaviorState>({
    isInFlow: false,
    focusDuration: 0,
    consistency: 72,
    taskSkipCount: 0,
    inactivityDuration: 0,
    sessionMood: 'productive',
  });

  const lastActivity = useRef(Date.now());
  const focusStart = useRef(Date.now());

  // Track user activity
  useEffect(() => {
    const onActivity = () => {
      lastActivity.current = Date.now();
      setBehavior(prev => ({ ...prev, inactivityDuration: 0 }));
    };

    window.addEventListener('mousemove', onActivity, { passive: true });
    window.addEventListener('keydown', onActivity, { passive: true });
    window.addEventListener('click', onActivity, { passive: true });

    return () => {
      window.removeEventListener('mousemove', onActivity);
      window.removeEventListener('keydown', onActivity);
      window.removeEventListener('click', onActivity);
    };
  }, []);

  // Update inactivity and flow state
  useEffect(() => {
    const interval = setInterval(() => {
      const inactivity = Math.floor((Date.now() - lastActivity.current) / 1000);
      const focusMin = Math.floor((Date.now() - focusStart.current) / 60000);

      setBehavior(prev => ({
        ...prev,
        inactivityDuration: inactivity,
        focusDuration: focusMin,
        isInFlow: focusMin > 15 && inactivity < 120 && prev.taskSkipCount < 2,
        sessionMood: focusMin > 25 ? 'productive' : inactivity > 300 ? 'struggling' : 'neutral',
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const recordTaskSkip = useCallback(() => {
    setBehavior(prev => ({ ...prev, taskSkipCount: prev.taskSkipCount + 1 }));
  }, []);

  const recordTaskComplete = useCallback(() => {
    setBehavior(prev => ({
      ...prev,
      consistency: Math.min(100, prev.consistency + 3),
      taskSkipCount: Math.max(0, prev.taskSkipCount - 1),
    }));
  }, []);

  return { behavior, recordTaskSkip, recordTaskComplete };
}
