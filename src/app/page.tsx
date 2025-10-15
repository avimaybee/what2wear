'use client';

import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import OutfitRecommender from './wardrobe/OutfitRecommender';
import Button from './components/Button';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setLoading(false);
    };
    checkUser();
  }, []);

  const FADE_IN_ANIMATION_VARIANTS = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 20 } },
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-[calc(100vh-72px)] p-4 md:p-8 text-center">
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[radial-gradient(hsl(var(--secondary))_1px,transparent_1px)] [background-size:32px_32px]"></div>
      <motion.div
        initial="hidden"
        animate="show"
        viewport={{ once: true }}
        variants={{
          hidden: {},
          show: {
            transition: {
              staggerChildren: 0.15,
            },
          },
        }}
        className="w-full max-w-3xl"
      >
        <motion.h1
          className="text-5xl font-bold tracking-tighter sm:text-7xl"
          variants={FADE_IN_ANIMATION_VARIANTS}
        >
          Style, simplified.
        </motion.h1>
        <motion.p
          className="mt-6 max-w-prose mx-auto text-muted-foreground sm:text-xl"
          variants={FADE_IN_ANIMATION_VARIANTS}
        >
          Your digital wardrobe and personal AI stylist. All in one place.
        </motion.p>

        <motion.div
          className="mt-10 flex justify-center gap-4"
          variants={FADE_IN_ANIMATION_VARIANTS}
        >
          {loading ? (
            <div className="h-12 w-48 rounded-md bg-secondary animate-pulse" />
          ) : user ? (
            <Link href="/wardrobe">
              <Button size="lg">Enter Your Wardrobe</Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button size="lg">Get Started</Button>
              </Link>
              <Link href="https://github.com/avimaybee/what2wear">
                <Button size="lg" variant="outline">
                  Star on GitHub
                </Button>
              </Link>
            </>
          )}
        </motion.div>
      </motion.div>

      {user && !loading && (
        <motion.div 
          className="w-full mt-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 100, damping: 20 }}
        >
          <h2 className="text-2xl font-bold tracking-tight">Your Daily Picks</h2>
          <OutfitRecommender />
        </motion.div>
      )}
    </main>
  );
}