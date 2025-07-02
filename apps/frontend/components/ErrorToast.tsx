'use client';

import React, { useEffect, useState } from 'react';

export interface ToastData {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number; // ms, 0 for persistent
  dismissible?: boolean;
}

interface ErrorToastProps extends ToastData {
  onDismiss: (id: string) => void;
  onExpire: (id: string) => void;
}

const ErrorToast: React.FC<ErrorToastProps> = ({
  id,
  type,
  title,
  message,
  action,
  duration = 5000,
  dismissible = true,
  onDismiss,
  onExpire
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  
  const handleExpire = React.useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onExpire(id);
    }, 300);
  }, [id, onExpire]);

  useEffect(() => {
    // Animate in
    const showTimer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto-dismiss timer
    let dismissTimer: NodeJS.Timeout | undefined;
    if (duration > 0) {
      dismissTimer = setTimeout(() => {
        handleExpire();
      }, duration);
    }
    
    return () => {
      clearTimeout(showTimer);
      if (dismissTimer) clearTimeout(dismissTimer);
    };
  }, [duration, handleExpire]);
  
  const handleDismiss = () => {
    if (!dismissible) return;
    
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(id);
    }, 300); // Match animation duration
  };
  
  const getToastStyles = () => {
    const baseStyles = "rounded-lg shadow-lg border p-4 max-w-sm w-full transition-all duration-300 transform";
    const positionStyles = isVisible && !isExiting 
      ? "translate-x-0 opacity-100" 
      : "translate-x-full opacity-0";
    
    const typeStyles = {
      error: "bg-red-50 border-red-200 text-red-900",
      warning: "bg-yellow-50 border-yellow-200 text-yellow-900", 
      info: "bg-blue-50 border-blue-200 text-blue-900",
      success: "bg-green-50 border-green-200 text-green-900"
    };
    
    return `${baseStyles} ${positionStyles} ${typeStyles[type]}`;
  };
  
  const getIconStyles = () => {
    const typeStyles = {
      error: "text-red-400",
      warning: "text-yellow-400",
      info: "text-blue-400", 
      success: "text-green-400"
    };
    
    return `h-5 w-5 ${typeStyles[type]}`;
  };
  
  const getIcon = () => {
    switch (type) {
      case 'error':
        return (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'warning':
        return (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'info':
        return (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'success':
        return (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };
  
  const getButtonStyles = () => {
    const typeStyles = {
      error: "text-red-600 hover:text-red-800 hover:bg-red-100",
      warning: "text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100",
      info: "text-blue-600 hover:text-blue-800 hover:bg-blue-100",
      success: "text-green-600 hover:text-green-800 hover:bg-green-100"
    };
    
    return `text-sm font-medium px-3 py-1 rounded transition-colors ${typeStyles[type]}`;
  };
  
  return (
    <div className={getToastStyles()}>
      <div className="flex items-start">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className={getIconStyles()}>
            {getIcon()}
          </div>
        </div>
        
        {/* Content */}
        <div className="ml-3 flex-1">
          <h4 className="text-sm font-medium">
            {title}
          </h4>
          {message && (
            <p className="mt-1 text-sm opacity-90">
              {message}
            </p>
          )}
          
          {/* Action Button */}
          {action && (
            <div className="mt-2">
              <button
                onClick={action.onClick}
                className={getButtonStyles()}
              >
                {action.label}
              </button>
            </div>
          )}
        </div>
        
        {/* Dismiss Button */}
        {dismissible && (
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={handleDismiss}
              className="inline-flex text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span className="sr-only">Dismiss</span>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
      
      {/* Progress Bar for timed toasts */}
      {duration > 0 && (
        <div className="mt-3 bg-black bg-opacity-10 rounded-full h-1 overflow-hidden">
          <div 
            className="h-full bg-current opacity-30 transition-all ease-linear"
            style={{
              animation: `toast-progress ${duration}ms linear forwards`,
              animationPlayState: isExiting ? 'paused' : 'running'
            }}
          />
        </div>
      )}
      
      <style jsx>{`
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default ErrorToast;
