import { useCallback, useState } from 'react';
import { logger } from '@/lib/logger';

/**
 * Hook for managing outfit generation state
 */
export interface UseOutfitGeneratorOptions {
  recommendationId: string;
  silhouette: 'male' | 'female' | 'neutral';
  onGenerationStart?: () => void;
  onPreviewReady?: (previewUrls: string[]) => void;
  onFinalReady?: (finalUrls: string[]) => void;
  onError?: (error: string) => void;
}

export function useOutfitGenerator(options: UseOutfitGeneratorOptions) {
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [finalUrls, setFinalUrls] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  const generateOutfit = useCallback(
    async (items: any[], stylePreset = 'photorealistic') => {
      try {
        setIsLoading(true);
        setError(null);
        options.onGenerationStart?.();

        logger.info('Starting outfit generation', {
          recommendationId: options.recommendationId,
          itemCount: items.length,
        });

        const response = await fetch('/api/generate/outfit-visual', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recommendationId: options.recommendationId,
            items,
            silhouette: options.silhouette,
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

        logger.info('Preview generated', {
          jobId: data.jobId,
          previewCount: data.previewUrls?.length,
        });

        setPreviewUrls(data.previewUrls || []);
        setJobId(data.jobId);
        setIsPolling(true);
        options.onPreviewReady?.(data.previewUrls);
      } catch (err: any) {
        logger.error('Generation error:', err);
        const errorMsg = err.message || 'Failed to generate outfit';
        setError(errorMsg);
        options.onError?.(errorMsg);
      } finally {
        setIsLoading(false);
      }
    },
    [options]
  );

  const pollJobStatus = useCallback(
    async (jId: string) => {
      try {
        const response = await fetch(`/api/generate/outfit-visual/${jId}`);

        if (!response.ok) {
          throw new Error('Failed to check job status');
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error?.message || 'Job polling failed');
        }

        if (data.status === 'completed' && data.finalUrls) {
          logger.info('Full-res generation completed', {
            jobId: jId,
            urlCount: data.finalUrls.length,
          });

          setFinalUrls(data.finalUrls);
          setIsPolling(false);
          options.onFinalReady?.(data.finalUrls);
          return { done: true, urls: data.finalUrls };
        } else if (data.status === 'failed') {
          throw new Error(
            data.errorMessage || 'Full-resolution generation failed'
          );
        }

        return { done: false };
      } catch (err: any) {
        logger.error('Polling error:', err);
        throw err;
      }
    },
    [options]
  );

  return {
    previewUrls,
    finalUrls,
    isLoading,
    isPolling,
    error,
    jobId,
    generateOutfit,
    pollJobStatus,
  };
}
