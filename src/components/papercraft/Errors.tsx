'use client';

import { motion } from 'framer-motion';
import { PapercraftCard } from './Card';
import { cn } from '@/lib/utils';

export interface ErrorFallbackProps {
  error?: Error | string;
  resetError?: () => void;
  illustration?: 'floppy' | 'torn-note' | 'emoji-face' | 'detective';
  title?: string;
  message?: string;
  className?: string;
}

const illustrations = {
  'floppy': '💾',
  'torn-note': '📄',
  'emoji-face': '😵',
  'detective': '🔍',
};

const funnyMessages = {
  'floppy': {
    title: "Oops! Something went floppy...",
    message: "Our digital floppy disk seems to have gotten a bit crumpled. Let's try to smooth it out!"
  },
  'torn-note': {
    title: "Page torn!",
    message: "Looks like this page got a paper cut. We're patching it up with some digital tape."
  },
  'emoji-face': {
    title: "Well, that's embarrassing...",
    message: "Our app just tripped over its own shoelaces. Give us a sec to tie them back up!"
  },
  'detective': {
    title: "Mystery detected!",
    message: "Something unexpected happened, and we're on the case! 🕵️"
  },
};

export function ErrorFallback({
  error,
  resetError,
  illustration = 'emoji-face',
  title,
  message,
  className,
}: ErrorFallbackProps) {
  const defaultContent = funnyMessages[illustration];
  const displayTitle = title || defaultContent.title;
  const displayMessage = message || defaultContent.message;
  const errorDetails = typeof error === 'string' ? error : error?.message;

  return (
    <PapercraftCard
      variant="outlined"
      className={cn('p-8 text-center space-y-4 max-w-md mx-auto', className)}
    >
      <motion.div
        className="text-7xl"
        initial={{ rotate: -10, scale: 0.8 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 15,
        }}
      >
        {illustrations[illustration]}
      </motion.div>
      
      <div className="space-y-2">
        <h2 className="font-heading text-2xl text-foreground">
          {displayTitle}
        </h2>
        
        <p className="text-secondary-label">
          {displayMessage}
        </p>
        
        {errorDetails && (
          <details className="text-xs text-tertiary-label mt-3">
            <summary className="cursor-pointer hover:text-secondary-label">
              Technical details
            </summary>
            <pre className="mt-2 p-2 bg-muted rounded text-left overflow-auto max-w-full">
              {errorDetails}
            </pre>
          </details>
        )}
      </div>
      
      {resetError && (
        <motion.button
          onClick={resetError}
          className="sticker sticker-info px-6 py-3 rounded-xl font-medium"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Try again
        </motion.button>
      )}
    </PapercraftCard>
  );
}

export function EmptyState({
  icon = '🎨',
  title,
  message,
  action,
  className,
}: {
  icon?: string;
  title: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}) {
  return (
    <PapercraftCard
      variant="flat"
      className={cn('p-12 text-center space-y-4', className)}
    >
      <motion.div
        className="text-6xl"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 15,
        }}
      >
        {icon}
      </motion.div>
      
      <div className="space-y-2">
        <h3 className="font-heading text-xl text-foreground">
          {title}
        </h3>
        
        {message && (
          <p className="text-secondary-label max-w-sm mx-auto">
            {message}
          </p>
        )}
      </div>
      
      {action && (
        <motion.button
          onClick={action.onClick}
          className="sticker sticker-success px-6 py-3 rounded-xl font-medium inline-flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span>{action.label}</span>
          <span>→</span>
        </motion.button>
      )}
    </PapercraftCard>
  );
}

export function NotFoundState({
  resource = 'page',
  className,
}: {
  resource?: string;
  className?: string;
}) {
  return (
    <ErrorFallback
      illustration="detective"
      title={`${resource.charAt(0).toUpperCase() + resource.slice(1)} not found`}
      message={`We searched high and low, but couldn't find that ${resource}. Maybe it's hiding behind the couch?`}
      className={className}
    />
  );
}

export function NetworkErrorState({
  onRetry,
  className,
}: {
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <ErrorFallback
      illustration="torn-note"
      title="Connection hiccup!"
      message="Looks like our internet decided to take a coffee break. Let's try reconnecting!"
      resetError={onRetry}
      className={className}
    />
  );
}
