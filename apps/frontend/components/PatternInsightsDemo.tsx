'use client';

import React, { useState } from 'react';
import { PatternView } from './PatternView';
import { InsightCard } from './InsightCard';
import { ScatterPlot } from './ScatterPlot';
import { EmptyState } from './EmptyState';
import { cn } from '@/lib/utils';

type DemoView = 'overview' | 'pattern-view' | 'insights' | 'charts';

interface DemoState {
  currentView: DemoView;
  showTooltips: boolean;
  animationsEnabled: boolean;
}

export function PatternInsightsDemo() {
  const [demoState, setDemoState] = useState<DemoState>({
    currentView: 'overview',
    showTooltips: true,
    animationsEnabled: true
  });

  const handleViewChange = (view: DemoView) => {
    setDemoState(prev => ({ ...prev, currentView: view }));
  };

  const demoInsights = [
    {
      id: '1',
      type: 'performance_correlation' as const,
      title: 'Your Sweet Spot',
      description: 'You win 85% of trades when your emotion level is between 7-8. This appears to be your optimal confidence range.',
      confidence: 82,
      priority: 'high' as const,
      actionable: true
    },
    {
      id: '2', 
      type: 'warning' as const,
      title: 'Danger Zone Detected',
      description: 'You only win 25% of trades when emotion level drops below 4. Consider taking a break when feeling anxious.',
      confidence: 78,
      priority: 'high' as const,
      actionable: true
    },
    {
      id: '3',
      type: 'trend' as const,
      title: 'Emotional Trend: Improving',
      description: 'Your emotional state has been steadily improving over the past 2 weeks. Your average emotion level increased from 5.2 to 6.8.',
      confidence: 71,
      priority: 'medium' as const,
      actionable: true
    }
  ];

  const demoChartData = [
    { emotion: 3, winRate: 0.2, outcome: 'loss' as const, tradeId: 'trade-1', details: { profit: -45.50, symbol: 'AAPL' } },
    { emotion: 4, winRate: 0.4, outcome: 'loss' as const, tradeId: 'trade-2', details: { profit: -22.30, symbol: 'GOOGL' } },
    { emotion: 5, winRate: 1, outcome: 'win' as const, tradeId: 'trade-3', details: { profit: 125.75, symbol: 'TSLA' } },
    { emotion: 6, winRate: 1, outcome: 'win' as const, tradeId: 'trade-4', details: { profit: 89.25, symbol: 'MSFT' } },
    { emotion: 7, winRate: 1, outcome: 'win' as const, tradeId: 'trade-5', details: { profit: 156.80, symbol: 'AMZN' } },
    { emotion: 8, winRate: 1, outcome: 'win' as const, tradeId: 'trade-6', details: { profit: 203.45, symbol: 'AAPL' } },
    { emotion: 6, winRate: 1, outcome: 'win' as const, tradeId: 'trade-7', details: { profit: 67.90, symbol: 'GOOGL' } },
    { emotion: 5, winRate: 0, outcome: 'loss' as const, tradeId: 'trade-8', details: { profit: -34.20, symbol: 'TSLA' } },
    { emotion: 7, winRate: 1, outcome: 'win' as const, tradeId: 'trade-9', details: { profit: 198.30, symbol: 'MSFT' } },
    { emotion: 8, winRate: 1, outcome: 'win' as const, tradeId: 'trade-10', details: { profit: 245.60, symbol: 'AMZN' } },
    { emotion: 9, winRate: 1, outcome: 'win' as const, tradeId: 'trade-11', details: { profit: 312.40, symbol: 'AAPL' } },
    { emotion: 4, winRate: 0, outcome: 'loss' as const, tradeId: 'trade-12', details: { profit: -78.90, symbol: 'GOOGL' } },
    { emotion: 6, winRate: 1, outcome: 'win' as const, tradeId: 'trade-13', details: { profit: 134.70, symbol: 'TSLA' } },
    { emotion: 7, winRate: 1, outcome: 'win' as const, tradeId: 'trade-14', details: { profit: 187.50, symbol: 'MSFT' } },
    { emotion: 8, winRate: 1, outcome: 'win' as const, tradeId: 'trade-15', details: { profit: 276.80, symbol: 'AMZN' } }
  ];

  if (demoState.currentView === 'pattern-view') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-4 border-b border-gray-200 bg-white">
          <button
            onClick={() => handleViewChange('overview')}
            className="flex items-center text-primary hover:text-primary-hover transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Demo Overview
          </button>
        </div>
        <PatternView userId="demo-user" />
      </div>
    );
  }

  if (demoState.currentView === 'insights') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-4 border-b border-gray-200 bg-white">
          <button
            onClick={() => handleViewChange('overview')}
            className="flex items-center text-primary hover:text-primary-hover transition-colors mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Demo Overview
          </button>
          <h1 className="text-2xl font-medium">Individual Insight Cards Demo</h1>
        </div>
        
        <div className="max-w-4xl mx-auto p-6">
          {demoInsights.map((insight) => (
            <InsightCard
              key={insight.id}
              title={insight.title}
              description={insight.description}
              confidence={insight.confidence}
              type={insight.type}
              onTellMeMore={() => alert(`More details about: ${insight.title}`)}
            />
          ))}
        </div>
      </div>
    );
  }

  if (demoState.currentView === 'charts') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-4 border-b border-gray-200 bg-white">
          <button
            onClick={() => handleViewChange('overview')}
            className="flex items-center text-primary hover:text-primary-hover transition-colors mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Demo Overview
          </button>
          <h1 className="text-2xl font-medium">Chart Components Demo</h1>
        </div>
        
        <div className="max-w-6xl mx-auto p-6 space-y-8">
          {/* Scatter Plot with Data */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-medium mb-4">Scatter Plot with Data</h2>
            <ScatterPlot
              data={demoChartData}
              trendLine={true}
              animationDuration={800}
              animationStagger={100}
              width={800}
              height={400}
            />
          </div>

          {/* Empty State */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-medium mb-4">Empty State Component</h2>
            <div className="h-64">
              <EmptyState 
                message="Need 5+ trades to see patterns" 
                icon="📊"
                subMessage="Start tracking your emotions with trades to see meaningful insights and correlations."
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main demo overview
  return (
    <div className="pattern-insights-demo max-w-6xl mx-auto p-6">
      {/* Demo Header */}
      <div className="demo-header text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Pattern Insights System Demo 📊</h1>
        <p className="text-text-secondary text-lg mb-6">
          Experience the complete pattern analysis system that provides personalized insights based on emotion-trading correlations using advanced statistical analysis and machine learning.
        </p>
        
        {/* Demo Controls */}
        <div className="demo-controls bg-surface rounded-xl p-4 mb-8">
          <div className="flex items-center justify-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={demoState.showTooltips}
                onChange={(e) => setDemoState(prev => ({ ...prev, showTooltips: e.target.checked }))}
                className="w-4 h-4 text-primary"
              />
              <span className="text-sm">Show Tooltips</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={demoState.animationsEnabled}
                onChange={(e) => setDemoState(prev => ({ ...prev, animationsEnabled: e.target.checked }))}
                className="w-4 h-4 text-primary"
              />
              <span className="text-sm">Enable Animations</span>
            </label>
          </div>
        </div>
      </div>

      {/* Feature Showcase */}
      <div className="features-grid grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Complete Pattern View */}
        <div className="feature-card bg-surface rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-3">📈</span>
            <h3 className="text-lg font-medium">Complete Pattern View</h3>
          </div>
          <p className="text-text-secondary mb-4">
            Experience the full pattern analysis interface with scatter plots, insights, and weekly emotion tracking. Includes statistical significance indicators and trend analysis.
          </p>
          <button
            onClick={() => handleViewChange('pattern-view')}
            className="w-full py-2 px-4 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors"
          >
            View Pattern Analysis
          </button>
        </div>

        {/* Individual Insights */}
        <div className="feature-card bg-surface rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-3">💡</span>
            <h3 className="text-lg font-medium">Individual Insights</h3>
          </div>
          <p className="text-text-secondary mb-4">
            Explore individual insight cards with confidence ratings, actionable recommendations, and different insight types (performance, warnings, trends).
          </p>
          <button
            onClick={() => handleViewChange('insights')}
            className="w-full py-2 px-4 border border-primary text-primary hover:bg-primary hover:text-white rounded-lg transition-colors"
          >
            View Insight Cards
          </button>
        </div>

        {/* Chart Components */}
        <div className="feature-card bg-surface rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-3">📊</span>
            <h3 className="text-lg font-medium">Chart Components</h3>
          </div>
          <p className="text-text-secondary mb-4">
            Interactive scatter plots with tooltips, trend lines, and empty states. Includes smooth animations and responsive design for mobile devices.
          </p>
          <button
            onClick={() => handleViewChange('charts')}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            View Charts
          </button>
        </div>

        {/* Backend Integration */}
        <div className="feature-card bg-surface rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-3">⚙️</span>
            <h3 className="text-lg font-medium">Backend Integration</h3>
          </div>
          <p className="text-text-secondary mb-4">
            Complete C# PatternService with linear regression, statistical analysis, and personalized insight generation ready for API integration.
          </p>
          <button
            className="w-full py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            onClick={() => alert('Backend PatternService.cs created with all statistical methods!')}
          >
            View Service Code
          </button>
        </div>
      </div>

      {/* Technical Features */}
      <div className="technical-features bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-medium mb-4 text-center">🔧 Technical Implementation</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="feature-item text-center">
            <div className="text-2xl mb-2">📈</div>
            <h4 className="font-medium mb-1">Linear Regression</h4>
            <p className="text-sm text-text-secondary">Statistical trend analysis with R-squared confidence calculations</p>
          </div>
          <div className="feature-item text-center">
            <div className="text-2xl mb-2">🎯</div>
            <h4 className="font-medium mb-1">Smart Insights</h4>
            <p className="text-sm text-text-secondary">AI-powered pattern recognition with statistical significance thresholds</p>
          </div>
          <div className="feature-item text-center">
            <div className="text-2xl mb-2">📊</div>
            <h4 className="font-medium mb-1">Interactive Charts</h4>
            <p className="text-sm text-text-secondary">SVG-based scatter plots with tooltips and smooth animations</p>
          </div>
          <div className="feature-item text-center">
            <div className="text-2xl mb-2">📱</div>
            <h4 className="font-medium mb-1">Responsive Design</h4>
            <p className="text-sm text-text-secondary">Mobile-optimized layouts that stack charts vertically</p>
          </div>
          <div className="feature-item text-center">
            <div className="text-2xl mb-2">🔍</div>
            <h4 className="font-medium mb-1">Statistical Validation</h4>
            <p className="text-sm text-text-secondary">Sample size validation (minimum 5 trades) for reliable insights</p>
          </div>
          <div className="feature-item text-center">
            <div className="text-2xl mb-2">⚡</div>
            <h4 className="font-medium mb-1">Performance Optimized</h4>
            <p className="text-sm text-text-secondary">Efficient rendering and calculations for large datasets</p>
          </div>
        </div>
      </div>

      {/* Pattern Analysis Capabilities */}
      <div className="analysis-capabilities bg-surface rounded-xl p-6">
        <h2 className="text-xl font-medium mb-4">🧠 Pattern Analysis Capabilities</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-2 text-primary">Statistical Analysis</h3>
            <ul className="text-sm space-y-1 text-text-secondary">
              <li>• Linear regression trend analysis with confidence intervals</li>
              <li>• Emotion-performance correlation detection</li>
              <li>• Statistical significance validation (min 5 data points)</li>
              <li>• Time-based pattern recognition (day/hour analysis)</li>
              <li>• Volatility analysis and risk assessment</li>
              <li>• Sample size adjustments for reliability</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2 text-primary">Insight Generation</h3>
            <ul className="text-sm space-y-1 text-text-secondary">
              <li>• Performance correlation insights (sweet spots)</li>
              <li>• Warning detection for danger zones</li>
              <li>• Emotional trend analysis (improving/declining)</li>
              <li>• Actionable recommendations based on patterns</li>
              <li>• Confidence scoring for each insight</li>
              <li>• Priority-based insight ordering</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
