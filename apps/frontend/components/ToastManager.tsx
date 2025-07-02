'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import ErrorToast, { ToastData } from './ErrorToast';

// Toast state management
interface ToastState {
  toasts: ToastData[];
}

type ToastAction = 
  | { type: 'ADD_TOAST'; payload: ToastData }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'CLEAR_ALL' };

const toastReducer = (state: ToastState, action: ToastAction): ToastState => {
  switch (action.type) {
    case 'ADD_TOAST':
      // Limit to 5 toasts maximum
      const newToasts = [action.payload, ...state.toasts].slice(0, 5);
      return { toasts: newToasts };
    
    case 'REMOVE_TOAST':
      return {
        toasts: state.toasts.filter(toast => toast.id !== action.payload)
      };
    
    case 'CLEAR_ALL':
      return { toasts: [] };
    
    default:
      return state;
  }
};

// Toast context
interface ToastContextValue {
  addToast: (toast: Omit<ToastData, 'id'>) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
  // Convenience methods
  showError: (title: string, message?: string, options?: Partial<ToastData>) => void;
  showWarning: (title: string, message?: string, options?: Partial<ToastData>) => void;
  showInfo: (title: string, message?: string, options?: Partial<ToastData>) => void;
  showSuccess: (title: string, message?: string, options?: Partial<ToastData>) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// Error message mapping for user-friendly display
const getUserFriendlyErrorMessage = (error: Error | string): { title: string; message?: string } => {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorName = typeof error === 'string' ? 'Error' : error.name;
  
  // Network errors
  if (errorMessage.includes('Network Error') || errorMessage.includes('fetch')) {
    return {
      title: 'Connection Problem',
      message: "We're having trouble connecting to our servers. Please check your internet connection and try again."
    };
  }
  
  // Chunk loading errors (code splitting)
  if (errorMessage.includes('ChunkLoadError') || errorMessage.includes('Loading chunk')) {
    return {
      title: 'Loading Error',
      message: "We're having trouble loading part of the application. This usually happens after an update. Please refresh the page."
    };
  }
  
  // Authentication errors
  if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
    return {
      title: 'Authentication Required',
      message: 'Your session has expired. Please sign in again.'
    };
  }
  
  // Permission errors
  if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
    return {
      title: 'Access Denied',
      message: "You don't have permission to perform this action."
    };
  }
  
  // Server errors
  if (errorMessage.includes('500') || errorMessage.includes('Internal Server Error')) {
    return {
      title: 'Server Error',
      message: "We're experiencing technical difficulties. Please try again in a few moments."
    };
  }
  
  // Rate limiting
  if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
    return {
      title: 'Too Many Requests',
      message: 'Please wait a moment before trying again.'
    };
  }
  
  // Validation errors
  if (errorName === 'ValidationError' || errorMessage.includes('validation')) {
    return {
      title: 'Invalid Input',
      message: 'Please check your input and try again.'
    };
  }
  
  // Type errors (often programming errors)
  if (errorName === 'TypeError') {
    return {
      title: 'Something Went Wrong',
      message: 'An unexpected error occurred. Please try again or contact support if the problem persists.'
    };
  }
  
  // Default error handling
  return {
    title: 'Error',
    message: errorMessage.length > 100 ? 
      'An unexpected error occurred. Please try again.' : 
      errorMessage
  };
};

// Toast Manager Provider
interface ToastManagerProps {
  children: React.ReactNode;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxToasts?: number;
}

