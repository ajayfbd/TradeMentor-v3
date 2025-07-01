import React from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useOfflineSync } from '../lib/offline-sync';

interface ConnectionStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({
  className,
  showDetails = false,
  position = 'top-right',
}) => {
  const { syncStatus, triggerSync, clearSyncErrors, isOnline } = useOfflineSync();

  const getStatusColor = () => {
    if (!isOnline) return 'text-red-500 bg-red-50 border-red-200';
    if (syncStatus.isSyncing) return 'text-blue-500 bg-blue-50 border-blue-200';
    if (syncStatus.syncErrors.length > 0) return 'text-yellow-500 bg-yellow-50 border-yellow-200';
    return 'text-green-500 bg-green-50 border-green-200';
  };

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="w-4 h-4" />;
    if (syncStatus.isSyncing) return <RefreshCw className="w-4 h-4 animate-spin" />;
    if (syncStatus.syncErrors.length > 0) return <AlertCircle className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (syncStatus.isSyncing) return 'Syncing...';
    if (syncStatus.syncErrors.length > 0) return 'Sync Issues';
    return 'Online';
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-4 right-4';
    }
  };

  const formatTime = (date: Date | undefined) => {
    if (!date) return 'Never';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      className={cn(
        'fixed z-50 transition-all duration-300',
        getPositionClasses(),
        className
      )}
    >
      {/* Main Status Indicator */}
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg border shadow-lg transition-all',
          getStatusColor(),
          showDetails ? 'rounded-b-none' : ''
        )}
      >
        {getStatusIcon()}
        <span className="text-sm font-medium">{getStatusText()}</span>
        
        {syncStatus.pendingRequests > 0 && (
          <span className="text-xs px-2 py-1 bg-white/80 rounded-full">
            {syncStatus.pendingRequests}
          </span>
        )}
      </div>

      {/* Detailed Status Panel */}
      {showDetails && (
        <div className="bg-white border border-t-0 rounded-b-lg shadow-lg p-4 min-w-[280px]">
          <div className="space-y-3">
            {/* Connection Status */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Connection:</span>
              <div className="flex items-center gap-2">
                {isOnline ? <Wifi className="w-4 h-4 text-green-500" /> : <WifiOff className="w-4 h-4 text-red-500" />}
                <span className={cn('text-sm font-medium', isOnline ? 'text-green-600' : 'text-red-600')}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>

            {/* Last Sync Time */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Last Sync:</span>
              <span className="text-sm">{formatTime(syncStatus.lastSyncTime)}</span>
            </div>

            {/* Pending Requests */}
            {syncStatus.pendingRequests > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pending:</span>
                <span className="text-sm font-medium text-blue-600">
                  {syncStatus.pendingRequests} request{syncStatus.pendingRequests !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            {/* Sync Status */}
            {syncStatus.isSyncing && (
              <div className="flex items-center gap-2 text-blue-600">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-sm">Syncing data...</span>
              </div>
            )}

            {/* Sync Errors */}
            {syncStatus.syncErrors.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Errors:</span>
                  <button
                    onClick={clearSyncErrors}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Clear
                  </button>
                </div>
                <div className="space-y-1">
                  {syncStatus.syncErrors.slice(0, 3).map((error, index) => (
                    <div
                      key={index}
                      className="text-xs text-red-600 bg-red-50 p-2 rounded border"
                    >
                      {error}
                    </div>
                  ))}
                  {syncStatus.syncErrors.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{syncStatus.syncErrors.length - 3} more errors
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2 border-t">
              <button
                onClick={triggerSync}
                disabled={!isOnline || syncStatus.isSyncing}
                className={cn(
                  'flex-1 px-3 py-2 text-sm rounded transition-colors',
                  isOnline && !syncStatus.isSyncing
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                )}
              >
                {syncStatus.isSyncing ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Compact version for minimal UI footprint
export const CompactConnectionIndicator: React.FC<{
  className?: string;
}> = ({ className }) => {
  const { isOnline, syncStatus } = useOfflineSync();

  return (
    <div
      className={cn(
        'flex items-center gap-1',
        className
      )}
    >
      {isOnline ? (
        <Wifi className="w-4 h-4 text-green-500" />
      ) : (
        <WifiOff className="w-4 h-4 text-red-500" />
      )}
      
      {syncStatus.pendingRequests > 0 && (
        <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full">
          {syncStatus.pendingRequests}
        </span>
      )}
      
      {syncStatus.isSyncing && (
        <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />
      )}
    </div>
  );
};

// Toast notification component for connection changes
export const ConnectionToast: React.FC<{
  show: boolean;
  isOnline: boolean;
  onClose: () => void;
}> = ({ show, isOnline, onClose }) => {
  React.useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-2">
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border',
          isOnline
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        )}
      >
        {isOnline ? (
          <CheckCircle className="w-5 h-5 text-green-600" />
        ) : (
          <WifiOff className="w-5 h-5 text-red-600" />
        )}
        
        <div>
          <div className="font-medium">
            {isOnline ? 'Back online!' : 'Connection lost'}
          </div>
          <div className="text-sm">
            {isOnline
              ? 'Your data will now sync automatically.'
              : 'Your changes will be saved and synced when reconnected.'
            }
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>
    </div>
  );
};

// Hook for managing connection toast notifications
export const useConnectionToast = () => {
  const { isOnline } = useOfflineSync();
  const [showToast, setShowToast] = React.useState(false);
  const [wasOffline, setWasOffline] = React.useState(false);

  React.useEffect(() => {
    if (wasOffline && isOnline) {
      // Coming back online
      setShowToast(true);
    } else if (!wasOffline && !isOnline) {
      // Going offline
      setShowToast(true);
    }
    
    setWasOffline(!isOnline);
  }, [isOnline, wasOffline]);

  return {
    showToast,
    isOnline,
    hideToast: () => setShowToast(false),
  };
};
