"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Shirt, Settings, Home, LogOut, User as UserIcon, TrendingUp, History, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

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
    href: '/history',
    label: 'History',
    icon: History,
  },
  {
    href: '/stats',
    label: 'Stats',
    icon: TrendingUp,
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: Settings,
  },
];

// Mobile bottom nav routes (only Home, Wardrobe, History)
const mobileBottomRoutes = routes.filter(route => 
  ['/', '/wardrobe', '/history'].includes(route.href)
);

// Mobile menu routes (Stats, Settings)
const mobileMenuRoutes = routes.filter(route => 
  ['/stats', '/settings'].includes(route.href)
);

export const Header = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      <header className="sticky top-0 z-50 w-full bg-background/90 backdrop-blur-sm" role="banner">
        <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            {/* Show back button on non-home pages */}
            {pathname !== '/' && (
              <BackButton className="flex" />
            )}
            
            <Link 
              href="/" 
              className="flex items-center"
              aria-label="setmyfit home"
            >
              <span className="text-lg md:text-xl font-semibold uppercase font-[family-name:var(--font-heading)] text-foreground">
                SetMyFit
              </span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2" role="navigation" aria-label="Main navigation">
            {routes.map((route) => {
              const Icon = route.icon;
              const isActive = pathname === route.href;
              
              return (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 text-xs md:text-sm font-semibold rounded-[0.9rem] border transition-all",
                    "hover:bg-secondary hover:text-accent",
                    isActive
                      ? "border-accent bg-secondary text-accent shadow-sm"
                      : "border-border bg-card text-muted-foreground"
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="h-3.5 w-3.5 md:h-4 md:w-4" aria-hidden="true" />
                  <span>{route.label}</span>
                </Link>
              );
            })}
            
            <div className="ml-2 flex items-center gap-2">
              {!loading && user && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-accent/50 text-xs" aria-label={`Signed in as ${user.email?.split('@')[0]}`}>
                  <UserIcon className="h-3 w-3" aria-hidden="true" />
                  <span className="max-w-[120px] truncate">
                    {user.email?.split('@')[0]}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive ml-1 border-0"
                    aria-label="Sign out"
                  >
                    <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </div>
              )}
            </div>
          </nav>

          {/* Mobile Hamburger Menu */}
          <div className="flex md:hidden items-center gap-2">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 transition-transform border-0"
                  aria-label="Open menu"
                >
                  {/* Smooth icon animation */}
                  <span className={cn("inline-block transition-transform duration-200", mobileMenuOpen && "rotate-90 scale-110")}> 
                    <Menu className="h-5 w-5" aria-hidden="true" />
                  </span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <nav className="mt-6 flex flex-col gap-1" role="navigation">
                  {mobileMenuRoutes.map((route) => {
                    const Icon = route.icon;
                    const isActive = pathname === route.href;
                    
                    return (
                      <Link
                        key={route.href}
                        href={route.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md transition-colors",
                          "hover:bg-accent hover:text-accent-foreground",
                          isActive ? "bg-accent text-accent-foreground" : "text-foreground"
                        )}
                      >
                        <Icon className="h-5 w-5" aria-hidden="true" />
                        <span>{route.label}</span>
                      </Link>
                    );
                  })}
                  
                  {!loading && user && (
                    <>
                      <div className="my-3 border-t border-border" />
                      <div className="px-4 py-2 text-xs text-muted-foreground">
                        Signed in as
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 text-sm">
                        <UserIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          handleSignOut();
                        }}
                        className="justify-start gap-3 px-4 h-auto py-3 text-sm font-medium"
                      >
                        <LogOut className="h-5 w-5" aria-hidden="true" />
                        <span>Sign Out</span>
                      </Button>
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation - Only Home, Wardrobe, History */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background border-t border-border/60" role="navigation" aria-label="Mobile navigation">
        <div className="grid h-12 grid-cols-3 gap-1 px-4 pb-2 pt-1">
          {mobileBottomRoutes.map((route) => {
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
                aria-label={route.label}
              >
                <Icon className={cn(
                  "h-4 w-4 md:h-5 md:w-5",
                  isActive && "text-primary"
                )} aria-hidden="true" />
                <span className="text-[10px] md:text-xs font-medium">
                  {route.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Spacer for mobile bottom nav */}
      <div className="h-12 md:hidden" aria-hidden="true" />
    </>
  );
};