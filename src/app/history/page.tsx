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
    <div className="min-h-screen papercraft-bg">
      <main className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-[0.08em] uppercase font-[family-name:var(--font-heading)]">Outfit History</h1>
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
      <div className="flex gap-3">
        <Skeleton className="flex-1" variant="text" />
        <Skeleton className="w-24" variant="text" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-72" variant="panel" />
        ))}
      </div>
    </div>
  );
}
