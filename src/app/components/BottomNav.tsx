'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Shirt, PlusSquare, History, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/wardrobe', label: 'Wardrobe', icon: Shirt },
  { href: '/create-outfit', label: 'Create', icon: PlusSquare },
  { href: '/history', label: 'History', icon: History },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[72px] bg-background/60 backdrop-blur-xl border-t border-border safe-bottom z-50 md:hidden">
      <div className="flex justify-around items-center h-full max-w-md mx-auto px-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link key={href} href={href} className="relative flex flex-col items-center justify-center flex-1 text-muted-foreground hover:text-foreground transition-colors duration-200">
              <Icon className={cn('h-6 w-6', isActive && 'text-foreground')} />
              <span className={cn('text-xs mt-1', isActive && 'text-foreground font-semibold')}>{label}</span>
              {isActive && (
                <motion.div
                  layoutId="underline"
                  className="absolute bottom-0 h-0.5 w-6 bg-foreground"
                  style={{ borderRadius: 9999 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
