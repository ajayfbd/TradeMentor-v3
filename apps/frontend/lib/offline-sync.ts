import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState, useCallback } from 'react';
import { apiClient, api } from './api-client';
import { 
  prefetchEmotionChecks, 
  prefetchTrades, 
  prefetchInsights,
  useCreateEmotionCheck,
  useCreateTrade,
  useCreateOrUpdateSession,
} from './query-hooks';

// Types for offline data management
interface OfflineRequest {
  config: any;
  timestamp: number;
  retryCount?: number;
  type: 'emotion' | 'trade' | 'session' | 'other';
  data?: any;
}

interface OfflineData {
  emotions: any[];
  trades: any[];
  sessions: any[];
  lastSync?: number;
}

interface SyncStatus {
  isOnline: boolean;
  lastSyncTime?: Date;
  pendingRequests: number;
  isSyncing: boolean;
  syncErrors: string[];
}

// Constants
const STORAGE_KEYS = {
  OFFLINE_REQUESTS: 'tradementor_offline_requests',
  OFFLINE_DATA: 'tradementor_offline_data',
  LAST_SYNC: 'tradementor_last_sync',
} as const;

const MAX_RETRY_ATTEMPTS = 3;
const SYNC_INTERVAL = 30000; // 30 seconds
const MAX_OFFLINE_STORAGE_DAYS = 7;

// ============================================================================
// OFFLINE STORAGE UTILITIES
// ============================================================================

export const OfflineStorage = {
  // Get stored offline requests
  getOfflineRequests(): OfflineRequest[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.OFFLINE_REQUESTS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get offline requests:', error);
      return [];
    }
  },

  // Store offline request
  addOfflineRequest(request: OfflineRequest): void {
    if (typeof window === 'undefined') return;
    
    try {
      const requests = this.getOfflineRequests();
      requests.push({
        ...request,
        timestamp: Date.now(),
        retryCount: 0,
      });
      
      // Clean old requests (older than MAX_OFFLINE_STORAGE_DAYS)
      const cutoffTime = Date.now() - (MAX_OFFLINE_STORAGE_DAYS * 24 * 60 * 60 * 1000);
      const cleanedRequests = requests.filter(req => req.timestamp > cutoffTime);
      
      localStorage.setItem(STORAGE_KEYS.OFFLINE_REQUESTS, JSON.stringify(cleanedRequests));
    } catch (error) {
      console.error('Failed to store offline request:', error);
    }
  },

  // Remove offline request
  removeOfflineRequest(timestamp: number): void {
    if (typeof window === 'undefined') return;
    
    try {
      const requests = this.getOfflineRequests();
      const filtered = requests.filter(req => req.timestamp !== timestamp);
      localStorage.setItem(STORAGE_KEYS.OFFLINE_REQUESTS, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to remove offline request:', error);
    }
  },

  // Clear all offline requests
  clearOfflineRequests(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.OFFLINE_REQUESTS);
  },

  // Get offline data cache
  getOfflineData(): OfflineData {
    if (typeof window === 'undefined') return { emotions: [], trades: [], sessions: [] };
    
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.OFFLINE_DATA);
      return stored ? JSON.parse(stored) : { emotions: [], trades: [], sessions: [] };
    } catch (error) {
      console.error('Failed to get offline data:', error);
      return { emotions: [], trades: [], sessions: [] };
    }
  },

  // Store offline data cache
  setOfflineData(data: OfflineData): void {
    if (typeof window === 'undefined') return;
    
    try {
      const dataWithTimestamp = {
        ...data,
        lastSync: Date.now(),
      };
      localStorage.setItem(STORAGE_KEYS.OFFLINE_DATA, JSON.stringify(dataWithTimestamp));
    } catch (error) {
      console.error('Failed to store offline data:', error);
    }
  },

  // Update specific offline data
  updateOfflineEmotions(emotions: any[]): void {
    const data = this.getOfflineData();
    data.emotions = emotions;
    this.setOfflineData(data);
  },

  updateOfflineTrades(trades: any[]): void {
    const data = this.getOfflineData();
    data.trades = trades;
    this.setOfflineData(data);
  },

  updateOfflineSessions(sessions: any[]): void {
    const data = this.getOfflineData();
    data.sessions = sessions;
    this.setOfflineData(data);
  },
};

// ============================================================================
// CONNECTION STATUS HOOK
// ============================================================================