export const ToastManager: React.FC<ToastManagerProps> = ({ 
  children, 
  position = 'top-right', 
  maxToasts = 5 
}) => {
  const [state, dispatch] = useReducer(toastReducer, { toasts: [] });
  
  const generateId = () => `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const addToast = useCallback((toast: Omit<ToastData, 'id'>) => {
    const newToast: ToastData = {
      id: generateId(),
      ...toast
    };
    dispatch({ type: 'ADD_TOAST', payload: newToast });
  }, []);
  
  const removeToast = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_TOAST', payload: id });
  }, []);
  
  const clearAll = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' });
  }, []);
  
  // Convenience methods
  const showError = useCallback((title: string, message?: string, options?: Partial<ToastData>) => {
    addToast({
      type: 'error',
      title,
      message,
      duration: 8000, // Longer duration for errors
      dismissible: true,
      ...options
    });
  }, [addToast]);
  
  const showWarning = useCallback((title: string, message?: string, options?: Partial<ToastData>) => {
    addToast({
      type: 'warning',
      title,
      message,
      duration: 6000,
      dismissible: true,
      ...options
    });
  }, [addToast]);
  
  const showInfo = useCallback((title: string, message?: string, options?: Partial<ToastData>) => {
    addToast({
      type: 'info',
      title,
      message,
      duration: 4000,
      dismissible: true,
      ...options
    });
  }, [addToast]);
  
  const showSuccess = useCallback((title: string, message?: string, options?: Partial<ToastData>) => {
    addToast({
      type: 'success',
      title,
      message,
      duration: 4000,
      dismissible: true,
      ...options
    });
  }, [addToast]);
  
  // Global error event listeners
  useEffect(() => {
    // Listen for uncaught errors
    const handleError = (event: ErrorEvent) => {
      const { title, message } = getUserFriendlyErrorMessage(event.error || event.message);
      showError(title, message, {
        action: {
          label: 'Reload Page',
          onClick: () => window.location.reload()
        }
      });
    };
    
    // Listen for unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      const { title, message } = getUserFriendlyErrorMessage(error);
      showError(title, message);
    };
    
    // Listen for performance warnings
    const handlePerformanceWarning = (event: CustomEvent) => {
      showWarning('Performance Issue', event.detail.message, {
        duration: 6000
      });
    };
    
    // Listen for app-specific error events
    const handleAppError = (event: CustomEvent) => {
      const { title, message, type = 'error', ...options } = event.detail;
      
      switch (type) {
        case 'error':
          showError(title, message, options);
          break;
        case 'warning':
          showWarning(title, message, options);
          break;
        case 'info':
          showInfo(title, message, options);
          break;
        case 'success':
          showSuccess(title, message, options);
          break;
      }
    };
    
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('app:performanceWarning', handlePerformanceWarning as EventListener);
    window.addEventListener('app:showToast', handleAppError as EventListener);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('app:performanceWarning', handlePerformanceWarning as EventListener);
      window.removeEventListener('app:showToast', handleAppError as EventListener);
    };
  }, [showError, showWarning, showInfo, showSuccess]);
  
  const getPositionStyles = () => {
    const baseStyles = "fixed z-50 pointer-events-none";
    
    switch (position) {
      case 'top-right':
        return `${baseStyles} top-4 right-4`;
      case 'top-left':
        return `${baseStyles} top-4 left-4`;
      case 'bottom-right':
        return `${baseStyles} bottom-4 right-4`;
      case 'bottom-left':
        return `${baseStyles} bottom-4 left-4`;
      case 'top-center':
        return `${baseStyles} top-4 left-1/2 transform -translate-x-1/2`;
      case 'bottom-center':
        return `${baseStyles} bottom-4 left-1/2 transform -translate-x-1/2`;
      default:
        return `${baseStyles} top-4 right-4`;
    }
  };
  
  const contextValue: ToastContextValue = {
    addToast,
    removeToast,
    clearAll,
    showError,
    showWarning,
    showInfo,
    showSuccess
  };
  
  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      
      {/* Toast Container */}
      <div className={getPositionStyles()}>
        <div className="space-y-2 pointer-events-auto">
          {state.toasts.map((toast) => (
            <ErrorToast
              key={toast.id}
              {...toast}
              onDismiss={removeToast}
              onExpire={removeToast}
            />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
};

// Hook to use toast functionality
export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastManager');
  }
  return context;
};

// Utility function to show toasts from anywhere in the app
export const toast = {
  show: (type: ToastData['type'], title: string, message?: string, options?: Partial<ToastData>) => {
    window.dispatchEvent(new CustomEvent('app:showToast', {
      detail: { type, title, message, ...options }
    }));
  },
  error: (title: string, message?: string, options?: Partial<ToastData>) => {
    window.dispatchEvent(new CustomEvent('app:showToast', {
      detail: { type: 'error', title, message, ...options }
    }));
  },
  warning: (title: string, message?: string, options?: Partial<ToastData>) => {
    window.dispatchEvent(new CustomEvent('app:showToast', {
      detail: { type: 'warning', title, message, ...options }
    }));
  },
  info: (title: string, message?: string, options?: Partial<ToastData>) => {
    window.dispatchEvent(new CustomEvent('app:showToast', {
      detail: { type: 'info', title, message, ...options }
    }));
  },
  success: (title: string, message?: string, options?: Partial<ToastData>) => {
    window.dispatchEvent(new CustomEvent('app:showToast', {
      detail: { type: 'success', title, message, ...options }
    }));
  }
};

export default ToastManager;
