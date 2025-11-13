'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import { toast } from '@/components/ui/toaster';
import type { OutfitTemplate } from '@/lib/helpers/outfitTemplates';

interface TemplateDisplayProps {
  onSelectTemplate?: (templateId: string) => void;
  isLoading?: boolean;
}

interface TemplateData {
  templates: (OutfitTemplate & { isAvailable: boolean })[];
  available: OutfitTemplate[];
  totalWardrobeItems: number;
  itemTypeBreakdown: Record<string, number>;
}

export default function TemplateDisplay({ onSelectTemplate, isLoading = false }: TemplateDisplayProps) {
  const [templates, setTemplates] = useState<TemplateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/templates');

      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }

      const result = await response.json();
      setTemplates(result.data);
      
      // Select the first available template by default
      if (result.data.available.length > 0) {
        setSelectedTemplate(result.data.available[0].id);
      }
    } catch (error) {
      toast.error('Failed to load outfit templates');
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (onSelectTemplate) {
      onSelectTemplate(templateId);
    }
    toast.success(`Selected ${templates?.templates.find(t => t.id === templateId)?.name || 'template'}`);
  };

  if (loading || !templates) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Zap className="w-5 h-5 text-accent" />
          Outfit Templates
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {templates.totalWardrobeItems} items available • {templates.available.length} templates possible
        </p>
      </div>

      {/* Item Type Breakdown */}
      <div className="grid grid-cols-3 gap-2 p-3 bg-card rounded-lg border border-border">
        <div className="text-center">
          <div className="text-lg font-bold text-accent">{templates.itemTypeBreakdown.tops}</div>
          <div className="text-xs text-muted-foreground">Tops</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-accent">{templates.itemTypeBreakdown.bottoms}</div>
          <div className="text-xs text-muted-foreground">Bottoms</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-accent">{templates.itemTypeBreakdown.footwear}</div>
          <div className="text-xs text-muted-foreground">Shoes</div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="space-y-3">
        {templates.available.length > 0 ? (
          <>
            <p className="text-xs font-medium text-muted-foreground">AVAILABLE TEMPLATES</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <AnimatePresence>
                {templates.templates
                  .filter(t => t.isAvailable)
                  .sort((a, b) => b.priority - a.priority)
                  .map((template, index) => (
                    <motion.button
                      key={template.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleSelectTemplate(template.id)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        selectedTemplate === template.id
                          ? 'border-accent bg-accent/10'
                          : 'border-border bg-card hover:border-accent/50'
                      }`}
                      disabled={isLoading}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
                            {template.name}
                            {selectedTemplate === template.id && (
                              <CheckCircle2 className="w-4 h-4 text-accent" />
                            )}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                        </div>
                      </div>

                      {/* Required Items */}
                      <div className="mt-3 flex flex-wrap gap-1">
                        {template.requiredTypes.map(type => (
                          <span
                            key={type}
                            className="px-2 py-1 text-xs bg-accent/20 text-accent rounded-full font-medium"
                          >
                            {type}
                          </span>
                        ))}
                      </div>

                      {/* Optional Items */}
                      {template.optionalTypes.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {template.optionalTypes.map(type => (
                            <span
                              key={type}
                              className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded-full"
                            >
                              {type}?
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Use Cases */}
                      <div className="mt-2 text-xs text-muted-foreground">
                        {template.useCaseExamples.slice(0, 2).join(' • ')}
                      </div>
                    </motion.button>
                  ))}
              </AnimatePresence>
            </div>
          </>
        ) : null}

        {templates.templates.some(t => !t.isAvailable) && (
          <>
            <p className="text-xs font-medium text-muted-foreground mt-6">UNAVAILABLE TEMPLATES</p>
            <div className="space-y-2">
              <AnimatePresence>
                {templates.templates
                  .filter(t => !t.isAvailable)
                  .map((template, index) => (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-3 rounded-lg border border-border bg-muted/30 opacity-60"
                    >
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-foreground text-sm">{template.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Missing: {template.requiredTypes.map(t => t).join(', ')}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>

      {templates.available.length === 0 && (
        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <p className="text-sm text-amber-900 dark:text-amber-200">
            Add more clothing items to unlock outfit templates.
          </p>
        </div>
      )}
    </div>
  );
}
