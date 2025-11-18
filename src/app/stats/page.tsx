/**
 * Statistics Dashboard Page
 * /stats
 * 
 * Displays comprehensive gamification statistics and achievements
 */

import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { StatsClient } from '@/components/client/stats-client';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Statistics | What2Wear',
  description: 'View your outfit logging stats, streaks, and achievements'
};

export default async function StatsPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    redirect('/auth/sign-in?redirect=/stats');
  }
  
  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 py-4 md:py-6 max-w-7xl space-y-6">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase text-muted-foreground font-heading">Daily Pulse</p>
          <h1 className="text-2xl md:text-3xl font-semibold uppercase font-heading">Outfit Stats</h1>
        </div>
        <Suspense fallback={<StatsLoadingSkeleton />}>
          <StatsClient userId={user.id} />
        </Suspense>
      </main>
    </div>
  );
}

function StatsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      
      {/* Streak card */}
      <Skeleton className="h-48 rounded-xl" />
      
      {/* Weekly activity */}
      <Skeleton className="h-64 rounded-xl" />
      
      {/* Achievements */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
