'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  BookOpen, 
  Brain, 
  Target, 
  TrendingUp, 
  Clock, 
  Calendar,
  Plus,
  Edit3,
  Save,
  X
} from 'lucide-react';

// Mock reflection data
const reflectionData = {
  weeklyReflections: [
    {
      id: '1',
      week: 'Week of Dec 18, 2024',
      date: new Date('2024-12-22'),
      wins: 'Stayed calm during volatile market conditions. Followed my trading plan consistently.',
      losses: 'Got overconfident after 3 wins in a row, leading to a large loss on AAPL.',
      lessons: 'Need to maintain discipline regardless of recent performance. Success can be as dangerous as failure.',
      emotionalInsights: 'Noticed I trade better with emotion levels 6-7. Above 8 leads to overconfidence.',
      nextWeekGoals: 'Focus on position sizing. No trades above 2% risk per position.',
      emotionLevel: 7.2,
      winRate: 0.68,
      totalPnL: 450,
    },
    {
      id: '2',
      week: 'Week of Dec 11, 2024',
      date: new Date('2024-12-15'),
      wins: 'Excellent risk management. Cut losses quickly on losing trades.',
      losses: 'Missed some good opportunities due to analysis paralysis.',
      lessons: 'Sometimes the perfect setup doesn\'t exist. Good enough is better than nothing.',
      emotionalInsights: 'Low emotion levels (4-5) made me too cautious. Need to find balance.',
      nextWeekGoals: 'Take more calculated risks. Trust my analysis more.',
      emotionLevel: 5.8,
      winRate: 0.55,
      totalPnL: 280,
    }
  ],
  monthlyGoals: [
    { id: '1', goal: 'Maintain emotion level between 6-7 during trading', progress: 75, completed: false },
    { id: '2', goal: 'Achieve 65% win rate for the month', progress: 68, completed: true },
    { id: '3', goal: 'Complete weekly reflections consistently', progress: 90, completed: false },
    { id: '4', goal: 'Reduce maximum position size to 2%', progress: 85, completed: false },
  ],
  insights: [
    {
      category: 'Emotional Pattern',
      insight: 'Your best performance occurs when emotion levels are between 6-7',
      confidence: 92,
      actionable: 'Consider meditation or breathing exercises before trading sessions'
    },
    {
      category: 'Risk Management', 
      insight: 'Weeks with consistent position sizing show 23% better returns',
      confidence: 87,
      actionable: 'Set position size rules and stick to them regardless of confidence level'
    },
    {
      category: 'Learning Curve',
      insight: 'Reflection quality correlates with improved performance next week',
      confidence: 79,
      actionable: 'Spend more time on detailed weekly reflections'
    }
  ]
};

