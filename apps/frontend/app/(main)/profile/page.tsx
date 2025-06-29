'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Mail, Clock, Target, TrendingUp, Calendar, Settings, LogOut } from 'lucide-react';

// Mock user data
const userData = {
  id: '1',
  email: 'trader@example.com',
  createdAt: new Date('2024-01-15'),
  timezone: 'America/New_York',
  streakCount: 12,
  lastCheckDate: new Date(),
  isActive: true,
  stats: {
    totalTrades: 156,
    totalEmotionChecks: 189,
    avgEmotionLevel: 6.2,
    winRate: 0.68,
    totalPnL: 2450,
    bestStreak: 15,
    currentStreak: 12
  }
};

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [email, setEmail] = useState(userData.email);
  const [timezone, setTimezone] = useState(userData.timezone);

  const handleSave = () => {
    // TODO: Implement API call to update user profile
    setIsEditing(false);
  };

  const handleLogout = () => {
    // TODO: Implement logout functionality
    console.log('Logging out...');
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account and view your trading statistics
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Information
              </CardTitle>
              <CardDescription>
                Your TradeMentor account details and current streak
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm text-muted-foreground">{userData.email}</p>
                </div>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Member Since</Label>
                  <p className="text-sm text-muted-foreground">
                    {userData.createdAt.toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Current Streak</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-success text-white">
                      {userData.streakCount} days
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Keep it up!
                    </span>
                  </div>
                </div>
                <Target className="h-4 w-4 text-muted-foreground" />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Timezone</Label>
                  <p className="text-sm text-muted-foreground">{userData.timezone}</p>
                </div>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
              <CardDescription>Your trading performance at a glance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center space-y-1">
                  <p className="text-2xl font-bold text-primary">{userData.stats.totalTrades}</p>
                  <p className="text-xs text-muted-foreground">Total Trades</p>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-2xl font-bold text-success">
                    {(userData.stats.winRate * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Win Rate</p>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-2xl font-bold text-primary">
                    ${userData.stats.totalPnL.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Total P&L</p>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-2xl font-bold text-warning">
                    {userData.stats.avgEmotionLevel.toFixed(1)}
                  </p>
                  <p className="text-xs text-muted-foreground">Avg Emotion</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Trading Statistics</CardTitle>
                <CardDescription>Detailed breakdown of your trading activity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Trades</span>
                  <Badge variant="outline">{userData.stats.totalTrades}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Win Rate</span>
                  <Badge variant={userData.stats.winRate >= 0.6 ? "default" : "secondary"}>
                    {(userData.stats.winRate * 100).toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total P&L</span>
                  <Badge variant={userData.stats.totalPnL >= 0 ? "default" : "destructive"}>
                    ${userData.stats.totalPnL.toLocaleString()}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Best Streak</span>
                  <Badge variant="outline">{userData.stats.bestStreak} days</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Emotion Tracking</CardTitle>
                <CardDescription>Your emotional awareness statistics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Checks</span>
                  <Badge variant="outline">{userData.stats.totalEmotionChecks}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Average Level</span>
                  <Badge variant="secondary">
                    {userData.stats.avgEmotionLevel.toFixed(1)}/10
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Current Streak</span>
                  <Badge variant="default">{userData.stats.currentStreak} days</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Consistency</span>
                  <Badge variant="default">
                    {((userData.stats.totalEmotionChecks / userData.stats.totalTrades) * 100).toFixed(0)}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Insights</CardTitle>
              <CardDescription>Key metrics about your trading journey</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <h4 className="font-semibold text-green-900">Strong Performance</h4>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Your {(userData.stats.winRate * 100).toFixed(1)}% win rate is above the typical 60% benchmark for successful traders.
                </p>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <h4 className="font-semibold text-blue-900">Consistent Tracking</h4>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  You&apos;ve maintained a {userData.streakCount}-day streak of emotion tracking. Keep building this habit!
                </p>
              </div>

              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-amber-600" />
                  <h4 className="font-semibold text-amber-900">Emotional Awareness</h4>
                </div>
                <p className="text-sm text-amber-700 mt-1">
                  Your average emotion level of {userData.stats.avgEmotionLevel.toFixed(1)} suggests good emotional control during trading.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Account Settings
              </CardTitle>
              <CardDescription>
                Update your account information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              <div className="flex gap-2 pt-4">
                {isEditing ? (
                  <>
                    <Button onClick={handleSave}>Save Changes</Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Actions</CardTitle>
              <CardDescription>
                Manage your account and data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <User className="h-4 w-4 mr-2" />
                Reset Statistics
              </Button>
              
              <Button 
                variant="destructive" 
                className="w-full justify-start"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
