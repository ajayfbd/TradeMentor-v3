'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api-client';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Brain, 
  AlertTriangle,
  CheckCircle,
  Activity
} from 'lucide-react';

interface PatternInsight {
  emotionLevel: number;
  winRate: number;
  avgPnL: number;
  tradeCount: number;
  confidence: number;
}

interface PatternInsightsData {
  insights: PatternInsight[];
  optimalEmotionRange: [number, number];
  correlationStrength: number;
  statisticalSignificance: boolean;
  recommendations: string[];
  summary: string;
}

export function PatternInsightsCard() {
  const { data, isLoading, error } = useQuery<PatternInsightsData>({
    queryKey: ['pattern-insights'],
    queryFn: async () => {
      // Call pattern service to get emotion-performance correlation
      const correlation = await apiClient.getPatternCorrelation();
      
      if (!correlation || !correlation.emotionLevels || correlation.emotionLevels.length === 0) {
        throw new Error('Insufficient data for pattern analysis');
      }

      // Transform backend data to frontend format
      const insights: PatternInsight[] = correlation.emotionLevels.map((level: any) => ({
        emotionLevel: level.emotionLevel,
        winRate: level.winRate,
        avgPnL: level.averageReturn,
        tradeCount: level.tradeCount,
        confidence: Math.min(level.tradeCount / 10, 1) // Confidence based on sample size
      }));

      // Find optimal emotion range (top 3 performing levels)
      const sortedByWinRate = [...insights].sort((a, b) => b.winRate - a.winRate);
      const topPerformers = sortedByWinRate.slice(0, 3);
      const optimalRange: [number, number] = [
        Math.min(...topPerformers.map(p => p.emotionLevel)),
        Math.max(...topPerformers.map(p => p.emotionLevel))
      ];

      // Generate recommendations based on insights
      const recommendations = generateRecommendations(insights, correlation.correlationCoefficient);
      
      // Create summary
      const summary = generateSummary(insights, correlation.correlationCoefficient, optimalRange);

      return {
        insights,
        optimalEmotionRange: optimalRange,
        correlationStrength: Math.abs(correlation.correlationCoefficient),
        statisticalSignificance: correlation.isStatisticallySignificant,
        recommendations,
        summary
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });

  if (isLoading) {
    return <PatternInsightsCardSkeleton />;
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="h-5 w-5 mr-2 text-blue-500" />
            Pattern Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">Insufficient Data</h3>
            <p className="text-muted-foreground text-center">
              {error instanceof Error && error.message.includes('Insufficient data') 
                ? 'You need at least 10 trades with emotion checks to generate insights.'
                : 'Unable to load pattern insights. Please try again later.'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Brain className="h-5 w-5 mr-2 text-blue-500" />
            Pattern Insights
          </div>
          <div className="flex items-center space-x-2">
            <Badge 
              variant={data.statisticalSignificance ? "default" : "secondary"}
              className="text-xs"
            >
              {data.statisticalSignificance ? (
                <><CheckCircle className="h-3 w-3 mr-1" />Significant</>
              ) : (
                <><Activity className="h-3 w-3 mr-1" />Preliminary</>
              )}
            </Badge>
          </div>
        </CardTitle>
        <CardDescription>
          AI-powered analysis of your emotion-performance patterns
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">Key Finding</h4>
          <p className="text-sm text-blue-800">{data.summary}</p>
        </div>

        {/* Optimal Range */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center">
            <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
            Optimal Emotion Range
          </h4>
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
            <div>
              <p className="text-sm font-medium text-green-900">
                Sweet Spot: Levels {data.optimalEmotionRange[0]}-{data.optimalEmotionRange[1]}
              </p>
              <p className="text-xs text-green-700">
                Trade when your emotion level is in this range for best results
              </p>
            </div>
            <Badge variant="outline" className="bg-green-100 text-green-800">
              {getCorrelationLabel(data.correlationStrength)}
            </Badge>
          </div>
        </div>

        {/* Top 3 Insights */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center">
            <BarChart3 className="h-4 w-4 mr-2 text-purple-600" />
            Performance by Emotion Level
          </h4>
          <div className="space-y-2">
            {data.insights
              .sort((a, b) => b.winRate - a.winRate)
              .slice(0, 3)
              .map((insight, index) => (
                <div 
                  key={insight.emotionLevel}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      #{index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        Level {insight.emotionLevel}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {insight.tradeCount} trades
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {insight.winRate.toFixed(1)}% win rate
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {insight.avgPnL > 0 ? '+' : ''}{insight.avgPnL.toFixed(2)}% avg
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center">
            <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
            Actionable Recommendations
          </h4>
          <div className="space-y-2">
            {data.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start space-x-2 p-2 rounded border-l-2 border-blue-200 bg-blue-50">
                <div className="h-5 w-5 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-blue-700">{index + 1}</span>
                </div>
                <p className="text-sm text-blue-800">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Correlation Strength Footer */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Correlation Strength:</span>
            <span className="font-medium">
              {getCorrelationLabel(data.correlationStrength)} ({(data.correlationStrength * 100).toFixed(0)}%)
            </span>
          </div>
          {!data.statisticalSignificance && (
            <p className="text-xs text-amber-600 mt-1">
              Need more trades for statistically significant results
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PatternInsightsCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-16 w-full" />
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

function generateRecommendations(insights: PatternInsight[], correlation: number): string[] {
  const recommendations: string[] = [];
  
  // Find best performing levels
  const bestLevel = insights.reduce((prev, curr) => 
    curr.winRate > prev.winRate ? curr : prev
  );
  
  // Find worst performing levels
  const worstLevel = insights.reduce((prev, curr) => 
    curr.winRate < prev.winRate ? curr : prev
  );

  if (Math.abs(correlation) > 0.3) {
    if (correlation > 0) {
      recommendations.push(`Higher emotion levels correlate with better performance. Consider trading when feeling more confident and energized.`);
    } else {
      recommendations.push(`Lower emotion levels correlate with better performance. Consider trading when feeling calm and neutral.`);
    }
  }

  if (bestLevel.tradeCount >= 5) {
    recommendations.push(`Your emotion level ${bestLevel.emotionLevel} shows the highest win rate (${bestLevel.winRate.toFixed(1)}%). Try to identify what makes you feel this way.`);
  }

  if (worstLevel.tradeCount >= 5 && worstLevel.winRate < 40) {
    recommendations.push(`Avoid trading at emotion level ${worstLevel.emotionLevel} - it shows only ${worstLevel.winRate.toFixed(1)}% win rate. Take a break or wait for better emotional state.`);
  }

  // Sample size recommendation
  if (insights.some(i => i.tradeCount < 5)) {
    recommendations.push(`Continue tracking emotions with trades to build more reliable patterns. More data will improve insight accuracy.`);
  }

  return recommendations.slice(0, 4); // Limit to 4 recommendations
}

function generateSummary(insights: PatternInsight[], correlation: number, optimalRange: [number, number]): string {
  const avgWinRate = insights.reduce((sum, insight) => sum + insight.winRate, 0) / insights.length;
  const bestWinRate = Math.max(...insights.map(i => i.winRate));
  
  if (Math.abs(correlation) < 0.2) {
    return `Your emotion levels show weak correlation with trading performance (${(correlation * 100).toFixed(0)}%). Focus on other factors like market analysis and risk management.`;
  }
  
  if (correlation > 0.5) {
    return `Strong positive correlation detected! Trading at emotion levels ${optimalRange[0]}-${optimalRange[1]} shows ${bestWinRate.toFixed(1)}% win rate vs ${avgWinRate.toFixed(1)}% average. Higher emotion levels improve your performance.`;
  }
  
  if (correlation < -0.5) {
    return `Strong negative correlation detected! Trading at emotion levels ${optimalRange[0]}-${optimalRange[1]} shows ${bestWinRate.toFixed(1)}% win rate vs ${avgWinRate.toFixed(1)}% average. Lower emotion levels improve your performance.`;
  }
  
  return `Moderate correlation found. Your optimal emotion range (${optimalRange[0]}-${optimalRange[1]}) shows ${bestWinRate.toFixed(1)}% win rate compared to ${avgWinRate.toFixed(1)}% average across all levels.`;
}

function getCorrelationLabel(strength: number): string {
  if (strength >= 0.7) return 'Strong';
  if (strength >= 0.5) return 'Moderate';
  if (strength >= 0.3) return 'Weak';
  return 'Very Weak';
}
