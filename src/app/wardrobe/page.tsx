import { createClient } from '@/lib/supabase/server';
import WardrobeGrid from './WardrobeGrid';
import UploadForm from './UploadForm';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { WardrobeGridSkeleton } from './WardrobeGrid';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';

export default async function WardrobePage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  return (
    <div className="grid gap-8 p-4 md:p-8 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <div className="sticky top-20">
          <Card>
            <CardHeader>
              <CardTitle>Upload New Item</CardTitle>
            </CardHeader>
            <CardContent>
              <UploadForm />
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Your Wardrobe</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<WardrobeGridSkeleton />}>
              <WardrobeGrid />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
