import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { EmotionState, EmotionCheck, EmotionCheckRequest } from './types';
import { apiClient } from './api-client';

export type EmotionContext = 'pre-trade' | 'post-trade' | 'market-event';

interface EmotionEntry {
  id: string;
  level: number;
  context: EmotionContext;
  symbol?: string;
  notes?: string;
  timestamp: Date;
  synced: boolean;
}

interface EnhancedEmotionState extends EmotionState {
  // Streak and history
  streakCount: number;
  lastCheckDate: string | null;
  totalChecks: number;
  
  // Offline queue
  pendingEntries: EmotionEntry[];
  
  // UI state
  showCelebration: boolean;
  isOnline: boolean;
}

interface EmotionStore extends EnhancedEmotionState {
  setLevel: (level: number) => void;
  setContext: (context: EmotionContext) => void;
  setNotes: (notes: string) => void;
  setSymbol: (symbol: string) => void;
  setSubmitting: (isSubmitting: boolean) => void;
  setOnlineStatus: (isOnline: boolean) => void;
  
  // Entry management
  addPendingEntry: (entry: Omit<EmotionEntry, 'id' | 'timestamp' | 'synced'>) => void;
  markEntrySynced: (id: string) => void;
  removePendingEntry: (id: string) => void;
  getPendingEntries: () => EmotionEntry[];
  
  // Streak management
  incrementStreak: () => void;
  resetStreak: () => void;
  updateLastCheckDate: () => void;
  shouldShowCelebration: () => boolean;
  setCelebration: (show: boolean) => void;
  
  // Form management
  reset: () => void;
  canSubmit: () => boolean;
  
  // API sync methods
  submitEmotionCheck: () => Promise<void>;
  syncPendingEntries: () => Promise<void>;
}

const initialState: EnhancedEmotionState = {
  currentLevel: 5,
  selectedContext: 'pre-trade',
  notes: '',
  symbol: '',
  isSubmitting: false,
  
  // Streak data
  streakCount: 0,
  lastCheckDate: null,
  totalChecks: 0,
  
  // Offline queue
  pendingEntries: [],
  
  // UI state
  showCelebration: false,
  isOnline: true,
};

export const useEmotionStore = create<EmotionStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Basic setters
      setLevel: (level: number) => set({ currentLevel: level }),
      setContext: (context: EmotionContext) => set({ selectedContext: context }),
      setNotes: (notes: string) => set({ notes }),
      setSymbol: (symbol: string) => set({ symbol }),
      setSubmitting: (isSubmitting: boolean) => set({ isSubmitting }),
      setOnlineStatus: (isOnline: boolean) => set({ isOnline }),
      
      // Entry management
      addPendingEntry: (entry) => {
        const newEntry: EmotionEntry = {
          ...entry,
          id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          synced: false,
        };
        set((state) => ({
          pendingEntries: [...state.pendingEntries, newEntry],
        }));
      },
      
      markEntrySynced: (id) => {
        set((state) => ({
          pendingEntries: state.pendingEntries.filter(entry => entry.id !== id),
        }));
      },
      
      removePendingEntry: (id) => {
        set((state) => ({
          pendingEntries: state.pendingEntries.filter(entry => entry.id !== id),
        }));
      },
      
      getPendingEntries: () => get().pendingEntries,
      
      // Streak management
      incrementStreak: () => {
        const state = get();
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
        
        let newStreakCount = state.streakCount;
        
        // Check if this is a new day
        if (state.lastCheckDate !== today) {
          if (state.lastCheckDate === yesterday) {
            // Consecutive day - increment streak
            newStreakCount = state.streakCount + 1;
          } else if (state.lastCheckDate === null || state.lastCheckDate !== yesterday) {
            // First check or broken streak - start new streak
            newStreakCount = 1;
          }
        }
        
        // Check for celebration milestones (7, 30, 100 days)
        const shouldCelebrate = [7, 30, 100].includes(newStreakCount);
        
        set({
          streakCount: newStreakCount,
          totalChecks: state.totalChecks + 1,
          lastCheckDate: today,
          showCelebration: shouldCelebrate,
        });
      },
      
      resetStreak: () => set({ streakCount: 0 }),
      
      updateLastCheckDate: () => {
        const today = new Date().toDateString();
        set({ lastCheckDate: today });
      },
      
      shouldShowCelebration: () => get().showCelebration,
      
      setCelebration: (show: boolean) => set({ showCelebration: show }),
      
      // Form management
      reset: () => set({
        currentLevel: 5,
        selectedContext: 'pre-trade',
        notes: '',
        symbol: '',
        isSubmitting: false,
      }),
      
      canSubmit: () => {
        const state = get();
        return !state.isSubmitting && state.selectedContext !== null;
      },
      
      // API sync methods
      submitEmotionCheck: async () => {
        const state = get();
        
        if (!state.selectedContext) {
          throw new Error('Context is required');
        }
        
        set({ isSubmitting: true });
        
        try {
          const emotionData: EmotionCheckRequest = {
            level: state.currentLevel,
            context: state.selectedContext,
            notes: state.notes || undefined,
            symbol: state.symbol || undefined,
          };
          
          if (state.isOnline) {
            // Submit directly to API
            await apiClient.createEmotionCheck(emotionData);
            
            // Update streak and stats
            get().incrementStreak();
            get().updateLastCheckDate();
            
            // Reset form
            get().reset();
          } else {
            // Add to pending queue for later sync
            get().addPendingEntry(emotionData);
            
            // Still update streak and stats locally
            get().incrementStreak();
            get().updateLastCheckDate();
            
            // Reset form
            get().reset();
          }
        } catch (error) {
          // If online but API fails, add to pending queue
          if (state.isOnline) {
            get().addPendingEntry({
              level: state.currentLevel,
              context: state.selectedContext,
              notes: state.notes || undefined,
              symbol: state.symbol || undefined,
            });
          }
          throw error;
        } finally {
          set({ isSubmitting: false });
        }
      },
      
      syncPendingEntries: async () => {
        const state = get();
        
        if (!state.isOnline || state.pendingEntries.length === 0) {
          return;
        }
        
        const entries = [...state.pendingEntries];
        
        try {
          // Submit all pending entries
          for (const entry of entries) {
            await apiClient.createEmotionCheck({
              level: entry.level,
              context: entry.context,
              notes: entry.notes,
              symbol: entry.symbol,
            });
            
            // Mark as synced
            get().markEntrySynced(entry.id);
          }
        } catch (error) {
          console.error('Failed to sync pending entries:', error);
          // Keep entries in queue for next attempt
        }
      },
    }),
    {
      name: 'emotion-store',
      partialize: (state) => ({
        streakCount: state.streakCount,
        lastCheckDate: state.lastCheckDate,
        totalChecks: state.totalChecks,
        pendingEntries: state.pendingEntries,
      }),
    }
  )
);
