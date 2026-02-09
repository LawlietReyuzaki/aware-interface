import { useState, useEffect } from 'react';
import { AppSidebar, type PageKey } from '@/components/layout/AppSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { SearchDialog } from '@/components/layout/SearchDialog';
import { CognitiveTimeline } from '@/components/agent/CognitiveTimeline';
import { AgentLivingPopup } from '@/components/agent/AgentLivingPopup';
import { useAgentState } from '@/hooks/useAgentState';
import { useBehaviorTracking } from '@/hooks/useBehaviorTracking';
import { useBackgroundAgent } from '@/hooks/useBackgroundAgent';
import DashboardPage from '@/pages/Dashboard';
import ProjectsPage from '@/pages/ProjectsPage';
import TasksPage from '@/pages/TasksPage';
import AIChatPage from '@/pages/AIChatPage';
import ProductivityPage from '@/pages/ProductivityPage';
import HealthPage from '@/pages/HealthPage';
import FinancesPage from '@/pages/FinancesPage';
import KnowledgePage from '@/pages/KnowledgePage';
import VaultPage from '@/pages/VaultPage';
import FreelancePage from '@/pages/FreelancePage';
import SettingsPage from '@/pages/SettingsPage';

const Index = () => {
  const [page, setPage] = useState<PageKey>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [legacyTimelineOpen, setLegacyTimelineOpen] = useState(false);
  const [livingPopupOpen, setLivingPopupOpen] = useState(false);

  const agent = useAgentState();
  const { behavior } = useBehaviorTracking();
  
  // 🚀 Background Agent - Runs continuously from app start
  const backgroundAgent = useBackgroundAgent();

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
        return <ProductivityPage />;
      case 'health':
        return <HealthPage />;
      case 'finances':
        return <FinancesPage />;
      case 'knowledge':
        return <KnowledgePage />;
      case 'vault':
        return <VaultPage />;
      case 'freelance':
        return <FreelancePage />;
      case 'ai_chat':
        return <AIChatPage />;
      case 'settings':
        return <SettingsPage />;
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

      {/* The Living Control Chamber - View into the running agent */}
      <AgentLivingPopup
        open={livingPopupOpen}
        onClose={() => setLivingPopupOpen(false)}
        backgroundAgent={backgroundAgent}
      />
    </div>
  );
};

export default Index;