export default function ReflectionPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [newReflection, setNewReflection] = useState({
    wins: '',
    losses: '',
    lessons: '',
    emotionalInsights: '',
    nextWeekGoals: ''
  });

  const handleSaveReflection = () => {
    // TODO: Implement API call to save reflection
    console.log('Saving reflection:', newReflection);
    setIsEditing(false);
    setNewReflection({
      wins: '',
      losses: '',
      lessons: '',
      emotionalInsights: '',
      nextWeekGoals: ''
    });
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Reflection Journal</h1>
        <p className="text-muted-foreground">
          Learn from your trading journey and build better habits through reflection
        </p>
      </div>

      <Tabs defaultValue="weekly" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="new">New Entry</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Weekly Reflections</h2>
            <Button onClick={() => setIsEditing(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Reflection
            </Button>
          </div>

          <div className="space-y-4">
            {reflectionData.weeklyReflections.map((reflection) => (
              <Card key={reflection.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{reflection.week}</CardTitle>
                      <CardDescription className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {reflection.date.toLocaleDateString()}
                        </span>
                        <Badge variant="outline">
                          Emotion: {reflection.emotionLevel}/10
                        </Badge>
                        <Badge variant={reflection.winRate >= 0.6 ? "default" : "secondary"}>
                          Win Rate: {(reflection.winRate * 100).toFixed(1)}%
                        </Badge>
                        <Badge variant={reflection.totalPnL >= 0 ? "default" : "destructive"}>
                          P&L: ${reflection.totalPnL}
                        </Badge>
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-success">✅ What Went Well</Label>
                      <p className="text-sm text-muted-foreground bg-green-50 p-3 rounded-md">
                        {reflection.wins}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-destructive">❌ What Didn&apos;t Work</Label>
                      <p className="text-sm text-muted-foreground bg-red-50 p-3 rounded-md">
                        {reflection.losses}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-primary">🧠 Key Lessons</Label>
                    <p className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-md">
                      {reflection.lessons}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-warning">💭 Emotional Insights</Label>
                    <p className="text-sm text-muted-foreground bg-amber-50 p-3 rounded-md">
                      {reflection.emotionalInsights}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-purple-600">🎯 Next Week Goals</Label>
                    <p className="text-sm text-muted-foreground bg-purple-50 p-3 rounded-md">
                      {reflection.nextWeekGoals}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Monthly Goals</h2>
            <Button size="sm" variant="outline">
              <Target className="h-4 w-4 mr-2" />
              Set New Goal
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {reflectionData.monthlyGoals.map((goal) => (
              <Card key={goal.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{goal.goal}</CardTitle>
                    <Badge variant={goal.completed ? "default" : "secondary"}>
                      {goal.completed ? "Complete" : "In Progress"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{goal.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          goal.completed ? 'bg-success' : goal.progress >= 80 ? 'bg-warning' : 'bg-primary'
                        }`}
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">AI-Generated Insights</h2>
            <Badge variant="outline" className="flex items-center gap-1">
              <Brain className="h-3 w-3" />
              Updated Weekly
            </Badge>
          </div>

          <div className="space-y-4">
            {reflectionData.insights.map((insight, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <Badge variant="outline">{insight.category}</Badge>
                      <CardTitle className="text-lg">{insight.insight}</CardTitle>
                    </div>
                    <Badge variant="secondary">
                      {insight.confidence}% confidence
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-1">💡 Actionable Advice</h4>
                    <p className="text-sm text-blue-700">{insight.actionable}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="new" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                New Weekly Reflection
              </CardTitle>
              <CardDescription>
                Take time to reflect on your trading week and identify patterns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="wins">What went well this week? ✅</Label>
                <Textarea
                  id="wins"
                  placeholder="Describe your successful trades, good decisions, and positive behaviors..."
                  value={newReflection.wins}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewReflection(prev => ({ ...prev, wins: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="losses">What didn&apos;t work this week? ❌</Label>
                <Textarea
                  id="losses"
                  placeholder="Identify mistakes, poor decisions, and areas for improvement..."
                  value={newReflection.losses}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewReflection(prev => ({ ...prev, losses: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lessons">Key lessons learned 🧠</Label>
                <Textarea
                  id="lessons"
                  placeholder="What insights did you gain? What would you do differently?"
                  value={newReflection.lessons}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewReflection(prev => ({ ...prev, lessons: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emotional">Emotional insights 💭</Label>
                <Textarea
                  id="emotional"
                  placeholder="How did your emotions affect your trading? What patterns do you notice?"
                  value={newReflection.emotionalInsights}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewReflection(prev => ({ ...prev, emotionalInsights: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goals">Goals for next week 🎯</Label>
                <Textarea
                  id="goals"
                  placeholder="What specific actions will you take next week to improve?"
                  value={newReflection.nextWeekGoals}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewReflection(prev => ({ ...prev, nextWeekGoals: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveReflection} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save Reflection
                </Button>
                <Button variant="outline" onClick={() => setNewReflection({
                  wins: '',
                  losses: '',
                  lessons: '',
                  emotionalInsights: '',
                  nextWeekGoals: ''
                })}>
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
