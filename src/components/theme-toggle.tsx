"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

// Custom hook for theme toggle with View Transitions API
export const useThemeToggle = (buttonRef: React.RefObject<HTMLButtonElement | null>) => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isDark, setIsDark] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (mounted) {
      setIsDark(resolvedTheme === "dark");
    }
  }, [resolvedTheme, mounted]);

  const styleId = "theme-transition-styles";

  const updateStyles = React.useCallback((css: string) => {
    if (typeof window === "undefined") return;

    let styleElement = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    styleElement.textContent = css;
  }, []);

  const toggleTheme = React.useCallback(() => {
    if (!mounted || !buttonRef.current) return;
    
    setIsDark(!isDark);

    // Get button position to calculate circle origin
    const rect = buttonRef.current.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    // Create circle-blur animation from button position
    const css = `
      ::view-transition-old(root),
      ::view-transition-new(root) {
        animation: none;
        mix-blend-mode: normal;
      }

      ::view-transition-old(root) {
        z-index: 1;
      }

      ::view-transition-new(root) {
        z-index: 2147483646;
        animation: circle-clip 0.7s ease-in-out;
      }

      @keyframes circle-clip {
        0% {
          clip-path: circle(0px at ${x}px ${y}px);
          filter: blur(8px);
        }
        50% {
          filter: blur(4px);
        }
        100% {
          clip-path: circle(${endRadius}px at ${x}px ${y}px);
          filter: blur(0px);
        }
      }
    `;

    updateStyles(css);

    if (typeof window === "undefined") return;

    const switchTheme = () => {
      setTheme(theme === "light" ? "dark" : "light");
    };

    // Check if View Transitions API is supported
    if (!document.startViewTransition) {
      switchTheme();
      return;
    }

    document.startViewTransition(switchTheme);
  }, [theme, setTheme, updateStyles, isDark, mounted, buttonRef]);

  return {
    isDark,
    toggleTheme,
    mounted,
  };
};

// Main ThemeToggle component with Sun/Moon icons
export function ThemeToggle({
  className = "",
}: {
  className?: string;
}) {
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const { isDark, toggleTheme, mounted } = useThemeToggle(buttonRef);

  if (!mounted) {
    return (
      <button
        type="button"
        ref={buttonRef}
        className={cn(
          "relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors",
          className
        )}
        aria-label="Toggle theme"
        disabled
      >
        <span className="sr-only">Toggle theme</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      </button>
    );
  }

  return (
    <button
      type="button"
      ref={buttonRef}
      className={cn(
        "relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors",
        className
      )}
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
    >
      <span className="sr-only">Toggle theme</span>
      {/* Sun Icon */}
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={false}
        animate={{
          scale: isDark ? 0 : 1,
          rotate: isDark ? 90 : 0,
          opacity: isDark ? 0 : 1,
        }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        style={{ position: "absolute" }}
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
      </motion.svg>
      {/* Moon Icon */}
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={false}
        animate={{
          scale: isDark ? 1 : 0,
          rotate: isDark ? 0 : -90,
          opacity: isDark ? 1 : 0,
        }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        style={{ position: "absolute" }}
      >
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      </motion.svg>
    </button>
  );
}
