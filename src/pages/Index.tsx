import { useState, useEffect } from 'react';
import {
  FolderKanban, ListTodo, TrendingUp, Heart, Wallet,
  BookOpen, Shield, Users, Bot, Settings,
} from 'lucide-react';
import { AppSidebar, type PageKey } from '@/components/layout/AppSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { SearchDialog } from '@/components/layout/SearchDialog';
import { CognitiveTimeline } from '@/components/agent/CognitiveTimeline';
import { AgentLivingPopup } from '@/components/agent/AgentLivingPopup';
import { useAgentState } from '@/hooks/useAgentState';
import { useBehaviorTracking } from '@/hooks/useBehaviorTracking';
import DashboardPage from '@/pages/Dashboard';
import ProjectsPage from '@/pages/ProjectsPage';
import TasksPage from '@/pages/TasksPage';
import AIChatPage from '@/pages/AIChatPage';
import { PlaceholderPage } from '@/pages/PlaceholderPage';

const Index = () => {
  const [page, setPage] = useState<PageKey>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [legacyTimelineOpen, setLegacyTimelineOpen] = useState(false);
  const [livingPopupOpen, setLivingPopupOpen] = useState(false);

  const agent = useAgentState();
  const { behavior } = useBehaviorTracking();

  // Keyboard handlers
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setLegacyTimelineOpen(false);
        setLivingPopupOpen(false);
      }
      // Open search with Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      // Open living popup with Cmd/Ctrl + .
      if ((e.metaKey || e.ctrlKey) && e.key === '.') {
        e.preventDefault();
        setLivingPopupOpen(true);
      }
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
        return <ProjectsPage />;
      case 'tasks':
        return <TasksPage />;
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
        return <AIChatPage />;
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
        onAgentClick={() => setLivingPopupOpen(true)}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <AppHeader
          currentPage={page}
          agentEmotion={agent.emotion}
          onSearchOpen={() => setSearchOpen(true)}
          onAgentClick={() => setLivingPopupOpen(true)}
        />

        <div className="flex-1 overflow-auto p-6">
          {renderPage()}
        </div>
      </main>

      {/* Search Dialog */}
      <SearchDialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={(p) => {
          setPage(p);
          setSearchOpen(false);
        }}
      />

      {/* Legacy Cognitive Timeline (still available via different trigger if needed) */}
      <CognitiveTimeline
        entries={agent.cognitiveTimeline}
        open={legacyTimelineOpen}
        onClose={() => setLegacyTimelineOpen(false)}
        agentEmotion={agent.emotion}
      />

      {/* The Living Control Chamber - Agentic Popup */}
      <AgentLivingPopup
        open={livingPopupOpen}
        onClose={() => setLivingPopupOpen(false)}
      />
    </div>
  );
};

export default Index;
