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
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-surface-1/95 backdrop-blur-xl border-t border-border/50 safe-bottom z-50 md:hidden">
      <div className="flex justify-around items-center h-full max-w-md mx-auto px-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link 
              key={href} 
              href={href} 
              className="relative flex flex-col items-center justify-center flex-1 group"
            >
              <div className={cn(
                "relative flex flex-col items-center justify-center transition-all duration-200",
                isActive ? "scale-110" : "scale-100 group-hover:scale-105"
              )}>
                <div className={cn(
                  "p-2 rounded-xl transition-all duration-200",
                  isActive 
                    ? "bg-primary/20 text-primary" 
                    : "text-muted-foreground group-hover:text-foreground group-hover:bg-surface-2"
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className={cn(
                  'text-[10px] mt-1 font-medium transition-colors duration-200',
                  isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                )}>
                  {label}
                </span>
              </div>
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute -bottom-1 h-1 w-8 bg-primary rounded-full"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
