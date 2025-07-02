// Example integration file showing how to use the error handling system
// This file demonstrates how to integrate all error handling components in a Next.js app

import React from 'react';
import ErrorBoundary, { withErrorBoundary, useErrorHandler } from '../components/ErrorBoundary';
import { ToastManager, useToast } from '../components/ToastManager';
import { errorMonitoring } from '../lib/error-monitoring';
import { performanceMonitoring } from '../lib/performance-monitoring';

// Initialize monitoring services early in the app lifecycle
export const initializeMonitoring = () => {
  // Initialize error monitoring with user ID
  errorMonitoring.initialize('user-123'); // Replace with actual user ID
  
  // Initialize performance monitoring
  performanceMonitoring.initialize();
  
  console.log('🔧 Error handling and performance monitoring initialized');
};

// Example of how to wrap your main app with error boundaries
export const AppWithErrorHandling: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ToastManager position="top-right" maxToasts={5}>
      <ErrorBoundary 
        level="critical" 
        showErrorDetails={process.env.NODE_ENV === 'development'}
        onError={(error, errorInfo) => {
          console.error('Critical app error:', error, errorInfo);
        }}
      >
        {children}
      </ErrorBoundary>
    </ToastManager>
  );
};

// Example page component with error handling
const ExamplePage: React.FC = () => {
  const { showError, showSuccess, showWarning } = useToast();
  const handleError = useErrorHandler();
  
  // Example of manual error reporting
  const handleManualError = () => {
    try {
      throw new Error('This is a test error');
    } catch (error) {
      // Report to monitoring
      errorMonitoring.captureException(error as Error, {
        source: 'manual-test',
        page: 'example'
      });
      
      // Show user-friendly toast
      showError('Test Error', 'This was a manually triggered test error');
    }
  };
  
  // Example of performance measurement
  const handleSlowOperation = async () => {
    const mark = performanceMonitoring.measureApiCall('/api/slow-endpoint', 'GET');
    mark.start();
    
    try {
      // Simulate slow operation
      await new Promise(resolve => setTimeout(resolve, 3000));
      mark.end(200);
      showSuccess('Operation Complete', 'The slow operation finished successfully');
    } catch (error) {
      mark.end(500, error as Error);
      handleError(error as Error, { operation: 'slow-operation' });
    }
  };
  
  // Example of async error that gets caught by error boundary
  const triggerAsyncError = async () => {
    // This will be caught by the error boundary
    setTimeout(() => {
      throw new Error('Async error that triggers error boundary');
    }, 1000);
  };
  
  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Error Handling Examples</h1>
      
      <div className="space-y-2">
        <button 
          onClick={handleManualError}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Test Manual Error
        </button>
        
        <button 
          onClick={handleSlowOperation}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Test Slow Operation
        </button>
        
        <button 
          onClick={triggerAsyncError}
          className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
        >
          Test Async Error Boundary
        </button>
        
        <button 
          onClick={() => showWarning('Test Warning', 'This is a test warning message')}
          className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
        >
          Test Warning Toast
        </button>
      </div>
    </div>
  );
};

// Example of component-level error boundary
const RiskyComponent: React.FC = () => {
  const [shouldError, setShouldError] = React.useState(false);
  
  if (shouldError) {
    throw new Error('Component-level error');
  }
  
  return (
    <div className="p-4 border rounded">
      <h3>Risky Component</h3>
      <button 
        onClick={() => setShouldError(true)}
        className="px-3 py-1 bg-red-500 text-white rounded text-sm"
      >
        Trigger Error
      </button>
    </div>
  );
};

const RiskyComponentWithBoundary = withErrorBoundary(RiskyComponent, {
  level: 'component',
  showErrorDetails: true
});

// Example API integration with error handling
export const apiWithErrorHandling = {
  async fetchData(endpoint: string) {
    const mark = performanceMonitoring.measureApiCall(endpoint, 'GET');
    mark.start();
    
    try {
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        mark.end(response.status, error);
        
        // Report API error
        errorMonitoring.captureException(error, {
          endpoint,
          status: response.status,
          method: 'GET'
        });
        
        throw error;
      }
      
      const data = await response.json();
      mark.end(response.status);
      return data;
    } catch (error) {
      mark.end(0, error as Error);
      
      // Report network error
      errorMonitoring.captureException(error as Error, {
        endpoint,
        method: 'GET',
        type: 'network-error'
      });
      
      throw error;
    }
  }
};

// Global error handlers for unhandled errors
export const setupGlobalErrorHandlers = () => {
  // These are automatically handled by ToastManager, but you can add custom logic here
  
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
  });
};

export default ExamplePage;
