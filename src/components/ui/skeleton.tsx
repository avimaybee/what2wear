import { cn } from "@/lib/utils";

function Skeleton({ className, variant = "panel", ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: "panel" | "text" | "avatar" | "hourglass" }) {
  if (variant === "hourglass") {
    return (
      <div className={cn("relative flex items-center justify-center w-10 h-10", className)} role="status" aria-label="Loading">
        <div className="animate-spin-slow text-accent" aria-hidden>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2h12" /><path d="M6 22h12" /><path d="M10 2v6l-2 4 2 4v6" /><path d="M14 2v6l2 4-2 4v6" />
          </svg>
        </div>
      </div>
    );
  }
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[1rem] border-2 border-dashed border-border bg-muted/40",
        variant === "text" && "h-4 rounded-[0.5rem]",
        variant === "avatar" && "rounded-full h-12 w-12 border-2",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-[linear-gradient(90deg,transparent,hsla(40,50%,98%,0.8),transparent)]",
        className
      )}
      role="status"
      aria-label="Loading..."
      {...props}
    />
  );
}

// Add keyframe for shimmer
// This assumes globals.css includes @layer utilities; if not, fallback to default animate-pulse.

export { Skeleton };
