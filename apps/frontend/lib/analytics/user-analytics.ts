import React from 'react';

interface UserEvent {
  userId?: string;
  sessionId: string;
  event: string;
  properties: Record<string, any>;
  timestamp: number;
  page: string;
  userAgent: string;
}

interface UserMetrics {
  dailyActiveUsers: number;
  emotionCheckCompletionRate: number;
  tradeLoggingAdoption: number;
  averageTimeToCompleteFlow: number;
  userRetentionDay7: number;
  netPromoterScore: number;
}

class UserAnalytics {
  private static instance: UserAnalytics;
  private sessionId: string;
  private userId?: string;
  private events: UserEvent[] = [];
  private startTime: number = Date.now();
  private batchSize = 10;
  private flushInterval = 30000; // 30 seconds
  private userJourney: string[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.sessionId = this.generateSessionId();
      this.loadUserData();
      this.startPeriodicFlush();
      this.setupUserJourneyTracking();
      this.trackPageView();
    } else {
      this.sessionId = 'server';
    }
  }

  static getInstance(): UserAnalytics {
    if (!UserAnalytics.instance) {
      UserAnalytics.instance = new UserAnalytics();
    }
    return UserAnalytics.instance;
  }

  setUserId(userId: string): void {
    this.userId = userId;
    if (typeof window !== 'undefined') {
      localStorage.setItem('userId', userId);
    }
  }

  private generateSessionId(): string {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('sessionId', sessionId);
    return sessionId;
  }

  private loadUserData(): void {
    try {
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId) {
        this.userId = storedUserId;
      }

      const storedSessionId = sessionStorage.getItem('sessionId');
      if (storedSessionId) {
        this.sessionId = storedSessionId;
      }

      const storedJourney = sessionStorage.getItem('userJourney');
      if (storedJourney) {
        this.userJourney = JSON.parse(storedJourney);
      }
    } catch (error) {
      console.warn('Failed to load user data:', error);
    }
  }

  private setupUserJourneyTracking(): void {
    // Track page changes
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      UserAnalytics.getInstance().trackPageView();
    };

    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      UserAnalytics.getInstance().trackPageView();
    };

    window.addEventListener('popstate', () => {
      this.trackPageView();
    });
  }

  private trackPageView(): void {
    const page = window.location.pathname;
    this.userJourney.push(page);
    
    // Keep only last 20 pages
    if (this.userJourney.length > 20) {
      this.userJourney = this.userJourney.slice(-20);
    }
    
    sessionStorage.setItem('userJourney', JSON.stringify(this.userJourney));
    
    this.track('page_view', {
      page,
      referrer: document.referrer,
      title: document.title,
    });
  }

  track(event: string, properties: Record<string, any> = {}): void {
    const userEvent: UserEvent = {
      userId: this.userId,
      sessionId: this.sessionId,
      event,
      properties: {
        ...properties,
        userJourney: [...this.userJourney],
      },
      timestamp: Date.now(),
      page: typeof window !== 'undefined' ? window.location.pathname : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    };

    this.events.push(userEvent);

    // Flush if batch is full
    if (this.events.length >= this.batchSize) {
      this.flush();
    }

    // Dispatch custom event for other components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('user:action', {
        detail: { action: event, properties }
      }));
    }
  }

  // Core metrics tracking methods
  trackEmotionCheck(emotion: string, intensity: number): void {
    this.track('emotion_check_completed', {
      emotion,
      intensity,
      duration: Date.now() - this.startTime,
    });
  }

  trackTradeLog(tradeData: any): void {
    this.track('trade_logged', {
      symbol: tradeData.symbol,
      action: tradeData.action,
      hasEmotions: !!tradeData.emotions,
      hasNotes: !!tradeData.notes,
    });
  }

  trackFlowCompletion(flowName: string, stepCount: number, duration: number): void {
    this.track('flow_completed', {
      flowName,
      stepCount,
      duration,
      completionRate: 1,
    });
  }

  trackFlowAbandonment(flowName: string, lastStep: string, duration: number): void {
    this.track('flow_abandoned', {
      flowName,
      lastStep,
      duration,
      completionRate: 0,
    });
  }

  trackFeatureUsage(feature: string, context?: string): void {
    this.track('feature_used', {
      feature,
      context,
      sessionDuration: Date.now() - this.startTime,
    });
  }

  trackError(error: string, context?: string): void {
    this.track('error_encountered', {
      error,
      context,
      page: window.location.pathname,
    });
  }

  trackUserFeedback(type: string, rating?: number): void {
    this.track('feedback_submitted', {
      type,
      rating,
      page: window.location.pathname,
    });
  }

  // Performance tracking
  trackPerformance(metric: string, value: number, context?: string): void {
    this.track('performance_metric', {
      metric,
      value,
      context,
    });
  }

  // A/B testing support
  trackExperiment(experimentName: string, variant: string): void {
    this.track('experiment_exposure', {
      experimentName,
      variant,
    });
  }

  private async flush(): Promise<void> {
    if (this.events.length === 0) return;

    const eventsToFlush = [...this.events];
    this.events = [];

    try {
      const response = await fetch('/api/analytics/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events: eventsToFlush }),
      });

      if (!response.ok) {
        // Re-add events to queue if failed
        this.events.unshift(...eventsToFlush);
        console.warn('Failed to flush analytics events');
      }
    } catch (error) {
      // Re-add events to queue if failed
      this.events.unshift(...eventsToFlush);
      console.warn('Analytics flush error:', error);
    }
  }

  private startPeriodicFlush(): void {
    setInterval(() => {
      this.flush();
    }, this.flushInterval);

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      if (this.events.length > 0) {
        // Use sendBeacon for reliable delivery
        navigator.sendBeacon('/api/analytics/events', JSON.stringify({
          events: this.events
        }));
      }
    });
  }

  // Get current session metrics
  getSessionMetrics(): Record<string, any> {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      sessionDuration: Date.now() - this.startTime,
      pageViews: this.userJourney.length,
      currentPage: typeof window !== 'undefined' ? window.location.pathname : '',
      eventsQueued: this.events.length,
    };
  }
}

// Analytics hooks for React components
export function useAnalytics() {
  const analytics = UserAnalytics.getInstance();

  return {
    track: analytics.track.bind(analytics),
    trackEmotionCheck: analytics.trackEmotionCheck.bind(analytics),
    trackTradeLog: analytics.trackTradeLog.bind(analytics),
    trackFlowCompletion: analytics.trackFlowCompletion.bind(analytics),
    trackFlowAbandonment: analytics.trackFlowAbandonment.bind(analytics),
    trackFeatureUsage: analytics.trackFeatureUsage.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    trackUserFeedback: analytics.trackUserFeedback.bind(analytics),
    trackPerformance: analytics.trackPerformance.bind(analytics),
    trackExperiment: analytics.trackExperiment.bind(analytics),
    setUserId: analytics.setUserId.bind(analytics),
    getSessionMetrics: analytics.getSessionMetrics.bind(analytics),
  };
}

// HOC for automatic component tracking
export function withAnalytics<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  componentName: string
): React.ComponentType<T> {
  return function AnalyticsWrappedComponent(props: T) {
    const analytics = useAnalytics();

    React.useEffect(() => {
      analytics.track('component_mounted', {
        componentName,
        page: window.location.pathname,
      });

      return () => {
        analytics.track('component_unmounted', {
          componentName,
          page: window.location.pathname,
        });
      };
    }, [analytics]);

    return React.createElement(Component, props);
  };
}

export default UserAnalytics;
