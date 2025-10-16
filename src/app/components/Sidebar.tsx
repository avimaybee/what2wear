'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Shirt, PlusSquare, History, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/wardrobe', label: 'Wardrobe', icon: Shirt },
  { href: '/create-outfit', label: 'Create', icon: PlusSquare },
  { href: '/history', label: 'History', icon: History },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:block w-64 border-r border-border/50 bg-surface-1/30">
      <div className="flex flex-col gap-2 p-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary/20 text-primary shadow-lg shadow-primary/10'
                  : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground'
              )}
            >
              <Icon className={cn(
                "h-5 w-5 transition-transform duration-200",
                isActive ? "" : "group-hover:scale-110"
              )} />
              <span>{label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-glow-pulse"></div>
              )}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
