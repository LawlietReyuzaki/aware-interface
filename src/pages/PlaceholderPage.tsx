import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface PlaceholderPageProps {
  title: string;
  icon: any;
  description: string;
  children?: ReactNode;
}

export function PlaceholderPage({ title, icon: Icon, description }: PlaceholderPageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center min-h-[60vh]"
    >
      <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 mb-6">
        <Icon size={32} className="text-primary" />
      </div>
      <h1 className="text-2xl font-display font-bold text-foreground mb-2">{title}</h1>
      <p className="text-sm text-muted-foreground max-w-md text-center leading-relaxed">
        {description}
      </p>
      <p className="text-xs font-mono text-muted-foreground mt-6 border border-border rounded-lg px-4 py-2">
        Connect your backend to populate this page
      </p>
    </motion.div>
  );
}
