'use client';

import { useEffect } from 'react';
import { useErrorTracking } from '@/lib/monitoring/error-tracking';
import { usePerformanceMonitor } from '@/hooks/use-performance-monitor';

interface ProductionProvidersProps {
  children: React.ReactNode;
}

export function ProductionProviders({ children }: ProductionProvidersProps) {
  // Initialize error tracking
  const { setUser } = useErrorTracking({
    apiKey: process.env.NEXT_PUBLIC_SENTRY_DSN,
    endpoint: '/api/monitoring/errors',
    maxReports: 100,
    batchSize: 10,
    flushInterval: 30000,
    enableConsoleCapture: true,
    enablePerformanceMonitoring: true,
    enableUserInteractionTracking: false,
    samplingRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0, // Sample 10% in production
  });

  // Initialize performance monitoring
  usePerformanceMonitor({
    enableMetrics: true,
    enableErrorTracking: true,
    slowLoadThreshold: process.env.NODE_ENV === 'production' ? 3000 : 5000,
    reportToConsole: process.env.NODE_ENV === 'development',
  });

  useEffect(() => {
    // Set up user identification for error tracking
    const userId = getUserId(); // Implement this function based on your auth system
    if (userId) {
      setUser(userId);
    }

    // Log application startup
    console.log('TradeMentor initialized', {
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });

    // Performance monitoring for Core Web Vitals
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Monitor Cumulative Layout Shift
      let clsScore = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsScore += (entry as any).value;
          }
        }
        
        // Report high CLS scores
        if (clsScore > 0.1) {
          console.warn('High CLS detected:', clsScore);
        }
      }).observe({ entryTypes: ['layout-shift'] });

      // Monitor Largest Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        if (lastEntry.startTime > 2500) {
          console.warn('Slow LCP detected:', lastEntry.startTime);
        }
      }).observe({ entryTypes: ['largest-contentful-paint'] });
    }
  }, [setUser]);

  return <>{children}</>;
}

// Helper function to get current user ID
function getUserId(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    // Get user ID from localStorage or your auth system
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      return user.id || user.email || null;
    }
  } catch {
    // Ignore errors
  }
  
  return null;
}
