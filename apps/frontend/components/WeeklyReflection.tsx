'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';

// Weekly reflection questions
const weeklyQuestions = [
  "What emotion pattern helped you the most this week?",
  "When did you feel most confident in your trading decisions this week?",
  "What market conditions triggered emotional reactions for you?",
  "How did your pre-trade emotions compare to post-trade emotions?",
  "What strategy worked best for managing trading anxiety this week?",
  "How did your emotion tracking influence your trading decisions?",
  "What was your biggest emotional challenge this week?",
  "When did you feel most in control of your emotions while trading?",
  "How did external factors affect your trading emotions this week?",
  "What pattern do you notice between your best trades and emotions?",
  "How did your emotional awareness change throughout the week?",
  "What emotion management technique was most effective for you?",
  "How did you recover from emotionally difficult trades?",
  "What emotional triggers do you want to work on next week?",
  "How did tracking your emotions affect your overall well-being?",
  "What correlation did you notice between emotion and performance?",
  "When did you successfully override an unhelpful emotional impulse?",
  "How has your emotional self-awareness changed since you started?",
  "What surprised you about your emotional patterns this week?",
  "How can you use this week's insights in your trading next week?"
];

// Weekly goal options
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

interface WeeklyStats {
  emotionsLogged: number;
  tradesLogged: number;
  averageEmotion: number;
  winRate: number;
}

interface WeeklyReflectionProps {
  onComplete?: (data: any) => void;
  onClose?: () => void;
}

// Streak Celebration Modal Component
function StreakCelebrationModal({ 
  streak, 
  isOpen, 
  onClose 
}: { 
  streak: number; 
  isOpen: boolean; 
  onClose: () => void; 
}) {
  const getStreakMessage = (streak: number) => {
    if (streak >= 100) return "Emotion Tracking Legend! 🏆";
    if (streak >= 30) return "Monthly Master! 🎖️";
    if (streak >= 14) return "Two Week Champion! 💪";
    if (streak >= 7) return "Week Warrior! 🔥";
    return "Streak Started! 🎯";
  };
  
  const getMessage = (streak: number) => {
    if (streak >= 100) {
      return "You've achieved legendary status with 100 days of emotion tracking. Your trading psychology is now backed by incredible self-awareness and data!";
    }
    if (streak >= 30) {
      return "A full month of consistent emotion tracking! You're building powerful habits that will transform your trading psychology.";
    }
    if (streak >= 14) {
      return "Two full weeks of tracking! You're developing a powerful habit that will give you an edge in your trading.";
    }
    if (streak >= 7) {
      return "Congratulations on your first week! Consistency is key to emotional intelligence in trading.";
    }
    return "You've started your emotion tracking journey! Keep going to reach your first milestone.";
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 animate-fade-in">
      <div className="celebration-modal bg-surface rounded-xl p-6 max-w-md mx-4 animate-scale-in">
        <div className="streak-icon text-center text-6xl mb-2">
          {streak >= 100 ? "🏆" : streak >= 30 ? "🎖️" : streak >= 14 ? "💪" : "🔥"}
        </div>
        
        <h2 className="text-2xl font-bold text-center mb-2">
          {getStreakMessage(streak)}
        </h2>
        
        <div className="streak-count text-center text-4xl font-bold text-primary mb-4">
          {streak} days
        </div>
        
        <p className="text-center text-text-secondary mb-6">
          {getMessage(streak)}
        </p>
        
        <button
          className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors"
          onClick={onClose}
        >
          Keep Going! 🚀
        </button>
      </div>
    </div>
  );
}

// Weekly Reminder Service
export class WeeklyReminderService {
  static checkForWeeklyPrompt(): boolean {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday
    
    // Check if it's Sunday and user hasn't completed this week's reflection
    if (dayOfWeek === 0) {
      const lastReflectionDate = localStorage.getItem('lastReflectionDate');
      
      if (!lastReflectionDate) {
        return true; // No reflection ever done
      }
      
      const lastDate = new Date(lastReflectionDate);
      const currentWeekStart = new Date(today);
      currentWeekStart.setDate(today.getDate() - today.getDay()); // Beginning of current week (Sunday)
      
      // If last reflection was before this week's Sunday
      return lastDate < currentWeekStart;
    }
    
    return false;
  }
  
  static markReflectionComplete(): void {
    localStorage.setItem('lastReflectionDate', new Date().toISOString());
  }
  
  static getCurrentStreak(): number {
    const streakData = localStorage.getItem('weeklyReflectionStreak');
    if (!streakData) return 0;
    
    try {
      const data = JSON.parse(streakData);
      return data.count || 0;
    } catch {
      return 0;
    }
  }
  
