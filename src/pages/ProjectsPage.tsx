import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, FolderKanban, MoreHorizontal, Trash2, Edit2, ExternalLink } from 'lucide-react';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  progress: number;
  color?: string;
  health_score?: number;
  created_at?: string;
}

const STATUS_COLORS: Record<string, string> = {
  ideation: 'hsl(var(--muted-foreground))',
  planning: 'hsl(var(--agent-thinking))',
  'in-development': 'hsl(var(--primary))',
  production: 'hsl(var(--accent))',
  archived: 'hsl(var(--muted-foreground))',
};

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => api.projects.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description: string }) => api.projects.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setCreateOpen(false);
      setNewProject({ name: '', description: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.projects.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-muted-foreground font-mono text-sm"
        >
          Loading projects...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <FolderKanban size={24} className="text-primary" />
            Projects
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {projects?.length ?? 0} projects tracked
          </p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus size={14} />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Project name"
                value={newProject.name}
                onChange={(e) => setNewProject((p) => ({ ...p, name: e.target.value }))}
              />
              <Textarea
                placeholder="Description (optional)"
                value={newProject.description}
                onChange={(e) => setNewProject((p) => ({ ...p, description: e.target.value }))}
              />
              <Button
                className="w-full"
                onClick={() => createMutation.mutate(newProject)}
                disabled={!newProject.name.trim() || createMutation.isPending}
              >
                {createMutation.isPending ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Projects Grid */}
      {!projects?.length ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20"
        >
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 mb-4">
            <FolderKanban size={32} className="text-primary" />
          </div>
          <p className="text-muted-foreground text-sm">No projects yet</p>
          <p className="text-xs text-muted-foreground mt-1">Create your first project to get started</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {projects.map((project, i) => {
              const color = project.color || STATUS_COLORS[project.status] || 'hsl(var(--primary))';
              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border border-border p-5 bg-card hover:border-muted-foreground/20 transition-colors group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-display font-bold"
                      style={{ background: `${color}15`, color }}
                    >
                      {project.name.slice(0, 2).toUpperCase()}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-secondary/80 transition-all">
                          <MoreHorizontal size={14} className="text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2">
                          <Edit2 size={12} /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <ExternalLink size={12} /> Open
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 text-destructive"
                          onClick={() => deleteMutation.mutate(project.id)}
                        >
                          <Trash2 size={12} /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <h3 className="text-sm font-semibold text-foreground mb-1 truncate">{project.name}</h3>
                  {project.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{project.description}</p>
                  )}

                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-[10px] font-mono px-2 py-0.5 rounded-full capitalize"
                      style={{ background: `${color}12`, color }}
                    >
                      {project.status.replace('-', ' ')}
                    </span>
                    {project.health_score !== undefined && (
                      <span className="text-[10px] font-mono text-muted-foreground">
                        Health: {project.health_score}%
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${project.progress}%` }}
                        transition={{ duration: 0.8, delay: i * 0.05 }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">{project.progress}%</span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
