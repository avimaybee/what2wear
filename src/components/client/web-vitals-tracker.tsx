'use client';

import { useEffect } from 'react';
import { webVitals } from '@/lib/performance/web-vitals';

export function WebVitalsTracker() {
  useEffect(() => {
    // Initialize web vitals tracking on mount
    webVitals.init();
  }, []);

  return null; // This component doesn't render anything
}