  static updateStreak(): number {
    const streakData = localStorage.getItem('weeklyReflectionStreak');
    let currentStreak = 0;
    
    if (streakData) {
      try {
        const data = JSON.parse(streakData);
        const lastDate = new Date(data.lastDate);
        const today = new Date();
        const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff <= 7) {
          currentStreak = data.count + 1;
        } else {
          currentStreak = 1; // Reset streak
        }
      } catch {
        currentStreak = 1;
      }
    } else {
      currentStreak = 1;
    }
    
    localStorage.setItem('weeklyReflectionStreak', JSON.stringify({
      count: currentStreak,
      lastDate: new Date().toISOString()
    }));
    
    return currentStreak;
  }
}

export function WeeklyReflection({ onComplete, onClose }: WeeklyReflectionProps) {
  const [reflectionText, setReflectionText] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<number[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [stats, setStats] = useState<WeeklyStats>({
    emotionsLogged: 28,
    tradesLogged: 15,
    averageEmotion: 6.2,
    winRate: 0.67
  });
  
  // Get current week info
  const today = useMemo(() => new Date(), []);
  
  const { weekStart, weekEnd } = useMemo(() => {
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    const end = new Date(start);
    end.setDate(start.getDate() + 6); // End of week (Saturday)
    return { weekStart: start, weekEnd: end };
  }, [today]);
  
  // Calculate current week number for question rotation
  const currentWeek = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24 * 7)
  );

  useEffect(() => {
    // Load current streak on component mount
    setCurrentStreak(WeeklyReminderService.getCurrentStreak());
    
    // Load saved reflection data if exists
    const savedReflection = localStorage.getItem(`weeklyReflection_${weekStart.toISOString().split('T')[0]}`);
    if (savedReflection) {
      try {
        const data = JSON.parse(savedReflection);
        setReflectionText(data.reflectionText || '');
        setSelectedGoals(data.selectedGoals || []);
      } catch (error) {
        console.error('Failed to load saved reflection:', error);
      }
    }
    
    // TODO: Load actual stats from your data store
    // This would typically fetch from your backend/database
    loadWeeklyStats();
  }, [weekStart]);

  const loadWeeklyStats = async () => {
    // TODO: Replace with actual API call
    // const response = await fetch(`/api/weekly-stats?week=${weekStart.toISOString()}`);
    // const statsData = await response.json();
    // setStats(statsData);
    
    // For now, using mock data
    setStats({
      emotionsLogged: Math.floor(Math.random() * 30) + 15,
      tradesLogged: Math.floor(Math.random() * 20) + 5,
      averageEmotion: Math.round((Math.random() * 5 + 3) * 10) / 10,
      winRate: Math.round((Math.random() * 0.4 + 0.4) * 100) / 100
    });
  };

  const formatDateRange = (start: Date, end: Date): string => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
  };

  const getEmotionEmoji = (emotion: number): string => {
    if (emotion >= 8) return '😎';
    if (emotion >= 6) return '😊';
    if (emotion >= 4) return '🙂';
    if (emotion >= 2) return '😐';
    return '😰';
  };

  const toggleGoal = (index: number) => {
    setSelectedGoals(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const saveReflection = () => {
    const reflectionData = {
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      reflectionText,
      selectedGoals,
      question: weeklyQuestions[currentWeek % weeklyQuestions.length],
      stats,
      completedAt: new Date().toISOString()
    };
    
    // Save to localStorage (in production, save to database)
    localStorage.setItem(
      `weeklyReflection_${weekStart.toISOString().split('T')[0]}`, 
      JSON.stringify(reflectionData)
    );
    
    return reflectionData;
  };

  const completeWeeklyReflection = () => {
    const reflectionData = saveReflection();
    
    // Update streak and check for celebration
    const newStreak = WeeklyReminderService.updateStreak();
    setCurrentStreak(newStreak);
    
    // Mark reflection as complete
    WeeklyReminderService.markReflectionComplete();
    
    // Show celebration for milestones
    if (newStreak % 7 === 0 || newStreak === 14 || newStreak === 30 || newStreak === 100) {
      setShowCelebration(true);
    }
    
    // TODO: Save to backend
    // await fetch('/api/weekly-reflections', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(reflectionData)
    // });
    
    if (onComplete) {
      onComplete(reflectionData);
    }
  };

  const isComplete = reflectionText.trim().length > 0 && selectedGoals.length > 0;
  const characterCount = reflectionText.length;
  const maxCharacters = 1000;

  return (
    <>
      <div className="weekly-reflection max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-medium">
            Week of {formatDateRange(weekStart, weekEnd)} 🗓️
          </h1>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close weekly reflection"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="achievement-card p-6 bg-surface rounded-xl shadow-md">
            <h2 className="text-lg font-medium mb-4">Your Week</h2>
            
            <div className="streak-card bg-primary-soft p-4 rounded-lg text-center mb-4">
              <h3 className="text-primary font-medium">🔥 Streak</h3>
              <div className="text-3xl font-bold text-primary-hover">
                {currentStreak} days
              </div>
            </div>
            
            <h3 className="font-medium mb-2">📊 This Week&apos;s Stats</h3>
            <ul className="stats-list space-y-2">
              <li className="flex items-center">
                <span className="bullet-point w-2 h-2 rounded-full bg-primary mr-3"></span>
                <span>Emotions logged: {stats.emotionsLogged}</span>
              </li>
              <li className="flex items-center">
                <span className="bullet-point w-2 h-2 rounded-full bg-primary mr-3"></span>
                <span>Trades recorded: {stats.tradesLogged}</span>
              </li>
              <li className="flex items-center">
                <span className="bullet-point w-2 h-2 rounded-full bg-primary mr-3"></span>
                <span>Average emotion: {stats.averageEmotion.toFixed(1)} {getEmotionEmoji(stats.averageEmotion)}</span>
              </li>
              <li className="flex items-center">
                <span className="bullet-point w-2 h-2 rounded-full bg-primary mr-3"></span>
                <span>Win rate: {(stats.winRate * 100).toFixed(0)}% {stats.winRate >= 0.5 ? '📈' : '📉'}</span>
              </li>
            </ul>
          </div>
          
          <div className="reflection-card p-6 bg-surface rounded-xl shadow-md">
            <h2 className="text-lg font-medium mb-4">🤔 Reflection Question</h2>
            <p className="reflection-question mb-4 text-text-secondary italic">
              &ldquo;{weeklyQuestions[currentWeek % weeklyQuestions.length]}&rdquo;
            </p>
            
            <div className="relative">
              <textarea
                className="w-full p-4 rounded-lg border border-border focus:border-border-focus focus:ring-1 focus:ring-border-focus min-h-[120px] resize-none"
                placeholder="Write your thoughts..."
                value={reflectionText}
                onChange={(e) => {
                  if (e.target.value.length <= maxCharacters) {
                    setReflectionText(e.target.value);
                  }
                }}
                maxLength={maxCharacters}
              />
              <div className="absolute bottom-2 right-2 text-xs text-text-muted">
                {characterCount}/{maxCharacters}
              </div>
            </div>
          </div>
        </div>
        
        <div className="goals-section mt-8 p-6 bg-surface rounded-xl shadow-md">
          <h2 className="text-lg font-medium mb-4">Next Week&apos;s Goal</h2>
          
          <div className="goals-checklist space-y-3">
            {weeklyGoals.map((goal, index) => (
              <div key={index} className="flex items-center group">
                <input
                  type="checkbox"
                  id={`goal-${index}`}
                  checked={selectedGoals.includes(index)}
                  onChange={() => toggleGoal(index)}
                  className="w-5 h-5 rounded border-2 border-primary text-primary focus:ring-primary-hover focus:ring-2 focus:ring-offset-2 transition-all"
                />
                <label 
                  htmlFor={`goal-${index}`} 
                  className={cn(
                    "ml-3 text-text-primary cursor-pointer transition-all group-hover:text-primary",
                    selectedGoals.includes(index) && "font-medium"
                  )}
                >
                  {goal}
                </label>
              </div>
            ))}
          </div>
          
          <button
            className={cn(
              "mt-6 w-full py-3 px-4 rounded-lg flex items-center justify-center transition-all",
              isComplete
                ? "bg-primary hover:bg-primary-hover text-white shadow-md hover:shadow-lg"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            )}
            onClick={completeWeeklyReflection}
            disabled={!isComplete}
          >
            <span>Complete Week</span>
            <span className="ml-2">✨</span>
          </button>
          
          {!isComplete && (
            <p className="text-center text-text-muted text-sm mt-2">
              Please answer the reflection question and select at least one goal to continue.
            </p>
          )}
        </div>
      </div>

      <StreakCelebrationModal
        streak={currentStreak}
        isOpen={showCelebration}
        onClose={() => setShowCelebration(false)}
      />

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scale-in {
          from { 
            opacity: 0;
            transform: scale(0.9);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
        
        .celebration-modal {
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
      `}</style>
    </>
  );
}
