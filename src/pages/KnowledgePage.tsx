import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Bookmark, Link as LinkIcon, Plus, ExternalLink, Trash2, Check } from 'lucide-react';
import { api } from '@/services/api';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function KnowledgePage() {
  const queryClient = useQueryClient();
  const [bookmarkOpen, setBookmarkOpen] = useState(false);
  const [readingOpen, setReadingOpen] = useState(false);
  const [bookmarkUrl, setBookmarkUrl] = useState('');
  const [bookmarkTitle, setBookmarkTitle] = useState('');
  const [readingTitle, setReadingTitle] = useState('');
  const [readingUrl, setReadingUrl] = useState('');

  const bookmarksQuery = useQuery({
    queryKey: ['knowledge', 'bookmarks'],
    queryFn: api.knowledge.bookmarks,
    staleTime: 60_000,
  });

  const readingQuery = useQuery({
    queryKey: ['knowledge', 'reading'],
    queryFn: api.knowledge.reading,
    staleTime: 60_000,
  });

  const statsQuery = useQuery({
    queryKey: ['knowledge', 'stats'],
    queryFn: api.knowledge.stats,
    staleTime: 120_000,
  });

  const createBookmarkMutation = useMutation({
    mutationFn: (data: { url: string; title: string }) =>
      fetch('/api/knowledge/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge'] });
      setBookmarkOpen(false);
      setBookmarkUrl('');
      setBookmarkTitle('');
    },
  });

  const createReadingMutation = useMutation({
    mutationFn: (data: { title: string; url?: string }) =>
      fetch('/api/knowledge/reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge'] });
      setReadingOpen(false);
      setReadingTitle('');
      setReadingUrl('');
    },
  });

  const deleteBookmarkMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/knowledge/bookmarks/${id}`, { method: 'DELETE' }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge'] });
    },
  });

  const updateReadingMutation = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      fetch(`/api/knowledge/reading/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge'] });
    },
  });

  const bookmarks = bookmarksQuery.data ?? [];
  const readingList = readingQuery.data ?? [];
  const stats = statsQuery.data;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Knowledge</h1>
          <p className="text-sm text-muted-foreground mt-1">Organize bookmarks and track your learning</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={bookmarkOpen} onOpenChange={setBookmarkOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-2">
                <Bookmark size={14} />
                Add Bookmark
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Bookmark</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>URL</Label>
                  <Input
                    placeholder="https://..."
                    value={bookmarkUrl}
                    onChange={(e) => setBookmarkUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    placeholder="Bookmark title"
                    value={bookmarkTitle}
                    onChange={(e) => setBookmarkTitle(e.target.value)}
                  />
                </div>
                <Button
                  onClick={() => createBookmarkMutation.mutate({ url: bookmarkUrl, title: bookmarkTitle })}
                  disabled={createBookmarkMutation.isPending || !bookmarkUrl || !bookmarkTitle}
                  className="w-full"
                >
                  {createBookmarkMutation.isPending ? 'Saving...' : 'Save Bookmark'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={readingOpen} onOpenChange={setReadingOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus size={14} />
                Add to Reading List
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add to Reading List</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    placeholder="Book or article title"
                    value={readingTitle}
                    onChange={(e) => setReadingTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>URL (optional)</Label>
                  <Input
                    placeholder="https://..."
                    value={readingUrl}
                    onChange={(e) => setReadingUrl(e.target.value)}
                  />
                </div>
                <Button
                  onClick={() => createReadingMutation.mutate({ title: readingTitle, url: readingUrl || undefined })}
                  disabled={createReadingMutation.isPending || !readingTitle}
                  className="w-full"
                >
                  {createReadingMutation.isPending ? 'Saving...' : 'Add to List'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-xl border border-border bg-card"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <BookOpen size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats?.total_items ?? 0}</p>
              <p className="text-xs text-muted-foreground">Total Items</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
          className="p-4 rounded-xl border border-border bg-card"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Bookmark size={18} className="text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats?.bookmarks_count ?? bookmarks.length}</p>
              <p className="text-xs text-muted-foreground">Bookmarks</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-xl border border-border bg-card"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Check size={18} className="text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats?.completed_reading ?? 0}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="p-4 rounded-xl border border-border bg-card"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <LinkIcon size={18} className="text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats?.reading_in_progress ?? 0}</p>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="bookmarks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
          <TabsTrigger value="reading">Reading List</TabsTrigger>
        </TabsList>

        <TabsContent value="bookmarks">
          <div className="p-5 rounded-xl border border-border bg-card">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {bookmarks.length === 0 ? (
                <p className="text-sm text-muted-foreground col-span-full text-center py-8">
                  No bookmarks yet. Save links to keep them organized!
                </p>
              ) : (
                bookmarks.map((bookmark: any) => (
                  <div
                    key={bookmark.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 group hover:bg-secondary/50 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <LinkIcon size={14} className="text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{bookmark.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{bookmark.url}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a
                        href={bookmark.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-muted-foreground hover:text-primary"
                      >
                        <ExternalLink size={14} />
                      </a>
                      <button
                        onClick={() => deleteBookmarkMutation.mutate(bookmark.id)}
                        className="p-1 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="reading">
          <div className="p-5 rounded-xl border border-border bg-card">
            <div className="space-y-3">
              {readingList.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Your reading list is empty. Add books or articles to track!
                </p>
              ) : (
                readingList.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 group"
                  >
                    <button
                      onClick={() => updateReadingMutation.mutate({ id: item.id, completed: !item.completed })}
                      className={`p-2 rounded-lg transition-colors ${
                        item.completed ? 'bg-green-500/20 text-green-500' : 'bg-secondary hover:bg-primary/10'
                      }`}
                    >
                      {item.completed ? <Check size={14} /> : <BookOpen size={14} className="text-muted-foreground" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${item.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                        {item.title}
                      </p>
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          Open link <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