export const useConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(
    typeof window !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

// ============================================================================
// OFFLINE SYNC HOOK
// ============================================================================

export const useOfflineSync = () => {
  const queryClient = useQueryClient();
  const isOnline = useConnectionStatus();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline,
    pendingRequests: 0,
    isSyncing: false,
    syncErrors: [],
  });
  
  const syncIntervalRef = useRef<NodeJS.Timeout>();
  const createEmotionMutation = useCreateEmotionCheck();
  const createTradeMutation = useCreateTrade();
  const createSessionMutation = useCreateOrUpdateSession();

  // Sync pending offline requests
  const syncOfflineRequests = useCallback(async (): Promise<void> => {
    if (!isOnline) return;

    const pendingRequests = OfflineStorage.getOfflineRequests();
    if (pendingRequests.length === 0) return;

    setSyncStatus(prev => ({ 
      ...prev, 
      isSyncing: true, 
      pendingRequests: pendingRequests.length,
      syncErrors: [],
    }));

    const errors: string[] = [];

    for (const request of pendingRequests) {
      try {
        // Skip if max retry attempts reached
        if ((request.retryCount || 0) >= MAX_RETRY_ATTEMPTS) {
          errors.push(`Request failed after ${MAX_RETRY_ATTEMPTS} attempts`);
          OfflineStorage.removeOfflineRequest(request.timestamp);
          continue;
        }

        // Execute request based on type
        await executeOfflineRequest(request);
        
        // Remove successful request
        OfflineStorage.removeOfflineRequest(request.timestamp);
        
      } catch (error) {
        console.error('Failed to sync offline request:', error);
        
        // Increment retry count
        const updatedRequests = OfflineStorage.getOfflineRequests().map(req => 
          req.timestamp === request.timestamp 
            ? { ...req, retryCount: (req.retryCount || 0) + 1 }
            : req
        );
        
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            STORAGE_KEYS.OFFLINE_REQUESTS, 
            JSON.stringify(updatedRequests)
          );
        }
        
        errors.push(error instanceof Error ? error.message : 'Unknown error');
      }
    }

    setSyncStatus(prev => ({
      ...prev,
      isSyncing: false,
      lastSyncTime: new Date(),
      pendingRequests: OfflineStorage.getOfflineRequests().length,
      syncErrors: errors,
    }));
  }, [isOnline]);

  // Execute individual offline request
  const executeOfflineRequest = async (request: OfflineRequest): Promise<void> => {
    switch (request.type) {
      case 'emotion':
        if (request.data) {
          await apiClient.createEmotionCheck(request.data);
        }
        break;
        
      case 'trade':
        if (request.data) {
          await apiClient.createTrade(request.data);
        }
        break;
        
      case 'session':
        if (request.data) {
          await apiClient.createOrUpdateSession(request.data);
        }
        break;
        default:
        // Generic request execution using the enhanced api client
        if (request.config) {
          const { method = 'GET', url, data } = request.config;
          
          switch (method.toUpperCase()) {
            case 'POST':
              await api.post(url, data);
              break;
            case 'PUT':
              await api.put(url, data);
              break;
            case 'DELETE':
              await api.delete(url);
              break;
            default:
              await api.get(url);
          }
        }
    }
  };

  // Prefetch data when coming online
  const refreshDataOnOnline = useCallback(async (): Promise<void> => {
    if (!isOnline) return;

    try {
      await Promise.all([
        prefetchEmotionChecks(queryClient),
        prefetchTrades(queryClient),
        prefetchInsights(queryClient),
      ]);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  }, [isOnline, queryClient]);

  // Update sync status when online status changes
  useEffect(() => {
    setSyncStatus(prev => ({ ...prev, isOnline }));

    if (isOnline) {
      // Sync pending requests and refresh data
      syncOfflineRequests();
      refreshDataOnOnline();
    }
  }, [isOnline, syncOfflineRequests, refreshDataOnOnline]);

  // Set up periodic sync when online
  useEffect(() => {
    if (isOnline && typeof window !== 'undefined') {
      syncIntervalRef.current = setInterval(() => {
        syncOfflineRequests();
      }, SYNC_INTERVAL);
    } else {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    }

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [isOnline, syncOfflineRequests]);

  // Manual sync trigger
  const triggerSync = async (): Promise<void> => {
    if (isOnline) {
      await syncOfflineRequests();
      await refreshDataOnOnline();
    }
  };

  // Clear sync errors
  const clearSyncErrors = (): void => {
    setSyncStatus(prev => ({ ...prev, syncErrors: [] }));
  };

  return {
    syncStatus,
    triggerSync,
    clearSyncErrors,
    isOnline,
  };
};

// ============================================================================
// OFFLINE-FIRST HOOKS
// ============================================================================

// Enhanced emotion check hook with offline support
export const useOfflineEmotionCheck = () => {
  const createEmotionMutation = useCreateEmotionCheck();
  const isOnline = useConnectionStatus();

  const createEmotionOffline = async (data: any) => {
    if (isOnline) {
      // Online: use normal mutation
      return createEmotionMutation.mutateAsync(data);
    } else {
      // Offline: store for later sync
      OfflineStorage.addOfflineRequest({
        type: 'emotion',
        data,
        config: {
          url: '/emotion',
          method: 'POST',
          data,
        },
        timestamp: Date.now(),
      });

      // Update offline cache optimistically
      const offlineData = OfflineStorage.getOfflineData();
      const newEmotion = {
        id: `offline_${Date.now()}`,
        ...data,
        timestamp: new Date().toISOString(),
        isOffline: true,
      };
      
      offlineData.emotions.unshift(newEmotion);
      OfflineStorage.updateOfflineEmotions(offlineData.emotions);

      // Dispatch offline event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app:offline-emotion-created', {
          detail: newEmotion,
        }));
      }

      return newEmotion;
    }
  };

  return {
    createEmotion: createEmotionOffline,
    isLoading: createEmotionMutation.isPending,
    error: createEmotionMutation.error,
    isOffline: !isOnline,
  };
};

