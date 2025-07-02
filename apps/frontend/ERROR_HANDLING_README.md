# Error Handling and Monitoring System

A comprehensive error handling and monitoring system for TradeMentor-v3, providing production-ready error tracking, performance monitoring, and user-friendly error reporting.

## Features

- 🚨 **Global Error Monitoring** - Automatic capture and reporting of all errors
- 📊 **Performance Monitoring** - Core Web Vitals tracking and performance issue detection
- 🛡️ **Error Boundaries** - React error boundaries with fallback UI at multiple levels
- 🍞 **Toast Notifications** - User-friendly error messages with automatic handling
- 🔧 **Development Support** - Enhanced debugging and error details in development
- 📤 **Backend Integration** - Automatic error and performance data reporting

## Quick Start

### 1. Initialize the System

```tsx
// In your main app file (e.g., _app.tsx or layout.tsx)
import { initializeMonitoring, AppWithErrorHandling } from './examples/error-handling-integration';

// Initialize monitoring early
initializeMonitoring();

function MyApp({ Component, pageProps }) {
  return (
    <AppWithErrorHandling>
      <Component {...pageProps} />
    </AppWithErrorHandling>
  );
}
```

### 2. Wrap Components with Error Boundaries

```tsx
import ErrorBoundary, { withErrorBoundary } from './components/ErrorBoundary';

// Method 1: HOC wrapper (recommended for single components)
const SafeComponent = withErrorBoundary(MyComponent, {
  level: 'component',
  showErrorDetails: true
});

// Method 2: Direct wrapping (recommended for page sections)
function MyPage() {
  return (
    <ErrorBoundary level="page">
      <PageContent />
    </ErrorBoundary>
  );
}
```

### 3. Use Toast Notifications

```tsx
import { useToast } from './components/ToastManager';

function MyComponent() {
  const { showError, showSuccess, showWarning, showInfo } = useToast();
  
  const handleAction = async () => {
    try {
      await someAsyncOperation();
      showSuccess('Success!', 'Operation completed successfully');
    } catch (error) {
      showError('Operation Failed', 'Please try again later');
    }
  };
}
```

## Core Components

### Error Monitoring (`lib/error-monitoring.ts`)

Central service for capturing and reporting errors:

```tsx
import { errorMonitoring } from './lib/error-monitoring';

// Manual error reporting
errorMonitoring.captureException(error, {
  source: 'api-call',
  endpoint: '/api/users'
});

// Capture messages
errorMonitoring.captureMessage('User action completed', {
  userId: 'user-123',
  action: 'profile-update'
}, 'info');

// Initialize with user context
errorMonitoring.initialize('user-id');
```

### Performance Monitoring (`lib/performance-monitoring.ts`)

Tracks Core Web Vitals and custom performance metrics:

```tsx
import { performanceMonitoring } from './lib/performance-monitoring';

// Measure API calls
const mark = performanceMonitoring.measureApiCall('/api/data', 'GET');
mark.start();
// ... make API call
mark.end(200); // HTTP status code

// Custom performance marks
performanceMonitoring.startMark('heavy-computation');
// ... do work
performanceMonitoring.endMark('heavy-computation');

// Get current metrics
const metrics = performanceMonitoring.getMetrics();
console.log('LCP:', metrics.lcp, 'FID:', metrics.fid);
```

### Error Boundaries (`components/ErrorBoundary.tsx`)

React error boundaries with multiple levels:

```tsx
// Critical level - for app-level errors
<ErrorBoundary level="critical" showErrorDetails={false}>
  <App />
</ErrorBoundary>

// Page level - for page-specific errors
<ErrorBoundary level="page" onError={(error, info) => logError(error)}>
  <PageContent />
</ErrorBoundary>

// Component level - for individual component errors
<ErrorBoundary level="component" showErrorDetails={true}>
  <SpecificComponent />
</ErrorBoundary>
```

### Toast System (`components/ToastManager.tsx`)

User-friendly notifications with automatic error handling:

```tsx
// Programmatic usage
import { toast } from './components/ToastManager';

toast.error('Error!', 'Something went wrong');
toast.success('Success!', 'Operation completed');
toast.warning('Warning!', 'Please check your input');
toast.info('Info', 'Here\'s some information');

// With actions
toast.error('Connection Error', 'Check your internet', {
  action: {
    label: 'Retry',
    onClick: () => retryOperation()
  },
  duration: 0 // Persistent until dismissed
});
```

## Error Boundary Levels

### Critical Level
- Used for app-level errors that affect the entire application
- Shows "Critical Error" message
- Provides error ID for support
- Logs with 'error' severity

### Page Level  
- Used for page-specific errors
- Shows "Page Error" message
- Allows retry functionality
- Logs with 'warning' severity

