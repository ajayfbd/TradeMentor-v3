'use client';

import { useEffect, useCallback, useRef } from 'react';

interface ErrorReport {
  id: string;
  timestamp: string;
  type: 'javascript' | 'promise' | 'resource' | 'api' | 'user';
  message: string;
  source?: string;
  line?: number;
  column?: number;
  stack?: string;
  url: string;
  userAgent: string;
  userId?: string;
  sessionId: string;
  browserInfo: {
    language: string;
    platform: string;
    cookieEnabled: boolean;
    onLine: boolean;
    viewport: {
      width: number;
      height: number;
    };
  };
  performanceInfo?: {
    memory?: any;
    connection?: any;
    timing?: PerformanceTiming;
  };
  additionalContext?: Record<string, any>;
}

interface MonitoringConfig {
  apiKey?: string;
  endpoint?: string;
  maxReports: number;
  batchSize: number;
  flushInterval: number;
  enableConsoleCapture: boolean;
  enablePerformanceMonitoring: boolean;
  enableUserInteractionTracking: boolean;
  samplingRate: number; // 0-1, percentage of errors to report
}

class ErrorTrackingService {
  private config: MonitoringConfig;
  private errorQueue: ErrorReport[] = [];
  private sessionId: string;
  private userId?: string;
  private isOnline: boolean = true;
  private flushTimer?: NodeJS.Timeout;
  private originalConsole: {
    error: typeof console.error;
    warn: typeof console.warn;
  };

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = {
      maxReports: 100,
      batchSize: 10,
      flushInterval: 30000, // 30 seconds
      enableConsoleCapture: true,
      enablePerformanceMonitoring: true,
      enableUserInteractionTracking: false, // Disabled by default for privacy
      samplingRate: 1.0, // Report all errors by default
      ...config,
    };

    this.sessionId = this.generateSessionId();
    this.originalConsole = {
      error: console.error,
      warn: console.warn,
    };

