'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api-client';
import { WeeklyReflection, MonthlyGoal, WeeklyReflectionRequest, MonthlyGoalRequest } from '@/lib/types';
import { WeeklyPromptCard } from '@/components/weekly-prompt/WeeklyPrompt';
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
  X,
  Loader2
} from 'lucide-react';

export default function ReflectionPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [newReflection, setNewReflection] = useState({
    wins: '',
    losses: '',
    lessons: '',
    emotionalInsights: '',
    nextWeekGoals: ''
  });
  const [newGoal, setNewGoal] = useState('');

  const queryClient = useQueryClient();

  // Fetch weekly reflections
  const { data: weeklyReflections, isLoading: reflectionsLoading, error: reflectionsError } = useQuery({
    queryKey: ['weeklyReflections'],
    queryFn: () => apiClient.getWeeklyReflections(),
  });

  // Fetch monthly goals
  const { data: monthlyGoals, isLoading: goalsLoading, error: goalsError } = useQuery({
    queryKey: ['monthlyGoals'],
    queryFn: () => apiClient.getMonthlyGoals(),
  });

  // Create weekly reflection mutation
  const createReflectionMutation = useMutation({
    mutationFn: (data: WeeklyReflectionRequest) => apiClient.createWeeklyReflection(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weeklyReflections'] });
      setIsEditing(false);
      setNewReflection({
        wins: '',
        losses: '',
        lessons: '',
        emotionalInsights: '',
        nextWeekGoals: ''
      });
    },
  });

  // Create monthly goal mutation
  const createGoalMutation = useMutation({
    mutationFn: (data: MonthlyGoalRequest) => apiClient.createMonthlyGoal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthlyGoals'] });
      setNewGoal('');
    },
  });

  // Update monthly goal mutation
  const updateGoalMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MonthlyGoalRequest> }) => 
      apiClient.updateMonthlyGoal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthlyGoals'] });
    },
  });

  const handleSaveReflection = () => {
    if (!newReflection.wins || !newReflection.losses || !newReflection.lessons) {
      return; // Basic validation
    }

    // Calculate the start of the current week (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust for Sunday
    const weekStart = new Date(now.setDate(diff));
    
    createReflectionMutation.mutate({
      wins: newReflection.wins,
      losses: newReflection.losses,
      lessons: newReflection.lessons,
      emotionalInsights: newReflection.emotionalInsights,
      nextWeekGoals: newReflection.nextWeekGoals,
      weekStartDate: weekStart.toISOString().split('T')[0],
    });
  };

  const handleCreateGoal = () => {
    if (!newGoal.trim()) return;

    const now = new Date();
    const targetMonth = now.toISOString().substring(0, 7); // YYYY-MM format

    createGoalMutation.mutate({
      goal: newGoal,
      targetMonth,
      progress: 0,
      isCompleted: false,
    });
  };

  const handleToggleGoal = (goal: MonthlyGoal) => {
    updateGoalMutation.mutate({
      id: goal.id,
      data: {
        goal: goal.goal,
        targetMonth: goal.targetMonth,
        isCompleted: !goal.isCompleted,
        progress: goal.isCompleted ? 0 : 100,
      },
    });
  };

  // Loading states
  if (reflectionsLoading || goalsLoading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  // Error states
  if (reflectionsError || goalsError) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="text-center text-destructive">
          <p>Error loading reflection data. Please try again.</p>
        </div>
      </div>
    );
  }

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
          <TabsTrigger value="prompt">Sunday Prompt</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
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
            {weeklyReflections && weeklyReflections.length > 0 ? (
              weeklyReflections.map((reflection: WeeklyReflection) => (
                <Card key={reflection.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">
                          Week of {new Date(reflection.weekStartDate).toLocaleDateString()}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(reflection.createdAt).toLocaleDateString()}
                          </span>
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
              ))
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No reflections yet</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Start your reflection journey by creating your first weekly reflection.
                  </p>
                  <Button onClick={() => setIsEditing(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Reflection
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="prompt" className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Sunday Reflection Prompts</h2>
            <p className="text-muted-foreground">
              Every Sunday, receive a thoughtful question to help you reflect on your trading journey and build better habits.
            </p>
          </div>
          <WeeklyPromptCard />
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Monthly Goals</h2>
            <div className="flex gap-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter new goal..."
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  className="px-3 py-1 text-sm border rounded-md"
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateGoal()}
                />
                <Button size="sm" onClick={handleCreateGoal} disabled={!newGoal.trim()}>
                  <Target className="h-4 w-4 mr-2" />
                  Add Goal
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {monthlyGoals && monthlyGoals.length > 0 ? (
              monthlyGoals.map((goal: MonthlyGoal) => (
                <Card key={goal.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{goal.goal}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={goal.isCompleted ? "default" : "secondary"}>
                          {goal.isCompleted ? "Complete" : "In Progress"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleGoal(goal)}
                        >
                          {goal.isCompleted ? <X className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{goal.progress || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${
                            goal.isCompleted ? 'bg-green-500' : (goal.progress || 0) >= 80 ? 'bg-yellow-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${goal.progress || 0}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="md:col-span-2">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Target className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No goals set</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Set your first monthly goal to track your progress.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">AI-Generated Insights</h2>
            <Badge variant="outline" className="flex items-center gap-1">
              <Brain className="h-3 w-3" />
              Coming Soon
            </Badge>
          </div>

          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Brain className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">AI Insights Coming Soon</h3>
              <p className="text-muted-foreground text-center">
                Once you have enough reflection data, we&apos;ll generate personalized insights about your trading patterns.
              </p>
            </CardContent>
          </Card>
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
                <Button 
                  onClick={handleSaveReflection} 
                  className="flex items-center gap-2"
                  disabled={createReflectionMutation.isPending || !newReflection.wins || !newReflection.losses || !newReflection.lessons}
                >
                  {createReflectionMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {createReflectionMutation.isPending ? 'Saving...' : 'Save Reflection'}
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
