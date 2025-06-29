import { create } from 'zustand';

export type TabKey = 'emotion' | 'trade' | 'patterns' | 'reflection' | 'profile';

interface TabState {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
}

export const useTabStore = create<TabState>((set) => ({
  activeTab: 'emotion',
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
