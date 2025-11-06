# MeetMac Technical Specification

**Version:** 1.0
**Date:** November 6, 2025
**Target Platform:** macOS 12+ (Monterey and later)

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Application Structure](#application-structure)
4. [Core Components](#core-components)
5. [Authentication System](#authentication-system)
6. [Meeting Detection](#meeting-detection)
7. [Notification System](#notification-system)
8. [Badge Management](#badge-management)
9. [Media Permissions](#media-permissions)
10. [IPC Communication](#ipc-communication)
11. [Security Model](#security-model)
12. [Window Management](#window-management)
13. [Data Storage](#data-storage)
14. [Build Configuration](#build-configuration)
15. [API Reference](#api-reference)

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     MeetMac Application                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────────────────────────────────────────────┐      │
│  │           Main Process (Node.js)                  │      │
│  │  - Application lifecycle management               │      │
│  │  - Window management (auth, main, PiP, prefs)     │      │
│  │  - Native macOS integration                       │      │
│  │  - Meeting state management                       │      │
│  │  - IPC message handling                           │      │
│  └────────────────┬──────────────────────────────────┘      │
│                   │                                          │
│                   │ Secure IPC (contextBridge)               │
│                   │                                          │
│  ┌────────────────▼──────────────────────────────────┐      │
│  │         Preload Script (Isolated)                 │      │
│  │  - Security boundary enforcement                  │      │
│  │  - API exposure via contextBridge                 │      │
│  │  - Input validation and rate limiting             │      │
│  └────────────────┬──────────────────────────────────┘      │
│                   │                                          │
│                   │ window.electronAPI                       │
│                   │                                          │
│  ┌────────────────▼──────────────────────────────────┐      │
│  │      Renderer Process (Chromium)                  │      │
│  │  - Google Meet web app (meet.google.com)          │      │
│  │  - DOM manipulation and event interception        │      │
│  │  - Meeting detection scripts                      │      │
│  │  - Notification API override                      │      │
│  └───────────────────────────────────────────────────┘      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         │                    │                    │
         ▼                    ▼                    ▼
   ┌─────────┐          ┌─────────┐         ┌──────────┐
   │  Dock   │          │  Menu   │         │  System  │
   │  Badge  │          │   Bar   │         │  Notifs  │
   └─────────┘          └─────────┘         └──────────┘
```

### Process Model

MeetMac follows Electron's multi-process architecture:

1. **Main Process**: Node.js environment with full system access
2. **Renderer Process**: Chromium browser environment (sandboxed)
3. **Preload Script**: Bridge between main and renderer (isolated context)

---

## Technology Stack

### Core Framework
- **Electron**: `^28.3.3`
  - Chromium rendering engine
  - Node.js integration for native features
  - Cross-platform desktop app framework

### Build Tools
- **electron-builder**: `^24.9.1`
  - Application packaging
  - DMG creation for macOS
  - Code signing and notarization support

### Runtime
- **Node.js**: v20+ (bundled with Electron)
- **JavaScript**: ES6+ (no transpilation required)
- **No TypeScript**: Maintain compatibility with ChatMac codebase

### Development Tools
- **VS Code**: Recommended IDE
- **Electron DevTools**: Built-in debugging
- **Chrome DevTools**: For renderer process debugging

---

## Application Structure

### Directory Layout

```
meetmac/
├── src/
│   ├── main.js                    # Main process (1,200+ lines)
│   ├── preload.js                 # IPC bridge (~150 lines)
│   ├── auth.html                  # Authentication UI
│   ├── preferences.html           # Settings UI
│   └── meeting-detector.js        # NEW: Meeting detection logic
├── assets/
│   ├── icon.svg                   # Vector icon source
│   ├── icon.png                   # Rasterized icon
│   ├── icon.icns                  # macOS icon bundle
│   └── icon.iconset/              # Multi-resolution icons
├── build/
│   └── entitlements.mac.plist     # macOS entitlements
├── scripts/
│   └── notarize.js                # Optional notarization
├── dist/                          # Build output (gitignored)
├── node_modules/                  # Dependencies (gitignored)
├── package.json                   # Project configuration
├── package-lock.json              # Dependency lock file
├── .gitignore                     # Git ignore rules
└── Documentation/
    ├── README.md                  # User documentation
    ├── INSTALL.md                 # Installation guide
    ├── CLAUDE.md                  # Developer guide
    └── SECURITY_AUDIT.md          # Security documentation
```

---

## Core Components

### 1. Main Process (main.js)

**Responsibilities:**
- Application initialization and lifecycle
- Window creation and management
- Authentication state management
- Meeting state tracking
- Native notification handling
- Dock badge updates
- Menu bar creation
- IPC message routing
- External link handling

**Key Classes:**

#### BadgeStateManager
Manages dock badge with meeting status.

```javascript
class BadgeStateManager {
  constructor() {
    this.isInMeeting = false;
    this.participantCount = 0;
    this.pendingUpdate = null;
    this.updateLock = false;
  }

  setMeetingStatus(inMeeting, participants = 0) {
    // Update badge with meeting indicator
  }

  startMonitoring() {
    // Poll for meeting state changes
  }

  stopMonitoring() {
    // Clean up monitoring
  }
}
```

#### MeetingStateManager (NEW)
Tracks active meeting state.

```javascript
class MeetingStateManager {
  constructor() {
    this.activeMeeting = null;
    this.participants = [];
    this.isPresenting = false;
    this.isMuted = false;
    this.cameraEnabled = false;
  }

  updateState(meetingData) {
    // Process meeting state updates from renderer
  }

  getMeetingInfo() {
    // Return current meeting information
  }
}
```

### 2. Preload Script (preload.js)

**Responsibilities:**
- Expose secure IPC API to renderer
- Validate all inputs from renderer
- Rate limit IPC messages
- No direct Node.js access to renderer

**Exposed API:**

```javascript
contextBridge.exposeInMainWorld('electronAPI', {
  // Meeting state
  updateMeetingState: (data) => ipcRenderer.invoke('meeting:update', data),
  getMeetingInfo: () => ipcRenderer.invoke('meeting:get-info'),

  // Notifications
  sendNotification: (data) => ipcRenderer.send('notification:send', data),

  // Authentication
  signInWithGoogle: () => ipcRenderer.invoke('auth:sign-in'),
  signOut: () => ipcRenderer.invoke('auth:sign-out'),
  checkAuthStatus: () => ipcRenderer.invoke('auth:check'),

  // Listeners
  onAuthStatus: (callback) => ipcRenderer.on('auth:status', callback),
  onMeetingCommand: (callback) => ipcRenderer.on('meeting:command', callback),
});
```

### 3. Meeting Detector (meeting-detector.js) - NEW

**Responsibilities:**
- Detect when user joins/leaves meetings
- Parse meeting information from DOM
- Monitor participant changes
- Detect camera/microphone state
- Report state to main process

**Detection Strategy:**

```javascript
class MeetingDetector {
  constructor() {
    this.observer = null;
    this.checkInterval = null;
    this.currentMeeting = null;
  }

  start() {
    // Start DOM observation
    this.observeDOM();
    this.checkInterval = setInterval(() => this.detectMeeting(), 1000);
  }

  detectMeeting() {
    // Check URL patterns
    const isInMeeting = window.location.href.match(/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}/);

    // Check for meeting UI elements
    const meetingContainer = document.querySelector('[data-meeting-id]');
    const participantList = document.querySelector('[data-participant-id]');

    if (isInMeeting && meetingContainer) {
      this.parseMeetingInfo();
    } else {
      this.clearMeetingState();
    }
  }

  parseMeetingInfo() {
    // Extract meeting details from DOM
    const meetingCode = this.getMeetingCode();
    const participants = this.getParticipantCount();
    const isMuted = this.getMutedState();
    const cameraEnabled = this.getCameraState();

    window.electronAPI.updateMeetingState({
      inMeeting: true,
      meetingCode,
      participants,
      isMuted,
      cameraEnabled,
      timestamp: Date.now()
    });
  }

  // Helper methods for DOM parsing
  getMeetingCode() { /* ... */ }
  getParticipantCount() { /* ... */ }
  getMutedState() { /* ... */ }
  getCameraState() { /* ... */ }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const detector = new MeetingDetector();
    detector.start();
  });
} else {
  const detector = new MeetingDetector();
  detector.start();
}
```

---

## Authentication System

### Authentication Flow

```
┌─────────────┐
│ App Startup │
└──────┬──────┘
       │
       ▼
  ┌────────────────────┐
  │ Check Auth State   │
  │ - auth-state.json  │
  │ - Google cookies   │
  └─────┬──────────────┘
        │
        ├── Authenticated? ──YES──┐
        │                          │
        NO                         │
        │                          │
        ▼                          ▼
  ┌──────────────┐        ┌──────────────┐
  │ Auth Window  │        │ Main Window  │
  │ (auth.html)  │        │ (Meet)       │
  └──────┬───────┘        └──────────────┘
         │
         ▼
  ┌─────────────────┐
  │ Google OAuth    │
  │ Window          │
  │ - accounts.     │
  │   google.com    │
  └──────┬──────────┘
         │
         ▼
  ┌─────────────────┐
  │ Validate        │
  │ Cookies         │
  │ - SID           │
  │ - HSID          │
  │ - SSID          │
  └──────┬──────────┘
         │
         ▼
  ┌─────────────────┐
  │ Save Auth State │
  │ Close Auth Win  │
  │ Open Main Win   │
  └─────────────────┘
```

### Cookie Validation

**Required Google Cookies:**
- `SID`: Session ID
- `HSID`: Host Session ID
- `SSID`: Secure Session ID

**Validation Code:**

```javascript
async function validateGoogleAuth() {
  const session = mainWindow.webContents.session;
  const cookies = await session.cookies.get({ domain: '.google.com' });

  const requiredCookies = ['SID', 'HSID', 'SSID'];
  const foundCookies = cookies.map(c => c.name);

  return requiredCookies.every(name => foundCookies.includes(name));
}
```

### Session Persistence

**Partition:** `persist:meetmac`

This creates an isolated session storage that persists between app restarts.

### Anti-Detection Measures

To prevent Google from blocking Electron:

```javascript
const CHROME_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.7390.122 Safari/537.36';

mainWindow.webContents.setUserAgent(CHROME_USER_AGENT);

mainWindow.webContents.executeJavaScript(`
  // Hide webdriver flag
  Object.defineProperty(navigator, 'webdriver', {
    get: () => undefined
  });

  // Spoof vendor
  Object.defineProperty(navigator, 'vendor', {
    get: () => 'Google Inc.'
  });

  // Hide Electron
  delete window.chrome.runtime;

  // Set languages
  Object.defineProperty(navigator, 'languages', {
    get: () => ['en-US', 'en']
  });

  // Empty plugins
  Object.defineProperty(navigator, 'plugins', {
    get: () => []
  });
`);
```

---

## Meeting Detection

### Detection Methods

#### 1. URL Pattern Matching
Google Meet URLs follow predictable patterns:
- `https://meet.google.com/{meeting-code}` (e.g., `abc-defg-hij`)
- `https://meet.google.com/lookup/{vanity-name}`

```javascript
function isMeetingURL(url) {
  return url.match(/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}/) !== null ||
         url.match(/meet\.google\.com\/lookup\//) !== null;
}
```

#### 2. DOM Element Detection
Look for meeting-specific UI elements:

```javascript
function detectMeetingUI() {
  // Video grid container
  const videoGrid = document.querySelector('[data-self-video]');

  // Meeting controls bar
  const controlsBar = document.querySelector('[data-meeting-controls]');

  // Participant info
  const participantInfo = document.querySelector('[data-participant-id]');

  return !!(videoGrid && controlsBar);
}
```

#### 3. Title Monitoring
Meeting titles contain meeting codes:

```javascript
function parseTitleForMeeting() {
  const title = document.title;
  const match = title.match(/([A-Z]{3}-[A-Z]{4}-[A-Z]{3})/);
  return match ? match[1] : null;
}
```

### State Extraction

```javascript
class MeetingStateExtractor {
  getParticipantCount() {
    // Look for participant count in UI
    const countEl = document.querySelector('[data-participant-count]');
    if (countEl) {
      return parseInt(countEl.textContent) || 0;
    }

    // Fallback: count video elements
    const videos = document.querySelectorAll('[data-participant-id]');
    return videos.length;
  }

  getMutedState() {
    // Check microphone button state
    const micButton = document.querySelector('[data-is-muted]');
    return micButton?.dataset?.isMuted === 'true';
  }

  getCameraState() {
    // Check camera button state
    const camButton = document.querySelector('[data-is-camera-on]');
    return camButton?.dataset?.isCameraOn === 'true';
  }

  isPresentingScreen() {
    // Check for presentation indicator
    const presentButton = document.querySelector('[data-is-presenting]');
    return presentButton?.dataset?.isPresenting === 'true';
  }
}
```

---

## Notification System

### Notification Types

1. **Meeting Starting** - Meeting begins
2. **Participant Joined** - Someone joins the meeting
3. **Participant Left** - Someone leaves the meeting
4. **Chat Message** - New in-meeting chat message
5. **Hand Raised** - Participant raises hand
6. **Recording Started** - Meeting recording begins

### Notification Interception

Override the web `Notification` API:

```javascript
// Injected into renderer process
(function() {
  const OriginalNotification = window.Notification;

  window.Notification = function(title, options = {}) {
    // Rate limiting check
    if (!window.__notificationRateLimiter.check()) {
      console.warn('Notification rate limit exceeded');
      return new OriginalNotification(title, options);
    }

    // Sanitize inputs
    const sanitizedTitle = sanitizeInput(title);
    const sanitizedBody = sanitizeInput(options.body);

    // Parse meeting notification
    const notificationData = {
      type: detectNotificationType(sanitizedTitle, sanitizedBody),
      title: sanitizedTitle,
      body: sanitizedBody,
      timestamp: Date.now(),
      meetingCode: getCurrentMeetingCode(),
    };

    // Send to main process
    window.electronAPI.sendNotification(notificationData);

    // Create mock notification object to prevent browser notification
    return {
      close: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
    };
  };

  // Copy static properties
  window.Notification.permission = 'granted';
  window.Notification.requestPermission = () => Promise.resolve('granted');
})();
```

### Native macOS Notification

```javascript
// In main process
function showNativeNotification(notificationData) {
  const notification = new Notification({
    title: notificationData.title,
    body: notificationData.body,
    icon: path.join(__dirname, '../assets/icon.png'),
    sound: 'default',
  });

  notification.on('click', () => {
    // Focus the main window
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  notification.show();
}
```

### Input Sanitization

```javascript
function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');

  // Remove script tags specifically
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Limit length
  sanitized = sanitized.substring(0, 500);

  // Escape special characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

  return sanitized.trim();
}
```

---

## Badge Management

### Badge Display Logic

```javascript
class BadgeStateManager {
  constructor() {
    this.isInMeeting = false;
    this.participantCount = 0;
    this.updateLock = false;
    this.pendingUpdate = null;
    this.monitoringInterval = null;
  }

  async setMeetingStatus(inMeeting, participantCount = 0) {
    // Prevent concurrent updates
    if (this.updateLock) {
      this.pendingUpdate = { inMeeting, participantCount };
      return;
    }

    this.updateLock = true;
    this.isInMeeting = inMeeting;
    this.participantCount = participantCount;

    try {
      if (inMeeting) {
        // Show participant count or generic "in meeting" indicator
        if (participantCount > 0) {
          app.dock.setBadge(participantCount.toString());
        } else {
          app.dock.setBadge('•'); // Bullet point for active meeting
        }
      } else {
        // Clear badge
        app.dock.setBadge('');
      }
    } finally {
      this.updateLock = false;

      // Process pending update if any
      if (this.pendingUpdate) {
        const pending = this.pendingUpdate;
        this.pendingUpdate = null;
        await this.setMeetingStatus(pending.inMeeting, pending.participantCount);
      }
    }
  }

  startMonitoring() {
    // Poll for meeting state every 5 seconds
    this.monitoringInterval = setInterval(async () => {
      if (!mainWindow || mainWindow.isFocused()) {
        return; // Skip if window is focused
      }

      const meetingState = await this.getCurrentMeetingState();
      if (meetingState) {
        this.setMeetingStatus(meetingState.inMeeting, meetingState.participantCount);
      }
    }, 5000);
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  async getCurrentMeetingState() {
    try {
      const state = await mainWindow.webContents.executeJavaScript(`
        (function() {
          const detector = window.__meetingDetector;
          return detector ? detector.getCurrentState() : null;
        })()
      `);
      return state;
    } catch (error) {
      console.error('Failed to get meeting state:', error);
      return null;
    }
  }
}
```

---

## Media Permissions

### Required Permissions

#### 1. Camera Access

**Info.plist Entry:**
```xml
<key>NSCameraUsageDescription</key>
<string>MeetMac needs access to your camera for video calls in Google Meet.</string>
```

#### 2. Microphone Access

**Info.plist Entry:**
```xml
<key>NSMicrophoneUsageDescription</key>
<string>MeetMac needs access to your microphone for audio in Google Meet.</string>
```

#### 3. Screen Capture

**Entitlements Entry:**
```xml
<key>com.apple.security.cs.disable-library-validation</key>
<true/>
```

### Permission Request Handling

```javascript
// In main process
async function setupMediaPermissions() {
  // Camera permission
  const cameraStatus = await systemPreferences.getMediaAccessStatus('camera');
  if (cameraStatus !== 'granted') {
    await systemPreferences.askForMediaAccess('camera');
  }

  // Microphone permission
  const micStatus = await systemPreferences.getMediaAccessStatus('microphone');
  if (micStatus !== 'granted') {
    await systemPreferences.askForMediaAccess('microphone');
  }

  // Screen recording permission (macOS 10.15+)
  if (process.platform === 'darwin' && parseFloat(os.release()) >= 19) {
    const screenStatus = await systemPreferences.getMediaAccessStatus('screen');
    if (screenStatus !== 'granted') {
      // Show dialog explaining how to grant screen recording permission
      showScreenPermissionDialog();
    }
  }
}

function showScreenPermissionDialog() {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Screen Sharing Permission Required',
    message: 'To share your screen in Google Meet, please grant screen recording permission.',
    detail: 'Go to System Preferences > Security & Privacy > Privacy > Screen Recording and enable MeetMac.',
    buttons: ['Open System Preferences', 'Later'],
  }).then(result => {
    if (result.response === 0) {
      // Open System Preferences
      shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture');
    }
  });
}
```

---

## IPC Communication

### Message Types

#### Renderer → Main (send)
- `notification:send` - Send notification to main process
- `meeting:state-changed` - Meeting state update

#### Renderer ↔ Main (invoke/handle)
- `meeting:update` - Update meeting state
- `meeting:get-info` - Get current meeting info
- `auth:sign-in` - Initiate sign-in flow
- `auth:sign-out` - Sign out
- `auth:check` - Check authentication status

#### Main → Renderer (send)
- `auth:status` - Authentication status update
- `meeting:command` - Command from menu (mute, camera, etc.)

### Rate Limiting

```javascript
// In preload.js
class RateLimiter {
  constructor(maxRequests = 20, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  check() {
    const now = Date.now();

    // Remove old requests outside the time window
    this.requests = this.requests.filter(time => now - time < this.windowMs);

    // Check if limit exceeded
    if (this.requests.length >= this.maxRequests) {
      return false;
    }

    // Add current request
    this.requests.push(now);
    return true;
  }

  reset() {
    this.requests = [];
  }
}

const notificationRateLimiter = new RateLimiter(20, 60000); // 20 per minute
```

### Input Validation

```javascript
// In preload.js
function validateNotificationData(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid notification data');
  }

  if (typeof data.title !== 'string' || data.title.length === 0) {
    throw new Error('Invalid notification title');
  }

  if (data.title.length > 100) {
    data.title = data.title.substring(0, 100);
  }

  if (data.body && typeof data.body === 'string' && data.body.length > 500) {
    data.body = data.body.substring(0, 500);
  }

  return data;
}
```

---

## Security Model

### Security Principles

1. **Context Isolation**: Enabled in all windows
2. **No Node Integration**: Disabled in renderer processes
3. **Secure IPC**: Only via contextBridge
4. **Input Validation**: All inputs from renderer validated
5. **Rate Limiting**: Prevent IPC abuse
6. **CSP Headers**: Restrict resource loading
7. **Certificate Validation**: All HTTPS certificates verified

### Content Security Policy

```html
<!-- In auth.html and preferences.html -->
<meta http-equiv="Content-Security-Policy"
      content="default-src 'none';
               script-src 'unsafe-inline';
               style-src 'unsafe-inline';
               img-src data:;
               connect-src 'none';">
```

### Navigation Restrictions

```javascript
// In main process
mainWindow.webContents.on('will-navigate', (event, url) => {
  const allowedDomains = [
    'meet.google.com',
    'accounts.google.com',
    'google.com',
    'gstatic.com',
    'googleapis.com',
    'googleusercontent.com',
  ];

  const urlObj = new URL(url);
  const isAllowed = allowedDomains.some(domain =>
    urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
  );

  if (!isAllowed) {
    event.preventDefault();
    shell.openExternal(url); // Open in default browser
  }
});
```

### Secure Session

```javascript
const sessionConfig = {
  partition: 'persist:meetmac',
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,
    nodeIntegration: false,
    enableRemoteModule: false,
    sandbox: true,
    webSecurity: true,
    allowRunningInsecureContent: false,
  }
};
```

---

## Window Management

### Window Types

#### 1. Auth Window
**Purpose:** Welcome screen and sign-in

```javascript
function createAuthWindow() {
  authWindow = new BrowserWindow({
    width: 600,
    height: 500,
    resizable: false,
    fullscreenable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  authWindow.loadFile(path.join(__dirname, 'auth.html'));
  authWindow.setMenu(null);
}
```

#### 2. Main Window
**Purpose:** Google Meet interface

```javascript
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 10, y: 10 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      partition: 'persist:meetmac',
    }
  });

  mainWindow.loadURL('https://meet.google.com');
}
```

#### 3. Picture-in-Picture Window (NEW)
**Purpose:** Small always-on-top meeting view

```javascript
function createPiPWindow() {
  pipWindow = new BrowserWindow({
    width: 400,
    height: 300,
    minWidth: 200,
    minHeight: 150,
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    vibrancy: 'under-window',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      partition: 'persist:meetmac',
    }
  });

  // Share same session as main window
  pipWindow.loadURL(mainWindow.webContents.getURL());
}
```

#### 4. Preferences Window
**Purpose:** Settings and account management

```javascript
function createPreferencesWindow() {
  preferencesWindow = new BrowserWindow({
    width: 500,
    height: 600,
    resizable: false,
    parent: mainWindow,
    modal: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  preferencesWindow.loadFile(path.join(__dirname, 'preferences.html'));
}
```

### Custom Titlebar

```javascript
// Injected CSS for draggable regions
const titlebarCSS = `
  /* Create drag region at top */
  body::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 22px;
    -webkit-app-region: drag;
    z-index: 10000;
  }

  /* Make header draggable */
  header {
    -webkit-app-region: drag;
  }

  /* Allow interaction with buttons */
  button, a, input, select, textarea {
    -webkit-app-region: no-drag;
  }
`;
```

---

## Data Storage

### Stored Data

#### 1. Authentication State
**Location:** `{userData}/auth-state.json`

```json
{
  "isAuthenticated": true,
  "lastAuthCheck": 1699286400000,
  "email": "user@example.com"
}
```

#### 2. User Preferences
**Location:** `{userData}/preferences.json`

```json
{
  "notifications": {
    "enabled": true,
    "sound": true,
    "meetingStart": true,
    "participantJoin": true
  },
  "pip": {
    "enabled": true,
    "defaultWidth": 400,
    "defaultHeight": 300
  },
  "window": {
    "width": 1200,
    "height": 800,
    "x": 100,
    "y": 100
  }
}
```

#### 3. Session Storage
**Location:** `{userData}/Partitions/meetmac/`

Contains:
- Cookies
- localStorage
- IndexedDB
- Cache
- Service Workers

### Data Management

```javascript
const { app } = require('electron');
const path = require('path');
const fs = require('fs').promises;

class DataManager {
  constructor() {
    this.userDataPath = app.getPath('userData');
    this.authStatePath = path.join(this.userDataPath, 'auth-state.json');
    this.preferencesPath = path.join(this.userDataPath, 'preferences.json');
  }

  async saveAuthState(state) {
    await fs.writeFile(this.authStatePath, JSON.stringify(state, null, 2));
  }

  async loadAuthState() {
    try {
      const data = await fs.readFile(this.authStatePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  async clearAuthState() {
    await fs.unlink(this.authStatePath).catch(() => {});
  }

  async savePreferences(prefs) {
    await fs.writeFile(this.preferencesPath, JSON.stringify(prefs, null, 2));
  }

  async loadPreferences() {
    try {
      const data = await fs.readFile(this.preferencesPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return this.getDefaultPreferences();
    }
  }

  getDefaultPreferences() {
    return {
      notifications: {
        enabled: true,
        sound: true,
        meetingStart: true,
        participantJoin: true,
      },
      pip: {
        enabled: true,
        defaultWidth: 400,
        defaultHeight: 300,
      },
      window: {
        width: 1200,
        height: 800,
      }
    };
  }
}
```

---

## Build Configuration

### package.json

```json
{
  "name": "meetmac",
  "version": "1.0.0",
  "description": "Native macOS client for Google Meet",
  "main": "src/main.js",
  "author": "Your Name",
  "license": "MIT",
  "scripts": {
    "start": "electron .",
    "dev": "electron . --dev",
    "build": "electron-builder",
    "build:mac": "electron-builder --mac",
    "clean": "rm -rf dist build"
  },
  "dependencies": {},
  "devDependencies": {
    "electron": "^28.3.3",
    "electron-builder": "^24.9.1"
  },
  "build": {
    "appId": "com.meetmac",
    "productName": "MeetMac",
    "copyright": "Copyright © 2025",
    "mac": {
      "category": "public.app-category.productivity",
      "target": ["dmg", "dir"],
      "icon": "assets/icon.png",
      "identity": null,
      "hardenedRuntime": true,
      "gatekeeperAssess": false,
      "entitlements": "build/entitlements.mac.plist",
      "entitlementsInherit": "build/entitlements.mac.plist",
      "extendInfo": {
        "NSCameraUsageDescription": "MeetMac needs access to your camera for video calls.",
        "NSMicrophoneUsageDescription": "MeetMac needs access to your microphone for audio.",
        "NSAppleEventsUsageDescription": "MeetMac needs access to control notifications."
      }
    },
    "files": [
      "src/**/*",
      "assets/**/*",
      "package.json"
    ],
    "directories": {
      "buildResources": "build",
      "output": "dist"
    }
  }
}
```

### Entitlements (entitlements.mac.plist)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <!-- Required for Chromium JIT -->
  <key>com.apple.security.cs.allow-jit</key>
  <true/>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
  <true/>

  <!-- Required for development -->
  <key>com.apple.security.cs.allow-dyld-environment-variables</key>
  <true/>
  <key>com.apple.security.cs.disable-library-validation</key>
  <true/>

  <!-- Camera access -->
  <key>com.apple.security.device.camera</key>
  <true/>

  <!-- Microphone access -->
  <key>com.apple.security.device.audio-input</key>
  <true/>
</dict>
</plist>
```

---

## API Reference

### window.electronAPI (Renderer Process)

#### Methods

##### meeting:update
Update the current meeting state.

```javascript
await window.electronAPI.updateMeetingState({
  inMeeting: boolean,
  meetingCode: string,
  participants: number,
  isMuted: boolean,
  cameraEnabled: boolean,
  timestamp: number
});
```

##### meeting:get-info
Get information about the current meeting.

```javascript
const meetingInfo = await window.electronAPI.getMeetingInfo();
// Returns: { inMeeting, meetingCode, participants, ... } or null
```

##### notification:send
Send a notification to be displayed natively.

```javascript
window.electronAPI.sendNotification({
  type: 'meeting-start' | 'participant-join' | 'participant-leave' | 'chat' | 'hand-raised',
  title: string,
  body: string,
  timestamp: number,
  meetingCode: string
});
```

##### auth:sign-in
Initiate Google sign-in flow.

```javascript
await window.electronAPI.signInWithGoogle();
```

##### auth:sign-out
Sign out and clear session.

```javascript
await window.electronAPI.signOut();
```

##### auth:check
Check current authentication status.

```javascript
const isAuthenticated = await window.electronAPI.checkAuthStatus();
```

#### Event Listeners

##### onAuthStatus
Listen for authentication status updates.

```javascript
window.electronAPI.onAuthStatus((event, status) => {
  console.log('Auth status:', status);
});
```

##### onMeetingCommand
Listen for meeting commands from menu bar.

```javascript
window.electronAPI.onMeetingCommand((event, command) => {
  // command: 'mute' | 'unmute' | 'camera-on' | 'camera-off' | 'leave'
  console.log('Meeting command:', command);
});
```

---

## Performance Considerations

### Memory Management
- Monitor memory usage during long meetings
- Implement cleanup for DOM observers
- Clear old notification data
- Limit stored meeting history

### CPU Optimization
- Debounce meeting state checks
- Use efficient DOM queries
- Minimize JavaScript execution in renderer
- Leverage Chromium's hardware acceleration

### Network
- Minimal IPC traffic
- Batch state updates when possible
- No unnecessary API calls

---

## Testing Strategy

### Unit Tests
- BadgeStateManager logic
- MeetingDetector parsing
- Input sanitization
- Rate limiting

### Integration Tests
- Authentication flow
- Meeting detection
- Notification system
- IPC communication

### Manual Testing
- All user flows
- Different macOS versions
- Various meeting scenarios
- Permission handling

---

## Deployment

### Build Process

```bash
# Install dependencies
npm install

# Development
npm run dev

# Production build
npm run build:mac
```

### Distribution

Output files in `dist/`:
- `MeetMac-1.0.0.dmg` - Installer
- `MeetMac.app` - Application bundle
- `MeetMac-1.0.0-mac.zip` - Portable version

---

## Conclusion

This technical specification provides a comprehensive blueprint for implementing MeetMac. The architecture leverages proven patterns from ChatMac while introducing new components specifically for video conferencing use cases.

Key technical challenges addressed:
- Secure Google authentication
- Reliable meeting detection
- Native macOS integration
- Media permission handling
- Performance optimization

The modular design allows for incremental implementation and future extensibility.
