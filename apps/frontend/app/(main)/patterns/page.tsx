'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

// Mock data for patterns analysis
const emotionPerformanceData = [
  { emotionLevel: 1, winRate: 0.25, avgPnL: -125, tradeCount: 8 },
  { emotionLevel: 2, winRate: 0.35, avgPnL: -85, tradeCount: 12 },
  { emotionLevel: 3, winRate: 0.45, avgPnL: -45, tradeCount: 15 },
  { emotionLevel: 4, winRate: 0.55, avgPnL: 25, tradeCount: 18 },
  { emotionLevel: 5, winRate: 0.65, avgPnL: 85, tradeCount: 22 },
  { emotionLevel: 6, winRate: 0.70, avgPnL: 125, tradeCount: 25 },
  { emotionLevel: 7, winRate: 0.75, avgPnL: 165, tradeCount: 20 },
  { emotionLevel: 8, winRate: 0.65, avgPnL: 105, tradeCount: 16 },
  { emotionLevel: 9, winRate: 0.55, avgPnL: 45, tradeCount: 12 },
  { emotionLevel: 10, winRate: 0.40, avgPnL: -25, tradeCount: 8 },
];

const weeklyTrends = [
  { week: 'Week 1', avgEmotion: 6.2, winRate: 0.68, totalPnL: 450 },
  { week: 'Week 2', avgEmotion: 5.8, winRate: 0.72, totalPnL: 620 },
  { week: 'Week 3', avgEmotion: 6.5, winRate: 0.65, totalPnL: 380 },
  { week: 'Week 4', avgEmotion: 7.1, winRate: 0.58, totalPnL: 280 },
];

const keyInsights = [
  {
    type: 'performance',
    message: 'Your optimal emotion range is 6-7 for maximum profitability',
    confidence: 0.85,
    emotionRange: [6, 7],
    improvement: 45
  },
  {
    type: 'emotion',
    message: 'High emotion levels (9-10) correlate with 40% lower win rates',
    confidence: 0.92,
    improvement: -35
  },
  {
    type: 'timing',
    message: 'Morning trades show 15% better performance when emotion level is 5-6',
    confidence: 0.78,
    improvement: 15
  }
];

export default function PatternsPage() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Pattern Analysis</h1>
        <p className="text-muted-foreground">
          Discover how your emotional state affects your trading performance
        </p>
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Win Rate by Emotion Level</CardTitle>
                <CardDescription>
                  How your emotional state correlates with trading success
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={emotionPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="emotionLevel" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        name === 'winRate' ? `${(value * 100).toFixed(1)}%` : value,
                        name === 'winRate' ? 'Win Rate' : name
                      ]}
                    />
                    <Bar dataKey="winRate" fill="#4338CA" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average P&L by Emotion</CardTitle>
                <CardDescription>
                  Profit/Loss performance across emotional states
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={emotionPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="emotionLevel" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`$${value}`, 'Avg P&L']}
                    />
                    <Bar 
                      dataKey="avgPnL" 
                      fill="#4338CA"
                      radius={[4, 4, 0, 0]} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Trade Volume Distribution</CardTitle>
              <CardDescription>
                Number of trades executed at each emotion level
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={emotionPerformanceData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="emotionLevel" type="category" />
                  <Tooltip formatter={(value) => [`${value} trades`, 'Trade Count']} />
                  <Bar dataKey="tradeCount" fill="#F59E0B" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Performance Trends</CardTitle>
              <CardDescription>
                Track your emotional patterns and performance over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="avgEmotion" 
                    stroke="#4338CA" 
                    strokeWidth={3}
                    name="Avg Emotion"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="winRate" 
                    stroke="#059669" 
                    strokeWidth={3}
                    name="Win Rate"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            {weeklyTrends.map((week, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{week.week}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Avg Emotion:</span>
                    <Badge variant="outline">{week.avgEmotion}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Win Rate:</span>
                    <Badge variant="outline">{(week.winRate * 100).toFixed(1)}%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total P&L:</span>
                    <Badge 
                      variant={week.totalPnL >= 0 ? "default" : "destructive"}
                    >
                      ${week.totalPnL}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="space-y-4">
            {keyInsights.map((insight, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{insight.message}</CardTitle>
                      <CardDescription>
                        Confidence: {(insight.confidence * 100).toFixed(1)}%
                      </CardDescription>
                    </div>
                    <Badge 
                      variant={insight.improvement >= 0 ? "default" : "destructive"}
                      className="ml-2"
                    >
                      {insight.improvement >= 0 ? '+' : ''}{insight.improvement}%
                    </Badge>
                  </div>
                </CardHeader>
                {insight.emotionRange && (
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      Optimal emotion range: {insight.emotionRange[0]} - {insight.emotionRange[1]}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
              <CardDescription>
                Actionable insights to improve your trading performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900">Maintain Emotional Balance</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Your data shows peak performance at emotion levels 6-7. Consider meditation or breathing exercises before trading.
                </p>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <h4 className="font-semibold text-amber-900">Avoid Extreme States</h4>
                <p className="text-sm text-amber-700 mt-1">
                  High emotion levels (9-10) correlate with poor performance. Take a break when feeling overly excited or anxious.
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-900">Morning Trading Advantage</h4>
                <p className="text-sm text-green-700 mt-1">
                  Your morning trades perform 15% better. Consider scheduling important trades in the morning when emotion levels are optimal.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
