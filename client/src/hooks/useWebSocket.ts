import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import webSocketService, { WebSocketEventHandlers, BalanceUpdate } from '../services/websocketService';

interface UseWebSocketOptions {
  autoConnect?: boolean;
  subscribeToFinancial?: boolean;
  accountIds?: string[];
  onBalanceUpdate?: (data: BalanceUpdate) => void;
  onAccountBalanceUpdate?: (data: BalanceUpdate) => void;
  onTransactionCreated?: (data: any) => void;
  onVoucherCreated?: (data: any) => void;
  onJournalEntryPosted?: (data: any) => void;
  onFinancialStatementUpdate?: (data: any) => void;
  onNotification?: (data: any) => void;
  onSystemNotification?: (data: any) => void;
  onAccountStatementRefresh?: (data: { accountId: string; timestamp: string }) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const { token, isAuthenticated } = useAuth();
  const {
    autoConnect = true,
    subscribeToFinancial = false,
    accountIds = [],
    ...eventHandlers
  } = options;

  const isConnectedRef = useRef(false);
  const subscribedAccountsRef = useRef<Set<string>>(new Set());

  // Connect to WebSocket
  const connect = useCallback(async () => {
    if (!token || !isAuthenticated || isConnectedRef.current) {
      return;
    }

    try {
      await webSocketService.connect(token);
      isConnectedRef.current = true;

      // Subscribe to financial updates if requested
      if (subscribeToFinancial) {
        webSocketService.subscribeToFinancialUpdates();
      }

      // Subscribe to specific accounts
      accountIds.forEach(accountId => {
        webSocketService.subscribeToAccount(accountId);
        subscribedAccountsRef.current.add(accountId);
      });

      console.log('✅ WebSocket connected and subscriptions set up');
    } catch (error) {
      console.error('❌ Failed to connect WebSocket:', error);
      isConnectedRef.current = false;
    }
  }, [token, isAuthenticated, subscribeToFinancial, accountIds]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    webSocketService.disconnect();
    isConnectedRef.current = false;
    subscribedAccountsRef.current.clear();
  }, []);

  // Subscribe to account
  const subscribeToAccount = useCallback((accountId: string) => {
    if (isConnectedRef.current && !subscribedAccountsRef.current.has(accountId)) {
      webSocketService.subscribeToAccount(accountId);
      subscribedAccountsRef.current.add(accountId);
    }
  }, []);

  // Unsubscribe from account
  const unsubscribeFromAccount = useCallback((accountId: string) => {
    if (isConnectedRef.current && subscribedAccountsRef.current.has(accountId)) {
      webSocketService.unsubscribeFromAccount(accountId);
      subscribedAccountsRef.current.delete(accountId);
    }
  }, []);

  // Get connection status
  const getConnectionStatus = useCallback(() => {
    return webSocketService.getConnectionStatus();
  }, []);

  // Send ping
  const ping = useCallback(() => {
    if (isConnectedRef.current) {
      webSocketService.ping();
    }
  }, []);

  // Setup event handlers
  useEffect(() => {
    const handlers: WebSocketEventHandlers = {
      ...eventHandlers,
      onConnect: () => {
        isConnectedRef.current = true;
        eventHandlers.onConnect?.();
      },
      onDisconnect: () => {
        isConnectedRef.current = false;
        eventHandlers.onDisconnect?.();
      }
    };

    webSocketService.setEventHandlers(handlers);
  }, [eventHandlers]);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect && token && isAuthenticated && !isConnectedRef.current) {
      connect();
    }

    return () => {
      if (autoConnect) {
        disconnect();
      }
    };
  }, [autoConnect, token, isAuthenticated, connect, disconnect]);

  // Handle account subscriptions changes
  useEffect(() => {
    if (!isConnectedRef.current) return;

    // Subscribe to new accounts
    accountIds.forEach(accountId => {
      if (!subscribedAccountsRef.current.has(accountId)) {
        webSocketService.subscribeToAccount(accountId);
        subscribedAccountsRef.current.add(accountId);
      }
    });

    // Unsubscribe from removed accounts
    const currentAccountIds = new Set(accountIds);
    subscribedAccountsRef.current.forEach(accountId => {
      if (!currentAccountIds.has(accountId)) {
        webSocketService.unsubscribeFromAccount(accountId);
        subscribedAccountsRef.current.delete(accountId);
      }
    });
  }, [accountIds]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isConnectedRef.current) {
        disconnect();
      }
    };
  }, [disconnect]);

  return {
    connect,
    disconnect,
    subscribeToAccount,
    unsubscribeFromAccount,
    getConnectionStatus,
    ping,
    isConnected: isConnectedRef.current
  };
};

// Hook specifically for account balance updates
export const useAccountBalance = (accountId: string, onBalanceUpdate?: (data: BalanceUpdate) => void) => {
  const webSocket = useWebSocket({
    accountIds: accountId ? [accountId] : [],
    onAccountBalanceUpdate: onBalanceUpdate,
    autoConnect: true
  });

  return webSocket;
};

// Hook for financial updates
export const useFinancialUpdates = (eventHandlers: Partial<WebSocketEventHandlers> = {}) => {
  const webSocket = useWebSocket({
    subscribeToFinancial: true,
    autoConnect: true,
    ...eventHandlers
  });

  return webSocket;
};

// Hook for multiple account balances
export const useMultipleAccountBalances = (
  accountIds: string[], 
  onBalanceUpdate?: (data: BalanceUpdate) => void
) => {
  const webSocket = useWebSocket({
    accountIds,
    onAccountBalanceUpdate: onBalanceUpdate,
    autoConnect: true
  });

  return webSocket;
};
