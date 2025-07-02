'use client';

import React from 'react';
import { cn } from '@/lib/utils';

// Weekly goal options (same as in WeeklyReflection component)
const weeklyGoals = [
  "Log emotions before and after each trade",
  "Maintain 7+ confidence level on trading days", 
  "Journal my thoughts after any losing trade",
  "Take a 5-minute break when emotion level drops below 4",
  "Review my emotion patterns before each trading day",
  "Avoid trading when emotion level is below 3",
  "Practice deep breathing before entering trades",
  "Set clear profit targets and stop losses before trading",
  "Limit trading size on days with emotion volatility",
  "Celebrate wins without letting excitement affect next trades"
];

interface ReflectionDetailViewProps {
  reflection: {
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
  };
  onClose: () => void;
}

export function ReflectionDetailView({ reflection, onClose }: ReflectionDetailViewProps) {
  const formatDateRange = (start: string, end: string): string => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
  };

  const getEmotionEmoji = (emotion: number): string => {
    if (emotion >= 8) return '😎';
    if (emotion >= 6) return '😊';
    if (emotion >= 4) return '🙂';
    if (emotion >= 2) return '😐';
    return '😰';
  };

  const getEmotionColor = (emotion: number): string => {
    if (emotion >= 8) return 'text-green-600';
    if (emotion >= 6) return 'text-blue-600';
    if (emotion >= 4) return 'text-yellow-600';
    if (emotion >= 2) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 bg-black bg-opacity-50">
        <div className="reflection-detail-modal bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-border p-6 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-medium">
                  Week of {formatDateRange(reflection.weekStart, reflection.weekEnd)} 🗓️
                </h1>
                <div className="text-sm text-text-secondary mt-1">
                  Completed on {new Date(reflection.completedAt).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close reflection detail"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-8">
            {/* Stats Overview */}
            <div className="stats-overview bg-gradient-to-r from-primary-soft to-blue-50 rounded-xl p-6">
              <h2 className="text-lg font-medium mb-4 text-primary">📊 Week Summary</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{reflection.stats.emotionsLogged}</div>
                  <div className="text-sm text-text-secondary">Emotions Logged</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{reflection.stats.tradesLogged}</div>
                  <div className="text-sm text-text-secondary">Trades Recorded</div>
                </div>
                <div className="text-center">
                  <div className={cn("text-2xl font-bold", getEmotionColor(reflection.stats.averageEmotion))}>
                    {reflection.stats.averageEmotion.toFixed(1)} {getEmotionEmoji(reflection.stats.averageEmotion)}
                  </div>
                  <div className="text-sm text-text-secondary">Average Emotion</div>
                </div>
                <div className="text-center">
                  <div className={cn(
                    "text-2xl font-bold",
                    reflection.stats.winRate >= 0.6 ? "text-green-600" : 
                    reflection.stats.winRate >= 0.4 ? "text-yellow-600" : "text-red-600"
                  )}>
                    {(reflection.stats.winRate * 100).toFixed(0)}% {reflection.stats.winRate >= 0.5 ? '📈' : '📉'}
                  </div>
                  <div className="text-sm text-text-secondary">Win Rate</div>
                </div>
              </div>
            </div>

            {/* Reflection Question & Answer */}
            <div className="reflection-content bg-surface rounded-xl p-6">
              <h2 className="text-lg font-medium mb-4 text-primary">🤔 Weekly Reflection</h2>
              
              <div className="question-section mb-6">
                <h3 className="font-medium mb-2 text-text-primary">Question:</h3>
                <p className="text-text-secondary italic bg-gray-50 p-4 rounded-lg border-l-4 border-primary">
                  &ldquo;{reflection.question}&rdquo;
                </p>
              </div>

              <div className="answer-section">
                <h3 className="font-medium mb-2 text-text-primary">Your Reflection:</h3>
                <div className="reflection-text bg-white p-4 rounded-lg border border-border">
                  <p className="text-text-primary whitespace-pre-wrap leading-relaxed">
                    {reflection.reflectionText}
                  </p>
                </div>
              </div>
            </div>

            {/* Selected Goals */}
            <div className="goals-section bg-surface rounded-xl p-6">
              <h2 className="text-lg font-medium mb-4 text-primary">🎯 Goals Set for Following Week</h2>
              
              {reflection.selectedGoals.length > 0 ? (
                <div className="goals-list space-y-3">
                  {reflection.selectedGoals.map((goalIndex) => (
                    <div key={goalIndex} className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center mr-3 mt-0.5">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-text-primary">{weeklyGoals[goalIndex]}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-secondary italic">No goals were selected for the following week.</p>
              )}
            </div>

            {/* Insights Section */}
            <div className="insights-section bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
              <h2 className="text-lg font-medium mb-4 text-primary">💡 Key Insights</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="insight-card bg-white p-4 rounded-lg">
                  <h3 className="font-medium text-primary mb-2">Emotional Consistency</h3>
                  <p className="text-sm text-text-secondary">
                    {reflection.stats.averageEmotion >= 6 
                      ? "Great emotional stability this week! Your positive mindset likely contributed to better trading decisions."
                      : reflection.stats.averageEmotion >= 4
                      ? "Moderate emotional state. Consider what factors influenced your emotional patterns this week."
                      : "This was a challenging week emotionally. Focus on self-care and stress management techniques."
                    }
                  </p>
                </div>
                <div className="insight-card bg-white p-4 rounded-lg">
                  <h3 className="font-medium text-primary mb-2">Trading Performance</h3>
                  <p className="text-sm text-text-secondary">
                    {reflection.stats.winRate >= 0.6
                      ? "Excellent win rate! Your emotional awareness seems to be positively impacting your trading."
                      : reflection.stats.winRate >= 0.4
                      ? "Solid performance. Continue tracking emotions to identify patterns that lead to successful trades."
                      : "Consider how emotional states might be affecting trade decisions. Use this data to improve your strategy."
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scale-in {
          from { 
            opacity: 0;
            transform: scale(0.95);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
