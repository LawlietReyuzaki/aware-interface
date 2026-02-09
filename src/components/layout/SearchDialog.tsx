import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Loader2, FolderKanban, ListTodo, TrendingUp, Heart, Wallet, BookOpen, Shield, Users, Bot, Settings, LayoutDashboard } from 'lucide-react';
import { api } from '@/services/api';
import type { PageKey } from './AppSidebar';

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (page: PageKey) => void;
}

interface SearchResult {
  type: string;
  title: string;
  description?: string;
  page?: PageKey;
}

const QUICK_ACTIONS = [
  { key: 'dashboard', icon: LayoutDashboard, label: 'Command Center', page: 'dashboard' as PageKey },
  { key: 'projects', icon: FolderKanban, label: 'Projects', page: 'projects' as PageKey },
  { key: 'tasks', icon: ListTodo, label: 'Tasks', page: 'tasks' as PageKey },
  { key: 'productivity', icon: TrendingUp, label: 'Productivity', page: 'productivity' as PageKey },
  { key: 'health', icon: Heart, label: 'Wellness', page: 'health' as PageKey },
  { key: 'finances', icon: Wallet, label: 'Finances', page: 'finances' as PageKey },
  { key: 'knowledge', icon: BookOpen, label: 'Knowledge', page: 'knowledge' as PageKey },
  { key: 'vault', icon: Shield, label: 'Vault', page: 'vault' as PageKey },
  { key: 'freelance', icon: Users, label: 'Freelance', page: 'freelance' as PageKey },
  { key: 'ai_chat', icon: Bot, label: 'AI Intelligence', page: 'ai_chat' as PageKey },
  { key: 'settings', icon: Settings, label: 'Settings', page: 'settings' as PageKey },
];

export function SearchDialog({ open, onClose, onNavigate }: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Filter quick actions based on query
  const filteredActions = query
    ? QUICK_ACTIONS.filter(a => a.label.toLowerCase().includes(query.toLowerCase()))
    : QUICK_ACTIONS;

  // Search API when query changes
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await api.search.query(query);
        setResults(data.results || []);
      } catch {
        // Search API might not be available, use local filtering
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [open]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const items = query ? [...results, ...filteredActions] : filteredActions;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && items[selectedIndex]) {
      e.preventDefault();
      const item = items[selectedIndex];
      if ('page' in item && item.page) {
        onNavigate(item.page as PageKey);
        onClose();
      }
    }
  }, [query, results, filteredActions, selectedIndex, onNavigate, onClose]);

  const handleSelect = (page: PageKey) => {
    onNavigate(page);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: -10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-lg rounded-xl border border-border overflow-hidden shadow-2xl"
            style={{ background: 'hsl(var(--card))' }}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Search size={16} className="text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search or jump to..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                autoFocus
              />
              {isSearching && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
              <button onClick={onClose} className="p-1 hover:bg-secondary rounded">
                <X size={14} className="text-muted-foreground" />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-[300px] overflow-y-auto py-2">
              {/* Search results from API */}
              {results.length > 0 && (
                <div className="px-2 mb-2">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground px-2 py-1">
                    Results
                  </p>
                  {results.map((result, i) => (
                    <button
                      key={`result-${i}`}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        selectedIndex === i ? 'bg-primary/10 text-primary' : 'hover:bg-secondary'
                      }`}
                    >
                      <span className="text-sm text-secondary-foreground">{result.title}</span>
                      {result.description && (
                        <span className="text-xs text-muted-foreground truncate">{result.description}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Quick actions */}
              <div className="px-2">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground px-2 py-1">
                  {query ? 'Pages' : 'Quick Actions'}
                </p>
                {filteredActions.map((action, i) => {
                  const idx = results.length + i;
                  return (
                    <button
                      key={action.key}
                      onClick={() => handleSelect(action.page)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        selectedIndex === idx ? 'bg-primary/10 text-primary' : 'hover:bg-secondary'
                      }`}
                    >
                      <action.icon size={14} className="text-muted-foreground" />
                      <span className="text-sm text-secondary-foreground">{action.label}</span>
                    </button>
                  );
                })}
              </div>

              {filteredActions.length === 0 && results.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-muted-foreground">No results found</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-border flex items-center justify-between">
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-secondary font-mono">↑↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-secondary font-mono">↵</kbd>
                  Select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-secondary font-mono">esc</kbd>
                  Close
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
