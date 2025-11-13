'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  MessageCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IClothingItem } from '@/lib/types';

/**
 * Unified Natural Language Handler
 * 
 * Consolidates all NL input scenarios:
 * - Outfit modification commands (swap, regenerate, style)
 * - Occasion-based outfit generation
 * - Item description for onboarding
 * 
 * Single parsing engine handles all cases
 */

export type NLHandlerMode = 'outfit_modifier' | 'occasion_planner' | 'item_describer';

export interface NaturalLanguageHandlerProps {
  mode: NLHandlerMode;
  outfitItems?: IClothingItem[];
  onProcessInput: (input: string, parsedAction?: ParsedAction) => Promise<void>;
  onClose?: () => void;
  className?: string;
  maxLength?: number;
  placeholder?: string;
  submitLabel?: string;
  showSuggestions?: boolean;
  suggestions?: string[];
  isProcessing?: boolean;
}

export interface ParsedAction {
  type: 'swap' | 'regenerate' | 'style_change' | 'occasion' | 'description' | 'unknown';
  confidence: number;
  params: {
    itemType?: string;
    targetColor?: string;
    targetStyle?: string;
    occasion?: string;
    description?: string;
  };
  displayText: string;
}

/**
 * Smart intent parser for all NL scenarios
 */
function parseAction(input: string, mode: NLHandlerMode): ParsedAction {
  const lowercaseInput = input.toLowerCase().trim();

  // For item describer mode, anything is valid
  if (mode === 'item_describer') {
    return {
      type: 'description',
      confidence: 1,
      params: { description: input },
      displayText: `Describing: "${input.slice(0, 50)}${input.length > 50 ? '...' : ''}"`,
    };
  }

  // For occasion planner mode, anything is valid description
  if (mode === 'occasion_planner') {
    return {
      type: 'occasion',
      confidence: 1,
      params: { occasion: input },
      displayText: `Outfit for: "${input.slice(0, 40)}${input.length > 40 ? '...' : ''}"`,
    };
  }

  // For outfit modifier mode - parse specific commands
  if (mode === 'outfit_modifier') {
    // Swap patterns
    const swapPatterns = [
      /swap (the\s+)?(top|bottom|shoes?|shirt|pants?|jacket|outerwear)/i,
      /change (the\s+)?(top|bottom|shoes?|shirt|pants?|jacket|outerwear)/i,
      /different (top|bottom|shoes?|shirt|pants?|jacket|outerwear)/i,
      /replace (the\s+)?(top|bottom|shoes?|shirt|pants?|jacket|outerwear)/i,
    ];

    for (const pattern of swapPatterns) {
      const match = lowercaseInput.match(pattern);
      if (match) {
        const itemType = normalizeItemType(match[2] || match[1]);
        return {
          type: 'swap',
          confidence: 0.9,
          params: { itemType },
          displayText: `Swap the ${itemType}`,
        };
      }
    }

    // Regenerate patterns
    const regeneratePatterns = [
      /new outfit|different outfit|regenerate|start over|try again/i,
      /show me (another|different)/i,
    ];

    for (const pattern of regeneratePatterns) {
      if (pattern.test(lowercaseInput)) {
        return {
          type: 'regenerate',
          confidence: 0.85,
          params: {},
          displayText: 'Generate a new outfit',
        };
      }
    }

    // Style change patterns
    const stylePatterns = [
      /more (casual|formal|business|sporty|elegant)/i,
      /make it (casual|formal|business|sporty|elegant)/i,
      /(casual|formal|business|sporty|elegant) style/i,
    ];

    for (const pattern of stylePatterns) {
      const match = lowercaseInput.match(pattern);
      if (match) {
        const style = match[1];
        return {
          type: 'style_change',
          confidence: 0.8,
          params: { targetStyle: style },
          displayText: `Make outfit more ${style}`,
        };
      }
    }
  }

  // Unknown command
  return {
    type: 'unknown',
    confidence: 0,
    params: {},
    displayText: 'I didn\'t understand that request',
  };
}

