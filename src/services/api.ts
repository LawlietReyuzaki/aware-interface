const BASE = 'http://127.0.0.1:3847/api';

async function request(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

export const api = {
  dashboard: () => request('/dashboard'),

  projects: {
    list: (status?: string) => request(`/projects${status ? `?status=${status}` : ''}`),
    get: (id: string) => request(`/projects/${id}`),
    create: (data: any) => request('/projects', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/projects/${id}`, { method: 'DELETE' }),
  },

  tasks: {
    list: (params?: Record<string, string>) => {
      const q = params ? '?' + new URLSearchParams(params).toString() : '';
      return request(`/tasks${q}`);
    },
    kanban: (projectId?: string) => request(`/tasks/kanban${projectId ? `?project_id=${projectId}` : ''}`),
    create: (data: any) => request('/tasks', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    move: (id: string, status: string, order: number = 0) =>
      request(`/tasks/${id}/move?status=${status}&sort_order=${order}`, { method: 'PUT' }),
    delete: (id: string) => request(`/tasks/${id}`, { method: 'DELETE' }),
    goals: {
      list: (date?: string) => request(`/tasks/daily/goals${date ? `?date=${date}` : ''}`),
      create: (data: any) => request('/tasks/daily/goals', { method: 'POST', body: JSON.stringify(data) }),
      toggle: (id: string) => request(`/tasks/daily/goals/${id}/toggle`, { method: 'PUT' }),
    },
  },

  productivity: {
    todayScore: () => request('/productivity/score/today'),
    history: (days?: number) => request(`/productivity/scores/history${days ? `?days=${days}` : ''}`),
    streak: () => request('/productivity/streak'),
    heatmap: () => request('/productivity/heatmap'),
    weeklyReport: () => request('/productivity/weekly-report'),
  },

  health: {
    summary: () => request('/health/summary'),
    mental: () => request('/health/mental'),
    createMental: (data: any) => request('/health/mental', { method: 'POST', body: JSON.stringify(data) }),
    createWorkout: (data: any) => request('/health/workouts', { method: 'POST', body: JSON.stringify(data) }),
  },

  finances: {
    transactions: (params?: Record<string, string>) => {
      const q = params ? '?' + new URLSearchParams(params).toString() : '';
      return request(`/finances/transactions${q}`);
    },
    createTransaction: (data: any) => request('/finances/transactions', { method: 'POST', body: JSON.stringify(data) }),
    summary: (days?: number) => request(`/finances/summary${days ? `?days=${days}` : ''}`),
    budgets: () => request('/finances/budgets'),
  },

  knowledge: {
    bookmarks: () => request('/knowledge/bookmarks'),
    reading: () => request('/knowledge/reading'),
    stats: () => request('/knowledge/stats'),
  },

  vault: {
    list: () => request('/vault'),
    create: (data: any) => request('/vault', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/vault/${id}`, { method: 'DELETE' }),
    stats: () => request('/vault/stats/summary'),
    generatePassword: (length: number = 20) => request(`/vault/generate-password?length=${length}`, { method: 'POST' }),
  },

  freelance: {
    clients: () => request('/freelance/clients'),
    stats: () => request('/freelance/stats'),
  },

  ai: {
    chat: (message: string, context?: any) => request('/ai/chat', { method: 'POST', body: JSON.stringify({ message, context }) }),
  },

  agent: {
    chat: (message: string, conversationId?: string) => request('/agent/chat', { method: 'POST', body: JSON.stringify({ message, conversation_id: conversationId || null }) }),
    status: () => request('/agent/status'),
  },

  search: {
    query: (q: string) => request(`/search?q=${encodeURIComponent(q)}`),
  },

  notifications: {
    list: (unreadOnly?: boolean) => request(`/notifications${unreadOnly ? '?unread_only=true' : ''}`),
    count: () => request('/notifications/count'),
    markRead: (id: string) => request(`/notifications/${id}/read`, { method: 'PUT' }),
    markAllRead: () => request('/notifications/read-all', { method: 'PUT' }),
    clearRead: () => request('/notifications', { method: 'DELETE' }),
    generate: () => request('/notifications/generate', { method: 'POST' }),
  },

  activity: {
    status: () => request('/activity/status'),
    timeline: (limit?: number) => request(`/activity/timeline?limit=${limit || 50}`),
    timelineSince: (timestamp: string) => request(`/activity/timeline/since/${encodeURIComponent(timestamp)}`),
    clearTimeline: () => request('/activity/timeline', { method: 'DELETE' }),
    textRespond: (text: string) => request('/activity/voice/text-respond', { method: 'POST', body: JSON.stringify({ text }) }),
  },

  users: {
    me: () => request('/users/me'),
    update: (data: any) => request('/users/me', { method: 'PUT', body: JSON.stringify(data) }),
  },

  data: {
    export: () => request('/data/export'),
    exportModule: (module: string) => request(`/data/export/${module}`),
    stats: () => request('/data/stats'),
  },
};
