import React, { PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BackgroundSyncService } from '../lib/offline-sync';

// Enhanced Query Client configuration with offline support
const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Stale time: how long data is considered fresh
        staleTime: 5 * 60 * 1000, // 5 minutes
        
        // Cache time: how long data stays in cache when unused
        gcTime: 30 * 60 * 1000, // 30 minutes (was cacheTime in v4)
        
        // Retry configuration for failed requests
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors (client errors)
          if (error && typeof error === 'object' && 'status' in error) {
            const status = (error as any).status;
            if (status >= 400 && status < 500) return false;
          }
          
          // Retry up to 3 times for network errors and 5xx errors
          return failureCount < 3;
        },
        
        // Retry delay with exponential backoff
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        
        // Background refetch configuration
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchOnMount: true,
        
        // Network mode for offline support
        networkMode: 'offlineFirst',
      },
      mutations: {
        // Retry configuration for mutations
        retry: (failureCount, error) => {
          // Check if error indicates offline state
          if (error && typeof error === 'object' && 'isOffline' in error) {
            return false; // Don't retry offline errors - they'll be handled by sync
          }
          
          // Don't retry on 4xx errors
          if (error && typeof error === 'object' && 'status' in error) {
            const status = (error as any).status;
            if (status >= 400 && status < 500) return false;
          }
          
          // Retry up to 2 times for other errors
          return failureCount < 2;
        },
        
        // Retry delay for mutations
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
        
        // Network mode for offline support
        networkMode: 'offlineFirst',
      },
    },
  });
};

// Background sync initialization component
const BackgroundSyncInitializer: React.FC = () => {
  const queryClient = useQueryClient();

  React.useEffect(() => {
    // Initialize background sync service
    const syncService = BackgroundSyncService.getInstance();
    syncService.init(queryClient);

    return () => {
      syncService.stop();
    };
  }, [queryClient]);

  return null;
};

// Offline data preloader component
const OfflineDataPreloader: React.FC = () => {
  const queryClient = useQueryClient();

  React.useEffect(() => {
    // Preload critical data for offline use
    const preloadData = async () => {
      if (typeof window !== 'undefined' && navigator.onLine) {
        try {
          // Prefetch most important data
          await Promise.allSettled([
            queryClient.prefetchQuery({
              queryKey: ['emotions'],
              queryFn: () => import('../lib/api-client').then(({ apiClient }) => 
                apiClient.getEmotionChecks(20, 0)
              ),
              staleTime: 10 * 60 * 1000, // 10 minutes
            }),
            queryClient.prefetchQuery({
              queryKey: ['trades'],
              queryFn: () => import('../lib/api-client').then(({ apiClient }) => 
                apiClient.getTrades(20, 0)
              ),
              staleTime: 10 * 60 * 1000, // 10 minutes
            }),
            queryClient.prefetchQuery({
              queryKey: ['insights', 'top'],
              queryFn: () => import('../lib/api-client').then(({ apiClient }) => 
                apiClient.getTopInsights(5)
              ),
              staleTime: 15 * 60 * 1000, // 15 minutes
            }),
          ]);
        } catch (error) {
          console.warn('Failed to preload offline data:', error);
        }
      }
    };

    preloadData();
  }, [queryClient]);

  return null;
};

// Custom error boundary for query errors
class QueryErrorBoundary extends React.Component<
  PropsWithChildren<{ fallback?: React.ComponentType<{ error: Error; resetError: () => void }> }>,
  { hasError: boolean; error?: Error }
