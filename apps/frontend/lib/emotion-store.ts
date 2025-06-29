import { create } from 'zustand';
import { EmotionState } from './types';

interface EmotionStore extends EmotionState {
  setLevel: (level: number) => void;
  setContext: (context: 'pre-trade' | 'post-trade' | 'market-event') => void;
  setNotes: (notes: string) => void;
  setSymbol: (symbol: string) => void;
  setSubmitting: (isSubmitting: boolean) => void;
  reset: () => void;
}

const initialState: EmotionState = {
  currentLevel: 5,
  selectedContext: 'pre-trade',
  notes: '',
  symbol: '',
  isSubmitting: false,
};

export const useEmotionStore = create<EmotionStore>((set) => ({
  ...initialState,
  
  setLevel: (level: number) => set({ currentLevel: level }),
  
  setContext: (context: 'pre-trade' | 'post-trade' | 'market-event') => 
    set({ selectedContext: context }),
  
  setNotes: (notes: string) => set({ notes }),
  
  setSymbol: (symbol: string) => set({ symbol }),
  
  setSubmitting: (isSubmitting: boolean) => set({ isSubmitting }),
  
  reset: () => set(initialState),
}));
