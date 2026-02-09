import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Plus, ListTodo, GripVertical, Trash2, Circle, CheckCircle2 } from 'lucide-react';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  project_id?: string;
  sort_order: number;
}

interface KanbanData {
  todo: Task[];
  in_progress: Task[];
  done: Task[];
}

const COLUMNS = [
  { key: 'todo', label: 'To Do', color: 'hsl(var(--muted-foreground))' },
  { key: 'in_progress', label: 'In Progress', color: 'hsl(var(--agent-thinking))' },
  { key: 'done', label: 'Done', color: 'hsl(var(--accent))' },
] as const;

const PRIORITY_COLORS: Record<string, string> = {
  low: 'hsl(var(--muted-foreground))',
  medium: 'hsl(var(--agent-thinking))',
  high: 'hsl(var(--agent-concerned))',
  critical: 'hsl(var(--destructive))',
};

export default function TasksPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', priority: 'medium' });

  const { data: kanban, isLoading } = useQuery<KanbanData>({
    queryKey: ['tasks', 'kanban'],
    queryFn: () => api.tasks.kanban(),
  });

  const createMutation = useMutation({
    mutationFn: (data: { title: string; priority: string }) =>
      api.tasks.create({ ...data, status: 'todo' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setCreateOpen(false);
      setNewTask({ title: '', priority: 'medium' });
    },
  });

  const moveMutation = useMutation({
    mutationFn: ({ id, status, order }: { id: string; status: string; order: number }) =>
      api.tasks.move(id, status, order),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.tasks.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const handleDrop = (taskId: string, newStatus: string, newOrder: number) => {
    moveMutation.mutate({ id: taskId, status: newStatus, order: newOrder });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-muted-foreground font-mono text-sm"
        >
          Loading tasks...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <ListTodo size={24} className="text-primary" />
            Tasks
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Drag and drop to organize your work
          </p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus size={14} />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Task title"
                value={newTask.title}
                onChange={(e) => setNewTask((t) => ({ ...t, title: e.target.value }))}
              />
              <Select
                value={newTask.priority}
                onValueChange={(v) => setNewTask((t) => ({ ...t, priority: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
              <Button
                className="w-full"
                onClick={() => createMutation.mutate(newTask)}
                disabled={!newTask.title.trim() || createMutation.isPending}
              >
                {createMutation.isPending ? 'Creating...' : 'Create Task'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-3 gap-4 h-[calc(100vh-200px)]">
        {COLUMNS.map((column) => {
          const tasks = kanban?.[column.key as keyof KanbanData] ?? [];
          return (
            <div
              key={column.key}
              className="rounded-xl border border-border bg-card/50 flex flex-col overflow-hidden"
            >
              {/* Column header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: column.color }}
                  />
                  <span className="text-sm font-semibold text-foreground">{column.label}</span>
                </div>
                <span className="text-xs font-mono text-muted-foreground">{tasks.length}</span>
              </div>

              {/* Tasks */}
              <div className="flex-1 p-3 space-y-2 overflow-y-auto">
                <AnimatePresence mode="popLayout">
                  {tasks.map((task, i) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.03 }}
                      layout
                      className="rounded-lg border border-border bg-card p-3 group cursor-grab active:cursor-grabbing hover:border-muted-foreground/30 transition-colors"
                      draggable
                      onDragEnd={(e, info) => {
                        // Simple drop zone detection would go here
                        // For full drag-drop, integrate with a DnD library
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <button
                          className="mt-0.5 text-muted-foreground hover:text-accent transition-colors"
                          onClick={() => {
                            if (column.key !== 'done') {
                              handleDrop(task.id, 'done', 0);
                            }
                          }}
                        >
                          {column.key === 'done' ? (
                            <CheckCircle2 size={14} className="text-accent" />
                          ) : (
                            <Circle size={14} />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm ${column.key === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                          >
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span
                              className="text-[9px] font-mono px-1.5 py-0.5 rounded capitalize"
                              style={{
                                background: `${PRIORITY_COLORS[task.priority] || 'hsl(var(--muted))'}15`,
                                color: PRIORITY_COLORS[task.priority] || 'hsl(var(--muted-foreground))',
                              }}
                            >
                              {task.priority}
                            </span>
                          </div>
                        </div>
                        <button
                          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                          onClick={() => deleteMutation.mutate(task.id)}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {!tasks.length && (
                  <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
                    No tasks
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
