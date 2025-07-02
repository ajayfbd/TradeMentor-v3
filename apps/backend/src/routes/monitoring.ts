// Backend API endpoint for error reporting
// File: apps/backend/src/routes/monitoring.ts

import { Request, Response } from 'express';
import { z } from 'zod';

// Validation schemas
const ErrorReportSchema = z.object({
  message: z.string(),
  stack: z.string().optional(),
  severity: z.enum(['error', 'warning', 'info']),
  context: z.record(z.any()).optional(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  userAgent: z.string().optional(),
  url: z.string().optional(),
  timestamp: z.string(),
  fingerprint: z.string().optional()
});

const PerformanceReportSchema = z.object({
  name: z.string(),
  value: z.number(),
  url: z.string(),
  timestamp: z.string(),
  metadata: z.record(z.any()).optional()
});

// Error reporting endpoint
export const reportError = async (req: Request, res: Response) => {
  try {
    const errorData = ErrorReportSchema.parse(req.body);
    
    // Log error to console (in production, use proper logging service)
    console.error('[Error Report]', {
      message: errorData.message,
      severity: errorData.severity,
      userId: errorData.userId,
      url: errorData.url,
      timestamp: errorData.timestamp,
      context: errorData.context
    });
    
    // Store error in database
    // await errorRepository.create({
    //   message: errorData.message,
    //   stack: errorData.stack,
    //   severity: errorData.severity,
    //   context: errorData.context,
    //   userId: errorData.userId,
    //   sessionId: errorData.sessionId,
    //   userAgent: errorData.userAgent,
    //   url: errorData.url,
    //   timestamp: new Date(errorData.timestamp),
    //   fingerprint: errorData.fingerprint
    // });
    
    // Send to external monitoring service (Sentry, LogRocket, etc.)
    // await externalMonitoringService.report(errorData);
    
    // Check if this is a critical error that needs immediate attention
    if (errorData.severity === 'error') {
      // Send alerts to team (email, Slack, etc.)
      // await alertingService.sendAlert(errorData);
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Error report received' 
    });
    
  } catch (error) {
    console.error('Failed to process error report:', error);
    res.status(400).json({ 
      success: false, 
      message: 'Invalid error report format' 
    });
  }
};

// Performance metrics endpoint
export const reportMetrics = async (req: Request, res: Response) => {
  try {
    const metricsData = PerformanceReportSchema.parse(req.body);
    
    // Log metrics (in production, use proper metrics service)
    console.log('[Performance Metric]', {
      name: metricsData.name,
      value: metricsData.value,
      url: metricsData.url,
      timestamp: metricsData.timestamp,
      metadata: metricsData.metadata
    });
    
    // Store metrics in database or time-series database
    // await metricsRepository.create({
    //   name: metricsData.name,
    //   value: metricsData.value,
    //   url: metricsData.url,
    //   timestamp: new Date(metricsData.timestamp),
    //   metadata: metricsData.metadata
    // });
    
    // Send to external analytics service
    // await analyticsService.track(metricsData);
    
    // Check for performance degradation
    if (metricsData.name === 'PageLoad' && metricsData.value > 5000) {
      // Alert on slow page loads
      console.warn('Slow page load detected:', metricsData);
    }
    
    if (metricsData.name === 'LCP' && metricsData.value > 4000) {
      // Alert on poor LCP scores
      console.warn('Poor LCP detected:', metricsData);
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Metrics received' 
    });
    
  } catch (error) {
    console.error('Failed to process metrics report:', error);
    res.status(400).json({ 
      success: false, 
      message: 'Invalid metrics format' 
    });
  }
};

// Health check endpoint
export const healthCheck = async (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0'
  });
};

// Get error statistics (for dashboard)
export const getErrorStats = async (req: Request, res: Response) => {
  try {
    // In a real implementation, query your database for error statistics
    const stats = {
      totalErrors: 0, // await errorRepository.count()
      errorsByDay: [], // await errorRepository.getErrorsByDay()
      errorsBySeverity: {
        error: 0,
        warning: 0,
        info: 0
      },
      topErrors: [], // await errorRepository.getTopErrors()
      affectedUsers: 0 // await errorRepository.getUniqueUsers()
    };
    
    res.status(200).json(stats);
  } catch (error) {
    console.error('Failed to get error stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve error statistics' 
    });
  }
};

// Get performance statistics (for dashboard)
export const getPerformanceStats = async (req: Request, res: Response) => {
  try {
    // In a real implementation, query your metrics database
    const stats = {
      averagePageLoad: 0, // await metricsRepository.getAveragePageLoad()
      webVitals: {
        lcp: { p50: 0, p75: 0, p95: 0 },
        fid: { p50: 0, p75: 0, p95: 0 },
        cls: { p50: 0, p75: 0, p95: 0 }
      },
      slowestPages: [], // await metricsRepository.getSlowestPages()
      performanceTrends: [] // await metricsRepository.getPerformanceTrends()
    };
    
    res.status(200).json(stats);
  } catch (error) {
    console.error('Failed to get performance stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve performance statistics' 
    });
  }
};
