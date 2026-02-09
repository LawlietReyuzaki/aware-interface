import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Send, Mic, MicOff, MessageSquare, Plus, History,
  Play, Pause, ToggleLeft, ToggleRight, Clock, CheckCircle2,
  Sunrise, BarChart3, Search, Heart, Wallet, AlertCircle,
  Timer, BookOpen, Moon, Loader2, Volume2, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { api } from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  ts: number;
  actions?: Array<{ tool: string; success: boolean }>;
}

interface SchedulerJob {
  name: string;
  enabled: boolean;
  interval_minutes: number;
  run_count: number;
}

interface PendingPrompt {
  id: string;
  prompt_text: string;
  created_at: string;
}

const QUICK_ACTIONS = [
  { icon: Sunrise, label: 'Start My Day', message: 'Good morning! Start my day.' },
  { icon: BarChart3, label: 'Daily Report', message: 'Generate my daily report with all scores.' },
  { icon: Search, label: 'Analyze Patterns', message: 'Analyze my productivity, health, and spending patterns.' },
  { icon: Heart, label: 'Health Check', message: 'How is my health looking? Show me a summary.' },
  { icon: Wallet, label: 'Finance Review', message: 'Show me my financial summary and spending patterns.' },
  { icon: AlertCircle, label: 'Incomplete Info', message: 'Check my system for any missing or incomplete information.' },
  { icon: Timer, label: 'Active Timers', message: 'Show me all my active task timers.' },
  { icon: BookOpen, label: 'Reading List', message: 'What am I currently reading and what should I read next?' },
  { icon: Moon, label: 'End My Day', message: "I'm done for today. Generate my end-of-day report." },
];

