'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useStreak } from '@/hooks/useStreak';
import { StreakCelebration } from '@/components/StreakCelebration';

interface StreakContextType {
  currentStreak: number;
  longestStreak: number;
  isLoading: boolean;
  error: string | null;
  updateStreak: () => Promise<void>;
  canUpdateToday: boolean;
  refreshStreak: () => Promise<void>;
  resetStreak: () => void;
}

const StreakContext = createContext<StreakContextType | undefined>(undefined);

export function StreakProvider({ children }: { children: React.ReactNode }) {
  const streakHook = useStreak();
  const [hasUpdatedToday, setHasUpdatedToday] = useState(false);

  // Check if streak was already updated today on mount
  useEffect(() => {
    const today = new Date().toDateString();
    const lastUpdate = localStorage.getItem('tradementor_streak_last_update');
    setHasUpdatedToday(lastUpdate === today);
  }, []);

  // Enhanced updateStreak that tracks daily updates
  const updateStreak = async () => {
    if (!hasUpdatedToday) {
      await streakHook.updateStreak();
      setHasUpdatedToday(true);
    }
  };

  // Reset daily update flag at midnight
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    const timer = setTimeout(() => {
      setHasUpdatedToday(false);
      // Set up recurring daily reset
      const dailyTimer = setInterval(() => {
        setHasUpdatedToday(false);
      }, 24 * 60 * 60 * 1000); // 24 hours
      
      return () => clearInterval(dailyTimer);
    }, msUntilMidnight);
    
    return () => clearTimeout(timer);
  }, []);

  const contextValue: StreakContextType = {
    ...streakHook,
    updateStreak,
    canUpdateToday: !hasUpdatedToday,
  };

  return (
    <StreakContext.Provider value={contextValue}>
      {children}
      
      {/* Global celebration modal */}
      {streakHook.showCelebration && streakHook.milestone && (
        <StreakCelebration
          streak={streakHook.currentStreak}
          milestone={streakHook.milestone}
          onClose={streakHook.closeCelebration}
        />
      )}
    </StreakContext.Provider>
  );
}

export function useStreakContext() {
  const context = useContext(StreakContext);
  if (context === undefined) {
    throw new Error('useStreakContext must be used within a StreakProvider');
  }
  return context;
}

// HOC for components that need streak functionality
export function withStreakUpdate<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function StreakEnhancedComponent(props: P) {
    const { updateStreak, canUpdateToday } = useStreakContext();
    
    // Auto-update streak when component mounts (for emotion logging components)
    useEffect(() => {
      if (canUpdateToday) {
        updateStreak();
      }
    }, [updateStreak, canUpdateToday]);
    
    return <WrappedComponent {...props} />;
  };
}
