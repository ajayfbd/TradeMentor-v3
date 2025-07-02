'use client';

import React, { useState } from 'react';
import { WeeklyReflection, WeeklyReminderService } from './WeeklyReflection';
import { WeeklyReflectionHistory } from './WeeklyReflectionHistory';
import { ReflectionDetailView } from './ReflectionDetailView';
import { WeeklyReflectionPrompt, useWeeklyReflectionPrompt, WeeklyReflectionNotification } from './WeeklyReflectionPrompt';
import { cn } from '@/lib/utils';

type ViewMode = 'demo' | 'reflection' | 'history' | 'detail';

interface DemoState {
  currentView: ViewMode;
  selectedReflection: any;
  showPrompt: boolean;
  completedReflections: number;
}

export function WeeklyReflectionDemo() {
  const [demoState, setDemoState] = useState<DemoState>({
    currentView: 'demo',
    selectedReflection: null,
    showPrompt: false,
    completedReflections: WeeklyReminderService.getCurrentStreak()
  });

  const shouldPrompt = useWeeklyReflectionPrompt();

  const handleViewChange = (view: ViewMode) => {
    setDemoState(prev => ({ ...prev, currentView: view, selectedReflection: null }));
  };

  const handleReflectionComplete = (data: any) => {
    console.log('Weekly reflection completed:', data);
    setDemoState(prev => ({ 
      ...prev, 
      currentView: 'demo',
      completedReflections: prev.completedReflections + 1
    }));
    
    // Show success message
    alert('Weekly reflection completed! 🎉\n\nYour insights have been saved and will help track your emotional growth over time.');
  };

  const handleViewReflection = (reflection: any) => {
    setDemoState(prev => ({ 
      ...prev, 
      currentView: 'detail',
      selectedReflection: reflection
    }));
  };

  const handleShowPrompt = () => {
    setDemoState(prev => ({ ...prev, showPrompt: true }));
  };

  const handleClosePrompt = () => {
    setDemoState(prev => ({ ...prev, showPrompt: false }));
  };

  const getCurrentStreak = () => {
    return WeeklyReminderService.getCurrentStreak();
  };

  const simulateNextWeek = () => {
    // For demo purposes - simulate completing a week
    const newStreak = getCurrentStreak() + 1;
    localStorage.setItem('weeklyReflectionStreak', JSON.stringify({
      count: newStreak,
      lastDate: new Date().toISOString()
    }));
    
    setDemoState(prev => ({ 
      ...prev, 
      completedReflections: newStreak
    }));
    
    alert(`Simulated week completion! Streak is now ${newStreak} weeks. 🔥`);
  };

  // Render different views based on current state
  if (demoState.currentView === 'reflection') {
    return (
      <WeeklyReflection 
        onComplete={handleReflectionComplete}
        onClose={() => handleViewChange('demo')}
      />
    );
  }

  if (demoState.currentView === 'history') {
    return (
      <div>
        <div className="mb-4">
          <button
            onClick={() => handleViewChange('demo')}
            className="flex items-center text-primary hover:text-primary-hover transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Demo
          </button>
        </div>
        <WeeklyReflectionHistory onViewReflection={handleViewReflection} />
      </div>
    );
  }

  if (demoState.currentView === 'detail' && demoState.selectedReflection) {
    return (
      <ReflectionDetailView
        reflection={demoState.selectedReflection}
        onClose={() => handleViewChange('history')}
      />
    );
  }

  // Main demo view
  return (
    <div className="weekly-reflection-demo max-w-6xl mx-auto p-6">
      {/* Demo Header */}
      <div className="demo-header text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Weekly Reflection System Demo 🗓️</h1>
        <p className="text-text-secondary text-lg mb-6">
          Experience the complete weekly reflection feature designed to enhance trading psychology through consistent self-reflection and goal setting.
        </p>
        
        {/* Current Status */}
        <div className="current-status bg-gradient-to-r from-primary-soft to-blue-50 rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">{demoState.completedReflections}</div>
              <div className="text-sm text-text-secondary">Weeks Reflected</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">{shouldPrompt ? '🔔' : '✅'}</div>
              <div className="text-sm text-text-secondary">
                {shouldPrompt ? 'Reflection Due' : 'Up to Date'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🏆</div>
              <div className="text-sm text-text-secondary">
                {getCurrentStreak() >= 4 ? 'Monthly Streak!' : 
                 getCurrentStreak() >= 2 ? 'Building Momentum' : 'Getting Started'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Showcase */}
      <div className="features-grid grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Start New Reflection */}
        <div className="feature-card bg-surface rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-3">✨</span>
            <h3 className="text-lg font-medium">Start Weekly Reflection</h3>
          </div>
          <p className="text-text-secondary mb-4">
            Complete a comprehensive weekly reflection with emotion tracking insights, guided questions, and goal setting for the upcoming week.
          </p>
          <button
            onClick={() => handleViewChange('reflection')}
            className="w-full py-2 px-4 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors"
          >
            Begin Reflection
          </button>
        </div>

        {/* View History */}
        <div className="feature-card bg-surface rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-3">📚</span>
            <h3 className="text-lg font-medium">Reflection History</h3>
          </div>
          <p className="text-text-secondary mb-4">
            Browse past weekly reflections to track your emotional growth and see how your trading psychology has evolved over time.
          </p>
          <button
            onClick={() => handleViewChange('history')}
            className="w-full py-2 px-4 border border-primary text-primary hover:bg-primary hover:text-white rounded-lg transition-colors"
          >
            View History
          </button>
        </div>

        {/* Weekly Prompt Demo */}
        <div className="feature-card bg-surface rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-3">🔔</span>
            <h3 className="text-lg font-medium">Sunday Prompt</h3>
          </div>
          <p className="text-text-secondary mb-4">
            Experience the automatic Sunday prompt that encourages weekly reflection. The system remembers your streak and celebrates milestones.
          </p>
          <button
            onClick={handleShowPrompt}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Demo Prompt
          </button>
        </div>

        {/* Streak System */}
        <div className="feature-card bg-surface rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-3">🔥</span>
            <h3 className="text-lg font-medium">Streak Tracking</h3>
          </div>
          <p className="text-text-secondary mb-4">
            Build momentum with weekly reflection streaks. Get celebrated for hitting milestones like 7, 14, 30, and 100 day streaks.
          </p>
          <button
            onClick={simulateNextWeek}
            className="w-full py-2 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
          >
            Simulate Week +1
          </button>
        </div>
      </div>

      {/* Key Features */}
      <div className="key-features bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-medium mb-4 text-center">🌟 Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="feature-item text-center">
            <div className="text-2xl mb-2">🤔</div>
            <h4 className="font-medium mb-1">Rotating Questions</h4>
            <p className="text-sm text-text-secondary">20 unique psychology-focused questions that rotate weekly</p>
          </div>
          <div className="feature-item text-center">
            <div className="text-2xl mb-2">🎯</div>
            <h4 className="font-medium mb-1">Goal Selection</h4>
            <p className="text-sm text-text-secondary">Choose from 10 research-backed trading psychology goals</p>
          </div>
          <div className="feature-item text-center">
            <div className="text-2xl mb-2">📊</div>
            <h4 className="font-medium mb-1">Automatic Stats</h4>
            <p className="text-sm text-text-secondary">Weekly emotion and trading performance insights</p>
          </div>
          <div className="feature-item text-center">
            <div className="text-2xl mb-2">🏆</div>
            <h4 className="font-medium mb-1">Milestone Celebrations</h4>
            <p className="text-sm text-text-secondary">Special animations for streak achievements</p>
          </div>
          <div className="feature-item text-center">
            <div className="text-2xl mb-2">📱</div>
            <h4 className="font-medium mb-1">Mobile Optimized</h4>
            <p className="text-sm text-text-secondary">Touch-friendly design with character counters</p>
          </div>
          <div className="feature-item text-center">
            <div className="text-2xl mb-2">💾</div>
            <h4 className="font-medium mb-1">Auto-Save</h4>
            <p className="text-sm text-text-secondary">Progress automatically saved and restored</p>
          </div>
        </div>
      </div>

      {/* Technical Implementation */}
      <div className="technical-details bg-surface rounded-xl p-6">
        <h2 className="text-xl font-medium mb-4">⚙️ Technical Implementation</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-2 text-primary">Frontend Features</h3>
            <ul className="text-sm space-y-1 text-text-secondary">
              <li>• React components with TypeScript</li>
              <li>• Responsive design with Tailwind CSS</li>
              <li>• Local storage for demo data</li>
              <li>• Automatic Sunday detection</li>
              <li>• Character counters and validation</li>
              <li>• Celebration animations and modals</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2 text-primary">Psychology Features</h3>
            <ul className="text-sm space-y-1 text-text-secondary">
              <li>• 20 research-backed reflection questions</li>
              <li>• 10 evidence-based trading goals</li>
              <li>• Emotion-performance correlation tracking</li>
              <li>• Streak-based motivation system</li>
              <li>• Progress visualization and insights</li>
              <li>• Historical reflection analysis</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Demo Prompt Modal */}
      {demoState.showPrompt && (
        <WeeklyReflectionPrompt
          onComplete={handleReflectionComplete}
          onDismiss={handleClosePrompt}
        />
      )}

      {/* Notification Component */}
      <WeeklyReflectionNotification />
    </div>
  );
}
