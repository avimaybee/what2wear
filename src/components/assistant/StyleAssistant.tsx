'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toaster';
import {
  Sparkles,
  Send,
  X,
  RefreshCw,
  Shirt,
  Palette,
  Wand2,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motionEasing, motionDurations } from '@/lib/motion';
import type { IClothingItem } from '@/lib/types';

/**
 * Style Assistant Component
 * Conversational UI for natural language outfit modifications
 * 
 * Features:
 * - Natural language input parsing
 * - Intent confirmation before execution
 * - Compact, mobile-optimized design
 * - Support for: swap items, regenerate, change colors/style
 */

export interface StyleAssistantProps {
  outfitItems?: IClothingItem[];
  onSwapRequest?: (itemType: string, newItem?: IClothingItem) => Promise<void>;
  onRegenerateRequest?: (params?: { style?: string; occasion?: string }) => Promise<void>;
  onClose?: () => void;
  className?: string;
}

interface ParsedIntent {
  action: 'swap' | 'regenerate' | 'style_change' | 'unknown';
  confidence: number;
  params: {
    itemType?: string; // 'top', 'bottom', 'shoes', etc.
    targetColor?: string;
    targetStyle?: string;
    occasion?: string;
  };
  displayText: string;
}

/**
 * Simple rule-based NL parser for outfit intents
 * Uses pattern matching to detect user intentions
 */
function parseIntent(input: string): ParsedIntent {
  const lowercaseInput = input.toLowerCase().trim();
  
  // Swap patterns
  const swapPatterns = [
    /swap (the\s+)?(top|bottom|shoes?|shirt|pants?|jacket|outerwear)/i,
    /change (the\s+)?(top|bottom|shoes?|shirt|pants?|jacket|outerwear)/i,
    /different (top|bottom|shoes?|shirt|pants?|jacket|outerwear)/i,
    /replace (the\s+)?(top|bottom|shoes?|shirt|pants?|jacket|outerwear)/i,
  ];
  
  // Regenerate patterns
  const regeneratePatterns = [
    /new outfit|different outfit|regenerate|start over|try again/i,
    /show me (another|different)/i,
  ];
  
  // Style change patterns
  const stylePatterns = [
    /more (casual|formal|business|sporty|elegant)/i,
    /make it (casual|formal|business|sporty|elegant)/i,
    /(casual|formal|business|sporty|elegant) style/i,
  ];
  
  // Color change patterns
  const colorPatterns = [
    /(blue|red|green|black|white|navy|beige|grey|gray) (top|bottom|shoes?|shirt|pants?)/i,
    /change.*color/i,
  ];
  
  // Check swap patterns
  for (const pattern of swapPatterns) {
    const match = lowercaseInput.match(pattern);
    if (match) {
      const itemType = normalizeItemType(match[2] || match[1]);
      return {
        action: 'swap',
        confidence: 0.9,
        params: { itemType },
        displayText: `Swap the ${itemType}`,
      };
    }
  }
  
  // Check regenerate patterns
  for (const pattern of regeneratePatterns) {
    if (pattern.test(lowercaseInput)) {
      return {
        action: 'regenerate',
        confidence: 0.85,
        params: {},
        displayText: 'Generate a new outfit',
      };
    }
  }
  
  // Check style patterns
  for (const pattern of stylePatterns) {
    const match = lowercaseInput.match(pattern);
    if (match) {
      const style = match[1];
      return {
        action: 'style_change',
        confidence: 0.8,
        params: { targetStyle: style },
        displayText: `Make the outfit more ${style}`,
      };
    }
  }
  
  // Check color patterns
  for (const pattern of colorPatterns) {
    const match = lowercaseInput.match(pattern);
    if (match) {
      const color = match[1];
      const itemType = match[2] ? normalizeItemType(match[2]) : undefined;
      return {
        action: 'style_change',
        confidence: 0.75,
        params: { targetColor: color, itemType },
        displayText: itemType 
          ? `Change ${itemType} to ${color}` 
          : `Add more ${color} to the outfit`,
      };
    }
  }
  
  // If we get here, we didn't recognize the intent
  return {
    action: 'unknown',
    confidence: 0,
    params: {},
    displayText: 'I didn\'t understand that request',
  };
}

/**
 * Normalize item type names to standard categories
 */
function normalizeItemType(type: string): string {
  const normalized = type.toLowerCase();
  if (['shirt', 'blouse', 'sweater', 't-shirt', 'tshirt'].includes(normalized)) return 'Top';
  if (['pants', 'jeans', 'trousers', 'skirt'].includes(normalized)) return 'Bottom';
  if (['shoe', 'shoes', 'sneakers', 'boots'].includes(normalized)) return 'Footwear';
  if (['jacket', 'coat', 'hoodie'].includes(normalized)) return 'Outerwear';
  
  // Capitalize first letter for display
  return type.charAt(0).toUpperCase() + type.slice(1);
}

/**
 * Get icon for action type
 */
function getActionIcon(action: ParsedIntent['action']) {
  switch (action) {
    case 'swap':
      return Shirt;
    case 'regenerate':
      return RefreshCw;
    case 'style_change':
      return Palette;
    default:
      return Wand2;
  }
}

