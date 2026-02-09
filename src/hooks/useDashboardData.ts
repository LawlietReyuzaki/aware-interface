import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

export interface DashboardData {
  productivity_score: number;
  streak_days: number;
  tasks_today: number;
  tasks_week: number;
  goals_met: string;
  health_checkins: number;
  projects: Array<{
    id: string;
    name: string;
    status: string;
    progress: number;
    color: string;
  }>;
  goals: Array<{
    id: string;
    title: string;
    completed: boolean;
  }>;
}

export function useDashboardData() {
  const dashboardQuery = useQuery({
    queryKey: ['dashboard'],
    queryFn: api.dashboard,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const productivityQuery = useQuery({
    queryKey: ['productivity', 'today'],
    queryFn: api.productivity.todayScore,
    staleTime: 30_000,
  });

  const streakQuery = useQuery({
    queryKey: ['productivity', 'streak'],
    queryFn: api.productivity.streak,
    staleTime: 60_000,
  });

  const goalsQuery = useQuery({
    queryKey: ['tasks', 'goals', 'today'],
    queryFn: () => api.tasks.goals.list(),
    staleTime: 30_000,
  });

  const projectsQuery = useQuery({
    queryKey: ['projects', 'active'],
    queryFn: () => api.projects.list('active'),
    staleTime: 60_000,
  });

  const isLoading =
    dashboardQuery.isLoading ||
    productivityQuery.isLoading ||
    streakQuery.isLoading;

  const error =
    dashboardQuery.error ||
    productivityQuery.error ||
    streakQuery.error;

  // Merge all data
  const data: DashboardData | null = dashboardQuery.data
    ? {
        productivity_score: productivityQuery.data?.score ?? dashboardQuery.data?.productivity_score ?? 0,
        streak_days: streakQuery.data?.current_streak ?? dashboardQuery.data?.streak_days ?? 0,
        tasks_today: dashboardQuery.data?.tasks_today ?? 0,
        tasks_week: dashboardQuery.data?.tasks_week ?? 0,
        goals_met: dashboardQuery.data?.goals_met ?? '0/0',
        health_checkins: dashboardQuery.data?.health_checkins ?? 0,
        projects: projectsQuery.data ?? dashboardQuery.data?.projects ?? [],
        goals: goalsQuery.data ?? dashboardQuery.data?.goals ?? [],
      }
    : null;

  return {
    data,
    isLoading,
    error,
    refetch: () => {
      dashboardQuery.refetch();
      productivityQuery.refetch();
      streakQuery.refetch();
      goalsQuery.refetch();
      projectsQuery.refetch();
    },
  };
}
