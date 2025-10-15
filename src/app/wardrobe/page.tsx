import { createClient } from '@/lib/supabase/server';
import WardrobeGrid from './WardrobeGrid';
import UploadForm from './UploadForm';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { WardrobeGridSkeleton } from './WardrobeGrid';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';

export default async function WardrobePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  const { data: clothingItems, error } = await supabase
    .from('clothing_items')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching clothing items:', error);
  }

  const items = clothingItems || [];

  return (
    <div className="grid gap-8 p-4 md:p-8 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <div className="sticky top-20">
          <Card>
            <CardHeader>
              <CardTitle>Upload New Item</CardTitle>
            </CardHeader>
            <CardContent>
              <UploadForm user={user} />
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
              <WardrobeGrid items={items} />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
