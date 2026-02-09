import { Search } from 'lucide-react';
import { AgentOrb } from '@/components/agent/AgentOrb';
import { NotificationsDropdown } from './NotificationsDropdown';
import type { AgentEmotion } from '@/hooks/useAgentState';
import type { PageKey } from './AppSidebar';

interface HeaderProps {
  currentPage: PageKey;
  agentEmotion: AgentEmotion;
  onSearchOpen: () => void;
  onAgentClick: () => void;
}

const pageTitles: Record<PageKey, string> = {
  dashboard: 'Command Center',
  projects: 'Projects',
  tasks: 'Tasks',
  productivity: 'Productivity',
  health: 'Wellness',
  finances: 'Finances',
  knowledge: 'Knowledge',
  vault: 'Vault',
  freelance: 'Freelance',
  ai_chat: 'AI Intelligence',
  settings: 'Settings',
};

export function AppHeader({ currentPage, agentEmotion, onSearchOpen, onAgentClick }: HeaderProps) {
  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-border bg-card flex-shrink-0">
      <h2 className="text-sm font-display font-semibold text-secondary-foreground">
        {pageTitles[currentPage]}
      </h2>

      <div className="flex items-center gap-2">
        {/* Search trigger */}
        <button
          onClick={onSearchOpen}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-secondary/30 text-muted-foreground text-sm hover:border-muted-foreground/30 transition-colors"
        >
          <Search size={13} />
          <span className="text-xs">Search...</span>
          <kbd className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground font-mono">⌘K</kbd>
        </button>

        {/* Notifications with dropdown */}
        <NotificationsDropdown />

        {/* Agent state in header */}
        <div className="ml-1">
          <AgentOrb emotion={agentEmotion} size="sm" onClick={onAgentClick} />
        </div>
      </div>
    </header>
  );
}
