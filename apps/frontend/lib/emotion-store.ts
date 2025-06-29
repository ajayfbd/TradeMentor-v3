import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { EmotionState } from './types';

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
