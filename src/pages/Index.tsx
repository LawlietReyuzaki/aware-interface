import { useState, useEffect } from 'react';
import {
  FolderKanban, ListTodo, TrendingUp, Heart, Wallet,
  BookOpen, Shield, Users, Bot, Settings,
} from 'lucide-react';
import { AppSidebar, type PageKey } from '@/components/layout/AppSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { CognitiveTimeline } from '@/components/agent/CognitiveTimeline';
import { useAgentState } from '@/hooks/useAgentState';
import { useBehaviorTracking } from '@/hooks/useBehaviorTracking';
import DashboardPage from '@/pages/Dashboard';
import { PlaceholderPage } from '@/pages/PlaceholderPage';

const Index = () => {
  const [page, setPage] = useState<PageKey>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);

  const agent = useAgentState();
  const { behavior } = useBehaviorTracking();

  // Ctrl+K placeholder
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTimelineOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return (
          <DashboardPage
            agentEmotion={agent.emotion}
            anticipations={agent.anticipations}
            behavior={behavior}
          />
        );
      case 'projects':
        return <PlaceholderPage title="Projects" icon={FolderKanban} description="Manage your projects, track progress, and monitor health scores across all your work." />;
      case 'tasks':
        return <PlaceholderPage title="Tasks" icon={ListTodo} description="Kanban board with drag-and-drop, priority levels, and project-linked task management." />;
      case 'productivity':
        return <PlaceholderPage title="Productivity" icon={TrendingUp} description="Daily scores, streak tracking, contribution heatmaps, and weekly reports." />;
      case 'health':
        return <PlaceholderPage title="Wellness" icon={Heart} description="Mental health check-ins, workout logging, nutrition tracking, and vitals monitoring." />;
      case 'finances':
        return <PlaceholderPage title="Finances" icon={Wallet} description="Transaction tracking, budget management, spending analytics, and savings insights." />;
      case 'knowledge':
        return <PlaceholderPage title="Knowledge" icon={BookOpen} description="Bookmarks, reading lists, learning progress, and curated knowledge base." />;
      case 'vault':
        return <PlaceholderPage title="Vault" icon={Shield} description="Encrypted credential storage, password generation, and security scoring." />;
      case 'freelance':
        return <PlaceholderPage title="Freelance" icon={Users} description="Client management, earnings tracking, and platform-specific analytics." />;
      case 'ai_chat':
        return <PlaceholderPage title="AI Intelligence" icon={Bot} description="Conversational AI assistant with context-aware analysis across all your data." />;
      case 'settings':
        return <PlaceholderPage title="Settings" icon={Settings} description="Profile, working hours, data export/import, and system configuration." />;
      default:
        return null;
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden bg-background ${behavior.isInFlow ? 'flow-mode' : ''}`}>
      <AppSidebar
        currentPage={page}
        onNavigate={setPage}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        agentEmotion={agent.emotion}
        onAgentClick={() => setTimelineOpen(!timelineOpen)}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <AppHeader
          currentPage={page}
          agentEmotion={agent.emotion}
          onSearchOpen={() => {}}
          onAgentClick={() => setTimelineOpen(!timelineOpen)}
        />

        <div className="flex-1 overflow-auto p-6">
          {renderPage()}
        </div>
      </main>

      {/* Cognitive Timeline Panel */}
      <CognitiveTimeline
        entries={agent.cognitiveTimeline}
        open={timelineOpen}
        onClose={() => setTimelineOpen(false)}
        agentEmotion={agent.emotion}
      />
    </div>
  );
};

export default Index;
