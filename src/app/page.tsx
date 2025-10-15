import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[calc(100vh-72px)] text-center px-4">
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-duke-blue opacity-20 blur-[100px]"></div>
      </div>
      <h1 className="text-5xl font-serif font-bold tracking-tighter sm:text-7xl">
        Reimagine Your Wardrobe
      </h1>
      <p className="mt-6 max-w-prose mx-auto text-muted-foreground sm:text-xl">
        Discover the future of personal styling. Effortless, intelligent, and
        uniquely yours.
      </p>

      <div className="mt-10 flex justify-center gap-4">
        <Link href="/login">
          <Button size="lg">Get Started for Free</Button>
        </Link>
        <Link href="https://github.com/avimaybee/what2wear">
          <Button size="lg" variant="outline">
            Star on GitHub
          </Button>
        </Link>
      </div>
    </main>
  );
}
