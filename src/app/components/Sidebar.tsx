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
    <aside className="hidden md:block w-64 border-r border-border">
      <div className="flex flex-col space-y-2 p-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
