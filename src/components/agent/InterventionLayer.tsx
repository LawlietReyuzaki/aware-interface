import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

interface InterventionLayerProps {
  active: boolean;
  message: string;
  onRespond: (response: string) => void;
  onDismiss: () => void;
  isListening?: boolean;
  isSpeaking?: boolean;
}

export function InterventionLayer({
  active,
  message,
  onRespond,
  onDismiss,
  isListening = false,
  isSpeaking = false,
}: InterventionLayerProps) {
  const [input, setInput] = useState('');
  const [listeningAnimation, setListeningAnimation] = useState(false);

  useEffect(() => {
    if (isListening) {
      setListeningAnimation(true);
    } else {
      const timeout = setTimeout(() => setListeningAnimation(false), 500);
      return () => clearTimeout(timeout);
    }
  }, [isListening]);

  const handleSubmit = useCallback(() => {
    if (input.trim()) {
      onRespond(input.trim());
      setInput('');
    }
  }, [input, onRespond]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="absolute inset-0 z-20 flex items-center justify-center"
        >
          {/* Dimming overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background"
            onClick={onDismiss}
          />

          {/* Focused intervention pane */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative z-10 w-full max-w-sm mx-6"
          >
            {/* Agent message */}
            <motion.div
              className="mb-6 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {isSpeaking && (
                <motion.div
                  className="flex justify-center gap-1 mb-4"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  {[0, 1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1 rounded-full bg-primary"
                      animate={{ height: [8, 20 + i * 4, 8] }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: i * 0.1,
                      }}
                    />
                  ))}
                </motion.div>
              )}
              <p className="text-base text-foreground leading-relaxed">{message}</p>
            </motion.div>

            {/* Listening indicator */}
            {listeningAnimation && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex justify-center mb-6"
              >
                <motion.div
                  className="relative flex items-center justify-center"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <motion.div
                    className="absolute w-16 h-16 rounded-full bg-primary/20"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <motion.div
                    className="absolute w-12 h-12 rounded-full bg-primary/30"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0.2, 0.6] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: 0.1 }}
                  />
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                    <Mic size={18} className="text-primary-foreground" />
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Text input fallback */}
            {!isListening && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-3"
              >
                <div className="relative">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    placeholder="Respond..."
                    className="w-full px-4 py-3 text-sm bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                    autoFocus
                  />
                  <button
                    onClick={() => {/* Trigger voice */}}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
                  >
                    <MicOff size={16} />
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={onDismiss}
                    className="flex-1 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground bg-secondary/50 rounded-xl transition-colors"
                  >
                    Later
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!input.trim()}
                    className="flex-1 px-4 py-2.5 text-sm text-primary-foreground bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-40 transition-colors"
                  >
                    Respond
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
