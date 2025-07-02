'use client';

import { useState, useEffect } from 'react';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
}

interface StreakUpdate extends StreakData {
  milestoneAchieved?: string;
  streakBroken: boolean;
}

const STREAK_STORAGE_KEY = 'tradementor_streak_data';
const LAST_UPDATE_KEY = 'tradementor_streak_last_update';

export function useStreak() {
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0
  });
  const [showCelebration, setShowCelebration] = useState(false);
  const [milestone, setMilestone] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load streak data from localStorage on mount
  useEffect(() => {
    const savedStreak = localStorage.getItem(STREAK_STORAGE_KEY);
    if (savedStreak) {
      try {
        const parsed = JSON.parse(savedStreak);
        setStreakData(parsed);
      } catch (err) {
        console.error('Error parsing saved streak data:', err);
      }
    }
    
    // Fetch current streak from API
    fetchStreak();
  }, []);

  // Save streak data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(streakData));
  }, [streakData]);

  const fetchStreak = async () => {
    try {
      setError(null);
      const response = await fetch('/api/streak', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch streak data');
      }

      const data: StreakData = await response.json();
      setStreakData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch streak');
      console.error('Error fetching streak:', err);
    }
  };

  const updateStreak = async () => {
    // Check if we already updated today to avoid duplicate requests
    const today = new Date().toDateString();
    const lastUpdate = localStorage.getItem(LAST_UPDATE_KEY);
    
    if (lastUpdate === today) {
      return; // Already updated today
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/streak/update', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to update streak');
      }

      const data: StreakUpdate = await response.json();
      
      // Update local state
      setStreakData({
        currentStreak: data.currentStreak,
        longestStreak: data.longestStreak
      });

      // Mark today as updated
      localStorage.setItem(LAST_UPDATE_KEY, today);

      // Show celebration if milestone achieved
      if (data.milestoneAchieved) {
        setMilestone(data.milestoneAchieved);
        setShowCelebration(true);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update streak');
      console.error('Error updating streak:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const closeCelebration = () => {
    setShowCelebration(false);
    setMilestone(null);
  };

  // Reset streak data (for testing or account reset)
  const resetStreak = () => {
    setStreakData({ currentStreak: 0, longestStreak: 0 });
    localStorage.removeItem(STREAK_STORAGE_KEY);
    localStorage.removeItem(LAST_UPDATE_KEY);
  };

  // Check if streak can be updated today
  const canUpdateToday = () => {
    const today = new Date().toDateString();
    const lastUpdate = localStorage.getItem(LAST_UPDATE_KEY);
    return lastUpdate !== today;
  };

  return {
    currentStreak: streakData.currentStreak,
    longestStreak: streakData.longestStreak,
    isLoading,
    error,
    updateStreak,
    showCelebration,
    milestone,
    closeCelebration,
    resetStreak,
    canUpdateToday: canUpdateToday(),
    refreshStreak: fetchStreak
  };
}
