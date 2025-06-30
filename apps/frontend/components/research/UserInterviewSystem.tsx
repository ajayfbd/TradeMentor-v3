'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Calendar, 
  Clock, 
  Users, 
  MessageSquare, 
  PlayCircle, 
  PauseCircle,
  Mic,
  MicOff,
  Video,
  VideoOff,
  FileText,
  Tag,
  Star,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface InterviewSession {
  id: string;
  participantId: string;
  participantName: string;
  scheduledDate: string;
  duration: number; // minutes
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  type: 'discovery' | 'usability' | 'feedback' | 'feature-validation';
  objectives: string[];
  recordingUrl?: string;
  transcriptUrl?: string;
  notes: string;
  insights: InterviewInsight[];
  tags: string[];
}

interface InterviewInsight {
  id: string;
  category: 'pain-point' | 'feature-request' | 'positive-feedback' | 'user-behavior' | 'emotional-response';
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp?: number; // for recording timestamp
  tags: string[];
  quotes: string[];
}

interface InterviewQuestions {
  category: string;
  questions: {
    id: string;
    question: string;
    type: 'open' | 'rating' | 'multiple-choice';
    followUps?: string[];
    purpose: string;
  }[];
}

const defaultQuestions: InterviewQuestions[] = [
  {
    category: 'Trading Background',
    questions: [
      {
        id: 'exp-level',
        question: 'How long have you been day trading?',
        type: 'open',
        purpose: 'Understand experience level and context',
      },
      {
        id: 'trading-style',
        question: 'Describe your typical trading routine and setup',
        type: 'open',
        followUps: [
          'What tools do you currently use?',
          'How do you track your trades?',
          'What\'s your biggest challenge?'
        ],
        purpose: 'Map current workflow and identify integration points',
      },
    ],
  },
  {
    category: 'Emotional Trading Patterns',
    questions: [
      {
        id: 'emotion-awareness',
        question: 'How aware are you of your emotions while trading?',
        type: 'rating',
        purpose: 'Gauge emotional intelligence and self-awareness',
      },
      {
        id: 'emotion-impact',
        question: 'Can you describe a time when emotions affected your trading decisions?',
        type: 'open',
        followUps: [
          'How did you recognize it?',
          'What would have helped in that moment?',
          'Do you have any strategies to manage emotions?'
        ],
        purpose: 'Understand emotional trading patterns and intervention opportunities',
      },
    ],
  },
  {
    category: 'App Experience',
    questions: [
      {
        id: 'first-impression',
        question: 'What was your first impression of TradeMentor?',
        type: 'open',
        purpose: 'Identify initial perception and onboarding effectiveness',
      },
      {
        id: 'core-value',
        question: 'If you had to explain TradeMentor to another trader, what would you say?',
        type: 'open',
        purpose: 'Validate value proposition understanding',
      },
      {
        id: 'feature-usage',
        question: 'Which features do you use most/least and why?',
        type: 'open',
        followUps: [
          'What makes certain features more appealing?',
          'What barriers prevent you from using other features?'
        ],
        purpose: 'Prioritize feature development and identify usability issues',
      },
    ],
  },
  {
    category: 'Habit Formation',
    questions: [
      {
        id: 'habit-integration',
        question: 'How has TradeMentor fit into your daily trading routine?',
        type: 'open',
        purpose: 'Understand habit formation and routine integration',
      },
      {
        id: 'motivation',
        question: 'What motivates you to continue using the app?',
        type: 'open',
        followUps: [
          'What would make you stop using it?',
          'What keeps you engaged?'
        ],
        purpose: 'Identify engagement drivers and retention factors',
      },
    ],
  },
];

const mockSessions: InterviewSession[] = [
  {
    id: '1',
    participantId: 'user-1',
    participantName: 'Sarah Johnson',
    scheduledDate: '2024-01-30T14:00:00Z',
    duration: 30,
    status: 'completed',
    type: 'discovery',
    objectives: [
      'Understand current trading workflow',
      'Identify emotional trading patterns',
      'Validate app value proposition',
    ],
    notes: 'Very experienced trader, uses multiple platforms. Expressed strong interest in pattern recognition features.',
    insights: [
      {
        id: 'insight-1',
        category: 'pain-point',
        description: 'Difficulty correlating emotions with trading performance',
        priority: 'high',
        tags: ['emotions', 'analytics'],
        quotes: ['I know I make emotional decisions but I can\'t see the patterns'],
      },
      {
        id: 'insight-2',
        category: 'feature-request',
        description: 'Wants integration with existing trading platforms',
        priority: 'medium',
        tags: ['integration', 'workflow'],
        quotes: ['It would be amazing if this connected to my TD Ameritrade account'],
      },
    ],
    tags: ['expert-trader', 'pattern-focused', 'integration-needs'],
  },
];

