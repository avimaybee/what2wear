"use client";

import React from "react";

/**
 * Squircle Filter Component - Apple-style squircle effect
 * Inspired by Skiper UI skiper63
 * 
 * Creates a smooth, continuous curve between rounded corners
 * that mimics Apple's design language
 */

interface SquircleFilterProps {
  id?: string;
  blur?: number;
  matrix?: number;
  alpha?: number;
}

export const SquircleFilter: React.FC<SquircleFilterProps> = ({
  id = "SkiperSquiCircleFilterLayout",
  blur = 10,
  matrix = 20,
  alpha = -7,
}) => {
  return (
    <svg
      width="0"
      height="0"
      style={{ position: "absolute", pointerEvents: "none" }}
      aria-hidden="true"
    >
      <defs>
        <filter id={id}>
          <feGaussianBlur in="SourceGraphic" stdDeviation={blur} result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${matrix} ${alpha}`}
            result="squircle"
          />
          <feComposite in="SourceGraphic" in2="squircle" operator="atop" />
        </filter>
      </defs>
    </svg>
  );
};

/**
 * SquircleProvider - Injects the squircle SVG filter once at the app level
 * Usage: Wrap your app or layout with this provider
 */
export const SquircleProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <>
      <SquircleFilter />
      {children}
    </>
  );
};

/**
 * Utility function to generate squircle CSS class
 * Returns the className string to apply the squircle effect
 */
export const squircleClass = (enabled: boolean = true): string => {
  return enabled ? "squircle-filter" : "";
};

/**
 * HOC to wrap an image component with squircle effect
 */
export const withSquircle = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P & { useSquircle?: boolean }> => {
  const WrappedComponent: React.FC<P & { useSquircle?: boolean }> = ({ 
    useSquircle = false, 
    ...props 
  }) => {
    return (
      <div className={useSquircle ? "squircle-filter" : ""}>
        <Component {...(props as P)} />
      </div>
    );
  };
  
  WrappedComponent.displayName = `withSquircle(${Component.displayName || Component.name || 'Component'})`;
  
  return WrappedComponent;
};
