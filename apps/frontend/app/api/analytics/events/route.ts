import { NextRequest, NextResponse } from 'next/server';

interface AnalyticsEvent {
  userId?: string;
  sessionId: string;
  event: string;
  properties: Record<string, any>;
  timestamp: number;
  page: string;
  userAgent: string;
}

interface AnalyticsBatch {
  events: AnalyticsEvent[];
}

// In-memory storage for demo - replace with database/analytics service
const analyticsStore: AnalyticsEvent[] = [];

export async function POST(request: NextRequest) {
  try {
    const batch: AnalyticsBatch = await request.json();

    if (!batch.events || !Array.isArray(batch.events)) {
      return NextResponse.json(
        { error: 'Events array is required' },
        { status: 400 }
      );
    }

    // Validate each event
    for (const event of batch.events) {
      if (!event.event || !event.sessionId || !event.timestamp) {
        return NextResponse.json(
          { error: 'Invalid event format' },
          { status: 400 }
        );
      }
    }

    // Store events
    analyticsStore.push(...batch.events);

    // Keep only recent events (last 10k events)
    if (analyticsStore.length > 10000) {
      analyticsStore.splice(0, analyticsStore.length - 10000);
    }

    // Log important events for monitoring
    const importantEvents = batch.events.filter(e => 
      ['emotion_check_completed', 'trade_logged', 'flow_completed', 'error_encountered'].includes(e.event)
    );

    if (importantEvents.length > 0) {
      console.log('Important analytics events:', importantEvents.map(e => ({
        event: e.event,
        userId: e.userId,
        properties: e.properties,
      })));
    }

    return NextResponse.json({
      success: true,
      eventsProcessed: batch.events.length,
      message: 'Events logged successfully',
    });

  } catch (error) {
    console.error('Error processing analytics events:', error);
    return NextResponse.json(
      { error: 'Failed to process events' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const event = searchParams.get('event');
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');

    let filteredEvents = [...analyticsStore];

    // Apply filters
    if (event) {
      filteredEvents = filteredEvents.filter(e => e.event === event);
    }

    if (userId) {
      filteredEvents = filteredEvents.filter(e => e.userId === userId);
    }

    if (sessionId) {
      filteredEvents = filteredEvents.filter(e => e.sessionId === sessionId);
    }

    if (startDate) {
      const start = new Date(startDate).getTime();
      filteredEvents = filteredEvents.filter(e => e.timestamp >= start);
    }

    if (endDate) {
      const end = new Date(endDate).getTime();
      filteredEvents = filteredEvents.filter(e => e.timestamp <= end);
    }

    // Sort by timestamp (newest first)
    filteredEvents.sort((a, b) => b.timestamp - a.timestamp);

    // Limit results
    filteredEvents = filteredEvents.slice(0, limit);

    // Calculate metrics
    const uniqueUsers = new Set(analyticsStore.filter(e => e.userId).map(e => e.userId)).size;
    const uniqueSessions = new Set(analyticsStore.map(e => e.sessionId)).size;
    
    const eventCounts = analyticsStore.reduce((acc, event) => {
      acc[event.event] = (acc[event.event] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate daily active users (last 7 days)
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const recentUsers = new Set(
      analyticsStore
        .filter(e => e.timestamp > sevenDaysAgo && e.userId)
        .map(e => e.userId)
    ).size;

    // Calculate key metrics
    const emotionChecks = analyticsStore.filter(e => e.event === 'emotion_check_completed').length;
    const tradesLogged = analyticsStore.filter(e => e.event === 'trade_logged').length;
    const flowsCompleted = analyticsStore.filter(e => e.event === 'flow_completed').length;
    const errors = analyticsStore.filter(e => e.event === 'error_encountered').length;

    const metrics = {
      totalEvents: analyticsStore.length,
      uniqueUsers,
      uniqueSessions,
      dailyActiveUsers: recentUsers,
      eventCounts,
      keyMetrics: {
        emotionChecks,
        tradesLogged,
        flowsCompleted,
        errors,
        emotionCheckRate: uniqueUsers > 0 ? (emotionChecks / uniqueUsers).toFixed(2) : '0',
        tradeLoggingAdoption: uniqueUsers > 0 ? ((tradesLogged > 0 ? 1 : 0) * 100).toFixed(0) + '%' : '0%',
      },
    };

    return NextResponse.json({
      events: filteredEvents,
      metrics,
      pagination: {
        total: analyticsStore.length,
        filtered: filteredEvents.length,
        limit,
      },
    });

  } catch (error) {
    console.error('Error retrieving analytics:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve analytics' },
      { status: 500 }
    );
  }
}
