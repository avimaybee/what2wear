'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Sparkles, Shirt, History, Settings } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
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

      await loadWardrobeCount(user.id);
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

  async function generateOutfit() {
    try {
      setGenerating(true);
      
      const response = await fetch('/api/outfit/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: new Date().toISOString().split('T')[0] }),
      });

      if (!response.ok) throw new Error('Failed to generate outfit');
      
      const { data } = await response.json();
      if (data && data[0]?.id) {
        router.push(`/outfit/${data[0].id}`);
      }
    } catch (err) {
      console.error('Error generating outfit:', err);
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-4xl">⏳</div>
          <p className="text-sm text-[var(--muted-foreground)]">Loading...</p>
        </div>
      </div>
    );
  }

  if (needsOnboarding) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] p-8 md:p-12 text-center space-y-6">
          <div className="text-6xl">👋</div>
          <div className="space-y-3">
            <h1 className="font-heading text-3xl md:text-4xl text-gray-900">
              Welcome to SetMyFit
            </h1>
            <p className="text-gray-600 text-base md:text-lg">
              Let's build your style profile and virtual wardrobe to get started!
            </p>
          </div>
          
          <button
            onClick={() => router.push('/onboarding')}
            className="inline-flex items-center gap-2 bg-[var(--primary)] text-white px-8 py-4 rounded-full font-semibold text-base hover:opacity-90 transition-opacity shadow-lg"
          >
            <Sparkles className="w-5 h-5" />
            Get Started
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--primary)] rounded-xl flex items-center justify-center text-white font-bold text-lg">
              R
            </div>
            <span className="font-heading text-xl text-gray-900">SetMyFit</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-900 bg-gray-100"
            >
              Dashboard
            </button>
            <button
              onClick={() => router.push('/wardrobe')}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              My Wardrobe
            </button>
            <button
              onClick={() => router.push('/history')}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Outfit History
            </button>
          </nav>

          <button
            onClick={() => router.push('/settings')}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Hero Section */}
          <div className="bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] p-8 md:p-12 text-center space-y-6">
            <div className="space-y-3">
              <h1 className="font-heading text-3xl md:text-4xl text-gray-900">
                Create Your Fit
              </h1>
              <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto">
                Select items from your wardrobe to see them come to life
              </p>
            </div>

            {/* Category Selection Placeholder */}
            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto py-8">
              <button
                onClick={() => router.push('/wardrobe?category=tops')}
                className="aspect-square rounded-2xl border-2 border-dashed border-gray-300 hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all flex flex-col items-center justify-center gap-3 p-6"
              >
                <Shirt className="w-8 h-8 md:w-12 md:h-12 text-gray-400" />
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">Select a Top</p>
                  <div className="mt-2 w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center mx-auto">
                    <span className="text-gray-400 text-lg">+</span>
                  </div>
                </div>
              </button>

              <button
                onClick={() => router.push('/wardrobe?category=bottoms')}
                className="aspect-square rounded-2xl border-2 border-dashed border-gray-300 hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all flex flex-col items-center justify-center gap-3 p-6"
              >
                <div className="w-8 h-8 md:w-12 md:h-12 text-gray-400">👖</div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">Select a Bottom</p>
                  <div className="mt-2 w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center mx-auto">
                    <span className="text-gray-400 text-lg">+</span>
                  </div>
                </div>
              </button>

              <button
                onClick={() => router.push('/wardrobe?category=shoes')}
                className="aspect-square rounded-2xl border-2 border-dashed border-gray-300 hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all flex flex-col items-center justify-center gap-3 p-6"
              >
                <div className="w-8 h-8 md:w-12 md:h-12 text-gray-400">👟</div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">Select Shoes</p>
                  <div className="mt-2 w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center mx-auto">
                    <span className="text-gray-400 text-lg">+</span>
                  </div>
                </div>
              </button>
            </div>

            {/* Get My Fit Button */}
            <button
              onClick={generateOutfit}
              disabled={generating || wardrobeCount < 3}
              className="inline-flex items-center gap-2 bg-[var(--primary)] text-white px-10 py-4 rounded-full font-semibold text-base hover:opacity-90 transition-opacity shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-5 h-5" />
              {generating ? 'Creating Your Fit...' : 'Get My Fit!'}
            </button>

            {wardrobeCount < 3 && (
              <p className="text-sm text-gray-500 mt-2">
                Add at least 3 items to your wardrobe to generate outfits
              </p>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/wardrobe')}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Shirt className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{wardrobeCount}</p>
                  <p className="text-sm text-gray-600">Items</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => router.push('/history')}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                  <History className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                  <p className="text-sm text-gray-600">Outfits</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => router.push('/wardrobe/upload')}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow text-left col-span-2 md:col-span-1"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📸</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Add Items</p>
                  <p className="text-xs text-gray-600">Upload to wardrobe</p>
                </div>
              </div>
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
