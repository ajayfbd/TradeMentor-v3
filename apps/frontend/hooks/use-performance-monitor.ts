'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface PerformanceMetrics {
  navigationStart: number;
  domContentLoaded: number;
  loadComplete: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  firstInputDelay?: number;
  cumulativeLayoutShift?: number;
  timeToInteractive?: number;
}

interface UsePerformanceMonitorOptions {
  enableMetrics?: boolean;
  enableErrorTracking?: boolean;
  slowLoadThreshold?: number; // ms
  reportToConsole?: boolean;
}

export function usePerformanceMonitor({
  enableMetrics = true,
  enableErrorTracking = true,
  slowLoadThreshold = 3000,
  reportToConsole = process.env.NODE_ENV === 'development'
}: UsePerformanceMonitorOptions = {}) {
  const { toast } = useToast();
  const metricsRef = useRef<PerformanceMetrics | null>(null);
  const hasReported = useRef(false);

  const reportMetrics = useCallback((metrics: PerformanceMetrics) => {
    if (reportToConsole) {
      console.group('🔍 Performance Metrics');
      console.log('📊 Navigation Start:', metrics.navigationStart);
      console.log('📄 DOM Content Loaded:', `${metrics.domContentLoaded}ms`);
      console.log('✅ Load Complete:', `${metrics.loadComplete}ms`);
      
      if (metrics.firstContentfulPaint) {
        console.log('🎨 First Contentful Paint:', `${metrics.firstContentfulPaint}ms`);
      }
      
      if (metrics.largestContentfulPaint) {
        console.log('🖼️ Largest Contentful Paint:', `${metrics.largestContentfulPaint}ms`);
      }
      
      if (metrics.firstInputDelay) {
        console.log('⚡ First Input Delay:', `${metrics.firstInputDelay}ms`);
      }
      
      if (metrics.cumulativeLayoutShift) {
        console.log('📐 Cumulative Layout Shift:', metrics.cumulativeLayoutShift.toFixed(4));
      }
      
      console.groupEnd();
    }

    // Warn about slow performance
    if (metrics.loadComplete > slowLoadThreshold) {
      toast({
        title: "Slow Performance Detected",
        description: `Page loaded in ${Math.round(metrics.loadComplete)}ms. Consider refreshing for better performance.`,
        variant: "destructive",
        duration: 8000,
      });
    }

    // Store for potential reporting to analytics service
    metricsRef.current = metrics;
  }, [reportToConsole, slowLoadThreshold, toast]);

  const measureWebVitals = useCallback(() => {
    if (!enableMetrics || typeof window === 'undefined') return;

    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      const metrics: PerformanceMetrics = {
        navigationStart: navigation.startTime,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.startTime,
        loadComplete: navigation.loadEventEnd - navigation.startTime,
      };

      // Add paint metrics if available
      const fcp = paint.find(entry => entry.name === 'first-contentful-paint');
      if (fcp) {
        metrics.firstContentfulPaint = fcp.startTime;
      }

      reportMetrics(metrics);
    } catch (error) {
      if (reportToConsole) {
        console.warn('Failed to collect performance metrics:', error);
      }
    }
  }, [enableMetrics, reportMetrics, reportToConsole]);

  const setupPerformanceObserver = useCallback(() => {
    if (!enableMetrics || typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    try {
      // Observe Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry;
        
        if (metricsRef.current) {
          metricsRef.current.largestContentfulPaint = lastEntry.startTime;
        }
        
        if (reportToConsole) {
          console.log('🖼️ LCP Updated:', `${lastEntry.startTime.toFixed(2)}ms`);
        }
      });
      
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // Observe First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (metricsRef.current) {
            metricsRef.current.firstInputDelay = entry.processingStart - entry.startTime;
          }
          
          if (reportToConsole) {
            console.log('⚡ FID:', `${(entry.processingStart - entry.startTime).toFixed(2)}ms`);
          }
        });
      });
      
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Observe Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((list) => {
        let cls = 0;
        list.getEntries().forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            cls += entry.value;
          }
        });
        
        if (metricsRef.current) {
          metricsRef.current.cumulativeLayoutShift = cls;
        }
        
        if (reportToConsole && cls > 0.1) {
          console.warn('📐 High CLS detected:', cls.toFixed(4));
        }
      });
      
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      return () => {
        lcpObserver.disconnect();
        fidObserver.disconnect();
        clsObserver.disconnect();
      };
    } catch (error) {
      if (reportToConsole) {
        console.warn('Failed to setup performance observers:', error);
      }
    }
  }, [enableMetrics, reportToConsole]);

  const setupErrorTracking = useCallback(() => {
    if (!enableErrorTracking || typeof window === 'undefined') return;

    const handleError = (event: ErrorEvent) => {
      console.error('💥 JavaScript Error:', {
        message: event.message,
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
        error: event.error
      });

      toast({
        title: "Application Error",
        description: "An unexpected error occurred. Please refresh the page if issues persist.",
        variant: "destructive",
        duration: 5000,
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('💥 Unhandled Promise Rejection:', event.reason);
      
      toast({
        title: "Connection Error",
        description: "A network or data error occurred. Please check your connection and try again.",
        variant: "destructive",
        duration: 5000,
      });
    };

    const handleResourceError = (event: Event) => {
      const target = event.target as HTMLElement;
      console.warn('📦 Resource Load Error:', {
        type: target.tagName,
        src: (target as any).src || (target as any).href,
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    document.addEventListener('error', handleResourceError, true);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      document.removeEventListener('error', handleResourceError, true);
    };
  }, [enableErrorTracking, toast]);

  const getConnectionInfo = useCallback(() => {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      return {
        effectiveType: connection.effectiveType, // '4g', '3g', etc.
        downlink: connection.downlink, // Mbps
        rtt: connection.rtt, // ms
        saveData: connection.saveData
      };
    }
    return null;
  }, []);

  useEffect(() => {
    if (hasReported.current) return;

    const cleanup: (() => void)[] = [];

    // Measure initial performance
    if (document.readyState === 'complete') {
      measureWebVitals();
      hasReported.current = true;
    } else {
      const handleLoad = () => {
        measureWebVitals();
        hasReported.current = true;
      };
      window.addEventListener('load', handleLoad);
      cleanup.push(() => window.removeEventListener('load', handleLoad));
    }

    // Setup observers
    const observerCleanup = setupPerformanceObserver();
    if (observerCleanup) cleanup.push(observerCleanup);

    // Setup error tracking
    const errorCleanup = setupErrorTracking();
    if (errorCleanup) cleanup.push(errorCleanup);

    // Log connection info
    const connectionInfo = getConnectionInfo();
    if (connectionInfo && reportToConsole) {
      console.log('🌐 Connection Info:', connectionInfo);
      
      // Warn about slow connections
      if (connectionInfo.effectiveType === '2g' || connectionInfo.effectiveType === 'slow-2g') {
        toast({
          title: "Slow Connection Detected",
          description: "You're on a slow connection. Some features may load more slowly.",
          duration: 6000,
        });
      }
    }

    return () => {
      cleanup.forEach(fn => fn());
    };
  }, [
    measureWebVitals, 
    setupPerformanceObserver, 
    setupErrorTracking, 
    getConnectionInfo, 
    reportToConsole, 
    toast
  ]);

  return {
    metrics: metricsRef.current,
    connectionInfo: getConnectionInfo(),
    refreshMetrics: measureWebVitals
  };
}
