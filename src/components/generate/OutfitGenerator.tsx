'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { logger } from '@/lib/logger';

/**
 * OutfitGenerator Component
 * Handles outfit visual generation with preview-first pipeline
 * Shows preview immediately, polls for full-resolution completion
 */

export interface OutfitGeneratorProps {
  recommendationId: string;
  items: Array<{
    id: string | number;
    imageUrl: string;
    type: string;
    colors?: string[];
    material?: string | null;
    styleTags?: string[];
  }>;
  silhouette: 'male' | 'female' | 'neutral';
  stylePreset?: string;
  onGenerationComplete?: (previewUrls: string[], finalUrls?: string[]) => void;
  onError?: (error: string) => void;
}

export function OutfitGenerator({
  recommendationId,
  items,
  silhouette,
  stylePreset = 'photorealistic',
  onGenerationComplete,
  onError,
}: OutfitGeneratorProps) {
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [finalUrls, setFinalUrls] = useState<string[] | null>(null);
  const [_jobId, setJobId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pollingJobId, setPollingJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<
    'idle' | 'generating' | 'preview' | 'processing' | 'completed' | 'failed'
  >('idle');

  /**
   * Generate outfit visuals (preview + queue full-res)
   */
  const generateOutfit = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setJobStatus('generating');

      logger.info('Starting outfit generation', {
        recommendationId,
        itemCount: items.length,
      });

      const response = await fetch('/api/generate/outfit-visual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recommendationId,
          items,
          silhouette,
          stylePreset,
          previewCount: 3,
          previewQuality: 'medium',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error?.message || 'Generation failed'
        );
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Generation failed');
      }

      logger.info('Preview generated successfully', {
        jobId: data.jobId,
        previewCount: data.previewUrls?.length,
      });

      // Display preview immediately
      setPreviewUrls(data.previewUrls || []);
      setJobId(data.jobId);
      setJobStatus('preview');
      setPollingJobId(data.jobId); // Start polling for full-res

      onGenerationComplete?.(data.previewUrls);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err || 'Failed to generate outfit');
      logger.error('Generation error', { error: errorMsg });
      setError(errorMsg);
      setJobStatus('failed');
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [recommendationId, items, silhouette, stylePreset, onGenerationComplete, onError]);

  /**
   * Poll for full-resolution job completion
   */
  useEffect(() => {
    if (!pollingJobId) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/generate/outfit-visual/${pollingJobId}`
        );

        if (!response.ok) {
          throw new Error('Failed to check job status');
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error?.message || 'Job polling failed');
        }

        // Update job status
        if (data.status === 'completed' && data.finalUrls) {
          logger.info('Full-res generation completed', {
            jobId: pollingJobId,
            urlCount: data.finalUrls.length,
          });

          setFinalUrls(data.finalUrls);
          setJobStatus('completed');
          setPollingJobId(null); // Stop polling
          onGenerationComplete?.(previewUrls, data.finalUrls);
          clearInterval(pollInterval);
        } else if (data.status === 'failed') {
          throw new Error(
            data.errorMessage || 'Full-resolution generation failed'
          );
        } else if (data.status === 'processing') {
          setJobStatus('processing');
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.error('Polling error', { error: msg });
        // Don't update error state on polling errors, just keep trying
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [pollingJobId, previewUrls, onGenerationComplete]);

  // Render preview carousel
  const renderPreviewCarousel = () => {
    if (previewUrls.length === 0) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mt-4 space-y-3"
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          <span>Preview Generated</span>
          {jobStatus === 'processing' && (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs text-muted-foreground">
                Generating full-resolution...
              </span>
            </>
          )}
          {jobStatus === 'completed' && (
            <>
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-xs text-green-600">
                Full-resolution ready
              </span>
            </>
          )}
        </div>

        <div className="grid gap-2">
          {previewUrls.map((url, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="relative overflow-hidden rounded-lg bg-muted aspect-square"
            >
              <Image
                src={url}
                alt={`Outfit preview ${idx + 1}`}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 33vw, 100vw"
              />
              {finalUrls && finalUrls[idx] && (
                <div className="absolute inset-0 bg-black/20" />
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  };

  // Render error state
  if (error && jobStatus === 'failed') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-3"
      >
        <Card className="border-red-200 bg-red-50 p-3 flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900">{error}</p>
            <p className="text-xs text-red-700 mt-1">Please try again</p>
          </div>
        </Card>
        <Button
          onClick={generateOutfit}
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Retrying...
            </>
          ) : (
            'Try Again'
          )}
        </Button>
      </motion.div>
    );
  }

  // Render idle / loading state
  if (jobStatus === 'idle' || loading) {
    return (
      <Button
        onClick={generateOutfit}
        disabled={loading || items.length < 3}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          'Generate Outfit Visuals'
        )}
      </Button>
    );
  }

  // Render preview/processing state
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {renderPreviewCarousel()}

      <AnimatePresence>
        {jobStatus === 'processing' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="p-3 bg-blue-50 border-blue-200">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Generating full-resolution images
                  </p>
                  <p className="text-xs text-blue-700">
                    This may take 2-3 minutes
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
