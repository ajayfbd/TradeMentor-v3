interface WebVitalMetric {
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  name: string;
  id: string;
  delta: number;
}

// Fallback type for when web-vitals types are not available
interface WebVitalsModule {
  onLCP: (callback: (metric: WebVitalMetric) => void) => void;
  onFID: (callback: (metric: WebVitalMetric) => void) => void;
  onCLS: (callback: (metric: WebVitalMetric) => void) => void;
  onTTFB: (callback: (metric: WebVitalMetric) => void) => void;
  onFCP: (callback: (metric: WebVitalMetric) => void) => void;
}

interface PerformanceMetrics {
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  ttfb: number | null; // Time to First Byte
  fcp: number | null; // First Contentful Paint
  [key: string]: number | null; // Allow custom metrics
}

interface TimingMark {
  name: string;
  startTime: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface PerformanceReport {
  name: string;
  value: number;
  url: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

class PerformanceMonitoring {
  private static instance: PerformanceMonitoring;
  private metrics: PerformanceMetrics = {
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
    fcp: null
  };
  private marks: Record<string, TimingMark> = {};
  private slowThreshold = 1000; // ms
  private verySlowThreshold = 3000; // ms
  private initialized = false;
  private reportQueue: PerformanceReport[] = [];
  
  private constructor() {
    if (typeof window !== 'undefined') {
      // Make instance available globally
      (window as any).performanceMonitoring = this;
      
      // Initialize Web Vitals monitoring when the class is instantiated
      this.initWebVitals();
      
      // Measure page load performance
      if (document.readyState === 'loading') {
        window.addEventListener('load', () => {
          this.measurePageLoad();
        });
      } else {
        // Document already loaded
        setTimeout(() => this.measurePageLoad(), 0);
      }
    }
  }
  
  public static getInstance(): PerformanceMonitoring {
    if (!PerformanceMonitoring.instance) {
      PerformanceMonitoring.instance = new PerformanceMonitoring();
    }
    return PerformanceMonitoring.instance;
  }
  
  public initialize(): void {
    this.initialized = true;
    this.processReportQueue();
  }
  
  private async initWebVitals(): Promise<void> {
    if (typeof window === 'undefined') return;
    
    try {
      // Dynamically import web-vitals with fallback typing
      const webVitals = await import('web-vitals') as WebVitalsModule;
      
      webVitals.onLCP((metric: WebVitalMetric) => {
        this.metrics.lcp = metric.value;
        this.reportMetric('LCP', metric.value, { rating: metric.rating });
      });
      
      webVitals.onFID((metric: WebVitalMetric) => {
        this.metrics.fid = metric.value;
        this.reportMetric('FID', metric.value, { rating: metric.rating });
      });
      
      webVitals.onCLS((metric: WebVitalMetric) => {
        this.metrics.cls = metric.value;
        this.reportMetric('CLS', metric.value, { rating: metric.rating });
      });
      
      webVitals.onTTFB((metric: WebVitalMetric) => {
        this.metrics.ttfb = metric.value;
        this.reportMetric('TTFB', metric.value, { rating: metric.rating });
      });
      
      webVitals.onFCP((metric: WebVitalMetric) => {
        this.metrics.fcp = metric.value;
        this.reportMetric('FCP', metric.value, { rating: metric.rating });
      });
      
      console.log('[Performance Monitoring] Web Vitals initialized');
    } catch (error) {
      console.warn('[Performance Monitoring] Web Vitals not available, using fallback performance monitoring');
      
      // Initialize basic performance monitoring without web-vitals
      this.initFallbackVitals();
      
      // Report error to error monitoring if available
      if ((window as any).errorMonitoring) {
        (window as any).errorMonitoring.captureException(
          error instanceof Error ? error : new Error('Failed to initialize web-vitals'),
          { source: 'performance-monitoring-init' },
          'warning'
        );
      }
    }
  }
  
  private initFallbackVitals(): void {
    // Basic LCP approximation using load event
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigationTiming) {
          const approximateLCP = navigationTiming.loadEventEnd - navigationTiming.startTime;
          this.metrics.lcp = approximateLCP;
          this.reportMetric('LCP', approximateLCP, { rating: 'unknown', fallback: true });
        }
      }, 1000);
    });
    
    // Basic FCP using paint timing API
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          for (const entry of entries) {
            if (entry.name === 'first-contentful-paint') {
              this.metrics.fcp = entry.startTime;
              this.reportMetric('FCP', entry.startTime, { rating: 'unknown', fallback: true });
            }
          }
        });
        observer.observe({ entryTypes: ['paint'] });
      } catch (e) {
        console.debug('[Performance Monitoring] PerformanceObserver not supported');
      }
    }
  }
  
  private measurePageLoad(): void {
    if (typeof window === 'undefined' || !window.performance) return;
    
    try {
      const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigationTiming) {
        const pageLoadTime = navigationTiming.loadEventEnd - navigationTiming.startTime;
        
        // Calculate detailed timing breakdown
        const timingBreakdown = {
          dns: navigationTiming.domainLookupEnd - navigationTiming.domainLookupStart,
          tcp: navigationTiming.connectEnd - navigationTiming.connectStart,
          ttfb: navigationTiming.responseStart - navigationTiming.requestStart,
          download: navigationTiming.responseEnd - navigationTiming.responseStart,
          processing: navigationTiming.domComplete - navigationTiming.domInteractive,
          domContentLoaded: navigationTiming.domContentLoadedEventEnd - navigationTiming.domContentLoadedEventStart,
          load: navigationTiming.loadEventEnd - navigationTiming.loadEventStart
        };
        
        this.reportMetric('PageLoad', pageLoadTime, { timingBreakdown });
        
        // Check if it's slow and report performance issues
        if (pageLoadTime > this.verySlowThreshold) {
          this.reportPerformanceIssue('Very slow page load', {
            duration: pageLoadTime,
            timing: timingBreakdown,
            severity: 'high'
          });
        } else if (pageLoadTime > this.slowThreshold) {
          this.reportPerformanceIssue('Slow page load', {
            duration: pageLoadTime,
            timing: timingBreakdown,
            severity: 'medium'
          });
        }
      }
    } catch (error) {
      console.error('[Performance Monitoring] Failed to measure page load:', error);
    }
  }
  
  public startMark(name: string, metadata?: Record<string, any>): void {
    if (typeof performance === 'undefined') return;
    
    this.marks[name] = {
      name,
      startTime: performance.now(),
      metadata
    };
  }
  
  public endMark(name: string, additionalMetadata?: Record<string, any>): number {
    if (typeof performance === 'undefined') return 0;
    
    const mark = this.marks[name];
    if (!mark) {
      console.warn(`[Performance Monitoring] Performance mark "${name}" not found`);
      return 0;
    }
    
    const endTime = performance.now();
    const duration = endTime - mark.startTime;
    
    mark.duration = duration;
    
    if (additionalMetadata) {
      mark.metadata = { ...mark.metadata, ...additionalMetadata };
    }
    
    // Report the duration
    this.reportMetric(name, duration, mark.metadata);
    
    // Check if it's slow
    if (duration > this.verySlowThreshold) {
      this.reportPerformanceIssue(`Very slow operation: ${name}`, {
        duration,
        severity: 'high',
        ...mark.metadata
      });
    } else if (duration > this.slowThreshold) {
      this.reportPerformanceIssue(`Slow operation: ${name}`, {
        duration,
        severity: 'medium',
        ...mark.metadata
      });
    }
    
    // Clean up the mark
    delete this.marks[name];
    
    return duration;
  }
  
  public measureApiCall(url: string, method: string = 'GET'): { 
    start: () => void; 
    end: (status?: number, error?: Error) => number 
  } {
    const markName = `api-${method}-${url}`;
    
    return {
      start: () => {
        this.startMark(markName, { url, method, type: 'api-call' });
      },
      end: (status?: number, error?: Error) => {
        const duration = this.endMark(markName, { status, error: error?.message });
        
        // Report API performance issues
        if (duration > 5000) { // 5 second threshold for API calls
          this.reportPerformanceIssue(`Slow API call: ${method} ${url}`, {
            duration,
            status,
            error: error?.message,
            severity: 'medium'
          });
        }
        
        return duration;
      }
    };
  }
  
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }
  
  private reportMetric(name: string, value: number, metadata?: Record<string, any>): void {
    const report: PerformanceReport = {
      name,
      value: Math.round(value * 100) / 100, // Round to 2 decimal places
      url: typeof window !== 'undefined' ? window.location.pathname : '',
      timestamp: new Date().toISOString(),
      metadata
    };
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[Performance] ${name}: ${report.value}ms`, metadata);
    }
    
    if (!this.initialized) {
      this.reportQueue.push(report);
      return;
    }
    
    this.sendMetricToBackend(report);
  }
  
  private async sendMetricToBackend(report: PerformanceReport): Promise<void> {
    if (typeof fetch === 'undefined') return;
    
    try {
      await fetch('/api/monitoring/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(report),
        keepalive: true
      });
    } catch (error) {
      // Silently fail for metric reporting
      console.debug('[Performance Monitoring] Failed to report metric:', error);
    }
  }
  
  private reportPerformanceIssue(message: string, data?: Record<string, any>): void {
    // Log to console
    console.warn(`[Performance Issue] ${message}`, data);
    
    // Report to error monitoring with warning severity
    if (typeof window !== 'undefined' && (window as any).errorMonitoring) {
      (window as any).errorMonitoring.captureMessage(message, {
        performanceData: data,
        metrics: this.getMetrics(),
        source: 'performance-monitoring'
      }, 'warning');
    }
    
    // Potentially show UI notification for very slow operations
    if (data?.severity === 'high' && data?.duration && data.duration > this.verySlowThreshold) {
      this.showPerformanceWarning(message);
    }
  }
  
  private showPerformanceWarning(message: string): void {
    // Check if we can detect slow network
    const connection = (navigator as any).connection;
    const isSlowNetwork = connection && (
      connection.effectiveType === 'slow-2g' || 
      connection.effectiveType === '2g'
    );
    
    // Don't show warnings if user is on a known slow connection
    if (isSlowNetwork) return;
    
    // Dispatch event for UI components to show a warning
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app:performanceWarning', {
        detail: { message }
      }));
    }
  }
  
  private processReportQueue(): void {
    while (this.reportQueue.length > 0) {
      const report = this.reportQueue.shift()!;
      this.sendMetricToBackend(report);
    }
  }
  
  public getConnectionInfo(): Record<string, any> {
    const connection = (navigator as any).connection;
    if (!connection) return {};
    
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    };
  }
  
  public getDeviceInfo(): Record<string, any> {
    return {
      memory: (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
      } : null,
      hardwareConcurrency: navigator.hardwareConcurrency,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled
    };
  }
}

// Initialize singleton
export const performanceMonitoring = PerformanceMonitoring.getInstance();

// Add global type
declare global {
  interface Window {
    performanceMonitoring: PerformanceMonitoring;
  }
}

export default PerformanceMonitoring;
