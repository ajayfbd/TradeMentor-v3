'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEmotionStore } from '@/lib/emotion-store';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Clock, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export function OfflineIndicator() {
  const { isOnline, pendingEntries, syncPendingEntries } = useEmotionStore();
  const pendingCount = pendingEntries.length;

  if (isOnline && pendingCount === 0) {
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        <Wifi className="h-3 w-3 mr-1" />
        Online
      </Badge>
    );
  }

  if (!isOnline) {
    return (
      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
        <WifiOff className="h-3 w-3 mr-1" />
        Offline Mode
      </Badge>
    );
  }

  if (pendingCount > 0) {
    return (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
        <Clock className="h-3 w-3 mr-1" />
        {pendingCount} Pending
      </Badge>
    );
  }

  return null;
}

export function OfflineStatusCard() {
  const { isOnline, pendingEntries, syncPendingEntries } = useEmotionStore();
  const pendingCount = pendingEntries.length;

  const handleSync = async () => {
    try {
      await syncPendingEntries();
    } catch (error) {
      console.error('Failed to sync pending entries:', error);
    }
  };

  // Don't show card if online and no pending entries
  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      {/* Offline Mode */}
      {!isOnline && (
        <div className="flex items-center space-x-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <WifiOff className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-900">
              You&apos;re offline
            </p>
            <p className="text-sm text-amber-700">
              Your emotion checks will be saved locally and synced when you&apos;re back online.
            </p>
          </div>
        </div>
      )}

      {/* Pending Sync */}
      {isOnline && pendingCount > 0 && (
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-3">
            <Clock className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-900">
                {pendingCount} emotion check{pendingCount > 1 ? 's' : ''} pending sync
              </p>
              <p className="text-sm text-blue-700">
                These will be automatically synced to your account.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            className="bg-white border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync Now
          </Button>
        </div>
      )}

      {/* Sync Success (show briefly) */}
      {isOnline && pendingCount === 0 && (
        <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-700">
            All emotion checks synced successfully
          </p>
        </div>
      )}
    </div>
  );
}

export function PendingEntriesList() {
  const { pendingEntries, removePendingEntry } = useEmotionStore();

  if (pendingEntries.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground">
        Pending Emotion Checks ({pendingEntries.length})
      </h4>
      <div className="space-y-2">
        {pendingEntries.map((entry) => (
          <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
                {entry.level}
              </div>
              <div>
                <p className="text-sm font-medium capitalize">
                  {entry.context.replace('-', ' ')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {entry.symbol && `${entry.symbol} • `}
                  Level {entry.level}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Pending
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removePendingEntry(entry.id)}
                className="h-6 w-6 p-0"
              >
                ✕
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
