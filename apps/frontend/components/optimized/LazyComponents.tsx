'use client';

import { lazy, Suspense } from 'react';
import { ErrorBoundary } from '@/components/ui/error-boundary';

// Lazy load heavy components
const BreathingGuide = lazy(() => 
  import('@/components/ui/breathing-guide').then(module => ({ default: module.BreathingGuide }))
);

// Loading skeleton for heavy components
function ComponentSkeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded-lg h-48 ${className || ''}`}>
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        <div className="h-32 bg-gray-300 rounded"></div>
      </div>
    </div>
  );
}

// Optimized components with error boundaries and loading states
export function OptimizedBreathingGuide(props: any) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<ComponentSkeleton className="bg-gradient-to-br from-blue-50 to-indigo-50" />}>
        <BreathingGuide {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}
