'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  Calendar, 
  MessageSquare, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  BarChart3,
  Target,
  Star
} from 'lucide-react';

interface BetaTester {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  experience: 'beginner' | 'intermediate' | 'expert';
  joinedAt: string;
  status: 'active' | 'inactive' | 'completed';
  metrics: {
    loginDays: number;
    emotionChecks: number;
    tradesLogged: number;
    sessionsCompleted: number;
    feedbackSubmitted: number;
    lastActive: string;
  };
  testingObjectives: string[];
  completedObjectives: string[];
}

interface TestingCycle {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  objectives: string[];
  testers: string[];
  status: 'planning' | 'active' | 'completed';
  metrics: {
    participationRate: number;
    objectiveCompletion: number;
    averageRating: number;
    criticalIssues: number;
  };
}

const mockBetaTesters: BetaTester[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    experience: 'expert',
    joinedAt: '2024-01-15',
    status: 'active',
    metrics: {
      loginDays: 12,
      emotionChecks: 45,
      tradesLogged: 28,
      sessionsCompleted: 15,
      feedbackSubmitted: 8,
      lastActive: '2024-01-27',
    },
    testingObjectives: [
      'Test emotion tracking during volatile markets',
      'Validate trade logging workflow',
      'Assess pattern recognition features',
    ],
    completedObjectives: [
      'Test emotion tracking during volatile markets',
      'Validate trade logging workflow',
    ],
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'michael@example.com',
    experience: 'intermediate',
    joinedAt: '2024-01-18',
    status: 'active',
    metrics: {
      loginDays: 8,
      emotionChecks: 32,
      tradesLogged: 15,
      sessionsCompleted: 10,
      feedbackSubmitted: 5,
      lastActive: '2024-01-26',
    },
    testingObjectives: [
      'Test onboarding flow for new users',
      'Validate mobile responsiveness',
      'Test notification preferences',
    ],
    completedObjectives: [
      'Test onboarding flow for new users',
    ],
  },
];

const mockTestingCycles: TestingCycle[] = [
  {
    id: '1',
    name: 'Alpha Release - Core Features',
    startDate: '2024-01-15',
    endDate: '2024-01-29',
    objectives: [
      'Validate emotion tracking accuracy',
      'Test trade logging completeness',
      'Assess user onboarding experience',
      'Verify mobile responsiveness',
    ],
    testers: ['1', '2'],
    status: 'active',
    metrics: {
      participationRate: 85,
      objectiveCompletion: 65,
      averageRating: 4.2,
      criticalIssues: 2,
    },
  },
];

