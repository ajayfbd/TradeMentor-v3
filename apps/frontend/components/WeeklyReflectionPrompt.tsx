'use client';

import React, { useState, useEffect } from 'react';
import { WeeklyReflection, WeeklyReminderService } from './WeeklyReflection';
import { cn } from '@/lib/utils';

interface WeeklyReflectionPromptProps {
  onComplete?: (data: any) => void;
  onDismiss?: () => void;
}

export function WeeklyReflectionPrompt({ onComplete, onDismiss }: WeeklyReflectionPromptProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [showReflection, setShowReflection] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if we should show the weekly prompt
    const shouldShow = WeeklyReminderService.checkForWeeklyPrompt();
    const isDismissedToday = localStorage.getItem('weeklyPromptDismissed') === new Date().toDateString();
    
    if (shouldShow && !isDismissedToday) {
      // Show prompt after a short delay to avoid jarring experience
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleStartReflection = () => {
    setShowPrompt(false);
    setShowReflection(true);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    // Remember dismissal for today
    localStorage.setItem('weeklyPromptDismissed', new Date().toDateString());
    onDismiss?.();
  };

  const handleReflectionComplete = (data: any) => {
    setShowReflection(false);
    onComplete?.(data);
  };

  const handleCloseReflection = () => {
    setShowReflection(false);
  };

  // Don't show anything if dismissed or conditions not met
  if (dismissed || (!showPrompt && !showReflection)) {
    return null;
  }

  // Show the full reflection component
  if (showReflection) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50">
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <WeeklyReflection 
              onComplete={handleReflectionComplete}
              onClose={handleCloseReflection}
            />
          </div>
        </div>
      </div>
    );
  }

  // Show the initial prompt
  if (showPrompt) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fade-in">
        <div className="weekly-prompt bg-white rounded-xl p-6 max-w-md mx-4 animate-scale-in shadow-2xl">
          <div className="text-center">
            <div className="text-6xl mb-4">🗓️</div>
            <h2 className="text-2xl font-bold mb-2">Weekly Reflection Time!</h2>
            <p className="text-text-secondary mb-6">
              It&apos;s Sunday - time to reflect on your trading week and set goals for the upcoming week. 
              This helps build emotional intelligence and improve your trading psychology.
            </p>
            
            <div className="space-y-3">
              <button
                className="w-full py-3 px-4 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors flex items-center justify-center"
                onClick={handleStartReflection}
              >
                <span>Start Weekly Reflection</span>
                <span className="ml-2">✨</span>
              </button>
              
              <button
                className="w-full py-2 px-4 text-text-secondary hover:text-text-primary transition-colors"
                onClick={handleDismiss}
              >
                Maybe later
              </button>
            </div>
            
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-center text-sm text-text-muted">
                <span className="mr-2">💡</span>
                <span>Takes about 5-10 minutes</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// Hook to easily integrate weekly reflection prompts
export function useWeeklyReflectionPrompt() {
  const [shouldPrompt, setShouldPrompt] = useState(false);

  useEffect(() => {
    const checkPrompt = () => {
      const shouldShow = WeeklyReminderService.checkForWeeklyPrompt();
      const isDismissedToday = localStorage.getItem('weeklyPromptDismissed') === new Date().toDateString();
      setShouldPrompt(shouldShow && !isDismissedToday);
    };

    checkPrompt();
    
    // Check again every hour in case the day changes
    const interval = setInterval(checkPrompt, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return shouldPrompt;
}

// Notification component for mobile/desktop notifications
export function WeeklyReflectionNotification() {
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    // Check if we should show notification
    if (WeeklyReminderService.checkForWeeklyPrompt()) {
      // Request notification permission if not already granted
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            showWeeklyNotification();
          }
        });
      } else if (Notification.permission === 'granted') {
        showWeeklyNotification();
      }
      
      // Also show in-app notification
      setShowNotification(true);
    }
  }, []);

  const showWeeklyNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Weekly Reflection Time! 🗓️', {
        body: 'Take a few minutes to reflect on your trading week and set goals for the upcoming week.',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'weekly-reflection',
        requireInteraction: true
      });
    }
  };

  const dismissNotification = () => {
    setShowNotification(false);
    localStorage.setItem('weeklyNotificationDismissed', new Date().toDateString());
  };

  if (!showNotification) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm animate-slide-in">
      <div className="bg-white rounded-lg shadow-lg border border-border p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="text-2xl">🗓️</span>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-text-primary">
              Weekly Reflection Time!
            </h3>
            <p className="text-xs text-text-secondary mt-1">
              Ready to reflect on your trading week?
            </p>
          </div>
          <button
            onClick={dismissNotification}
            className="ml-2 flex-shrink-0 text-text-muted hover:text-text-primary"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
