import Link from 'next/link';

export const Header = () => {
  return (
    <header className="py-4 px-8 flex justify-between items-center border-b border-border">
      <Link href="/" className="text-2xl font-serif font-bold text-foreground">
        setmyfit
      </Link>
      <nav className="flex items-center gap-6">
        <Link href="/wardrobe" className="text-foreground hover:text-primary transition-colors">
          Wardrobe
        </Link>
        <Link href="/settings" className="text-foreground hover:text-primary transition-colors">
          Settings
        </Link>
      </nav>
    </header>
  );
};