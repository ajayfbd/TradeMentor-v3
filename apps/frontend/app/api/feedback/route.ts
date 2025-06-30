import { NextRequest, NextResponse } from 'next/server';
import { ErrorTrackingService } from '@/lib/monitoring/error-tracking';

interface FeedbackSubmission {
  type: 'bug' | 'feature' | 'general' | 'rating';
  rating?: number;
  message: string;
  context: {
    page: string;
    userAgent: string;
    timestamp: string;
    userId?: string;
    sessionId: string;
    userJourney: string[];
  };
}

// In-memory storage for demo - replace with database
const feedbackStore: (FeedbackSubmission & { id: string; status: 'new' | 'reviewed' | 'resolved' })[] = [];

export async function POST(request: NextRequest) {
  try {
    const feedback: FeedbackSubmission = await request.json();

    // Validate feedback data
    if (!feedback.message?.trim() && feedback.type !== 'rating') {
      return NextResponse.json(
        { error: 'Message is required for non-rating feedback' },
        { status: 400 }
      );
    }

    if (feedback.type === 'rating' && !feedback.rating) {
      return NextResponse.json(
        { error: 'Rating is required for rating feedback' },
        { status: 400 }
      );
    }

    // Generate unique ID
    const feedbackId = `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store feedback
    const storedFeedback = {
      ...feedback,
      id: feedbackId,
      status: 'new' as const,
    };

    feedbackStore.push(storedFeedback);

    // Track the feedback submission for analytics
    console.log('Feedback submitted:', {
      feedbackId,
      type: feedback.type,
      rating: feedback.rating,
      hasMessage: !!feedback.message?.trim(),
      page: feedback.context.page,
      userId: feedback.context.userId,
    });

    // For critical bugs or low ratings, trigger alerts
    if (feedback.type === 'bug' || (feedback.rating && feedback.rating <= 2)) {
      // In production, this would trigger alerts to the team
      console.warn('Critical feedback received:', {
        id: feedbackId,
        type: feedback.type,
        rating: feedback.rating,
        message: feedback.message.substring(0, 100),
      });
    }

    return NextResponse.json({
      success: true,
      feedbackId,
      message: 'Thank you for your feedback!',
    });

  } catch (error) {
    console.error('Error processing feedback:', error);

    return NextResponse.json(
      { error: 'Failed to process feedback' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');

    let filteredFeedback = [...feedbackStore];

    // Apply filters
    if (status) {
      filteredFeedback = filteredFeedback.filter(f => f.status === status);
    }

    if (type) {
      filteredFeedback = filteredFeedback.filter(f => f.type === type);
    }

    // Sort by timestamp (newest first)
    filteredFeedback.sort((a, b) => 
      new Date(b.context.timestamp).getTime() - new Date(a.context.timestamp).getTime()
    );

    // Limit results
    filteredFeedback = filteredFeedback.slice(0, limit);

    // Calculate summary statistics
    const summary = {
      total: feedbackStore.length,
      byType: {
        bug: feedbackStore.filter(f => f.type === 'bug').length,
        feature: feedbackStore.filter(f => f.type === 'feature').length,
        general: feedbackStore.filter(f => f.type === 'general').length,
        rating: feedbackStore.filter(f => f.type === 'rating').length,
      },
      byStatus: {
        new: feedbackStore.filter(f => f.status === 'new').length,
        reviewed: feedbackStore.filter(f => f.status === 'reviewed').length,
        resolved: feedbackStore.filter(f => f.status === 'resolved').length,
      },
      averageRating: feedbackStore
        .filter(f => f.type === 'rating' && f.rating)
        .reduce((acc, f, _, arr) => acc + (f.rating! / arr.length), 0) || 0,
    };

    return NextResponse.json({
      feedback: filteredFeedback,
      summary,
      pagination: {
        total: feedbackStore.length,
        filtered: filteredFeedback.length,
        limit,
      },
    });

  } catch (error) {
    console.error('Error retrieving feedback:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve feedback' },
      { status: 500 }
    );
  }
}

// Update feedback status (for admin interface)
export async function PATCH(request: NextRequest) {
  try {
    const { id, status } = await request.json();

    const feedbackIndex = feedbackStore.findIndex(f => f.id === id);
    if (feedbackIndex === -1) {
      return NextResponse.json(
        { error: 'Feedback not found' },
        { status: 404 }
      );
    }

    feedbackStore[feedbackIndex].status = status;

    return NextResponse.json({
      success: true,
      feedback: feedbackStore[feedbackIndex],
    });

  } catch (error) {
    console.error('Error updating feedback:', error);
    return NextResponse.json(
      { error: 'Failed to update feedback' },
      { status: 500 }
    );
  }
}
