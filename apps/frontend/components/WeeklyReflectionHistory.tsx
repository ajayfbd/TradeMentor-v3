'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface WeeklyReflectionHistoryProps {
  onViewReflection?: (reflection: any) => void;
}

interface ReflectionEntry {
  weekStart: string;
  weekEnd: string;
  reflectionText: string;
  selectedGoals: number[];
  question: string;
  stats: {
    emotionsLogged: number;
    tradesLogged: number;
    averageEmotion: number;
    winRate: number;
  };
  completedAt: string;
}

export function WeeklyReflectionHistory({ onViewReflection }: WeeklyReflectionHistoryProps) {
  const [reflections, setReflections] = useState<ReflectionEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReflectionHistory();
  }, []);

  const loadReflectionHistory = () => {
    try {
      const reflectionEntries: ReflectionEntry[] = [];
      
      // Load all weekly reflections from localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('weeklyReflection_')) {
          const data = localStorage.getItem(key);
          if (data) {
            try {
              const reflection = JSON.parse(data);
              reflectionEntries.push(reflection);
            } catch (error) {
              console.error('Failed to parse reflection data:', error);
            }
          }
        }
      }
      
      // Sort by week start date (newest first)
      reflectionEntries.sort((a, b) => 
        new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime()
      );
      
      setReflections(reflectionEntries);
    } catch (error) {
      console.error('Failed to load reflection history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateRange = (start: string, end: string): string => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
  };

  const getEmotionEmoji = (emotion: number): string => {
    if (emotion >= 8) return '😎';
    if (emotion >= 6) return '😊';
    if (emotion >= 4) return '🙂';
    if (emotion >= 2) return '😐';
    return '😰';
  };

  const truncateText = (text: string, maxLength: number = 150): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="weekly-reflection-history max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-100 rounded-xl p-6 h-40"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (reflections.length === 0) {
    return (
      <div className="weekly-reflection-history max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-medium mb-6">Weekly Reflection History 📚</h1>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-lg font-medium mb-2">No reflections yet</h3>
          <p className="text-text-secondary">
            Complete your first weekly reflection to see it here. Reflections help track your emotional growth over time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="weekly-reflection-history max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-medium">Weekly Reflection History 📚</h1>
        <div className="text-sm text-text-secondary">
          {reflections.length} reflection{reflections.length !== 1 ? 's' : ''} completed
        </div>
      </div>
      
      <div className="space-y-6">
        {reflections.map((reflection, index) => (
          <div
            key={`${reflection.weekStart}-${index}`}
            className="reflection-card bg-surface rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onViewReflection?.(reflection)}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium">
                  Week of {formatDateRange(reflection.weekStart, reflection.weekEnd)} 🗓️
                </h3>
                <div className="text-sm text-text-secondary">
                  Completed {new Date(reflection.completedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center">
                  <span className="text-primary font-medium">📊</span>
                  <span className="ml-1">{reflection.stats.emotionsLogged} emotions</span>
                </div>
                <div className="flex items-center">
                  <span className="text-primary font-medium">📈</span>
                  <span className="ml-1">{(reflection.stats.winRate * 100).toFixed(0)}% wins</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2 text-primary">🤔 Reflection Question</h4>
                <p className="text-sm text-text-secondary italic mb-3">
                  &ldquo;{reflection.question}&rdquo;
                </p>
                <p className="text-text-primary">
                  {truncateText(reflection.reflectionText)}
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2 text-primary">🎯 Goals Selected</h4>
                <div className="text-sm text-text-secondary mb-3">
                  {reflection.selectedGoals.length} goal{reflection.selectedGoals.length !== 1 ? 's' : ''} for the following week
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Average Emotion:</span>
                    <span className="font-medium">
                      {reflection.stats.averageEmotion.toFixed(1)} {getEmotionEmoji(reflection.stats.averageEmotion)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Trades Recorded:</span>
                    <span className="font-medium">{reflection.stats.tradesLogged}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="text-sm text-text-muted">
                  Click to view full reflection
                </div>
                <svg 
                  className="w-5 h-5 text-text-muted" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 5l7 7-7 7" 
                  />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {reflections.length > 0 && (
        <div className="mt-8 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-primary-soft rounded-lg text-primary">
            <span className="mr-2">🏆</span>
            <span className="font-medium">
              {reflections.length} week{reflections.length !== 1 ? 's' : ''} of self-reflection completed!
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
