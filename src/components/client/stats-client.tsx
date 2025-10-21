/**
 * Statistics Client Component
 * 
 * Client-side component that fetches and displays user statistics
 */

'use client';

import { useEffect, useState } from 'react';
import { BarChart3, Shirt, TrendingUp } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { StreakDisplay } from '@/components/ui/streak-display';
import { AchievementGrid } from '@/components/ui/achievement-badge';
import { WeeklyActivityChart } from '@/components/ui/weekly-activity-chart';
import { EmptyState } from '@/components/ui/empty-state';
import type { UserStats } from '@/lib/gamification/stats';

interface StatsClientProps {
  userId: string;
}

export function StatsClient({ userId }: StatsClientProps) {
  const [stats, setStats] = useState<UserStats | null>(null);
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
  if (stats.totalOutfitsLogged === 0) {
    return (
      <EmptyState
        icon={Shirt}
        title="Start your style journey"
        description="Log your first outfit to unlock statistics and achievements"
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Outfits Logged"
          value={stats.totalOutfitsLogged}
          icon="📸"
          description={`${stats.averageOutfitsPerWeek} per week average`}
          delay={0}
        />
        
        <StatCard
          label="Current Streak"
          value={`${stats.currentStreak} days`}
          icon="🔥"
          description={stats.currentStreak > 0 ? "Keep it up!" : "Start today!"}
          delay={0.1}
        />
        
        <StatCard
          label="Wardrobe Size"
          value={stats.wardrobeSize}
          icon="👗"
          description={`${Object.keys(stats.categoryDistribution).length} categories`}
          delay={0.2}
        />
        
        <StatCard
          label="Style Score"
          value={`${stats.styleConsistencyScore}%`}
          icon="⭐"
          description={stats.favoriteStyle ? `Love ${stats.favoriteStyle}` : 'Exploring styles'}
          delay={0.3}
        />
      </div>
      
      {/* Streak Display */}
      <StreakDisplay
        currentStreak={stats.currentStreak}
        longestStreak={stats.longestStreak}
      />
      
      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          label="Color Diversity"
          value={`${stats.colorDiversity}%`}
          icon="🎨"
          description="Variety in your wardrobe"
        />
        
        {stats.mostWornItem && (
          <StatCard
            label="Most Worn Item"
            value={stats.mostWornItem.timesWorn}
            icon="👕"
            description={stats.mostWornItem.name}
          />
        )}
      </div>
      
      {/* Weekly Activity Chart */}
      <WeeklyActivityChart data={stats.weeklyActivity} />
      
      {/* Category Distribution */}
      {Object.keys(stats.categoryDistribution).length > 0 && (
        <div className="bg-card rounded-xl p-6 border border-border/50">
          <h3 className="text-lg font-semibold mb-4">Wardrobe Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(stats.categoryDistribution)
              .sort((a, b) => b[1] - a[1])
              .map(([category, count]) => (
                <div key={category} className="text-center">
                  <div className="text-2xl mb-1">
                    {getCategoryIcon(category)}
                  </div>
                  <p className="text-sm font-medium">{category}</p>
                  <p className="text-xs text-muted-foreground">{count} items</p>
                </div>
              ))}
          </div>
        </div>
      )}
      
      {/* Achievements */}
      <AchievementGrid achievements={stats.achievements} />
    </div>
  );
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    'Outerwear': '🧥',
    'Top': '👕',
    'Bottom': '👖',
    'Footwear': '👟',
    'Accessory': '👜',
    'Headwear': '🎩'
  };
  return icons[category] || '👔';
}