### Component Level
- Used for individual component errors
- Shows "Component Error" message
- Shows detailed error info in development
- Logs with 'info' severity

## User-Friendly Error Messages

The system automatically converts technical errors into user-friendly messages:

- **Network errors** → "Connection Problem" with troubleshooting tips
- **Chunk load errors** → "Loading Error" with refresh suggestion
- **401/403 errors** → Authentication/permission messages
- **500 errors** → "Server Error" with retry suggestion
- **Validation errors** → "Invalid Input" with correction guidance

## Development vs Production

### Development Mode
- Shows detailed error information
- Displays error stacks and technical details
- Console logging for debugging
- Enhanced error boundaries with debug info

### Production Mode
- User-friendly error messages only
- Error details hidden from users
- Comprehensive error reporting to backend
- Graceful degradation

## Performance Monitoring

### Core Web Vitals
- **LCP** (Largest Contentful Paint) - Loading performance
- **FID** (First Input Delay) - Interactivity
- **CLS** (Cumulative Layout Shift) - Visual stability
- **TTFB** (Time to First Byte) - Server response
- **FCP** (First Contentful Paint) - Rendering start

### Custom Metrics
- API call performance tracking
- Component render times
- User interaction delays
- Memory usage monitoring

### Performance Thresholds
- **Slow**: 1000ms+ operations
- **Very Slow**: 3000ms+ operations
- Automatic performance issue reporting
- Network condition awareness

## Backend Integration

### Error Reporting Endpoint
```
POST /api/monitoring/errors
```

### Performance Metrics Endpoint
```
POST /api/monitoring/metrics
```

### Data Format
The system sends structured data including:
- Error details and stack traces
- User context and session info
- Performance measurements
- Browser and device information

## Error Deduplication

The system prevents spam by:
- Deduplicating identical errors within 5 minutes
- Rate limiting error reports (max 10/minute)
- Intelligent error grouping
- Queue management for offline scenarios

## Best Practices

### 1. Error Boundary Placement
```tsx
// ✅ Good: Multiple levels of error boundaries
<ErrorBoundary level="critical">
  <App>
    <ErrorBoundary level="page">
      <Router>
        <ErrorBoundary level="component">
          <SpecificFeature />
        </ErrorBoundary>
      </Router>
    </ErrorBoundary>
  </App>
</ErrorBoundary>

// ❌ Bad: Single error boundary for everything
<ErrorBoundary level="critical">
  <EntireApp />
</ErrorBoundary>
```

### 2. Error Context
```tsx
// ✅ Good: Provide context for debugging
errorMonitoring.captureException(error, {
  userId: user.id,
  action: 'profile-update',
  endpoint: '/api/users/profile',
  formData: sanitizedFormData
});

// ❌ Bad: No context
errorMonitoring.captureException(error);
```

### 3. Performance Measurements
```tsx
// ✅ Good: Measure important operations
const mark = performanceMonitoring.measureApiCall(url, method);
mark.start();
const result = await apiCall();
mark.end(response.status);

// ❌ Bad: No performance tracking
await apiCall();
```

### 4. Toast Usage
```tsx
// ✅ Good: User-friendly messages
showError('Save Failed', 'Your changes couldn\'t be saved. Please try again.');

// ❌ Bad: Technical error messages
showError('Error', 'TypeError: Cannot read property \'name\' of undefined');
```

## Testing Error Handling

The system includes test utilities for development:

```tsx
// Trigger different error types for testing
<button onClick={() => {
  // Test error boundary
  throw new Error('Test error boundary');
}}>Test Error Boundary</button>

<button onClick={() => {
  // Test async error
  setTimeout(() => {
    throw new Error('Test async error');
  }, 1000);
}}>Test Async Error</button>

<button onClick={() => {
  // Test performance monitoring
  performanceMonitoring.startMark('test-operation');
  setTimeout(() => {
    performanceMonitoring.endMark('test-operation');
  }, 2000);
}}>Test Performance</button>
```

## Monitoring Dashboard

The error monitoring system provides data for building dashboards to track:

- Error frequency and trends
- Performance degradation alerts
- User impact analysis
- Error resolution tracking
- Performance optimization opportunities

## Configuration

### Environment Variables
```env
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_ERROR_REPORTING_URL=/api/monitoring/errors
NEXT_PUBLIC_METRICS_REPORTING_URL=/api/monitoring/metrics
```

### Customization
All components support extensive customization through props and configuration options. See individual component documentation for detailed configuration options.

## Browser Support

- **Modern browsers**: Full feature support including Web Vitals
- **Legacy browsers**: Graceful degradation with fallback performance monitoring
- **Mobile browsers**: Optimized for mobile performance tracking
- **Offline support**: Queue management for offline error reporting

This error handling system provides a production-ready foundation for monitoring and improving the reliability and performance of TradeMentor-v3.
