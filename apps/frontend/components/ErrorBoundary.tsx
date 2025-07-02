'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { errorMonitoring } from '../lib/error-monitoring';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, errorId: string, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showErrorDetails?: boolean;
  level?: 'page' | 'component' | 'critical';
}

interface ErrorDisplayProps {
  level: 'page' | 'component' | 'critical';
  error: Error;
  errorId: string;
  onRetry: () => void;
  showDetails: boolean;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ 
  level, 
  error, 
  errorId, 
  onRetry, 
  showDetails 
}) => {
  const [detailsVisible, setDetailsVisible] = React.useState(false);
  
  const getErrorMessage = () => {
    // User-friendly error messages
    if (error.message.includes('ChunkLoadError') || error.message.includes('Loading chunk')) {
      return "We're having trouble loading part of the application. This usually happens after an update.";
    }
    
    if (error.message.includes('Network Error') || error.message.includes('fetch')) {
      return "We're having trouble connecting to our servers. Please check your internet connection.";
    }
    
    if (error.name === 'TypeError' && error.message.includes('null')) {
      return "Something went wrong with the data we received. Please try again.";
    }
    
    // Default messages by level
    switch (level) {
      case 'critical':
        return "A critical error occurred that affects the entire application.";
      case 'page':
        return "Something went wrong on this page.";
      case 'component':
        return "A component on this page encountered an error.";
      default:
        return "An unexpected error occurred.";
    }
  };
  
  const getErrorTitle = () => {
    switch (level) {
      case 'critical':
        return "Critical Error";
      case 'page':
        return "Page Error";
      case 'component':
        return "Component Error";
      default:
        return "Error";
    }
  };
  
  const getContainerStyles = () => {
    const baseStyles = "rounded-lg border p-6 text-center";
    
    switch (level) {
      case 'critical':
        return `${baseStyles} bg-red-50 border-red-200 text-red-900`;
      case 'page':
        return `${baseStyles} bg-orange-50 border-orange-200 text-orange-900`;
      case 'component':
        return `${baseStyles} bg-yellow-50 border-yellow-200 text-yellow-900`;
      default:
        return `${baseStyles} bg-gray-50 border-gray-200 text-gray-900`;
    }
  };
  
  const getButtonStyles = () => {
    switch (level) {
      case 'critical':
        return "bg-red-600 hover:bg-red-700 text-white";
      case 'page':
        return "bg-orange-600 hover:bg-orange-700 text-white";
      case 'component':
        return "bg-yellow-600 hover:bg-yellow-700 text-white";
      default:
        return "bg-gray-600 hover:bg-gray-700 text-white";
    }
  };
  
  return (
    <div className={getContainerStyles()}>
      <div className="mx-auto max-w-md">
        {/* Error Icon */}
        <div className="mx-auto mb-4 h-12 w-12 text-current">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
            />
          </svg>
        </div>
        
        {/* Error Title */}
        <h3 className="text-lg font-semibold mb-2">
          {getErrorTitle()}
        </h3>
        
        {/* Error Message */}
        <p className="text-sm opacity-90 mb-4">
          {getErrorMessage()}
        </p>
        
        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={onRetry}
            className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-colors ${getButtonStyles()}`}
          >
            Try Again
          </button>
          
          {showDetails && (
            <button
              onClick={() => setDetailsVisible(!detailsVisible)}
              className="w-full px-4 py-2 rounded-md text-sm font-medium bg-transparent border border-current hover:bg-current hover:bg-opacity-10 transition-colors"
            >
              {detailsVisible ? 'Hide Details' : 'Show Technical Details'}
            </button>
          )}
        </div>
        
        {/* Error Details */}
        {detailsVisible && showDetails && (
          <div className="mt-4 p-3 bg-black bg-opacity-5 rounded text-left">
            <div className="text-xs space-y-2">
              <div>
                <strong>Error ID:</strong> {errorId}
              </div>
              <div>
                <strong>Error:</strong> {error.name}
              </div>
              <div>
                <strong>Message:</strong> {error.message}
              </div>
              {error.stack && (
                <div>
                  <strong>Stack:</strong>
                  <pre className="mt-1 text-xs overflow-auto max-h-32">
                    {error.stack}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Support Information */}
        {level === 'critical' && (
          <div className="mt-4 text-xs opacity-75">
            If this problem persists, please contact support with Error ID: {errorId}
          </div>
        )}
      </div>
    </div>
  );
};

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;
  
  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }
  
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Generate unique error ID
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Update state with error info
    this.setState({
      errorInfo,
      errorId
    });
    
    // Determine error severity based on level
    const level = this.props.level || 'component';
    const severity = level === 'critical' ? 'error' : level === 'page' ? 'warning' : 'info';
    
    // Report error to monitoring
    errorMonitoring.captureException(error, {
      errorBoundary: true,
      level,
      errorId,
      componentStack: errorInfo.componentStack || undefined,
      errorInfo
    }, severity);
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🔴 ErrorBoundary (${level})`);
      console.error('Error ID:', errorId);
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.groupEnd();
    }
  }
  
  componentWillUnmount(): void {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }
  
  handleRetry = (): void => {
    // Clear any existing timeout
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
    
    // Log retry attempt
    if (this.state.errorId) {
      errorMonitoring.captureMessage(`ErrorBoundary retry attempted`, {
        errorId: this.state.errorId,
        level: this.props.level || 'component'
      }, 'info');
    }
    
    // Reset error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
    
    // For chunk load errors, reload the page after a short delay
    if (this.state.error?.message.includes('ChunkLoadError') || 
        this.state.error?.message.includes('Loading chunk')) {
      this.retryTimeoutId = setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  };
  
  render(): ReactNode {
    if (this.state.hasError && this.state.error && this.state.errorId) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.state.errorId, this.handleRetry);
      }
      
      // Use default error display
      return (
        <ErrorDisplay
          level={this.props.level || 'component'}
          error={this.state.error}
          errorId={this.state.errorId}
          onRetry={this.handleRetry}
          showDetails={this.props.showErrorDetails ?? process.env.NODE_ENV === 'development'}
        />
      );
    }
    
    return this.props.children;
  }
}

// Higher-order component for easy wrapping
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Hook for programmatic error throwing (useful for async errors)
export function useErrorHandler() {
  return React.useCallback((error: Error, context?: Record<string, any>) => {
    // Report the error
    errorMonitoring.captureException(error, {
      ...context,
      source: 'useErrorHandler'
    });
    
    // Throw the error to trigger the nearest error boundary
    throw error;
  }, []);
}

export default ErrorBoundary;
