/**
 * Statistics Client Component
 * 
 * Client-side component that fetches and displays user statistics
 */

'use client';

import { useEffect, useState } from 'react';
import { BarChart3, Shirt } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';

interface BasicStats {
  totalOutfits: number;
  wardrobeSize: number;
}

interface StatsClientProps {
  userId: string;
}

export function StatsClient({ userId }: StatsClientProps) {
  const [stats, setStats] = useState<BasicStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchStats() {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/stats');
        
        if (!response.ok) {
          throw new Error('Failed to fetch statistics');
        }
        
        const data = await response.json();
        setStats(data.data);
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchStats();
  }, [userId]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-sm text-muted-foreground">Loading your stats...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Failed to load statistics"
        description={error}
        actions={[{
          label: 'Try Again',
          onClick: () => window.location.reload()
        }]}
      />
    );
  }
  
  if (!stats) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No statistics available"
        description="Start logging outfits to see your stats"
      />
    );
  }
  
  // No outfits logged yet
  if (stats.totalOutfits === 0) {
    return (
      <EmptyState
        icon={Shirt}
        title="Start your style journey"
        description="Log your first outfit to unlock statistics"
        actions={[{
          label: 'Log First Outfit',
          onClick: () => window.location.href = '/'
        }]}
      />
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          label="Outfits Logged"
          value={stats.totalOutfits}
          icon="📸"
          description="Total outfits logged"
          delay={0}
        />
        
        <StatCard
          label="Wardrobe Size"
          value={stats.wardrobeSize}
          icon="👗"
          description="Total clothing items"
          delay={0.1}
        />
      </div>
    </div>
  );
}
