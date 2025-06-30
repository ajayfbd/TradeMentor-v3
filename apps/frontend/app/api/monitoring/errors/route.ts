import { NextRequest, NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/security/api-middleware';

interface ErrorReport {
  id: string;
  timestamp: string;
  type: string;
  message: string;
  source?: string;
  stack?: string;
  url: string;
  userAgent: string;
  userId?: string;
  sessionId: string;
  browserInfo: any;
  performanceInfo?: any;
  additionalContext?: any;
}

interface ErrorBatch {
  reports: ErrorReport[];
}

async function handleErrorReports(request: NextRequest) {
  try {
    const body: ErrorBatch = await request.json();
    
    // Validate the error reports
    if (!body.reports || !Array.isArray(body.reports)) {
      return NextResponse.json(
        { error: 'Invalid error reports format' },
        { status: 400 }
      );
    }

    console.log(`Received ${body.reports.length} error reports`);

    // Process each error report
    for (const report of body.reports) {
      await processErrorReport(report);
    }

    return NextResponse.json({ 
      success: true, 
      processed: body.reports.length 
    });

  } catch (error) {
    console.error('Failed to process error reports:', error);
    return NextResponse.json(
      { error: 'Failed to process error reports' },
      { status: 500 }
    );
  }
}

async function processErrorReport(report: ErrorReport) {
  // Log the error
  console.error('Client Error Report:', {
    id: report.id,
    type: report.type,
    message: report.message,
    url: report.url,
    userId: report.userId,
    timestamp: report.timestamp,
  });

  // In production, you would:
  // 1. Send to error tracking service (Sentry, Bugsnag, etc.)
  // 2. Store in database for analysis
  // 3. Alert on critical errors
  // 4. Update metrics dashboards

  // Example: Send to external monitoring service
  if (process.env.NODE_ENV === 'production') {
    try {
      // await sendToMonitoringService(report);
    } catch (error) {
      console.error('Failed to send error to monitoring service:', error);
    }
  }

  // Example: Store critical errors in database
  if (report.type === 'javascript' && report.stack?.includes('ChunkLoadError')) {
    console.warn('Critical deployment error detected - possible bad deployment');
    // Alert development team
  }
}

// Export the handler with security middleware
export const POST = createApiHandler(handleErrorReports, {
  requireAuth: false, // Public endpoint for error reporting
  rateLimit: true,
  cors: true,
  methods: ['POST'],
});