// Enhanced trade hook with offline support
export const useOfflineTrade = () => {
  const createTradeMutation = useCreateTrade();
  const isOnline = useConnectionStatus();

  const createTradeOffline = async (data: any) => {
    if (isOnline) {
      // Online: use normal mutation
      return createTradeMutation.mutateAsync(data);
    } else {
      // Offline: store for later sync
      OfflineStorage.addOfflineRequest({
        type: 'trade',
        data,
        config: {
          url: '/trade',
          method: 'POST',
          data,
        },
        timestamp: Date.now(),
      });

      // Update offline cache optimistically
      const offlineData = OfflineStorage.getOfflineData();
      const newTrade = {
        id: `offline_${Date.now()}`,
        ...data,
        timestamp: new Date().toISOString(),
        isOffline: true,
      };
      
      offlineData.trades.unshift(newTrade);
      OfflineStorage.updateOfflineTrades(offlineData.trades);

      // Dispatch offline event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app:offline-trade-created', {
          detail: newTrade,
        }));
      }

      return newTrade;
    }
  };

  return {
    createTrade: createTradeOffline,
    isLoading: createTradeMutation.isPending,
    error: createTradeMutation.error,
    isOffline: !isOnline,
  };
};

// ============================================================================
// BACKGROUND SYNC SERVICE
// ============================================================================

export class BackgroundSyncService {
  private static instance: BackgroundSyncService;
  private queryClient: any;
  private syncInterval?: NodeJS.Timeout;
  private isRunning = false;

  private constructor() {}

  static getInstance(): BackgroundSyncService {
    if (!BackgroundSyncService.instance) {
      BackgroundSyncService.instance = new BackgroundSyncService();
    }
    return BackgroundSyncService.instance;
  }

  init(queryClient: any): void {
    this.queryClient = queryClient;
    this.startBackgroundSync();
  }

  private startBackgroundSync(): void {
    if (this.isRunning || typeof window === 'undefined') return;

    this.isRunning = true;

    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Start periodic sync
    this.syncInterval = setInterval(() => {
      if (navigator.onLine) {
        this.performBackgroundSync();
      }
    }, SYNC_INTERVAL);
  }

  private handleOnline(): void {
    console.log('Connection restored, syncing data...');
    this.performBackgroundSync();
  }

  private handleOffline(): void {
    console.log('Connection lost, enabling offline mode...');
  }

  private async performBackgroundSync(): Promise<void> {
    if (!navigator.onLine || !this.queryClient) return;

    try {
      // Sync pending requests
      const pendingRequests = OfflineStorage.getOfflineRequests();
      
      for (const request of pendingRequests) {
        try {
          // Execute request logic here
          OfflineStorage.removeOfflineRequest(request.timestamp);
        } catch (error) {
          console.error('Background sync failed for request:', error);
        }
      }

      // Refresh critical data
      await Promise.all([
        prefetchEmotionChecks(this.queryClient),
        prefetchTrades(this.queryClient),
        prefetchInsights(this.queryClient),
      ]);

    } catch (error) {
      console.error('Background sync failed:', error);
    }
  }

  stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline.bind(this));
      window.removeEventListener('offline', this.handleOffline.bind(this));
    }
    
    this.isRunning = false;
  }
}

// ============================================================================
// OFFLINE DATA PROVIDER
// ============================================================================

export const OfflineDataProvider = {
  // Get offline emotions (for use when offline)
  getOfflineEmotions(): any[] {
    const data = OfflineStorage.getOfflineData();
    return data.emotions || [];
  },

  // Get offline trades (for use when offline)
  getOfflineTrades(): any[] {
    const data = OfflineStorage.getOfflineData();
    return data.trades || [];
  },

  // Get offline sessions (for use when offline)
  getOfflineSessions(): any[] {
    const data = OfflineStorage.getOfflineData();
    return data.sessions || [];
  },

  // Check if data is available offline
  hasOfflineData(): boolean {
    const data = OfflineStorage.getOfflineData();
    return (
      data.emotions.length > 0 || 
      data.trades.length > 0 || 
      data.sessions.length > 0
    );
  },

  // Get last sync time
  getLastSyncTime(): Date | null {
    const data = OfflineStorage.getOfflineData();
    return data.lastSync ? new Date(data.lastSync) : null;
  },
};