function normalizeItemType(type: string): string {
  const normalized = type.toLowerCase();
  if (['shirt', 'blouse', 'sweater', 't-shirt', 'tshirt'].includes(normalized)) return 'Top';
  if (['pants', 'jeans', 'trousers', 'skirt'].includes(normalized)) return 'Bottom';
  if (['shoe', 'shoes', 'sneakers', 'boots'].includes(normalized)) return 'Footwear';
  if (['jacket', 'coat', 'hoodie'].includes(normalized)) return 'Outerwear';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function getActionIcon(actionType: ParsedAction['type']) {
  switch (actionType) {
    case 'swap':
      return Shirt;
    case 'regenerate':
      return RefreshCw;
    case 'style_change':
      return Palette;
    case 'occasion':
      return Wand2;
    case 'description':
      return MessageCircle;
    default:
      return AlertCircle;
  }
}

export function NaturalLanguageHandler({
  mode,
  outfitItems = [],
  onProcessInput,
  onClose,
  className,
  maxLength = 200,
  placeholder,
  submitLabel = 'Submit',
  showSuggestions: defaultShowSuggestions = true,
  suggestions: customSuggestions,
  isProcessing: externalIsProcessing = false,
}: NaturalLanguageHandlerProps) {
  const [input, setInput] = useState('');
  const [parsedAction, setParsedAction] = useState<ParsedAction | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(defaultShowSuggestions);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Default suggestions by mode
  const defaultSuggestionsByMode: Record<NLHandlerMode, string[]> = {
    outfit_modifier: ['Swap the top', 'New outfit', 'More casual', 'Different shoes'],
    occasion_planner: ['Casual brunch', 'Job interview', 'Date night', 'Gym workout'],
    item_describer: ['Blue cotton shirt', 'Black leather jacket', 'White sneakers', 'Dark jeans'],
  };

  const suggestions = customSuggestions || defaultSuggestionsByMode[mode];

  // Parse as user types
  useEffect(() => {
    if (!input.trim()) {
      setParsedAction(null);
      return;
    }

    const timer = setTimeout(() => {
      const action = parseAction(input, mode);
      setParsedAction(action);
    }, 300);

    return () => clearTimeout(timer);
  }, [input, mode]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!input.trim()) {
      return;
    }

    // For outfit modifier, validate parsed action
    if (mode === 'outfit_modifier' && (!parsedAction || parsedAction.type === 'unknown')) {
      toast("I didn't understand that. Try 'swap the top' or 'new outfit'", {
        icon: '🤔',
        duration: 4000,
      });
      return;
    }

    try {
      setIsProcessing(true);
      await onProcessInput(input, parsedAction || undefined);
      setInput('');
      setParsedAction(null);
      setShowSuggestions(true);
    } catch (error) {
      toast.error('Failed to process request. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [input, parsedAction, mode, onProcessInput]);

  const handleSuggestion = (suggestion: string) => {
    setInput(suggestion);
    setShowSuggestions(false);
    // Focus input for easier submission
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const processing = isProcessing || externalIsProcessing;
  const ActionIcon = parsedAction ? getActionIcon(parsedAction.type) : Sparkles;

  return (
    <Card className={cn('glass-effect', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          {mode === 'outfit_modifier' && 'Style Assistant'}
          {mode === 'occasion_planner' && 'Describe Your Occasion'}
          {mode === 'item_describer' && 'Describe Item'}
        </CardTitle>
        <CardDescription>
          {mode === 'outfit_modifier' && 'Natural commands to modify your outfit'}
          {mode === 'occasion_planner' && 'Tell us about your day'}
          {mode === 'item_describer' && 'Describe what you\'re adding'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={placeholder || 'Start typing...'}
              maxLength={maxLength}
              disabled={processing}
              className="pr-12"
            />
            <Button
              type="submit"
              size="icon"
              variant="ghost"
              disabled={!input.trim() || processing}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              aria-label={submitLabel}
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Character count */}
          {maxLength && input.length > maxLength * 0.8 && (
            <div className="text-xs text-muted-foreground text-right">
              {input.length} / {maxLength}
            </div>
          )}
        </form>

        {/* Parsed Intent Display (outfit modifier only) */}
        {mode === 'outfit_modifier' && input.trim() && parsedAction && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={cn(
                'p-3 rounded-lg border-2 transition-colors',
                parsedAction.type === 'unknown'
                  ? 'border-destructive/50 bg-destructive/5'
                  : 'border-primary/50 bg-primary/5'
              )}
            >
              <div className="flex items-center gap-2">
                <ActionIcon className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">
                  {parsedAction.displayText}
                </span>
                {parsedAction.type !== 'unknown' && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {Math.round(parsedAction.confidence * 100)}% confident
                  </Badge>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Suggestion Chips */}
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Quick suggestions
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <motion.button
                  key={suggestion}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSuggestion(suggestion)}
                  disabled={processing}
                  className={cn(
                    'px-3 py-1.5 text-xs rounded-full border transition-colors',
                    'hover:bg-primary/10 hover:border-primary/50',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Help Text */}
        {mode === 'outfit_modifier' && (
          <p className="text-xs text-muted-foreground">
            Try: &quot;swap the top&quot;, &quot;new outfit&quot;, &quot;more casual&quot;
          </p>
        )}
        {mode === 'occasion_planner' && (
          <p className="text-xs text-muted-foreground">
            Be specific: &quot;casual brunch with friends&quot;, &quot;important meeting&quot;, &quot;date night&quot;
          </p>
        )}
        {mode === 'item_describer' && (
          <p className="text-xs text-muted-foreground">
            Describe color, type, and style: &quot;navy blue button-up shirt&quot;
          </p>
        )}
      </CardContent>
    </Card>
  );
}
