'use client';

import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export default function Header() {
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

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            {/* Add Logo Here */}
            <span className="hidden font-bold sm:inline-block">setmyfit</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {loading ? (
              <div className="h-8 w-20 animate-pulse rounded-md bg-secondary" />
            ) : user ? (
              <Link href="/profile">
                <Button variant="ghost">Profile</Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button>Sign In</Button>
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