export default function AIChatPage() {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Agent status query
  const { data: agentStatus } = useQuery({
    queryKey: ['agent', 'status'],
    queryFn: api.agent.status,
    refetchInterval: 5000,
    retry: false,
  });

  // Scheduler status query
  const { data: schedulerStatus, refetch: refetchScheduler } = useQuery({
    queryKey: ['autonomous', 'scheduler'],
    queryFn: async () => {
      const res = await fetch('/api/autonomous/scheduler/status');
      if (!res.ok) throw new Error('Failed to fetch scheduler');
      return res.json();
    },
    refetchInterval: 30000,
    retry: false,
  });

  // Pending prompts query
  const { data: pendingPrompts } = useQuery({
    queryKey: ['autonomous', 'prompts'],
    queryFn: async () => {
      const res = await fetch('/api/autonomous/prompts?unacknowledged_only=true');
      if (!res.ok) throw new Error('Failed to fetch prompts');
      return res.json();
    },
    refetchInterval: 30000,
    retry: false,
  });

  // Conversations list
  const { data: conversations } = useQuery({
    queryKey: ['ai', 'conversations'],
    queryFn: async () => {
      const res = await fetch('/api/ai/conversations');
      if (!res.ok) throw new Error('Failed to fetch conversations');
      return res.json();
    },
    retry: false,
  });

  // Chat mutation
  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      try {
        // Try agent chat first
        return await api.agent.chat(message, conversationId || undefined);
      } catch {
        // Fallback to legacy AI chat
        if (conversationId) {
          const res = await fetch(`/api/ai/chat/${conversationId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message }),
          });
          if (!res.ok) throw new Error('Chat failed');
          return res.json();
        }
        return api.ai.chat(message);
      }
    },
    onSuccess: (data) => {
      if (data.conversation_id) {
        setConversationId(data.conversation_id);
      }
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.response,
          ts: Date.now(),
          actions: data.actions,
        },
      ]);
    },
    onError: (error: Error) => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ ${error.message || 'Agent unavailable. Please try again.'}`,
          ts: Date.now(),
        },
      ]);
    },
  });

  // Voice mutation
  const voiceMutation = useMutation({
    mutationFn: async (audioBase64: string) => {
      const res = await fetch('/api/activity/voice/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio_base64: audioBase64, format: 'webm' }),
      });
      if (!res.ok) throw new Error('Voice processing failed');
      return res.json();
    },
    onSuccess: (data) => {
      // Add user's transcribed message
      if (data.user_text) {
        setMessages((prev) => [
          ...prev,
          { role: 'user', content: data.user_text, ts: Date.now() },
        ]);
      }
      // Add agent response
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.agent_response,
          ts: Date.now(),
          actions: data.actions,
        },
      ]);
      // Play audio if available
      if (data.agent_audio_base64 && audioRef.current) {
        audioRef.current.src = `data:audio/mp3;base64,${data.agent_audio_base64}`;
        audioRef.current.play();
      }
    },
  });

  // Scheduler control mutations
  const toggleSchedulerMutation = useMutation({
    mutationFn: async (action: 'start' | 'stop') => {
      const res = await fetch(`/api/autonomous/scheduler/${action}`, { method: 'POST' });
      if (!res.ok) throw new Error(`Failed to ${action} scheduler`);
      return res.json();
    },
    onSuccess: () => refetchScheduler(),
  });

  const toggleJobMutation = useMutation({
    mutationFn: async ({ jobName, enabled }: { jobName: string; enabled: boolean }) => {
      const res = await fetch('/api/autonomous/scheduler/toggle-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_name: jobName, enabled }),
      });
      if (!res.ok) throw new Error('Failed to toggle job');
      return res.json();
    },
    onSuccess: () => refetchScheduler(),
  });

  const acknowledgePromptMutation = useMutation({
    mutationFn: async (promptId: string) => {
      const res = await fetch(`/api/autonomous/prompts/${promptId}/acknowledge`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to acknowledge');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['autonomous', 'prompts'] }),
  });

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || chatMutation.isPending) return;
    const msg = input.trim();
    setMessages((prev) => [...prev, { role: 'user', content: msg, ts: Date.now() }]);
    setInput('');
    chatMutation.mutate(msg);
  };

  const handleQuickAction = (message: string) => {
    setMessages((prev) => [...prev, { role: 'user', content: message, ts: Date.now() }]);
    chatMutation.mutate(message);
  };

  const handleNewChat = () => {
    setMessages([]);
    setConversationId(null);
  };

  const loadConversation = async (convId: string) => {
    try {
      const res = await fetch(`/api/ai/conversations/${convId}`);
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setConversationId(convId);
      setMessages(
        data.messages?.map((m: any) => ({
          role: m.role,
          content: m.content,
          ts: new Date(m.timestamp).getTime(),
        })) || []
      );
      setShowHistory(false);
    } catch (e) {
      console.error('Failed to load conversation:', e);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          voiceMutation.mutate(base64);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (e) {
      console.error('Microphone access denied:', e);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const isAgentAvailable = agentStatus?.available !== false;
  const toolsCount = agentStatus?.tools_count || 51;
  const isSchedulerRunning = schedulerStatus?.running;
  const jobs: SchedulerJob[] = schedulerStatus?.jobs || [];
  const prompts: PendingPrompt[] = pendingPrompts?.prompts || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex h-full gap-4"
    >
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-card/50 rounded-2xl border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bot size={24} className="text-primary" />
              <span
                className={cn(
                  'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card',
                isAgentAvailable ? 'bg-primary' : 'bg-destructive'
                )}
              />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">AI Intelligence</h2>
              <p className="text-xs text-muted-foreground">
                {isAgentAvailable ? `Agent (${toolsCount} tools)` : 'Agent Offline'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowHistory(!showHistory)}>
              <History size={16} className="mr-1.5" />
              History
            </Button>
            <Button variant="ghost" size="sm" onClick={handleNewChat}>
              <Plus size={16} className="mr-1.5" />
              New Chat
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-5">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <Bot size={48} className="text-primary/30 mb-4" />
              <p className="text-muted-foreground text-sm mb-6">
                Start a conversation or use a quick action
              </p>
              <div className="grid grid-cols-3 gap-2 max-w-lg">
                {QUICK_ACTIONS.slice(0, 6).map(({ icon: Icon, label, message }) => (
                  <button
                    key={label}
                    onClick={() => handleQuickAction(message)}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-xs"
                  >
                    <Icon size={18} className="text-primary" />
                    <span className="text-muted-foreground">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'flex gap-3',
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot size={16} className="text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'max-w-[70%] rounded-2xl px-4 py-3',
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-foreground'
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {msg.actions.map((action, j) => (
                          <Badge
                            key={j}
                            variant={action.success ? 'default' : 'destructive'}
                            className="text-[10px]"
                          >
                            {action.tool}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <MessageSquare size={14} className="text-primary-foreground" />
                    </div>
                  )}
                </motion.div>
              ))}
              {chatMutation.isPending && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Loader2 size={16} className="text-primary animate-spin" />
                  </div>
                  <div className="bg-secondary rounded-2xl px-4 py-3">
                    <p className="text-sm text-muted-foreground">Thinking...</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask the agent anything..."
              className="flex-1"
              disabled={chatMutation.isPending}
            />
            <Button
              variant={isRecording ? 'destructive' : 'secondary'}
              size="icon"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={voiceMutation.isPending}
            >
              {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
            </Button>
            <Button onClick={handleSend} disabled={!input.trim() || chatMutation.isPending}>
              <Send size={18} />
            </Button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-72 flex flex-col gap-4">
        {/* Conversation History */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-card/50 rounded-xl border border-border overflow-hidden"
            >
              <div className="p-3 border-b border-border">
                <h3 className="text-xs font-semibold text-foreground">Conversations</h3>
              </div>
              <ScrollArea className="max-h-48">
                <div className="p-2 space-y-1">
                  {(conversations || []).slice(0, 10).map((conv: any) => (
                    <button
                      key={conv.id}
                      onClick={() => loadConversation(conv.id)}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-secondary transition-colors truncate text-muted-foreground hover:text-foreground"
                    >
                      {conv.title || 'Untitled'}
                    </button>
                  ))}
                  {(!conversations || conversations.length === 0) && (
                    <p className="px-3 py-2 text-xs text-muted-foreground">No conversations yet</p>
                  )}
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Autonomous Agent Control */}
        <div className="bg-card/50 rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-foreground">Autonomous Agent</h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() =>
                toggleSchedulerMutation.mutate(isSchedulerRunning ? 'stop' : 'start')
              }
              disabled={toggleSchedulerMutation.isPending}
            >
              {isSchedulerRunning ? (
                <>
                  <Pause size={12} className="mr-1" /> Stop
                </>
              ) : (
                <>
                  <Play size={12} className="mr-1" /> Start
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <span
              className={cn(
                'w-2 h-2 rounded-full',
                isSchedulerRunning ? 'bg-primary animate-pulse' : 'bg-muted-foreground'
              )}
            />
            <span className="text-xs text-muted-foreground">
              {isSchedulerRunning ? 'Scheduler Running' : 'Scheduler Stopped'}
            </span>
          </div>

          {jobs.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">
                Jobs
              </p>
              {jobs.slice(0, 5).map((job) => (
                <div
                  key={job.name}
                  className="flex items-center justify-between py-1.5 border-b border-border last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground truncate">{job.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {job.interval_minutes}m · {job.run_count} runs
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      toggleJobMutation.mutate({ jobName: job.name, enabled: !job.enabled })
                    }
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {job.enabled ? (
                      <ToggleRight size={18} className="text-primary" />
                    ) : (
                      <ToggleLeft size={18} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Prompts */}
        {prompts.length > 0 && (
          <div className="bg-card/50 rounded-xl border border-border p-4">
            <h3 className="text-xs font-semibold text-foreground mb-3">Pending Prompts</h3>
            <div className="space-y-2">
              {prompts.map((prompt) => (
                <div key={prompt.id} className="p-2 bg-secondary/50 rounded-lg">
                  <p className="text-xs text-foreground mb-2 line-clamp-2">{prompt.prompt_text}</p>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px]"
                      onClick={() => {
                        handleQuickAction(prompt.prompt_text);
                        acknowledgePromptMutation.mutate(prompt.id);
                      }}
                    >
                      Reply
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px]"
                      onClick={() => acknowledgePromptMutation.mutate(prompt.id)}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-card/50 rounded-xl border border-border p-4">
          <h3 className="text-xs font-semibold text-foreground mb-3">Quick Actions</h3>
          <div className="space-y-1">
            {QUICK_ACTIONS.map(({ icon: Icon, label, message }) => (
              <button
                key={label}
                onClick={() => handleQuickAction(message)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <Icon size={14} className="text-primary" />
                {label}
                <ChevronRight size={12} className="ml-auto opacity-50" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hidden audio element for TTS playback */}
      <audio ref={audioRef} className="hidden" />
    </motion.div>
  );
}
