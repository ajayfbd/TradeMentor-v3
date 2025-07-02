'use client';

import React, { useState } from 'react';
import { StreakProvider } from '@/contexts/StreakContext';
import { EnhancedEmotionLogger } from '@/components/EnhancedEmotionLogger';
import { StreakDisplay, StreakDisplayCompact } from '@/components/StreakDisplay';
import { StreakCelebration } from '@/components/StreakCelebration';

type DemoView = 'overview' | 'emotion-logger' | 'streak-display' | 'celebration';

export default function StreakTrackingDemo() {
  const [currentView, setCurrentView] = useState<DemoView>('overview');
  const [demoStreak, setDemoStreak] = useState(7);
  const [showDemoCelebration, setShowDemoCelebration] = useState(false);
  const [demoMilestone, setDemoMilestone] = useState<string>('');

  const triggerCelebration = (streak: number) => {
    setDemoStreak(streak);
    let milestone = '';
    if (streak === 100) milestone = 'Emotion Tracking Legend! 🏆';
    else if (streak === 30) milestone = 'Monthly Master! 🎖️';
    else if (streak === 14) milestone = 'Two Week Champion! 💪';
    else if (streak === 7) milestone = 'Week Warrior! 🔥';
    
    setDemoMilestone(milestone);
    setShowDemoCelebration(true);
  };

  if (currentView === 'emotion-logger') {
    return (
      <StreakProvider>
        <div className="min-h-screen bg-gray-50">
          <div className="p-4 border-b border-gray-200 bg-white">
            <button
              onClick={() => setCurrentView('overview')}
              className="flex items-center text-primary hover:text-primary-hover transition-colors mb-4"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Demo Overview
            </button>
            <h1 className="text-2xl font-medium">Enhanced Emotion Logger with Streak Tracking</h1>
          </div>
          <div className="py-8">
            <EnhancedEmotionLogger />
          </div>
        </div>
      </StreakProvider>
    );
  }

  if (currentView === 'streak-display') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-4 border-b border-gray-200 bg-white">
          <button
            onClick={() => setCurrentView('overview')}
            className="flex items-center text-primary hover:text-primary-hover transition-colors mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Demo Overview
          </button>
          <h1 className="text-2xl font-medium">Streak Display Components</h1>
        </div>
        
        <div className="max-w-4xl mx-auto p-6 space-y-8">
          {/* Different Streak Levels */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-medium mb-6">Streak Display Variations</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-600 mb-3">New User (0 days)</h3>
                <StreakDisplay currentStreak={0} />
              </div>
              
              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-600 mb-3">Getting Started (3 days)</h3>
                <StreakDisplay currentStreak={3} />
              </div>
              
              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-600 mb-3">Week Warrior (7 days)</h3>
                <StreakDisplay currentStreak={7} />
              </div>
              
              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-600 mb-3">Two Week Champion (14 days)</h3>
                <StreakDisplay currentStreak={14} />
              </div>
              
              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-600 mb-3">Monthly Master (30 days)</h3>
                <StreakDisplay currentStreak={30} />
              </div>
              
              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-600 mb-3">Dedicated User (65 days)</h3>
                <StreakDisplay currentStreak={65} />
              </div>
              
              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-600 mb-3">Legend (100 days)</h3>
                <StreakDisplay currentStreak={100} />
              </div>
              
              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-600 mb-3">Compact Version</h3>
                <StreakDisplayCompact currentStreak={42} />
              </div>
            </div>
          </div>

          {/* Mobile Header Simulation */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-medium mb-4">App Header Integration</h2>
            
            <div className="bg-gray-900 text-white p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm font-bold">
                    TM
                  </div>
                  <span className="font-medium">TradeMentor</span>
                </div>
                
                <div className="flex items-center space-x-4">
                  <StreakDisplayCompact currentStreak={23} />
                  <button className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5M15 17h5l-5-5M15 17H6a2 2 0 01-2-2V5a2 2 0 012-2h9" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Demo */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-medium mb-4">Interactive Demo</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Different Streak Values
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={demoStreak}
                  onChange={(e) => setDemoStreak(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="text-center mt-2 text-sm text-gray-600">
                  Current: {demoStreak} days
                </div>
              </div>
              
              <div className="flex justify-center">
                <StreakDisplay currentStreak={demoStreak} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'celebration') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-4 border-b border-gray-200 bg-white">
          <button
            onClick={() => setCurrentView('overview')}
            className="flex items-center text-primary hover:text-primary-hover transition-colors mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Demo Overview
          </button>
          <h1 className="text-2xl font-medium">Streak Celebration Animations</h1>
        </div>
        
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-medium mb-6">Test Milestone Celebrations</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => triggerCelebration(7)}
                className="p-4 bg-green-100 hover:bg-green-200 rounded-lg border border-green-300 transition-colors"
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">🔥</div>
                  <div className="font-medium">Week Warrior</div>
                  <div className="text-sm text-gray-600">7 days celebration</div>
                </div>
              </button>
              
              <button
                onClick={() => triggerCelebration(14)}
                className="p-4 bg-blue-100 hover:bg-blue-200 rounded-lg border border-blue-300 transition-colors"
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">💪</div>
                  <div className="font-medium">Two Week Champion</div>
                  <div className="text-sm text-gray-600">14 days celebration</div>
                </div>
              </button>
              
              <button
                onClick={() => triggerCelebration(30)}
                className="p-4 bg-purple-100 hover:bg-purple-200 rounded-lg border border-purple-300 transition-colors"
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">🎖️</div>
                  <div className="font-medium">Monthly Master</div>
                  <div className="text-sm text-gray-600">30 days celebration</div>
                </div>
              </button>
              
              <button
                onClick={() => triggerCelebration(100)}
                className="p-4 bg-yellow-100 hover:bg-yellow-200 rounded-lg border border-yellow-300 transition-colors"
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">🏆</div>
                  <div className="font-medium">Legend Status</div>
                  <div className="text-sm text-gray-600">100 days celebration</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Demo Celebration Modal */}
        {showDemoCelebration && (
          <StreakCelebration
            streak={demoStreak}
            milestone={demoMilestone}
            onClose={() => setShowDemoCelebration(false)}
          />
        )}
      </div>
    );
  }

  // Main overview
  return (
    <div className="streak-tracking-demo max-w-6xl mx-auto p-6">
      {/* Demo Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Enhanced Streak Tracking System 🔥</h1>
        <p className="text-gray-600 text-lg mb-6">
          Complete emotion tracking streak system with celebrations, offline support, and gamification to encourage daily habit formation.
        </p>
      </div>

      {/* Feature Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Enhanced Emotion Logger */}
        <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center mb-4">
            <span className="text-3xl mr-3">📝</span>
            <h3 className="text-lg font-medium">Enhanced Emotion Logger</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Complete emotion logging interface with streak integration, daily summaries, and progress tracking.
          </p>
          <button
            onClick={() => setCurrentView('emotion-logger')}
            className="w-full py-2 px-4 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors"
          >
            Try Emotion Logger
          </button>
        </div>

        {/* Streak Display Components */}
        <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center mb-4">
            <span className="text-3xl mr-3">🏆</span>
            <h3 className="text-lg font-medium">Streak Display</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Dynamic streak counters with milestone indicators, tooltips, and responsive design for headers.
          </p>
          <button
            onClick={() => setCurrentView('streak-display')}
            className="w-full py-2 px-4 border border-primary text-primary hover:bg-primary hover:text-white rounded-lg transition-colors"
          >
            View Displays
          </button>
        </div>

        {/* Celebration System */}
        <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center mb-4">
            <span className="text-3xl mr-3">🎉</span>
            <h3 className="text-lg font-medium">Celebration Animations</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Milestone celebrations with confetti effects, progress animations, and motivational messaging.
          </p>
          <button
            onClick={() => setCurrentView('celebration')}
            className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Test Celebrations
          </button>
        </div>
      </div>

      {/* Technical Features */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-medium mb-4 text-center">🔧 Technical Implementation</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="feature-item text-center">
            <div className="text-2xl mb-2">💾</div>
            <h4 className="font-medium mb-1">Offline Support</h4>
            <p className="text-sm text-gray-600">LocalStorage backup with API synchronization</p>
          </div>
          <div className="feature-item text-center">
            <div className="text-2xl mb-2">🌍</div>
            <h4 className="font-medium mb-1">Timezone Aware</h4>
            <p className="text-sm text-gray-600">Accurate daily streak calculation across timezones</p>
          </div>
          <div className="feature-item text-center">
            <div className="text-2xl mb-2">🎯</div>
            <h4 className="font-medium mb-1">Milestone System</h4>
            <p className="text-sm text-gray-600">7, 14, 30, and 100-day achievement levels</p>
          </div>
          <div className="feature-item text-center">
            <div className="text-2xl mb-2">📱</div>
            <h4 className="font-medium mb-1">Mobile Optimized</h4>
            <p className="text-sm text-gray-600">Touch-friendly interfaces and responsive design</p>
          </div>
          <div className="feature-item text-center">
            <div className="text-2xl mb-2">⚡</div>
            <h4 className="font-medium mb-1">Real-time Updates</h4>
            <p className="text-sm text-gray-600">Instant streak updates with context providers</p>
          </div>
          <div className="feature-item text-center">
            <div className="text-2xl mb-2">🎨</div>
            <h4 className="font-medium mb-1">CSS Animations</h4>
            <p className="text-sm text-gray-600">Smooth transitions and confetti effects</p>
          </div>
        </div>
      </div>

      {/* Backend Integration */}
      <div className="bg-white rounded-xl p-6">
        <h2 className="text-xl font-medium mb-4">🛠️ Backend Integration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-2 text-primary">C# StreakService</h3>
            <ul className="text-sm space-y-1 text-gray-600">
              <li>• Timezone-aware streak calculations</li>
              <li>• Daily session tracking with emotion counts</li>
              <li>• Longest streak persistence</li>
              <li>• Milestone achievement detection</li>
              <li>• Automatic insight generation</li>
              <li>• Database optimization for large datasets</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2 text-primary">Frontend Integration</h3>
            <ul className="text-sm space-y-1 text-gray-600">
              <li>• React Context for app-wide streak state</li>
              <li>• Custom hooks for streak management</li>
              <li>• LocalStorage fallback for offline use</li>
              <li>• Automatic streak updates on emotion logging</li>
              <li>• HOC pattern for streak-aware components</li>
              <li>• Performance optimized with React Query</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
