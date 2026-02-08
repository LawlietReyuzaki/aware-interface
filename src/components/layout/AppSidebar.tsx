import {
  LayoutDashboard, FolderKanban, ListTodo, TrendingUp, Heart, Wallet,
  BookOpen, Shield, Users, Bot, Settings, ChevronLeft, ChevronRight, Zap,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { AgentOrb } from '@/components/agent/AgentOrb';
import type { AgentEmotion } from '@/hooks/useAgentState';

export type PageKey = 'dashboard' | 'projects' | 'tasks' | 'productivity' | 'health' | 'finances' | 'knowledge' | 'vault' | 'freelance' | 'ai_chat' | 'settings';

interface SidebarProps {
  currentPage: PageKey;
  onNavigate: (page: PageKey) => void;
  collapsed: boolean;
  onToggle: () => void;
  agentEmotion: AgentEmotion;
  onAgentClick: () => void;
}

const NAV_ITEMS: { key: PageKey; icon: any; label: string; section?: string }[] = [
  { key: 'dashboard', icon: LayoutDashboard, label: 'Command Center' },
  { key: 'projects', icon: FolderKanban, label: 'Projects', section: 'Work' },
  { key: 'tasks', icon: ListTodo, label: 'Tasks' },
  { key: 'productivity', icon: TrendingUp, label: 'Productivity' },
  { key: 'health', icon: Heart, label: 'Wellness', section: 'Life' },
  { key: 'finances', icon: Wallet, label: 'Finances' },
  { key: 'knowledge', icon: BookOpen, label: 'Knowledge', section: 'Growth' },
  { key: 'vault', icon: Shield, label: 'Vault' },
  { key: 'freelance', icon: Users, label: 'Freelance' },
  { key: 'ai_chat', icon: Bot, label: 'AI Chat', section: 'Intelligence' },
  { key: 'settings', icon: Settings, label: 'Settings' },
];

export function AppSidebar({ currentPage, onNavigate, collapsed, onToggle, agentEmotion, onAgentClick }: SidebarProps) {
  let lastSection = '';

  return (
    <motion.aside
      className="flex flex-col border-r border-border flex-shrink-0 h-screen overflow-hidden"
      style={{ background: 'hsl(var(--sidebar-background))' }}
      animate={{ width: collapsed ? 64 : 220 }}
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {/* Logo + Agent Orb */}
      <div className="h-16 flex items-center justify-between px-3 border-b border-border">
        <div className="flex items-center gap-2.5 min-w-0">
          <AgentOrb emotion={agentEmotion} size="sm" onClick={onAgentClick} />
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm font-display font-bold tracking-wide text-foreground truncate"
            >
              NEBUNEX
            </motion.span>
          )}
        </div>
        <button
          onClick={onToggle}
          className="p-1 rounded-md hover:bg-secondary text-muted-foreground transition-colors"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {NAV_ITEMS.map(({ key, icon: Icon, label, section }) => {
          const showSection = section && section !== lastSection;
          if (section) lastSection = section;

          return (
            <div key={key}>
              {showSection && !collapsed && (
                <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-muted-foreground px-3 pt-4 pb-1.5">
                  {section}
                </p>
              )}
              {showSection && collapsed && <div className="h-3" />}
              <button
                onClick={() => onNavigate(key)}
                className={`w-full flex items-center gap-3 rounded-lg text-sm transition-all duration-200 ${
                  collapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2'
                } ${
                  currentPage === key
                    ? 'bg-primary/10 text-primary'
                    : 'text-sidebar-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
              >
                <Icon size={17} className="flex-shrink-0" />
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="truncate"
                  >
                    {label}
                  </motion.span>
                )}
              </button>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-border">
        {!collapsed && (
          <div className="text-[10px] font-mono text-muted-foreground space-y-0.5">
            <p className="flex items-center gap-1.5">
              <Zap size={9} className="text-primary" />
              NEBUNEX v4
            </p>
            <p>{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        )}
      </div>
    </motion.aside>
  );
}
