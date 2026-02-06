const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

class NotificationService {
  constructor() {
    this.eventSource = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.isConnecting = false;
    this.isConnected = false;
    this.heartbeatInterval = null;
    this.lastHeartbeat = null;
    this.permissionGranted = false;
    this.swRegistration = null;
    this.pushSubscription = null;
  }

  // Initialize notification service
  async initialize() {
    try {
      // Request notification permission
      await this.requestNotificationPermission();
      
      // Register service worker for push notifications
      await this.registerServiceWorker();
      
      // Connect to SSE endpoint
      this.connect();
      
      console.log('Notification service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
    }
  }

  // Request notification permission
  async requestNotificationPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      this.permissionGranted = permission === 'granted';
      
      if (this.permissionGranted) {
        console.log('Notification permission granted');
      } else {
        console.warn('Notification permission denied');
      }
      
      return this.permissionGranted;
    } else {
      console.warn('Notifications not supported in this browser');
      return false;
    }
  }

  // Register service worker for push notifications
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        this.swRegistration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service worker registered:', this.swRegistration);
        
        // Subscribe to push notifications
        await this.subscribeToPushNotifications();
      } catch (error) {
        console.error('Service worker registration failed:', error);
      }
    } else {
      console.warn('Service workers not supported in this browser');
    }
  }

  // Subscribe to push notifications
  async subscribeToPushNotifications() {
    if (!this.swRegistration) return;

    try {
      // Get public key from server
      const response = await fetch(`${API_BASE_URL}/notifications/vapid-public-key`);
      const { publicKey } = await response.json();

      // Subscribe to push
      this.pushSubscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(publicKey)
      });

      console.log('Push subscription created:', this.pushSubscription);

      // Send subscription to server
      await fetch(`${API_BASE_URL}/notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscription: this.pushSubscription,
          userId: 'user123' // This would come from auth
        })
      });

      console.log('Push subscription sent to server');
    } catch (error) {
      console.error('Push subscription failed:', error);
    }
  }

  // Convert base64 to Uint8Array for VAPID key
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  // Connect to SSE endpoint
  connect() {
    if (this.isConnecting || this.isConnected) return;

    this.isConnecting = true;

    try {
      this.eventSource = new EventSource('/api/notifications/stream');

      // Connection opened
      this.eventSource.onopen = () => {
        console.log('SSE connection established');
        this.isConnected = true;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        
        // Start heartbeat
        this.startHeartbeat();
        
        // Notify listeners
        this.emit('connection', { connected: true });
      };

      // Connection closed
      this.eventSource.onclose = () => {
        console.log('SSE connection closed');
        this.isConnected = false;
        this.isConnecting = false;
        
        // Stop heartbeat
        this.stopHeartbeat();
        
        // Notify listeners
        this.emit('connection', { connected: false });
        
        // Attempt to reconnect
        this.attemptReconnect();
      };

      // Connection error
      this.eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        this.isConnected = false;
        this.isConnecting = false;
        
        // Stop heartbeat
        this.stopHeartbeat();
        
        // Notify listeners
        this.emit('error', { error: 'Connection error' });
        
        // Attempt to reconnect
        this.attemptReconnect();
      };

      // Message received
      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      // Custom event listeners
      this.eventSource.addEventListener('notification', (event) => {
        try {
          const notification = JSON.parse(event.data);
          this.handleNotification(notification);
        } catch (error) {
          console.error('Error handling notification event:', error);
        }
      });

      this.eventSource.addEventListener('heartbeat', (event) => {
        this.lastHeartbeat = Date.now();
        console.log('Heartbeat received');
      });

      this.eventSource.addEventListener('lead-update', (event) => {
        try {
          const leadUpdate = JSON.parse(event.data);
          this.handleLeadUpdate(leadUpdate);
        } catch (error) {
          console.error('Error handling lead update event:', error);
        }
      });

    } catch (error) {
      console.error('Failed to create SSE connection:', error);
      this.isConnecting = false;
      this.attemptReconnect();
    }
  }

  // Disconnect from SSE endpoint
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    this.isConnected = false;
    this.isConnecting = false;
    this.stopHeartbeat();
    
    console.log('SSE connection closed');
  }

  // Attempt to reconnect
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('error', { error: 'Max reconnection attempts reached' });
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);

    setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  // Start heartbeat
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.lastHeartbeat && Date.now() - this.lastHeartbeat > 30000) {
        console.warn('Heartbeat timeout, reconnecting...');
        this.disconnect();
        this.connect();
      }
    }, 10000);
  }

  // Stop heartbeat
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Handle incoming messages
  handleMessage(data) {
    console.log('Message received:', data);
    this.emit('message', data);
  }

  // Handle notifications
  handleNotification(notification) {
    console.log('Notification received:', notification);
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
      if (notification.userId && currentUser?._id && notification.userId !== currentUser._id) {
        return;
      }
    } catch (error) {
      // ignore parse errors and continue
    }

    // Show browser notification if permission granted
    if (this.permissionGranted) {
      this.showBrowserNotification(notification);
    }

    // Emit to listeners
    this.emit('notification', notification);
  }

  // Handle lead updates
  handleLeadUpdate(leadUpdate) {
    console.log('Lead update received:', leadUpdate);
    this.emit('lead-update', leadUpdate);
  }

  // Show browser notification
  showBrowserNotification(notification) {
    const options = {
      body: notification.message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: notification.id || 'default',
      renotify: true,
      requireInteraction: notification.type === 'urgent',
      actions: notification.actions || []
    };

    const browserNotification = new Notification(notification.title, options);

    // Handle notification click
    browserNotification.onclick = () => {
      console.log('Notification clicked:', notification);
      
      // Focus the window
      window.focus();
      
      // Navigate to relevant page if URL provided
      if (notification.url) {
        window.location.href = notification.url;
      }
      
      // Close the notification
      browserNotification.close();
    };

    // Auto-close after 5 seconds unless it's urgent
    if (notification.type !== 'urgent') {
      setTimeout(() => {
        browserNotification.close();
      }, 5000);
    }
  }

  // Add event listener
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  // Remove event listener
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Emit event to listeners
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  // Send notification to server (for testing)
  async sendNotification(notification) {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...notification,
          userId: 'user123' // This would come from auth
        })
      });

      const result = await response.json();
      console.log('Notification sent:', result);
      return result;
    } catch (error) {
      console.error('Failed to send notification:', error);
      throw error;
    }
  }

  // Get notification history
  async getNotificationHistory() {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/history?userId=user123`);
      const history = await response.json();
      return history;
    } catch (error) {
      console.error('Failed to get notification history:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notificationId,
          userId: 'user123'
        })
      });

      const result = await response.json();
      console.log('Notification marked as read:', result);
      return result;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      connecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts,
      permissionGranted: this.permissionGranted,
      pushSubscribed: !!this.pushSubscription,
      lastHeartbeat: this.lastHeartbeat
    };
  }

  // Test notification (for development)
  testNotification() {
    const testNotification = {
      id: 'test-' + Date.now(),
      type: 'info',
      title: 'Test Notification',
      message: 'This is a test notification from the notification service.',
      timestamp: new Date().toISOString(),
      url: '/leads'
    };

    this.handleNotification(testNotification);
  }

  // Cleanup
  cleanup() {
    this.disconnect();
    this.listeners.clear();
  }
}

// Create singleton instance
const notificationService = new NotificationService();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    notificationService.initialize();
  });
} else {
  notificationService.initialize();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  notificationService.cleanup();
});

// Export for use in other modules
export default notificationService;
