"use client";

import { motion } from "framer-motion";
import React from "react";
import { cn } from "@/lib/utils";

/**
 * TextRoll Component - Hover animation with rolling text effect
 * Inspired by Skiper UI skiper58
 * 
 * Features smooth text transitions where characters roll and animate
 * individually on hover, with optional center-out stagger effect
 */

const STAGGER = 0.035;

interface TextRollProps {
  children: string;
  className?: string;
  center?: boolean;
  as?: React.ElementType;
}

export const TextRoll: React.FC<TextRollProps> = ({
  children,
  className,
  center = false,
  as = "span",
}) => {
  const Component = as;
  
  return (
    <Component
      className={cn("relative block overflow-hidden", className)}
      style={{
        lineHeight: 0.75,
      }}
    >
      <motion.span
        initial="initial"
        whileHover="hovered"
        className="relative block"
      >
        <div>
          {children.split("").map((char, i) => {
            const delay = center
              ? STAGGER * Math.abs(i - (children.length - 1) / 2)
              : STAGGER * i;

            return (
              <motion.span
                variants={{
                  initial: {
                    y: 0,
                  },
                  hovered: {
                    y: "-100%",
                  },
                }}
                transition={{
                  ease: "easeInOut",
                  delay,
                }}
                className="inline-block"
                key={`${char}-${i}-top`}
              >
                {char === " " ? "\u00A0" : char}
              </motion.span>
            );
          })}
        </div>
        <div className="absolute inset-0">
          {children.split("").map((char, i) => {
            const delay = center
              ? STAGGER * Math.abs(i - (children.length - 1) / 2)
              : STAGGER * i;

            return (
              <motion.span
                variants={{
                  initial: {
                    y: "100%",
                  },
                  hovered: {
                    y: 0,
                  },
                }}
                transition={{
                  ease: "easeInOut",
                  delay,
                }}
                className="inline-block"
                key={`${char}-${i}-bottom`}
                aria-hidden="true"
              >
                {char === " " ? "\u00A0" : char}
              </motion.span>
            );
          })}
        </div>
      </motion.span>
    </Component>
  );
};

/**
 * TextRollNavigation - Navigation with text roll effects
 * Example usage for navigation items
 */
interface NavigationItem {
  name: string;
  href: string;
  description?: string;
}

interface TextRollNavigationProps {
  items: NavigationItem[];
  className?: string;
  itemClassName?: string;
  onItemClick?: (item: NavigationItem) => void;
}

export const TextRollNavigation: React.FC<TextRollNavigationProps> = ({
  items,
  className,
  itemClassName,
  onItemClick,
}) => {
  return (
    <ul
      className={cn(
        "flex min-h-full w-full flex-1 flex-col items-center justify-center gap-1.5 rounded-2xl px-7 py-3 backdrop-blur-sm",
        className
      )}
    >
      {items.map((item, index) => (
        <li
          className="relative flex cursor-pointer flex-col items-center overflow-visible"
          key={index}
          onClick={() => onItemClick?.(item)}
        >
          <div className="relative flex items-start">
            <TextRoll
              center
              className={cn(
                "text-4xl font-extrabold leading-[0.8] tracking-[-0.03em] transition-colors lg:text-5xl",
                itemClassName
              )}
            >
              {item.name}
            </TextRoll>
          </div>
        </li>
      ))}
    </ul>
  );
};

/**
 * Accessibility-friendly version with reduced motion support
 */
export const TextRollAccessible: React.FC<TextRollProps> = (props) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  if (prefersReducedMotion) {
    const Component = props.as || "span";
    return (
      <Component className={cn("relative block", props.className)}>
        {props.children}
      </Component>
    );
  }

  return <TextRoll {...props} />;
};
