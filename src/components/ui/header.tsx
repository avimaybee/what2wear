"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shirt, Settings, Home } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { TextRollAccessible } from '@/components/ui/text-roll';
import { cn } from '@/lib/utils';

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

  return (
    <>
      {/* Desktop Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link 
            href="/" 
            className="flex items-center space-x-3 transition-opacity hover:opacity-80"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Shirt className="h-6 w-6 text-primary-foreground" />
            </div>
            <TextRollAccessible 
              className="text-2xl md:text-3xl font-bold tracking-tight"
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
                    "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="h-4 w-4" />
                  <span>{route.label}</span>
                </Link>
              );
            })}
            <div className="ml-2 flex items-center">
              <ThemeToggle />
            </div>
          </nav>

          {/* Mobile Theme Toggle */}
          <div className="flex md:hidden">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-safe">
        <div className="grid h-16 grid-cols-3 gap-1 px-2">
          {routes.map((route) => {
            const Icon = route.icon;
            const isActive = pathname === route.href;
            
            return (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-md transition-colors",
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