> {
  constructor(props: PropsWithChildren<{ fallback?: React.ComponentType<{ error: Error; resetError: () => void }> }>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Query error boundary caught an error:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

// Default error fallback component
const DefaultErrorFallback: React.FC<{ error: Error; resetError: () => void }> = ({
  error,
  resetError,
}) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
        <svg
          className="w-6 h-6 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>
      
      <div className="mt-4 text-center">
        <h3 className="text-lg font-medium text-gray-900">Something went wrong</h3>
        <p className="mt-2 text-sm text-gray-500">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
      </div>
      
      <div className="mt-6">
        <button
          onClick={resetError}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  </div>
);

// Main Enhanced Query Provider
interface EnhancedQueryProviderProps {
  children: React.ReactNode;
  client?: QueryClient;
  enableDevtools?: boolean;
  errorFallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

export const EnhancedQueryProvider: React.FC<EnhancedQueryProviderProps> = ({
  children,
  client,
  enableDevtools = process.env.NODE_ENV === 'development',
  errorFallback,
}) => {
  const [queryClient] = React.useState(() => client || createQueryClient());

  return (
    <QueryErrorBoundary fallback={errorFallback}>
      <QueryClientProvider client={queryClient}>
        <BackgroundSyncInitializer />
        <OfflineDataPreloader />
        {children}
        {enableDevtools && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </QueryErrorBoundary>
  );
};

// Hook for accessing query client with offline utilities
export const useEnhancedQueryClient = () => {
  const queryClient = useQueryClient();

  const invalidateWithOfflineSupport = React.useCallback(
    (queryKey: any[]) => {
      if (navigator.onLine) {
        return queryClient.invalidateQueries({ queryKey });
      } else {
        // Store invalidation for when we come back online
        const pendingInvalidations = JSON.parse(
          localStorage.getItem('pendingInvalidations') || '[]'
        );
        pendingInvalidations.push({ queryKey, timestamp: Date.now() });
        localStorage.setItem('pendingInvalidations', JSON.stringify(pendingInvalidations));
      }
    },
    [queryClient]
  );

  const resetWithOfflineSupport = React.useCallback(
    (queryKey?: any[]) => {
      if (navigator.onLine) {
        return queryClient.resetQueries({ queryKey });
      } else {
        // Store reset for when we come back online
        const pendingResets = JSON.parse(
          localStorage.getItem('pendingResets') || '[]'
        );
        pendingResets.push({ queryKey, timestamp: Date.now() });
        localStorage.setItem('pendingResets', JSON.stringify(pendingResets));
      }
    },
    [queryClient]
  );

  const processPendingUpdates = React.useCallback(async () => {
    if (!navigator.onLine) return;

    try {
      // Process pending invalidations
      const pendingInvalidations = JSON.parse(
        localStorage.getItem('pendingInvalidations') || '[]'
      );
      
      for (const { queryKey } of pendingInvalidations) {
        await queryClient.invalidateQueries({ queryKey });
      }
      
      localStorage.removeItem('pendingInvalidations');

      // Process pending resets
      const pendingResets = JSON.parse(
        localStorage.getItem('pendingResets') || '[]'
      );
      
      for (const { queryKey } of pendingResets) {
        await queryClient.resetQueries({ queryKey });
      }
      
      localStorage.removeItem('pendingResets');
    } catch (error) {
      console.error('Failed to process pending updates:', error);
    }
  }, [queryClient]);

  React.useEffect(() => {
    // Process pending updates when coming online
    const handleOnline = () => {
      processPendingUpdates();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [processPendingUpdates]);

  return {
    ...queryClient,
    invalidateWithOfflineSupport,
    resetWithOfflineSupport,
    processPendingUpdates,
  };
};

// Utility function to check if data is stale and needs refresh
export const shouldRefreshData = (lastFetch?: Date, staleTime = 5 * 60 * 1000): boolean => {
  if (!lastFetch) return true;
  return Date.now() - lastFetch.getTime() > staleTime;
};

// Utility function to merge offline and online data
export const mergeOfflineOnlineData = <T extends { id: string; isOffline?: boolean }>(
  onlineData: T[],
  offlineData: T[]
): T[] => {
  const merged = [...onlineData];
  
  // Add offline items that aren't duplicated online
  offlineData.forEach(offlineItem => {
    const existsOnline = merged.some(onlineItem => 
      onlineItem.id === offlineItem.id || 
      onlineItem.id.replace('offline_', '') === offlineItem.id.replace('offline_', '')
    );
    
    if (!existsOnline) {
      merged.unshift(offlineItem);
    }
  });
  
  return merged;
};

export default EnhancedQueryProvider;
