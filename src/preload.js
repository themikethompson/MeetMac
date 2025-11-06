const { contextBridge, ipcRenderer } = require('electron');

// Rate limiting for IPC messages to prevent flooding
const rateLimiter = {
  notifications: [],
  MAX_PER_MINUTE: 20,
  WINDOW_MS: 60000,

  canSend() {
    const now = Date.now();
    // Remove old entries outside the time window
    this.notifications = this.notifications.filter(time => now - time < this.WINDOW_MS);

    if (this.notifications.length >= this.MAX_PER_MINUTE) {
      console.warn('Notification rate limit exceeded');
      return false;
    }

    this.notifications.push(now);
    return true;
  }
};

// Validate notification data before sending to main process
function validateNotificationData(data) {
  // Must be an object
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    console.warn('Invalid notification data: must be an object');
    return null;
  }

  // Validate title
  const title = typeof data.title === 'string' ? data.title : '';
  if (title.length > 200) {
    console.warn('Notification title too long, truncating');
  }

  // Validate body
  const body = typeof data.body === 'string' ? data.body : '';
  if (body.length > 1000) {
    console.warn('Notification body too long, truncating');
  }

  // Return validated and sanitized data
  return {
    title: title.substring(0, 200),
    body: body.substring(0, 1000),
    timestamp: Date.now()
  };
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Send notification to main process with validation and rate limiting
  sendNotification: (data) => {
    // Check rate limit
    if (!rateLimiter.canSend()) {
      return;
    }

    const validatedData = validateNotificationData(data);
    if (validatedData) {
      ipcRenderer.send('notification', validatedData);
    }
  },

  // Authentication methods
  signInWithGoogle: () => {
    return ipcRenderer.invoke('auth:sign-in');
  },

  signOut: () => {
    return ipcRenderer.invoke('auth:sign-out');
  },

  checkAuthStatus: () => {
    return ipcRenderer.invoke('auth:check-status');
  },

  // Auth event listeners
  onAuthStatus: (callback) => {
    ipcRenderer.on('auth:status', (event, message) => callback(message));
  },

  onAuthError: (callback) => {
    ipcRenderer.on('auth:error', (event, message) => callback(message));
  },

  onAuthSuccess: (callback) => {
    ipcRenderer.on('auth:success', () => callback());
  },

  // Platform information
  platform: process.platform,

  // App version
  version: '1.0.0'
});

// Log that preload script loaded successfully
console.log('MeetMac preload script loaded');