export function StyleAssistant({
  outfitItems: _outfitItems = [],
  onSwapRequest,
  onRegenerateRequest,
  onClose,
  className,
}: StyleAssistantProps) {
  const [input, setInput] = useState('');
  const [parsedIntent, setParsedIntent] = useState<ParsedIntent | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Suggested prompts
  const suggestions = [
    'Swap the top',
    'New outfit',
    'More casual',
    'Different shoes',
  ];

  // Parse input as user types (debounced)
  useEffect(() => {
    if (!input.trim()) {
      setParsedIntent(null);
      return;
    }

    const timer = setTimeout(() => {
      const intent = parseIntent(input);
      setParsedIntent(intent);
    }, 300);

    return () => clearTimeout(timer);
  }, [input]);

  // Handle input submission
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!input.trim() || !parsedIntent || parsedIntent.action === 'unknown') {
      if (parsedIntent?.action === 'unknown') {
        toast("I didn't understand that. Try something like 'swap the top' or 'new outfit'", {
          icon: '🤔',
          duration: 4000,
        });
      }
      return;
    }

    try {
      setIsProcessing(true);

      // Execute the parsed action
      switch (parsedIntent.action) {
        case 'swap':
          if (!onSwapRequest) {
            toast.error('Swap function not available');
            return;
          }
          if (!parsedIntent.params.itemType) {
            toast.error('Please specify which item to swap');
            return;
          }
          await onSwapRequest(parsedIntent.params.itemType);
          toast.success(`Swapping ${parsedIntent.params.itemType}...`, { icon: '🔄' });
          break;

        case 'regenerate':
          if (!onRegenerateRequest) {
            toast.error('Regenerate function not available');
            return;
          }
          await onRegenerateRequest();
          toast.success('Generating new outfit...', { icon: '✨' });
          break;

        case 'style_change':
          if (!onRegenerateRequest) {
            toast.error('Style change function not available');
            return;
          }
          await onRegenerateRequest({
            style: parsedIntent.params.targetStyle,
            occasion: parsedIntent.params.occasion,
          });
          toast.success('Adjusting style...', { icon: '🎨' });
          break;

        default:
          toast.error('Action not supported yet');
      }

      // Clear input after successful action
      setInput('');
      setParsedIntent(null);
      setShowSuggestions(true);
      
      // Optional: close assistant after action
      // onClose?.();
      
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Style Assistant error:', error);
      }
      toast.error('Failed to execute action. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [input, parsedIntent, onSwapRequest, onRegenerateRequest]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: string) => {
    setInput(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  }, []);

  const ActionIcon = parsedIntent ? getActionIcon(parsedIntent.action) : Wand2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.98 }}
      transition={{
        duration: motionDurations.medium / 1000,
        ease: motionEasing.easeOut,
      }}
      className={cn('w-full', className)}
    >
      <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-card to-card/50 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <Sparkles className="h-5 w-5 text-primary" />
            </motion.div>
            <h3 className="font-semibold text-base">Style Assistant</h3>
            <Badge variant="secondary" className="text-xs">Beta</Badge>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
              aria-label="Close assistant"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          {/* Input form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Try: 'swap the top' or 'new outfit'..."
                className="pr-12 h-11 text-base"
                disabled={isProcessing}
                aria-label="Style assistant input"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!input.trim() || isProcessing || parsedIntent?.action === 'unknown'}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 p-0"
                aria-label="Submit request"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Parsed intent display */}
            <AnimatePresence mode="wait">
              {parsedIntent && input.trim() && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: motionDurations.fast / 1000 }}
                  className="overflow-hidden"
                >
                  <Card
                    className={cn(
                      'p-3 border-2 transition-colors',
                      parsedIntent.action === 'unknown'
                        ? 'border-destructive/50 bg-destructive/5'
                        : 'border-primary/50 bg-primary/5'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'p-2 rounded-lg flex-shrink-0',
                          parsedIntent.action === 'unknown'
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-primary/10 text-primary'
                        )}
                      >
                        {parsedIntent.action === 'unknown' ? (
                          <AlertCircle className="h-4 w-4" />
                        ) : (
                          <ActionIcon className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold mb-1">
                          {parsedIntent.action === 'unknown' ? 'Not sure what you mean' : 'I understand:'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {parsedIntent.displayText}
                        </p>
                        {parsedIntent.action !== 'unknown' && (
                          <div className="flex items-center gap-2 mt-2">
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                            <span className="text-xs text-green-600 font-medium">
                              Ready to execute
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          {/* Suggestions */}
          <AnimatePresence>
            {showSuggestions && !input.trim() && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: motionDurations.fast / 1000 }}
                className="space-y-2"
              >
                <p className="text-xs text-muted-foreground font-medium">Try these:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion, idx) => (
                    <motion.button
                      key={suggestion}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: idx * 0.05,
                        duration: motionDurations.fast / 1000,
                      }}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="px-3 py-1.5 text-xs font-medium rounded-full bg-muted hover:bg-muted-foreground/10 transition-colors border border-border/50 hover:border-primary/50"
                    >
                      {suggestion}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Help text */}
          <p className="text-xs text-muted-foreground/70 text-center pt-1">
            Describe what you would like to change and I will help you adjust your outfit
          </p>
        </div>
      </Card>
    </motion.div>
  );
}
