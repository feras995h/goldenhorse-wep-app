import { io, Socket } from 'socket.io-client';

interface BalanceUpdate {
  accountId: string;
  accountCode: string;
  accountName: string;
  oldBalance: number;
  newBalance: number;
  difference: number;
  currency: string;
  reason: string;
  timestamp: string;
  metadata?: any;
}

interface TransactionCreated {
  transactionId: string;
  transactionType: string;
  amount: number;
  accountId: string;
  timestamp: string;
}

interface VoucherCreated {
  voucherId: string;
  voucherType: 'receipt' | 'payment';
  voucherNumber: string;
  amount: number;
  accountId: string;
  timestamp: string;
}

interface WebSocketEventHandlers {
  onBalanceUpdate?: (data: BalanceUpdate) => void;
  onAccountBalanceUpdate?: (data: BalanceUpdate) => void;
  onTransactionCreated?: (data: TransactionCreated) => void;
  onVoucherCreated?: (data: VoucherCreated) => void;
  onJournalEntryPosted?: (data: any) => void;
  onFinancialStatementUpdate?: (data: any) => void;
  onNotification?: (data: any) => void;
  onSystemNotification?: (data: any) => void;
  onAccountStatementRefresh?: (data: { accountId: string; timestamp: string }) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
}

class WebSocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventHandlers: WebSocketEventHandlers = {};
  private subscribedAccounts = new Set<string>();

  /**
   * Initialize WebSocket connection
   */
  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const serverUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';
        
        this.socket = io(serverUrl, {
          auth: {
            token: token
          },
          transports: ['websocket', 'polling'],
          timeout: 10000,
          forceNew: true
        });

        this.setupEventListeners();

        this.socket.on('connect', () => {
          console.log('✅ WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.eventHandlers.onConnect?.();
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          console.error('❌ WebSocket connection error:', error);
          this.isConnected = false;
          this.eventHandlers.onError?.(error);
          reject(error);
        });

        this.socket.on('disconnect', (reason) => {
          console.log('🔌 WebSocket disconnected:', reason);
          this.isConnected = false;
          this.eventHandlers.onDisconnect?.();
          
          // Auto-reconnect if not manually disconnected
          if (reason !== 'io client disconnect') {
            this.handleReconnect();
          }
        });

      } catch (error) {
        console.error('Failed to initialize WebSocket:', error);
        reject(error);
      }
    });
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners() {
    if (!this.socket) return;

    // Balance updates
    this.socket.on('balance_updated', (data: BalanceUpdate) => {
      console.log('💰 Balance updated:', data);
      this.eventHandlers.onBalanceUpdate?.(data);
    });

    this.socket.on('account_balance_updated', (data: BalanceUpdate) => {
      console.log('🏦 Account balance updated:', data);
      this.eventHandlers.onAccountBalanceUpdate?.(data);
    });

    // Transaction events
    this.socket.on('transaction_created', (data: TransactionCreated) => {
      console.log('📝 Transaction created:', data);
      this.eventHandlers.onTransactionCreated?.(data);
    });

    this.socket.on('voucher_created', (data: VoucherCreated) => {
      console.log('🧾 Voucher created:', data);
      this.eventHandlers.onVoucherCreated?.(data);
    });

    this.socket.on('account_voucher_created', (data: VoucherCreated) => {
      console.log('🏦 Account voucher created:', data);
      this.eventHandlers.onVoucherCreated?.(data);
    });

    // Journal entries
    this.socket.on('journal_entry_posted', (data: any) => {
      console.log('📊 Journal entry posted:', data);
      this.eventHandlers.onJournalEntryPosted?.(data);
    });

    // Financial statements
    this.socket.on('financial_statement_updated', (data: any) => {
      console.log('📈 Financial statement updated:', data);
      this.eventHandlers.onFinancialStatementUpdate?.(data);
    });

    // Account statement refresh
    this.socket.on('account_statement_refresh', (data: { accountId: string; timestamp: string }) => {
      console.log('🔄 Account statement refresh requested:', data);
      this.eventHandlers.onAccountStatementRefresh?.(data);
    });

    // Notifications
    this.socket.on('notification', (data: any) => {
      console.log('🔔 Notification received:', data);
      this.eventHandlers.onNotification?.(data);
    });

    this.socket.on('system_notification', (data: any) => {
      console.log('🚨 System notification:', data);
      this.eventHandlers.onSystemNotification?.(data);
    });

    // Connection confirmation
    this.socket.on('connected', (data: any) => {
      console.log('✅ WebSocket connection confirmed:', data);
    });

    // Ping/Pong for connection health
    this.socket.on('pong', (data: any) => {
      console.log('🏓 Pong received:', data);
    });
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
    
    setTimeout(() => {
      if (this.socket && !this.isConnected) {
        this.socket.connect();
      }
    }, delay);
  }

  /**
   * Subscribe to account updates
   */
  subscribeToAccount(accountId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe_account', accountId);
      this.subscribedAccounts.add(accountId);
      console.log(`📡 Subscribed to account: ${accountId}`);
    }
  }

  /**
   * Unsubscribe from account updates
   */
  unsubscribeFromAccount(accountId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('unsubscribe_account', accountId);
      this.subscribedAccounts.delete(accountId);
      console.log(`📡 Unsubscribed from account: ${accountId}`);
    }
  }

  /**
   * Subscribe to financial updates
   */
  subscribeToFinancialUpdates() {
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe_financial');
      console.log('📡 Subscribed to financial updates');
    }
  }

  /**
   * Set event handlers
   */
  setEventHandlers(handlers: WebSocketEventHandlers) {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
  }

  /**
   * Send ping to check connection health
   */
  ping() {
    if (this.socket && this.isConnected) {
      this.socket.emit('ping');
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.subscribedAccounts.clear();
      console.log('🔌 WebSocket disconnected manually');
    }
  }

  /**
   * Check if connected
   */
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      subscribedAccounts: Array.from(this.subscribedAccounts)
    };
  }

  /**
   * Re-subscribe to all previously subscribed accounts
   */
  resubscribeToAccounts() {
    this.subscribedAccounts.forEach(accountId => {
      this.subscribeToAccount(accountId);
    });
  }
}

// Create singleton instance
const webSocketService = new WebSocketService();

export default webSocketService;
export type { BalanceUpdate, TransactionCreated, VoucherCreated, WebSocketEventHandlers };