export function BetaTestingDashboard() {
  const [testers, setTesters] = useState<BetaTester[]>(mockBetaTesters);
  const [cycles, setCycles] = useState<TestingCycle[]>(mockTestingCycles);
  const [selectedCycle, setSelectedCycle] = useState<TestingCycle>(cycles[0]);

  const overallMetrics = {
    totalTesters: testers.length,
    activeTesters: testers.filter(t => t.status === 'active').length,
    averageEngagement: Math.round(
      testers.reduce((acc, t) => acc + t.metrics.loginDays, 0) / testers.length
    ),
    completionRate: Math.round(
      testers.reduce((acc, t) => 
        acc + (t.completedObjectives.length / t.testingObjectives.length), 0
      ) / testers.length * 100
    ),
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Beta Testing Dashboard</h1>
          <p className="text-gray-600">Monitor user testing progress and gather insights</p>
        </div>
        <Button>
          <Users className="w-4 h-4 mr-2" />
          Invite Testers
        </Button>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Testers</p>
                <p className="text-2xl font-bold">{overallMetrics.totalTesters}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Active Testers</p>
                <p className="text-2xl font-bold">{overallMetrics.activeTesters}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Avg Engagement</p>
                <p className="text-2xl font-bold">{overallMetrics.averageEngagement} days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold">{overallMetrics.completionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="testers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="testers">Beta Testers</TabsTrigger>
          <TabsTrigger value="cycles">Testing Cycles</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="testers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Beta Testers Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {testers.map((tester) => (
                  <div key={tester.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={tester.avatar} />
                        <AvatarFallback>
                          {tester.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium">{tester.name}</h3>
                          <Badge variant={
                            tester.experience === 'expert' ? 'default' :
                            tester.experience === 'intermediate' ? 'secondary' : 'outline'
                          }>
                            {tester.experience}
                          </Badge>
                          <Badge variant={tester.status === 'active' ? 'default' : 'secondary'}>
                            {tester.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{tester.email}</p>
                        <p className="text-xs text-gray-500">
                          Last active: {new Date(tester.metrics.lastActive).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Login Days:</span>
                          <span className="ml-1 font-medium">{tester.metrics.loginDays}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Emotions:</span>
                          <span className="ml-1 font-medium">{tester.metrics.emotionChecks}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Trades:</span>
                          <span className="ml-1 font-medium">{tester.metrics.tradesLogged}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Feedback:</span>
                          <span className="ml-1 font-medium">{tester.metrics.feedbackSubmitted}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-sm text-gray-600">Progress:</span>
                        <Progress 
                          value={(tester.completedObjectives.length / tester.testingObjectives.length) * 100}
                          className="w-20"
                        />
                        <span className="text-sm font-medium">
                          {tester.completedObjectives.length}/{tester.testingObjectives.length}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cycles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Testing Cycles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cycles.map((cycle) => (
                  <div key={cycle.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-medium">{cycle.name}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(cycle.startDate).toLocaleDateString()} - {new Date(cycle.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={
                        cycle.status === 'active' ? 'default' :
                        cycle.status === 'completed' ? 'secondary' : 'outline'
                      }>
                        {cycle.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-500">{cycle.metrics.participationRate}%</p>
                        <p className="text-sm text-gray-600">Participation</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-500">{cycle.metrics.objectiveCompletion}%</p>
                        <p className="text-sm text-gray-600">Completion</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-500">{cycle.metrics.averageRating}</p>
                        <p className="text-sm text-gray-600">Avg Rating</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-500">{cycle.metrics.criticalIssues}</p>
                        <p className="text-sm text-gray-600">Critical Issues</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Testing Objectives:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {cycle.objectives.map((objective, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm">{objective}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Daily Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border rounded">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Chart visualization would go here</p>
                    <p className="text-sm text-gray-500">Integration with analytics service needed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Feature Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Emotion Check</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={85} className="w-24" />
                      <span className="text-sm font-medium">85%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Trade Logging</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={72} className="w-24" />
                      <span className="text-sm font-medium">72%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Pattern Recognition</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={58} className="w-24" />
                      <span className="text-sm font-medium">58%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Journal Notes</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={43} className="w-24" />
                      <span className="text-sm font-medium">43%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Key Metrics Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-500 mb-1">3.2</div>
                  <div className="text-sm text-gray-600">Avg Emotion Checks/Day</div>
                  <div className="text-xs text-gray-500">Target: 3+</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-500 mb-1">68%</div>
                  <div className="text-sm text-gray-600">7-Day Retention</div>
                  <div className="text-xs text-gray-500">Target: 40%</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-500 mb-1">4.2</div>
                  <div className="text-sm text-gray-600">Net Promoter Score</div>
                  <div className="text-xs text-gray-500">Target: 7+</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>SJ</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">Sarah Johnson</p>
                        <p className="text-xs text-gray-500">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm mb-2">
                    The emotion tracking feature is really helpful! I can see patterns in my trading behavior that I never noticed before. The interface is intuitive and doesn&apos;t feel intrusive.
                  </p>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">feature</Badge>
                    <Badge variant="outline">emotion-tracking</Badge>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>MC</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">Michael Chen</p>
                        <p className="text-xs text-gray-500">1 day ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4].map((star) => (
                        <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                      <Star className="w-4 h-4 text-gray-300" />
                    </div>
                  </div>
                  <p className="text-sm mb-2">
                    The mobile experience needs work. Some buttons are too small and the charts are hard to read on phone. Desktop version is great though!
                  </p>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">bug</Badge>
                    <Badge variant="outline">mobile</Badge>
                    <Badge variant="outline">ui</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
