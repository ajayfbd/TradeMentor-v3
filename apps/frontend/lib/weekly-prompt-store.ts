'use client';

import React from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WeeklyPrompt {
  id: string;
  question: string;
  week: string;
  isAnswered: boolean;
  answer?: string;
  answeredAt?: Date;
}

interface WeeklyPromptStore {
  currentPrompt: WeeklyPrompt | null;
  answeredPrompts: WeeklyPrompt[];
  
  // Actions
  generateWeeklyPrompt: () => void;
  answerPrompt: (answer: string) => void;
  markPromptAsSkipped: () => void;
  shouldShowPrompt: () => boolean;
  getPromptHistory: () => WeeklyPrompt[];
}

// Thoughtful weekly reflection questions
const WEEKLY_QUESTIONS = [
  "What trading decision this week are you most proud of, and what mindset led to that decision?",
  "If you could give advice to yourself at the beginning of this week, what would it be?",
  "What pattern in your emotions did you notice this week that affected your trading?",
  "Which trade this week taught you the most, regardless of its outcome?",
  "How did your risk management evolve this week compared to last week?",
  "What external factor (news, market conditions, personal life) most influenced your trading mindset this week?",
  "If you had to describe your emotional state while trading this week in three words, what would they be?",
  "What's one habit you developed or broke this week that impacted your trading?",
  "How did your pre-trade preparation differ this week from previous weeks?",
  "What would you change about your trading approach if you could repeat this week?",
  "Which emotion served you best this week while trading, and which held you back?",
  "What's the most important lesson about yourself as a trader that you learned this week?",
  "How did your relationship with money/profit/loss evolve this week?",
  "What would your best trading mentor say about your performance this week?",
  "If you could only keep one trading insight from this week, what would it be?",
  "How did your patience and discipline show up in your trading this week?",
  "What surprised you most about your emotional responses to trades this week?",
  "How did you handle uncertainty in the markets this week?",
  "What's one thing about your trading psychology that you want to work on next week?",
  "If this week's trading was a movie, what would be the key lesson of the story?"
];

export const useWeeklyPromptStore = create<WeeklyPromptStore>()(
  persist(
    (set, get) => ({
      currentPrompt: null,
      answeredPrompts: [],

      generateWeeklyPrompt: () => {
        const now = new Date();
        const currentWeek = getWeekString(now);
        
        // Check if we already have a prompt for this week
        const existingPrompt = get().answeredPrompts.find(p => p.week === currentWeek);
        if (existingPrompt) {
          set({ currentPrompt: existingPrompt });
          return;
        }

        // Check if current prompt is already for this week
        const current = get().currentPrompt;
        if (current && current.week === currentWeek) {
          return;
        }

        // Generate new prompt for the week
        const usedQuestions = get().answeredPrompts.map(p => p.question);
        const availableQuestions = WEEKLY_QUESTIONS.filter(q => !usedQuestions.includes(q));
        
        // If we've used all questions, reset and use all again
        const questionsPool = availableQuestions.length > 0 ? availableQuestions : WEEKLY_QUESTIONS;
        const randomIndex = Math.floor(Math.random() * questionsPool.length);
        
        const newPrompt: WeeklyPrompt = {
          id: `${currentWeek}-${Date.now()}`,
          question: questionsPool[randomIndex],
          week: currentWeek,
          isAnswered: false,
        };

        set({ currentPrompt: newPrompt });
      },

      answerPrompt: (answer: string) => {
        const current = get().currentPrompt;
        if (!current) return;

        const answeredPrompt: WeeklyPrompt = {
          ...current,
          answer,
          isAnswered: true,
          answeredAt: new Date(),
        };

        set(state => ({
          currentPrompt: answeredPrompt,
          answeredPrompts: [...state.answeredPrompts, answeredPrompt],
        }));
      },

      markPromptAsSkipped: () => {
        const current = get().currentPrompt;
        if (!current) return;

        const skippedPrompt: WeeklyPrompt = {
          ...current,
          answer: undefined,
          isAnswered: true,
          answeredAt: new Date(),
        };

        set(state => ({
          currentPrompt: skippedPrompt,
          answeredPrompts: [...state.answeredPrompts, skippedPrompt],
        }));
      },

      shouldShowPrompt: () => {
        const current = get().currentPrompt;
        if (!current) return false;
        
        // Show prompt if it's not answered and it's the current week
        return !current.isAnswered && current.week === getWeekString(new Date());
      },

      getPromptHistory: () => {
        return get().answeredPrompts.sort((a, b) => 
          new Date(b.answeredAt || 0).getTime() - new Date(a.answeredAt || 0).getTime()
        );
      },
    }),
    {
      name: 'weekly-prompt-store',
      version: 1,
    }
  )
);

// Helper function to get week string (YYYY-WW format)
function getWeekString(date: Date): string {
  const year = date.getFullYear();
  const start = new Date(year, 0, 1);
  const diff = (date.getTime() - start.getTime() + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60000));
  const oneWeek = 604800000; // milliseconds in a week
  const week = Math.floor(diff / oneWeek) + 1;
  return `${year}-W${week.toString().padStart(2, '0')}`;
}

// Hook to check if it's Sunday (prompt day)
export function useIsSunday(): boolean {
  const [isSunday, setIsSunday] = React.useState(false);
  
  React.useEffect(() => {
    const checkDay = () => {
      const today = new Date();
      setIsSunday(today.getDay() === 0); // Sunday is 0
    };
    
    checkDay();
    
    // Check every hour
    const interval = setInterval(checkDay, 3600000);
    return () => clearInterval(interval);
  }, []);
  
  return isSunday;
}