export function UserInterviewSystem() {
  const [sessions] = useState<InterviewSession[]>(mockSessions);
  const [selectedSession, setSelectedSession] = useState<InterviewSession | null>(null);
  const [activeTab, setActiveTab] = useState('schedule');
  const [newInsight, setNewInsight] = useState({
    category: 'pain-point' as InterviewInsight['category'],
    description: '',
    priority: 'medium' as InterviewInsight['priority'],
    tags: [] as string[],
    quotes: [] as string[],
  });

  const handleScheduleInterview = () => {
    // Implementation for scheduling new interviews
    console.log('Schedule new interview');
  };

  const handleStartRecording = () => {
    // Implementation for starting interview recording
    console.log('Start recording');
  };

  const addInsight = () => {
    if (!selectedSession || !newInsight.description.trim()) return;
    
    // Add insight logic here
    console.log('Add insight:', newInsight);
    
    // Reset form
    setNewInsight({
      category: 'pain-point',
      description: '',
      priority: 'medium',
      tags: [],
      quotes: [],
    });
  };

  const getStatusColor = (status: InterviewSession['status']) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: InterviewInsight['category']) => {
    switch (category) {
      case 'pain-point': return 'bg-red-100 text-red-800';
      case 'feature-request': return 'bg-blue-100 text-blue-800';
      case 'positive-feedback': return 'bg-green-100 text-green-800';
      case 'user-behavior': return 'bg-purple-100 text-purple-800';
      case 'emotional-response': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Research Hub</h1>
          <p className="text-gray-600">Conduct interviews and gather deep user insights</p>
        </div>
        <Button onClick={handleScheduleInterview}>
          <Calendar className="w-4 h-4 mr-2" />
          Schedule Interview
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="schedule">Interview Schedule</TabsTrigger>
          <TabsTrigger value="questions">Question Bank</TabsTrigger>
          <TabsTrigger value="insights">Insights Dashboard</TabsTrigger>
          <TabsTrigger value="analysis">Research Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sessions List */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming & Recent Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className={cn(
                        "p-4 border rounded-lg cursor-pointer transition-colors",
                        selectedSession?.id === session.id ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50"
                      )}
                      onClick={() => setSelectedSession(session)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback>
                              {session.participantName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{session.participantName}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(session.scheduledDate).toLocaleDateString()} at{' '}
                              {new Date(session.scheduledDate).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(session.status)}>
                          {session.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{session.type}</Badge>
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{session.duration}min</span>
                        </div>
                      </div>

                      {session.insights.length > 0 && (
                        <div className="mt-2 flex items-center space-x-1">
                          <MessageSquare className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {session.insights.length} insights captured
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Session Details */}
            {selectedSession && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Session Details</CardTitle>
                    {selectedSession.status === 'in-progress' && (
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          <MicOff className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <VideoOff className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="destructive">
                          <PauseCircle className="w-4 h-4 mr-1" />
                          End
                        </Button>
                      </div>
                    )}
                    {selectedSession.status === 'scheduled' && (
                      <Button size="sm" onClick={handleStartRecording}>
                        <PlayCircle className="w-4 h-4 mr-1" />
                        Start
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Objectives</h4>
                    <ul className="space-y-1">
                      {selectedSession.objectives.map((objective, index) => (
                        <li key={index} className="text-sm flex items-start space-x-2">
                          <span className="text-gray-400">•</span>
                          <span>{objective}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Session Notes</h4>
                    <Textarea
                      value={selectedSession.notes}
                      placeholder="Add notes during or after the interview..."
                      rows={4}
                      className="resize-none"
                    />
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Quick Insight Capture</h4>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={newInsight.category}
                          onChange={(e) => setNewInsight(prev => ({ 
                            ...prev, 
                            category: e.target.value as InterviewInsight['category'] 
                          }))}
                          className="border rounded px-3 py-2 text-sm"
                        >
                          <option value="pain-point">Pain Point</option>
                          <option value="feature-request">Feature Request</option>
                          <option value="positive-feedback">Positive Feedback</option>
                          <option value="user-behavior">User Behavior</option>
                          <option value="emotional-response">Emotional Response</option>
                        </select>
                        <select
                          value={newInsight.priority}
                          onChange={(e) => setNewInsight(prev => ({ 
                            ...prev, 
                            priority: e.target.value as InterviewInsight['priority'] 
                          }))}
                          className="border rounded px-3 py-2 text-sm"
                        >
                          <option value="low">Low Priority</option>
                          <option value="medium">Medium Priority</option>
                          <option value="high">High Priority</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                      
                      <Textarea
                        value={newInsight.description}
                        onChange={(e) => setNewInsight(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe the insight..."
                        rows={3}
                        className="resize-none"
                      />
                      
                      <Button onClick={addInsight} size="sm" className="w-full">
                        <Tag className="w-4 h-4 mr-1" />
                        Add Insight
                      </Button>
                    </div>
                  </div>

                  {selectedSession.insights.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Captured Insights</h4>
                      <div className="space-y-2">
                        {selectedSession.insights.map((insight) => (
                          <div key={insight.id} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <Badge className={getCategoryColor(insight.category)}>
                                {insight.category.replace('-', ' ')}
                              </Badge>
                              <Badge variant="outline">
                                {insight.priority}
                              </Badge>
                            </div>
                            <p className="text-sm mb-2">{insight.description}</p>
                            {insight.quotes.length > 0 && (
                              <div className="text-xs text-gray-600 italic">
                                &ldquo;{insight.quotes[0]}&rdquo;
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="questions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Interview Question Bank</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {defaultQuestions.map((category, categoryIndex) => (
                  <div key={categoryIndex}>
                    <h3 className="text-lg font-medium mb-3">{category.category}</h3>
                    <div className="space-y-4 pl-4">
                      {category.questions.map((question) => (
                        <div key={question.id} className="border-l-2 border-gray-200 pl-4">
                          <div className="flex items-start justify-between mb-2">
                            <p className="font-medium">{question.question}</p>
                            <Badge variant="outline">{question.type}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{question.purpose}</p>
                          {question.followUps && (
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-1">Follow-up questions:</p>
                              <ul className="space-y-1">
                                {question.followUps.map((followUp, index) => (
                                  <li key={index} className="text-sm text-gray-600 flex items-start space-x-2">
                                    <span className="text-gray-400">→</span>
                                    <span>{followUp}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Total Insights</p>
                    <p className="text-2xl font-bold">
                      {sessions.reduce((acc, session) => acc + session.insights.length, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="text-sm text-gray-600">High Priority</p>
                    <p className="text-2xl font-bold">
                      {sessions.reduce((acc, session) => 
                        acc + session.insights.filter(i => i.priority === 'high' || i.priority === 'critical').length, 0
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">Pain Points</p>
                    <p className="text-2xl font-bold">
                      {sessions.reduce((acc, session) => 
                        acc + session.insights.filter(i => i.category === 'pain-point').length, 0
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Research Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sessions.flatMap(session => 
                  session.insights.map(insight => ({
                    ...insight,
                    sessionParticipant: session.participantName,
                    sessionDate: session.scheduledDate,
                  }))
                ).map((insight) => (
                  <div key={insight.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge className={getCategoryColor(insight.category)}>
                          {insight.category.replace('-', ' ')}
                        </Badge>
                        <Badge variant="outline">
                          {insight.priority}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {insight.sessionParticipant} • {new Date(insight.sessionDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm mb-2">{insight.description}</p>
                    {insight.quotes.length > 0 && (
                      <div className="bg-gray-50 p-2 rounded text-sm italic text-gray-700">
                        &ldquo;{insight.quotes[0]}&rdquo;
                      </div>
                    )}
                    {insight.tags.length > 0 && (
                      <div className="flex items-center space-x-1 mt-2">
                        {insight.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Research Summary & Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Key Findings</h3>
                  <div className="space-y-2">
                    <div className="p-3 bg-red-50 border border-red-200 rounded">
                      <p className="font-medium text-red-800">Top Pain Point</p>
                      <p className="text-sm text-red-700">Difficulty correlating emotions with trading performance</p>
                    </div>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                      <p className="font-medium text-blue-800">Most Requested Feature</p>
                      <p className="text-sm text-blue-700">Integration with existing trading platforms</p>
                    </div>
                    <div className="p-3 bg-green-50 border border-green-200 rounded">
                      <p className="font-medium text-green-800">Strongest Value Proposition</p>
                      <p className="text-sm text-green-700">Pattern recognition in emotional trading behavior</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-3">Recommended Actions</h3>
                  <div className="space-y-2">
                    <div className="flex items-start space-x-2">
                      <span className="text-red-500 font-bold">1.</span>
                      <span className="text-sm">Enhance analytics dashboard to show emotion-performance correlations</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-orange-500 font-bold">2.</span>
                      <span className="text-sm">Research API integrations with major trading platforms</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-blue-500 font-bold">3.</span>
                      <span className="text-sm">Improve mobile experience based on feedback</span>
                    </div>
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
