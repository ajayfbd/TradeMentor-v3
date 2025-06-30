'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info';
  action?: React.ReactNode;
  className?: string;
}

const variantStyles = {
  default: {
    container: 'bg-background border-border',
    icon: <Info className="h-4 w-4" />,
    iconColor: 'text-blue-500',
  },
  destructive: {
    container: 'bg-red-50 border-red-200 text-red-900',
    icon: <AlertCircle className="h-4 w-4" />,
    iconColor: 'text-red-500',
  },
  success: {
    container: 'bg-green-50 border-green-200 text-green-900',
    icon: <CheckCircle className="h-4 w-4" />,
    iconColor: 'text-green-500',
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    icon: <AlertTriangle className="h-4 w-4" />,
    iconColor: 'text-yellow-500',
  },
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-900',
    icon: <Info className="h-4 w-4" />,
    iconColor: 'text-blue-500',
  },
};

export function EnhancedToast({
  title,
  description,
  variant = 'default',
  action,
  className,
}: ToastProps) {
  const styles = variantStyles[variant];

  return (
    <div className={cn(
      'flex items-start space-x-3 p-4 rounded-lg border shadow-sm',
      styles.container,
      className
    )}>
      <div className={cn('flex-shrink-0 mt-0.5', styles.iconColor)}>
        {styles.icon}
      </div>
      <div className="flex-1 min-w-0">
        {title && (
          <div className="font-medium text-sm mb-1">{title}</div>
        )}
        {description && (
          <div className="text-sm opacity-90">{description}</div>
        )}
      </div>
      {action && (
        <div className="flex-shrink-0">{action}</div>
      )}
    </div>
  );
}

// Helper function to show contextual toasts
export function getContextualToast(context: string, type: 'success' | 'error' | 'info', customMessage?: string) {
  const messages = {
    'emotion-check': {
      success: {
        title: 'Emotion Logged! 🎯',
        description: customMessage || 'Your emotional state has been recorded successfully.',
      },
      error: {
        title: 'Unable to Save',
        description: customMessage || 'Your emotion check has been saved offline and will sync when you\'re back online.',
      },
      info: {
        title: 'Emotion Check',
        description: customMessage || 'Track your emotional state to improve trading performance.',
      },
    },
    'trade-log': {
      success: {
        title: 'Trade Recorded! 📈',
        description: customMessage || 'Your trade has been logged and linked to your recent emotion check.',
      },
      error: {
        title: 'Trade Save Failed',
        description: customMessage || 'We couldn\'t save your trade right now. Please check your connection and try again.',
      },
      info: {
        title: 'Trade Log',
        description: customMessage || 'Record your trades to analyze emotion-performance correlations.',
      },
    },
    'sync': {
      success: {
        title: 'Data Synced! ☁️',
        description: customMessage || 'All your offline data has been synchronized successfully.',
      },
      error: {
        title: 'Sync Failed',
        description: customMessage || 'Some data couldn\'t be synchronized. We\'ll try again automatically.',
      },
      info: {
        title: 'Syncing Data',
        description: customMessage || 'Uploading your offline data to the cloud...',
      },
    },
    'network': {
      success: {
        title: 'Back Online! 🌐',
        description: customMessage || 'Connection restored. Syncing your data now.',
      },
      error: {
        title: 'Connection Lost',
        description: customMessage || 'You\'re offline. Don\'t worry - your data is being saved locally.',
      },
      info: {
        title: 'Network Status',
        description: customMessage || 'Checking connection status...',
      },
    },
  };

  const contextMessages = messages[context as keyof typeof messages];
  if (!contextMessages) {
    return {
      title: 'Notification',
      description: customMessage || 'Something happened.',
    };
  }

  return contextMessages[type];
}
