'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const items = [
  { href: '/', label: 'Home', icon: HomeIcon },
  { href: '/wardrobe', label: 'Wardrobe', icon: WardrobeIcon },
  { href: '/create-outfit', label: 'Create', icon: PlusIcon },
  { href: '/history', label: 'History', icon: HistoryIcon },
  { href: '/profile', label: 'Profile', icon: UserIcon },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 safe-bottom border-t border-[var(--color-border)] bg-[color:oklch(24%_0_0_/_0.7)] backdrop-blur-xl"
      role="navigation"
      aria-label="Primary"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-5 gap-1 px-3 py-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <li key={href} className="flex items-center justify-center">
              <Link
                href={href}
                className="group flex w-full flex-col items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
              >
                <span
                  className={
                    active
                      ? 'rounded-full bg-[var(--color-primary)]/20 px-3 py-1 text-[var(--color-text)]'
                      : ''
                  }
                >
                  <Icon active={active} />
                </span>
                <span className={active ? 'text-[var(--color-text)]' : 'group-hover:text-[var(--color-text)]'}>
                  {label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function HomeIcon({ active }: { active?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={active ? 'text-[var(--color-primary)]' : ''}><path d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-10.5z"/></svg>
  )
}
function WardrobeIcon({ active }: { active?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={active ? 'text-[var(--color-primary)]' : ''}><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M12 3v18"/><circle cx="9" cy="12" r=".8" fill="currentColor"/><circle cx="15" cy="12" r=".8" fill="currentColor"/></svg>
  )
}
function PlusIcon({ active }: { active?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={active ? 'text-[var(--color-primary)]' : ''}><path d="M12 5v14M5 12h14"/></svg>
  )
}
function HistoryIcon({ active }: { active?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={active ? 'text-[var(--color-primary)]' : ''}><path d="M3 12a9 9 0 1 0 3-6.708"/><path d="M3 3v6h6"/><path d="M12 7v6l4 2"/></svg>
  )
}
function UserIcon({ active }: { active?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={active ? 'text-[var(--color-primary)]' : ''}><circle cx="12" cy="8" r="4"/><path d="M6 20a6 6 0 0 1 12 0"/></svg>
  )
}
