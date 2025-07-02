type ErrorSeverity = 'error' | 'warning' | 'info';

interface ErrorContext {
  userId?: string;
  route?: string;
  action?: string;
  componentStack?: string;
  extra?: Record<string, any>;
  [key: string]: any;
}

interface QueuedError {
  error: Error;
  context?: ErrorContext;
  severity: ErrorSeverity;
  timestamp: number;
}

class ErrorMonitoring {
  private static instance: ErrorMonitoring;
  private initialized = false;
  private userId: string | null = null;
  private errorQueue: QueuedError[] = [];
  private maxQueueSize = 50;
  private reportedErrors = new Set<string>();
  private errorCooldown = 5000; // 5 seconds
  
  private constructor() {
    // Initialize global error listeners
    if (typeof window !== 'undefined') {
      // Unhandled promise rejections
      window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));
      
      // Global errors
      window.addEventListener('error', this.handleGlobalError.bind(this));
      
      // Make instance available globally
      (window as any).errorMonitoring = this;
    }
  }
  
  public static getInstance(): ErrorMonitoring {
    if (!ErrorMonitoring.instance) {
      ErrorMonitoring.instance = new ErrorMonitoring();
    }
    return ErrorMonitoring.instance;
  }
  
  public initialize(userId?: string): void {
    this.userId = userId || null;
    this.initialized = true;
    
    // Process any queued errors
    this.processErrorQueue();
  }
  
  private handlePromiseRejection(event: PromiseRejectionEvent): void {
    const error = event.reason instanceof Error 
      ? event.reason 
      : new Error(String(event.reason));
    
    this.captureException(error, {
      source: 'unhandledrejection',
      stack: error.stack,
      reason: event.reason
    });
  }
  
  private handleGlobalError(event: ErrorEvent): void {
    // Avoid duplicate reporting for errors already caught
    if (event.error) {
      this.captureException(event.error, {
        source: 'window.onerror',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    }
  }
  
  public captureException(error: Error, context?: ErrorContext, severity: ErrorSeverity = 'error'): void {
    // Create error signature for deduplication
    const errorSignature = `${error.name}:${error.message}:${context?.source || 'unknown'}`;
    
    // Check if we've recently reported this error
    if (this.reportedErrors.has(errorSignature)) {
      return;
    }
    
    // Add to reported errors with cooldown
    this.reportedErrors.add(errorSignature);
    setTimeout(() => {
      this.reportedErrors.delete(errorSignature);
    }, this.errorCooldown);
    
    // Add common context
    const enhancedContext: ErrorContext = {
      ...context,
      userId: this.userId || undefined,
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      timestamp: new Date().toISOString(),
      errorSignature
    };
    
    const queuedError: QueuedError = {
      error,
      context: enhancedContext,
      severity,
      timestamp: Date.now()
    };
    
    if (!this.initialized) {
      // Queue error for later processing
      this.addToQueue(queuedError);
      return;
    }
    
    this.processError(queuedError);
  }
  
  private addToQueue(queuedError: QueuedError): void {
    this.errorQueue.push(queuedError);
    
    // Prevent memory leaks by limiting queue size
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue = this.errorQueue.slice(-this.maxQueueSize);
    }
  }
  
  private processError(queuedError: QueuedError): void {
    const { error, context, severity } = queuedError;
    
    // Log to console based on severity
    const logMethod = severity === 'error' ? 'error' : severity === 'warning' ? 'warn' : 'info';
    console[logMethod]('[Error Monitoring]', { 
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }, 
      context, 
      severity 
    });
    
    // Send to backend for logging
    this.reportToBackend(error, context, severity);
    
    // Dispatch event for UI components (like toast notifications)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app:error', {
        detail: {
          message: this.getUserFriendlyMessage(error, context),
          type: severity,
          error,
          context
        }
      }));
    }
  }
  
  private async reportToBackend(error: Error, context?: ErrorContext, severity: ErrorSeverity = 'error'): Promise<void> {
    if (typeof fetch === 'undefined') return;
    
    try {
      await fetch('/api/monitoring/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: error.name,
          message: error.message,
          stack: error.stack,
          context,
          severity,
          timestamp: new Date().toISOString()
        }),
        // Use keepalive to ensure the request completes even if page is unloading
        keepalive: true
      });
    } catch (reportingError) {
      // Silently fail - we don't want to cause an infinite loop
      console.error('[Error Monitoring] Failed to report error:', reportingError);
    }
  }
  
  private getUserFriendlyMessage(error: Error, context?: ErrorContext): string {
    // Map technical errors to user-friendly messages
    const errorMappings: Record<string, string> = {
      'ChunkLoadError': 'Failed to load application resources. Please refresh the page.',
      'TypeError': 'An unexpected error occurred. Please try again.',
      'NetworkError': 'Network connection issue. Please check your internet connection.',
      'ReferenceError': 'Application error occurred. Please refresh the page.',
      'SyntaxError': 'Application error occurred. Please refresh the page.',
      'SecurityError': 'Security restriction encountered. Please refresh the page.',
      'AbortError': 'Operation was cancelled. Please try again.',
      'TimeoutError': 'Operation timed out. Please try again.'
    };
    
    // Check for specific error patterns
    if (error.name in errorMappings) {
      return errorMappings[error.name];
    }
    
    // Check for network-related errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return 'Network connection issue. Please check your internet connection and try again.';
    }
    
    // Check for authentication errors
    if (error.message.includes('401') || error.message.includes('unauthorized')) {
      return 'Your session has expired. Please log in again.';
    }
    
    // Check for permission errors
    if (error.message.includes('403') || error.message.includes('forbidden')) {
      return 'You don\'t have permission to perform this action.';
    }
    
    // Default user-friendly message
    return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
  }
  
  public captureMessage(message: string, context?: ErrorContext, severity: ErrorSeverity = 'info'): void {
    this.captureException(new Error(message), context, severity);
  }
  
  private processErrorQueue(): void {
    if (!this.initialized) return;
    
    while (this.errorQueue.length > 0) {
      const queuedError = this.errorQueue.shift()!;
      this.processError(queuedError);
    }
  }
  
  public getQueueSize(): number {
    return this.errorQueue.length;
  }
  
  public clearQueue(): void {
    this.errorQueue = [];
  }
}

// Initialize singleton
export const errorMonitoring = ErrorMonitoring.getInstance();

// Add global type
declare global {
  interface Window {
    errorMonitoring: ErrorMonitoring;
  }
}

export default ErrorMonitoring;
