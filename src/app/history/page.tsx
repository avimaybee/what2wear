/**
 * Outfit History & Timeline Page
 * /history
 * 
 * Displays complete outfit history with infinite scroll, filtering, and search
 */

import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { HistoryClient } from '@/components/client/history-client';
import { Header } from '@/components/ui/header';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Outfit History | What2Wear',
  description: 'Browse your complete outfit timeline and history'
};

export default async function HistoryPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    redirect('/auth/sign-in?redirect=/history');
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Outfit History</h1>
          <p className="text-muted-foreground">
            Browse your complete style timeline and rediscover past outfits
          </p>
        </div>
        
        <Suspense fallback={<HistoryLoadingSkeleton />}>
          <HistoryClient userId={user.id} />
        </Suspense>
      </main>
    </div>
  );
}

function HistoryLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Search and filter skeleton */}
      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-24" />
      </div>
      
      {/* Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-72 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
