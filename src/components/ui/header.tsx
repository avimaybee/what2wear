"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Shirt, Settings, Home, LogOut, User as UserIcon } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { TextRollAccessible } from '@/components/ui/text-roll';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

const routes = [
  {
    href: '/',
    label: 'Home',
    icon: Home,
  },
  {
    href: '/wardrobe',
    label: 'Wardrobe',
    icon: Shirt,
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: Settings,
  },
];

export const Header = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    
    // Get initial user
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };
    
    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/sign-in');
    router.refresh();
  };

  // Don't show header on auth pages
  if (pathname?.startsWith('/auth') || pathname === '/onboarding') {
    return null;
  }

  return (
    <>
      {/* Desktop Header */}
      <header className="sticky top-0 z-50 w-full glass-regular border-border/40">
        <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link 
            href="/" 
            className="flex items-center transition-opacity hover:opacity-80"
          >
            <TextRollAccessible 
              className="text-xl md:text-2xl font-bold tracking-tight leading-none py-1"
              as="span"
            >
              setmyfit
            </TextRollAccessible>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {routes.map((route) => {
              const Icon = route.icon;
              const isActive = pathname === route.href;
              
              return (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                    "hover:bg-accent/50 hover:text-accent-foreground",
                    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                    isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="h-4 w-4" />
                  <span>{route.label}</span>
                </Link>
              );
            })}
            
            <div className="ml-2 flex items-center gap-2">
              {!loading && user && (
                <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-accent/50 text-xs">
                  <UserIcon className="h-3 w-3" />
                  <span className="max-w-[120px] truncate">
                    {user.email?.split('@')[0]}
                  </span>
                </div>
              )}
              <ThemeToggle />
              {!loading && user && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="h-8 px-2"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              )}
            </div>
          </nav>

          {/* Mobile Theme Toggle */}
          <div className="flex md:hidden">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass-regular border-t border-border/40 pb-safe">
        <div className="grid h-14 grid-cols-3 gap-1 px-2">
          {routes.map((route) => {
            const Icon = route.icon;
            const isActive = pathname === route.href;
            
            return (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 rounded-md transition-colors",
                  "active:bg-accent",
                  isActive 
                    ? "text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={cn(
                  "h-5 w-5",
                  isActive && "text-primary"
                )} />
                <span className="text-xs font-medium">
                  {route.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Spacer for mobile bottom nav */}
      <div className="h-14 md:hidden" />
    </>
  );
};