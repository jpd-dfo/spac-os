/**
 * SPAC OS - Real-time Notification Stream Hook
 * Connects to SSE endpoint for real-time compliance alerts and notifications
 *
 * Features:
 * - Automatic reconnection with exponential backoff
 * - Graceful fallback to polling if SSE fails
 * - Connection state management
 * - TypeScript-safe event handling
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { trpc } from '@/lib/trpc';

// Event types matching the SSE endpoint
export type NotificationEventType =
  | 'connected'
  | 'alert'
  | 'alert_count'
  | 'filing_status'
  | 'heartbeat'
  | 'error';

export interface NotificationEvent {
  type: NotificationEventType;
  data: unknown;
  timestamp: string;
}

export interface AlertNotification {
  id: string;
  title: string;
  description: string;
  type: string;
  severity: 'high' | 'medium' | 'low';
  spacId: string | null;
  spac: {
    id: string;
    name: string;
    ticker: string | null;
  } | null;
  createdAt: string;
}

export interface NotificationStreamState {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  lastHeartbeat: Date | null;

  // Notification state
  unreadCount: number;
  recentAlerts: AlertNotification[];

  // Methods
  reconnect: () => void;
  markAlertSeen: (alertId: string) => void;
  clearRecentAlerts: () => void;
}

export interface UseNotificationStreamOptions {
  // Filter notifications to a specific SPAC
  spacId?: string;
  // Enable/disable the stream (useful for conditional connection)
  enabled?: boolean;
  // Callback when a new alert arrives
  onNewAlert?: (alert: AlertNotification) => void;
  // Callback when unread count changes
  onCountChange?: (newCount: number, previousCount: number) => void;
  // Maximum reconnection attempts before falling back to polling
  maxReconnectAttempts?: number;
  // Enable debug logging
  debug?: boolean;
}

const DEFAULT_OPTIONS: Required<Omit<UseNotificationStreamOptions, 'spacId' | 'onNewAlert' | 'onCountChange'>> = {
  enabled: true,
  maxReconnectAttempts: 5,
  debug: false,
};

export function useNotificationStream(
  options: UseNotificationStreamOptions = {}
): NotificationStreamState {
  const {
    spacId,
    enabled = DEFAULT_OPTIONS.enabled,
    onNewAlert,
    onCountChange,
    maxReconnectAttempts = DEFAULT_OPTIONS.maxReconnectAttempts,
    debug = DEFAULT_OPTIONS.debug,
  } = options;

  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [lastHeartbeat, setLastHeartbeat] = useState<Date | null>(null);

  // Notification state
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentAlerts, setRecentAlerts] = useState<AlertNotification[]>([]);

  // Refs for connection management
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFallbackModeRef = useRef(false);

  // tRPC for fallback polling
  const trpcUtils = trpc.useUtils();
  const { data: polledUnreadData } = trpc.alert.getUnreadCount.useQuery(
    spacId ? { spacId } : undefined,
    {
      // Only poll if SSE is not connected (fallback mode)
      enabled: enabled && isFallbackModeRef.current,
      refetchInterval: isFallbackModeRef.current ? 10000 : false, // 10 second polling in fallback
    }
  );

  // Update unread count from polling fallback
  useEffect(() => {
    if (isFallbackModeRef.current && polledUnreadData) {
      const newCount = polledUnreadData.count;
      if (newCount !== unreadCount) {
        onCountChange?.(newCount, unreadCount);
        setUnreadCount(newCount);
      }
    }
  }, [polledUnreadData, unreadCount, onCountChange]);

  // Debug logger
  const log = useCallback(
    (message: string, ...args: unknown[]) => {
      if (debug) {
        // eslint-disable-next-line no-console
        console.log(`[NotificationStream] ${message}`, ...args);
      }
    },
    [debug]
  );

  // Calculate reconnection delay with exponential backoff
  const getReconnectDelay = useCallback(() => {
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const delay = Math.min(
      baseDelay * Math.pow(2, reconnectAttemptsRef.current),
      maxDelay
    );
    return delay;
  }, []);

  // Connect to SSE endpoint
  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setIsConnecting(true);
    setConnectionError(null);

    const url = spacId
      ? `/api/notifications/stream?spacId=${encodeURIComponent(spacId)}`
      : '/api/notifications/stream';

    log('Connecting to SSE endpoint:', url);

    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    // Handle connection open
    eventSource.onopen = () => {
      log('SSE connection opened');
      setIsConnecting(false);
      setIsConnected(true);
      setConnectionError(null);
      reconnectAttemptsRef.current = 0;
      isFallbackModeRef.current = false;
    };

    // Handle errors
    eventSource.onerror = (event) => {
      log('SSE connection error:', event);
      setIsConnected(false);
      setIsConnecting(false);

      // Attempt reconnection
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        const delay = getReconnectDelay();
        reconnectAttemptsRef.current++;
        setConnectionError(`Connection lost. Reconnecting in ${Math.round(delay / 1000)}s...`);
        log(`Scheduling reconnection attempt ${reconnectAttemptsRef.current} in ${delay}ms`);

        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      } else {
        // Fall back to polling
        log('Max reconnection attempts reached, falling back to polling');
        setConnectionError('Real-time connection unavailable. Using polling fallback.');
        isFallbackModeRef.current = true;
        // Invalidate to trigger immediate poll
        trpcUtils.alert.getUnreadCount.invalidate();
      }
    };

    // Handle 'connected' event
    eventSource.addEventListener('connected', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as NotificationEvent;
        log('Connected event received:', data);
      } catch (e) {
        log('Error parsing connected event:', e);
      }
    });

    // Handle 'alert_count' event
    eventSource.addEventListener('alert_count', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as NotificationEvent;
        const { count, previousCount } = data.data as {
          count: number;
          previousCount: number;
        };
        log('Alert count update:', count, 'previous:', previousCount);

        if (count !== unreadCount) {
          onCountChange?.(count, previousCount);
          setUnreadCount(count);
        }
      } catch (e) {
        log('Error parsing alert_count event:', e);
      }
    });

    // Handle 'alert' event (new alert)
    eventSource.addEventListener('alert', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as NotificationEvent;
        const alert = data.data as AlertNotification;
        log('New alert received:', alert);

        // Add to recent alerts (keep max 10)
        setRecentAlerts((prev) => {
          const exists = prev.some((a) => a.id === alert.id);
          if (exists) {
            return prev;
          }
          return [alert, ...prev].slice(0, 10);
        });

        // Trigger callback
        onNewAlert?.(alert);
      } catch (e) {
        log('Error parsing alert event:', e);
      }
    });

    // Handle 'filing_status' event
    eventSource.addEventListener('filing_status', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as NotificationEvent;
        log('Filing status update:', data);
        // TODO: Implement filing status handling when needed
      } catch (e) {
        log('Error parsing filing_status event:', e);
      }
    });

    // Handle 'heartbeat' event
    eventSource.addEventListener('heartbeat', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as NotificationEvent;
        setLastHeartbeat(new Date(data.timestamp));
      } catch (e) {
        log('Error parsing heartbeat event:', e);
      }
    });

    // Handle 'error' event
    eventSource.addEventListener('error', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as NotificationEvent;
        log('Server error event:', data);
        setConnectionError((data.data as { message?: string })?.message || 'Server error');
      } catch {
        // This might be a connection error, not a parsed event
      }
    });
  }, [spacId, maxReconnectAttempts, getReconnectDelay, log, onNewAlert, onCountChange, trpcUtils, unreadCount]);

  // Disconnect from SSE
  const disconnect = useCallback(() => {
    log('Disconnecting from SSE');

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
  }, [log]);

  // Manual reconnect
  const reconnect = useCallback(() => {
    log('Manual reconnection triggered');
    reconnectAttemptsRef.current = 0;
    isFallbackModeRef.current = false;
    disconnect();
    connect();
  }, [connect, disconnect, log]);

  // Mark an alert as seen (remove from recent)
  const markAlertSeen = useCallback((alertId: string) => {
    setRecentAlerts((prev) => prev.filter((a) => a.id !== alertId));
  }, []);

  // Clear all recent alerts
  const clearRecentAlerts = useCallback(() => {
    setRecentAlerts([]);
  }, []);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  // Reconnect if spacId changes
  useEffect(() => {
    if (enabled && isConnected) {
      log('SpacId changed, reconnecting');
      reconnect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spacId]);

  return {
    // Connection state
    isConnected,
    isConnecting,
    connectionError,
    lastHeartbeat,

    // Notification state
    unreadCount,
    recentAlerts,

    // Methods
    reconnect,
    markAlertSeen,
    clearRecentAlerts,
  };
}

export default useNotificationStream;
