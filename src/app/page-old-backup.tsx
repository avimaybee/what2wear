'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import {
  PapercraftCard,
  OutfitCard,
  RetroButton,
  RetroWindow,
  RetroFolder,
  EmptyState,
  LoadingSkeleton,
} from '@/components/papercraft';
import type { OutfitRecommendation } from '@/types/papercraft';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [todayOutfit, setTodayOutfit] = useState<OutfitRecommendation | null>(null);
  const [wardrobeCount, setWardrobeCount] = useState(0);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/sign-in');
        return;
      }

      await Promise.all([
        loadWardrobeCount(user.id),
        loadTodayOutfit(user.id),
      ]);
    } catch (err) {
      console.error('Auth check error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadWardrobeCount(userId: string) {
    try {
      const { count } = await supabase
        .from('clothing_items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      setWardrobeCount(count || 0);
      
      if (count === 0) {
        setNeedsOnboarding(true);
      }
    } catch (err) {
      console.error('Error loading wardrobe count:', err);
    }
  }

  async function loadTodayOutfit(userId: string) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('outfits')
        .select(`
          *,
          outfit_items (
            clothing_item:clothing_items (*)
          )
        `)
        .eq('user_id', userId)
        .eq('outfit_date', today)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setTodayOutfit(data as unknown as OutfitRecommendation);
      }
    } catch (err) {
      console.error('Error loading today outfit:', err);
    }
  }

  async function generateTodayOutfit() {
    try {
      setLoading(true);
      
      const response = await fetch('/api/outfit/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: new Date().toISOString().split('T')[0] }),
      });

      if (!response.ok) throw new Error('Failed to generate outfit');
      
      const { data } = await response.json();
      setTodayOutfit(data);
    } catch (err) {
      console.error('Error generating outfit:', err);
      alert('Failed to generate outfit. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <LoadingSkeleton variant="card" count={3} />
        </div>
      </div>
    );
  }

  if (needsOnboarding) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8 flex items-center justify-center">
        <RetroWindow title="Welcome!" className="max-w-2xl">
          <div className="space-y-6 text-center">
            <div className="text-6xl">👋</div>
            <div className="space-y-2">
              <h1 className="font-heading text-3xl">Welcome to What2Wear!</h1>
              <p className="text-secondary-label">
                Let&apos;s get started by building your digital wardrobe.
              </p>
            </div>
            
            <div className="flex gap-3 justify-center">
              <RetroButton
                variant="primary"
                size="lg"
                onClick={() => router.push('/onboarding')}
              >
                Start Setup
              </RetroButton>
              
              <RetroButton
                variant="secondary"
                size="lg"
                onClick={() => router.push('/wardrobe')}
              >
                Skip for now
              </RetroButton>
            </div>
          </div>
        </RetroWindow>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <h1 className="font-heading text-4xl md:text-5xl">
            What should I wear?
          </h1>
          <p className="text-secondary-label text-lg">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </motion.div>

        {/* Today's Outfit */}
        <RetroWindow title="Today's Outfit" className="bg-pattern-checker">
          {todayOutfit ? (
            <div className="space-y-4">
              <OutfitCard
                outfit={todayOutfit}
                onClick={() => router.push(`/outfit/${todayOutfit.id}`)}
              />
              
              <div className="flex gap-2">
                <RetroButton
                  variant="secondary"
                  onClick={generateTodayOutfit}
                  className="flex-1"
                >
                  🔄 Generate New
                </RetroButton>
                
                <RetroButton
                  variant="primary"
                  onClick={() => router.push(`/outfit/${todayOutfit.id}`)}
                  className="flex-1"
                >
                  View Details →
                </RetroButton>
              </div>
            </div>
          ) : (
            <EmptyState
              icon="👔"
              title="No outfit yet"
              message="Generate your outfit for today based on weather and your style preferences!"
              action={{
                label: "Generate Outfit",
                onClick: generateTodayOutfit,
              }}
            />
          )}
        </RetroWindow>

        {/* Quick Actions */}
        <PapercraftCard variant="flat" className="p-6">
          <h2 className="font-heading text-2xl mb-4">Quick Actions</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <RetroFolder
              icon="👕"
              label="Wardrobe"
              onClick={() => router.push('/wardrobe')}
            />
            
            <RetroFolder
              icon="📸"
              label="Add Items"
              onClick={() => router.push('/wardrobe/upload')}
            />
            
            <RetroFolder
              icon="📅"
              label="History"
              onClick={() => router.push('/history')}
            />
            
            <RetroFolder
              icon="📊"
              label="Analytics"
              onClick={() => router.push('/stats')}
            />
            
            <RetroFolder
              icon="⚙️"
              label="Settings"
              onClick={() => router.push('/settings')}
            />
            
            <RetroFolder
              icon="🌤️"
              label="Weather"
              onClick={() => router.push('/weather')}
            />
          </div>
        </PapercraftCard>

        {/* Wardrobe Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <PapercraftCard variant="default" className="p-6 text-center">
            <div className="text-4xl mb-2">👕</div>
            <div className="font-heading text-3xl mb-1">{wardrobeCount}</div>
            <div className="text-secondary-label text-sm">Items in Wardrobe</div>
          </PapercraftCard>
          
          <PapercraftCard variant="default" className="p-6 text-center">
            <div className="text-4xl mb-2">🔥</div>
            <div className="font-heading text-3xl mb-1">0</div>
            <div className="text-secondary-label text-sm">Outfits This Week</div>
          </PapercraftCard>
          
          <PapercraftCard variant="default" className="p-6 text-center">
            <div className="text-4xl mb-2">⭐</div>
            <div className="font-heading text-3xl mb-1">0</div>
            <div className="text-secondary-label text-sm">Favorites</div>
          </PapercraftCard>
        </div>
      </div>
    </div>
  );
}
