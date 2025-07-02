'use client';

import React, { useState, useEffect } from 'react';
import { InsightCard } from './InsightCard';
import { ScatterPlot } from './ScatterPlot';
import { EmptyState } from './EmptyState';
// import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface WeeklyEmotion {
  date: string;
  dayShort: string;
  level: number;
}

interface Insight {
  id: string;
  type: 'performance_correlation' | 'warning' | 'trend';
  title: string;
  description: string;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
}

interface WinRateDataPoint {
  emotion: number;
  winRate: number;
  outcome: 'win' | 'loss';
  tradeId: string;
  details?: {
    profit?: number;
    symbol?: string;
    timestamp?: string;
  };
}

interface PatternViewProps {
  userId?: string;
}

export function PatternView({ userId = 'demo-user' }: PatternViewProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [winRateByEmotion, setWinRateByEmotion] = useState<WinRateDataPoint[]>([]);
  const [weeklyEmotions, setWeeklyEmotions] = useState<WeeklyEmotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);

  // Calculate if we have sufficient data for patterns
  const hasSufficientData = winRateByEmotion.length >= 5;

  useEffect(() => {
    const loadData = async () => {
      try {
        // TODO: Replace with actual API calls
        // const response = await fetch(`/api/patterns/${userId}`);
        // const data = await response.json();
        
        // For demo purposes, generate mock data
        const mockData = generateMockData();
        
        setWinRateByEmotion(mockData.winRateData);
        setWeeklyEmotions(mockData.weeklyEmotions);
        setInsights(mockData.insights);
      } catch (error) {
        console.error('Failed to load pattern data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId]);

  const generateMockData = () => {
    // Generate mock win rate data
    const winRateData: WinRateDataPoint[] = [];
    const emotions = [3, 4, 5, 6, 7, 8, 6, 5, 7, 8, 9, 4, 6, 7, 8];
    const outcomes = ['win', 'loss', 'win', 'win', 'loss', 'win', 'win', 'loss', 'win', 'win', 'win', 'loss', 'win', 'win', 'win'];
    
    emotions.forEach((emotion, index) => {
      winRateData.push({
        emotion,
        winRate: outcomes[index] === 'win' ? 1 : 0,
        outcome: outcomes[index] as 'win' | 'loss',
        tradeId: `trade-${index + 1}`,
        details: {
          profit: outcomes[index] === 'win' ? Math.random() * 200 + 50 : -(Math.random() * 150 + 25),
          symbol: ['AAPL', 'GOOGL', 'TSLA', 'MSFT', 'AMZN'][Math.floor(Math.random() * 5)],
          timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      });
    });

    // Generate weekly emotions
    const weeklyEmotions: WeeklyEmotion[] = [
      { date: '2025-06-25', dayShort: 'Mon', level: 6.2 },
      { date: '2025-06-26', dayShort: 'Tue', level: 7.1 },
      { date: '2025-06-27', dayShort: 'Wed', level: 5.8 },
      { date: '2025-06-28', dayShort: 'Thu', level: 8.3 },
      { date: '2025-06-29', dayShort: 'Fri', level: 7.9 },
      { date: '2025-06-30', dayShort: 'Sat', level: 6.5 },
      { date: '2025-07-01', dayShort: 'Sun', level: 7.2 }
    ];

    // Generate insights
    const insights: Insight[] = [
      {
        id: '1',
        type: 'performance_correlation',
        title: 'Your Sweet Spot',
        description: 'You win 85% of trades when your emotion level is between 7-8. This appears to be your optimal confidence range.',
        confidence: 82,
        priority: 'high',
        actionable: true
      },
      {
        id: '2',
        type: 'warning',
        title: 'Danger Zone Detected',
        description: 'You only win 25% of trades when emotion level drops below 4. Consider taking a break when feeling anxious.',
        confidence: 78,
        priority: 'high',
        actionable: true
      },
      {
        id: '3',
        type: 'trend',
        title: 'Emotional Trend: Improving',
        description: 'Your emotional state has been steadily improving over the past 2 weeks. Your average emotion level increased from 5.2 to 6.8.',
        confidence: 71,
        priority: 'medium',
        actionable: true
      }
    ];

    return { winRateData, weeklyEmotions, insights };
  };

  const getEmotionColor = (level: number): string => {
    const emotionLevel = Math.round(level);
    return `var(--emotion-${emotionLevel})`;
  };

  const getEmotionEmoji = (level: number): string => {
    if (level >= 8) return '😎';
    if (level >= 6) return '😊';
    if (level >= 4) return '🙂';
    if (level >= 2) return '😐';
    return '😰';
  };

  const handleTellMeMore = (insight: Insight) => {
    setSelectedInsight(insight);
  };

  if (loading) {
    return (
      <div className="pattern-view animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="bg-gray-100 rounded-xl h-80 mb-6"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-100 rounded-xl h-32"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pattern-view max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-medium mb-6">
        Your Trading Psychology
      </h1>
      
      <div className="win-rate-chart card p-4 mb-6 bg-surface rounded-xl shadow-md">
        <h2 className="text-lg font-medium mb-2">Win Rate by Emotion</h2>
        <div className="chart-container h-64">
          {hasSufficientData ? (
            <ScatterPlot 
              data={winRateByEmotion} 
              trendLine={true}
              animationDuration={800}
              animationStagger={100}
              width={Math.min(800, typeof window !== 'undefined' ? window.innerWidth - 100 : 800)}
              height={250}
            />
          ) : (
            <EmptyState 
              message="Need 5+ trades to see patterns" 
              icon="📊"
              subMessage="Start tracking your emotions with trades to see meaningful insights and correlations."
            />
          )}
        </div>
      </div>
      
      <div className="insights-section">
        {insights.map((insight, index) => (
          <div
            key={insight.id}
            className="animate-pulse"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <InsightCard 
              title={insight.title}
              description={insight.description}
              confidence={insight.confidence}
              type={insight.type}
              onTellMeMore={() => handleTellMeMore(insight)}
            />
          </div>
        ))}
      </div>
      
      <div className="weekly-emotions card p-4 mt-6 bg-surface rounded-xl shadow-md">
        <h2 className="text-lg font-medium mb-4">This Week&apos;s Emotions</h2>
        <div className="emotion-bars space-y-3">
          {weeklyEmotions.map((day, index) => (
            <div 
              key={day.date} 
              className="emotion-day flex items-center animate-pulse"
              style={{ animationDelay: `${700 + (index * 50)}ms` }}
            >
              <span className="day-label w-12 text-sm font-medium text-text-secondary">
                {day.dayShort}
              </span>
              <div className="emotion-bar-container flex-1 h-8 bg-gray-100 rounded-full overflow-hidden mx-3 relative">
                <div 
                  className="emotion-bar-fill h-full rounded-full transition-all duration-500" 
                  style={{
                    backgroundColor: getEmotionColor(day.level),
                    width: `${day.level * 10}%`
                  }}
                />
                
                {/* Gradient overlay for visual appeal */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="emotion-value text-sm font-medium w-8 text-right">
                  {day.level.toFixed(1)}
                </span>
                <span className="emotion-emoji text-lg">
                  {getEmotionEmoji(day.level)}
                </span>
                {day.level <= 3 && (
                  <span className="warning-icon text-yellow-500 animate-pulse">
                    ⚠️
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Weekly summary */}
        <div className="weekly-summary mt-6 pt-4 border-t border-border">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-primary">
                {(weeklyEmotions.reduce((sum, day) => sum + day.level, 0) / weeklyEmotions.length).toFixed(1)}
              </div>
              <div className="text-sm text-text-secondary">Average</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-green-600">
                {Math.max(...weeklyEmotions.map(d => d.level)).toFixed(1)}
              </div>
              <div className="text-sm text-text-secondary">Peak</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-red-600">
                {Math.min(...weeklyEmotions.map(d => d.level)).toFixed(1)}
              </div>
              <div className="text-sm text-text-secondary">Low</div>
            </div>
          </div>
        </div>
      </div>

      {/* Insight Detail Modal */}
      {selectedInsight && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-pulse"
          onClick={() => setSelectedInsight(null)}
        >
          <div
            className="bg-white rounded-xl p-6 max-w-md mx-4 relative"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary"
              onClick={() => setSelectedInsight(null)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h3 className="text-xl font-semibold mb-3">{selectedInsight.title}</h3>
            <p className="text-text-secondary mb-4">{selectedInsight.description}</p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="font-medium mb-2">Recommended Actions:</h4>
              <ul className="text-sm text-text-secondary space-y-1">
                {selectedInsight.type === 'performance_correlation' && (
                  <>
                    <li>• Try to maintain emotion levels in your sweet spot range</li>
                    <li>• Use pre-trade emotion checks as entry criteria</li>
                    <li>• Consider meditation before trading sessions</li>
                  </>
                )}
                {selectedInsight.type === 'warning' && (
                  <>
                    <li>• Set alerts when emotion levels drop too low</li>
                    <li>• Take breaks during high-stress periods</li>
                    <li>• Consider reducing position sizes when anxious</li>
                  </>
                )}
                {selectedInsight.type === 'trend' && (
                  <>
                    <li>• Continue current emotional wellness practices</li>
                    <li>• Track what&apos;s contributing to improvement</li>
                    <li>• Maintain consistent emotion logging</li>
                  </>
                )}
              </ul>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">
                {selectedInsight.confidence}% confidence
              </span>
              <button
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
                onClick={() => setSelectedInsight(null)}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
