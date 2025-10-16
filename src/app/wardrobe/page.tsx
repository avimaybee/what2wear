import { createClient } from '@/lib/supabase/server';
import WardrobeGrid from './WardrobeGrid';
import UploadForm from './UploadForm';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { WardrobeGridSkeleton } from './WardrobeGrid';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/Card';
import { Upload, Sparkles } from 'lucide-react';

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
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8 md:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-serif mb-2">Your Wardrobe</h1>
          <p className="text-muted-foreground text-lg">Manage and organize your digital closet</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <Upload className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Upload New Item</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        <Sparkles className="w-3 h-3 inline mr-1" />
                        AI-powered analysis
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <UploadForm user={user} />
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="lg:col-span-2">
            <Suspense fallback={<WardrobeGridSkeleton />}>
              <WardrobeGrid items={items} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
