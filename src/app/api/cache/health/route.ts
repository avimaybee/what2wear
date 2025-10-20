import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache';

/**
 * GET /api/cache/health
 * Check cache health and get statistics
 */
export async function GET(_request: NextRequest) {
  const isHealthy = await cache.healthCheck();
  const stats = cache.getCacheStats();

  return NextResponse.json({
    success: true,
    data: {
      status: isHealthy ? 'healthy' : 'unhealthy',
      enabled: stats.enabled,
      metrics: stats.metrics,
      hitRate: stats.hitRate,
    },
  });
}