    this.setupErrorHandlers();
    this.setupNetworkMonitoring();
    this.startFlushTimer();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupErrorHandlers(): void {
    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.captureError({
        type: 'javascript',
        message: event.message,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error?.stack,
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        type: 'promise',
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
      });
    });

    // Resource loading errors
    document.addEventListener('error', (event) => {
      const target = event.target as any;
      if (target && target.tagName) {
        this.captureError({
          type: 'resource',
          message: `Failed to load resource: ${(target as any).src || (target as any).href}`,
          source: (target as any).src || (target as any).href,
          additionalContext: {
            tagName: target.tagName,
            resourceType: target.tagName.toLowerCase(),
          },
        });
      }
    }, true);

    // Console capture
    if (this.config.enableConsoleCapture) {
      this.setupConsoleCapture();
    }
  }

  private setupConsoleCapture(): void {
    console.error = (...args) => {
      this.originalConsole.error(...args);
      this.captureError({
        type: 'javascript',
        message: args.join(' '),
        additionalContext: { source: 'console.error' },
      });
    };

    console.warn = (...args) => {
      this.originalConsole.warn(...args);
      // Only capture warnings that look like errors
      const message = args.join(' ');
      if (message.toLowerCase().includes('error') || message.toLowerCase().includes('failed')) {
        this.captureError({
          type: 'javascript',
          message,
          additionalContext: { source: 'console.warn', severity: 'warning' },
        });
      }
    };
  }

  private setupNetworkMonitoring(): void {
    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushErrors(); // Flush queued errors when back online
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Monitor fetch failures
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        // Log API errors
        if (!response.ok) {
          this.captureError({
            type: 'api',
            message: `API Error: ${response.status} ${response.statusText}`,
            source: args[0] as string,
            additionalContext: {
              status: response.status,
              statusText: response.statusText,
              method: (args[1] as RequestInit)?.method || 'GET',
            },
          });
        }
        
        return response;
      } catch (error) {
        this.captureError({
          type: 'api',
          message: `Network Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          source: args[0] as string,
          stack: error instanceof Error ? error.stack : undefined,
          additionalContext: {
            method: (args[1] as RequestInit)?.method || 'GET',
          },
        });
        throw error;
      }
    };
  }

  private captureError(errorData: Partial<ErrorReport>): void {
    // Apply sampling rate
    if (Math.random() > this.config.samplingRate) {
      return;
    }

    const report: ErrorReport = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type: errorData.type || 'javascript',
      message: errorData.message || 'Unknown error',
      source: errorData.source,
      line: errorData.line,
      column: errorData.column,
      stack: errorData.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: this.userId,
      sessionId: this.sessionId,
      browserInfo: {
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      },
      additionalContext: errorData.additionalContext,
    };

    // Add performance info if enabled
    if (this.config.enablePerformanceMonitoring) {
      report.performanceInfo = {
        memory: (performance as any).memory,
        connection: (navigator as any).connection,
        timing: performance.timing,
      };
    }

    // Add to queue
    this.errorQueue.push(report);

    // Trim queue if too large
    if (this.errorQueue.length > this.config.maxReports) {
      this.errorQueue = this.errorQueue.slice(-this.config.maxReports);
    }

    // Flush immediately for critical errors
    if (errorData.type === 'javascript' && errorData.stack?.includes('ChunkLoadError')) {
      this.flushErrors();
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flushErrors();
    }, this.config.flushInterval);
  }

  private async flushErrors(): Promise<void> {
    if (this.errorQueue.length === 0 || !this.isOnline) {
      return;
    }

    const batch = this.errorQueue.splice(0, this.config.batchSize);
    
    try {
      await this.sendErrorReports(batch);
    } catch (error) {
      // Re-add to queue if sending failed
      this.errorQueue.unshift(...batch);
      console.warn('Failed to send error reports:', error);
    }
  }

  private async sendErrorReports(reports: ErrorReport[]): Promise<void> {
    const endpoint = this.config.endpoint || '/api/monitoring/errors';
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { 'X-API-Key': this.config.apiKey }),
      },
      body: JSON.stringify({ reports }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send error reports: ${response.status}`);
    }
  }

  // Public methods
  setUserId(userId: string): void {
    this.userId = userId;
  }

  captureUserError(message: string, context?: Record<string, any>): void {
    this.captureError({
      type: 'user',
      message,
      additionalContext: context,
    });
  }

  captureException(error: Error, context?: Record<string, any>): void {
    this.captureError({
      type: 'javascript',
      message: error.message,
      stack: error.stack,
      additionalContext: context,
    });
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    // Restore original console methods
    console.error = this.originalConsole.error;
    console.warn = this.originalConsole.warn;
    
    // Flush remaining errors
    this.flushErrors();
  }
}

// Global error tracking instance
let errorTracker: ErrorTrackingService;

export function initializeErrorTracking(config?: Partial<MonitoringConfig>): ErrorTrackingService {
  if (typeof window === 'undefined') {
    // Return mock for SSR
    return {} as ErrorTrackingService;
  }

  if (!errorTracker) {
    errorTracker = new ErrorTrackingService(config);
  }
  
  return errorTracker;
}

export function useErrorTracking(config?: Partial<MonitoringConfig>) {
  const trackerRef = useRef<ErrorTrackingService>();

  useEffect(() => {
    trackerRef.current = initializeErrorTracking(config);

    return () => {
      trackerRef.current?.destroy();
    };
  }, [config]);

  const captureError = useCallback((error: Error, context?: Record<string, any>) => {
    trackerRef.current?.captureException(error, context);
  }, []);

  const captureMessage = useCallback((message: string, context?: Record<string, any>) => {
    trackerRef.current?.captureUserError(message, context);
  }, []);

  const setUser = useCallback((userId: string) => {
    trackerRef.current?.setUserId(userId);
  }, []);

  return {
    captureError,
    captureMessage,
    setUser,
    tracker: trackerRef.current,
  };
}

export { ErrorTrackingService };
