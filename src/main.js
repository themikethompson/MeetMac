const { app, BrowserWindow, Menu, Notification, ipcMain, shell, session, systemPreferences, dialog, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');

// Keep a global reference of the window objects
let authWindow;
let mainWindow;
let preferencesWindow;
let isAuthenticated = false;

// Meeting state tracking
let meetingState = {
  inMeeting: false,
  isMuted: false,
  isCameraOff: false,
  participantCount: 0
};

// Google Meet URLs
const GOOGLE_MEET_URL = 'https://meet.google.com';
const GOOGLE_MEET_APP_URL = 'https://meet.google.com';

/**
 * BadgeStateManager - Centralized badge state management for meetings
 *
 * Single source of truth for dock badge to prevent race conditions and state conflicts.
 * This class consolidates all badge-related operations into a single, managed interface
 * that handles debouncing, focus-aware updates, and periodic verification.
 *
 * Key Features:
 * - Meeting detection based on URL and DOM state
 * - Debounced updates (200ms) for rapid state changes
 * - Immediate updates on window focus for accuracy
 * - State locking to prevent concurrent badge modifications
 * - Periodic verification (5s) to catch drift when window is unfocused
 * - Comprehensive logging for debugging
 *
 * @class
 */
class BadgeStateManager {
  // Class constants for configuration values
  static DEBOUNCE_DELAY_MS = 200;
  static VERIFICATION_INTERVAL_MS = 5000;
  static RETRY_DELAY_MS = 50;
  static MAX_RETRIES = 10;
  static SYNC_DELAY_MS = 100;

  /**
   * Creates a new BadgeStateManager instance
   *
   * Initializes all state properties to their default values and logs
   * the initialization for debugging purposes.
   *
   * @constructor
   */
  constructor() {
    /** @type {boolean} Whether user is currently in a meeting */
    this.inMeeting = false;

    /** @type {boolean} Whether the main window currently has focus */
    this.windowFocused = false;

    /** @type {number} Timestamp of the last badge update (milliseconds) */
    this.lastUpdateTime = 0;

    /** @type {number|null} Timeout ID for debounced badge updates */
    this.updateTimeout = null;

    /** @type {number|null} Interval ID for periodic verification */
    this.verificationInterval = null;

    /** @type {boolean} Lock to prevent concurrent badge updates */
    this.stateLock = false;

    /** @type {number} Number of retry attempts for locked state */
    this.retryCount = 0;

    console.log('[BadgeStateManager] Initialized for meeting detection');
  }

  /**
   * Set the meeting state and update badge
   *
   * Updates the internal meeting state and triggers a badge update. The update
   * can be either debounced (200ms delay) or immediate based on the `immediate`
   * parameter and window focus state.
   *
   * @param {boolean} inMeeting - Whether user is currently in a meeting
   * @param {boolean} [immediate=false] - If true, skip debouncing for immediate update
   * @returns {void}
   */
  setMeetingState(inMeeting, immediate = false) {
    // Validate meeting state
    if (typeof inMeeting !== 'boolean') {
      console.warn('[BadgeStateManager] Invalid meeting state received:', inMeeting);
      return;
    }

    // Detect state change
    const stateChanged = this.inMeeting !== inMeeting;
    const previousState = this.inMeeting;

    this.inMeeting = inMeeting;

    if (stateChanged) {
      console.log(`[BadgeStateManager] Meeting state changed: ${previousState} → ${inMeeting}`);
    }

    // Update badge with debouncing (unless immediate or focus event)
    if (immediate || this.windowFocused) {
      this._updateBadgeImmediate();
    } else {
      this._updateBadgeDebounced();
    }
  }

  /**
   * Set window focus state and trigger immediate badge sync if gaining focus
   *
   * Tracks whether the main window currently has focus. When the window gains
   * focus (unfocused → focused), an immediate badge update is triggered to
   * ensure the badge accurately reflects current state.
   *
   * @param {boolean} focused - True if window has focus, false otherwise
   * @returns {void}
   */
  setWindowFocused(focused) {
    if (this.windowFocused !== focused) {
      console.log(`[BadgeStateManager] Window focus changed: ${focused}`);
      this.windowFocused = focused;

      // Immediate sync when window gains focus
      if (focused) {
        this._updateBadgeImmediate();
      }
    }
  }

  /**
   * Sync badge from current meeting state
   *
   * Checks if user is currently in a meeting by examining URL and DOM.
   * This is used for:
   * - Periodic verification to catch drift
   * - Emergency sync on window activation
   * - Recovery after notification clicks
   *
   * @returns {Promise<void>}
   */
  async syncFromMeetingState() {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const inMeeting = await this.getCurrentMeetingState();

      console.log(`[BadgeStateManager] Syncing meeting state → inMeeting: ${inMeeting}`);
      this.setMeetingState(inMeeting, true);
    }
  }

  /**
   * Check if URL indicates an active meeting
   *
   * Google Meet URLs follow the pattern: meet.google.com/{meeting-code}
   * Meeting codes are typically 3 groups of letters separated by hyphens (e.g., abc-defg-hij)
   *
   * @param {string} url - The URL to check
   * @returns {boolean} True if URL indicates an active meeting
   */
  isMeetingURL(url) {
    // Match Google Meet meeting room URLs
    // Pattern: meet.google.com/{meeting-code} where code is like "abc-defg-hij"
    const meetingPattern = /meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}/i;
    return meetingPattern.test(url);
  }

  /**
   * Check if DOM indicates an active meeting
   *
   * Examines the page DOM for elements that indicate the user is in an active meeting.
   * This provides additional verification beyond URL matching.
   *
   * @returns {Promise<boolean>} True if DOM indicates an active meeting
   */
  async checkMeetingDOM() {
    if (!mainWindow || mainWindow.isDestroyed()) {
      return false;
    }

    try {
      const result = await mainWindow.webContents.executeJavaScript(`
        (function() {
          // Look for Google Meet's video container or control buttons
          // These elements are present when in an active meeting
          const videoElements = document.querySelector('[data-allocation-index]') ||
                               document.querySelector('[data-self-name]') ||
                               document.querySelector('div[jsname][data-participant-id]');

          const controlButtons = document.querySelector('[data-mute-button]') ||
                                document.querySelector('[aria-label*="microphone"]') ||
                                document.querySelector('[aria-label*="camera"]') ||
                                document.querySelector('[aria-label*="Leave call"]');

          return !!(videoElements || controlButtons);
        })()
      `);
      return result === true;
    } catch (error) {
      console.error('[BadgeStateManager] Error checking meeting DOM:', error);
      return false;
    }
  }

  /**
   * Get comprehensive meeting state (URL + DOM verification)
   *
   * Combines URL-based and DOM-based detection for the most accurate meeting state.
   * Both checks must pass for a positive meeting detection.
   *
   * @returns {Promise<boolean>} True if user is in an active meeting
   */
  async getCurrentMeetingState() {
    if (!mainWindow || mainWindow.isDestroyed()) {
      return false;
    }

    const url = mainWindow.webContents.getURL();
    const urlCheck = this.isMeetingURL(url);

    // If URL doesn't indicate a meeting, no need to check DOM
    if (!urlCheck) {
      return false;
    }

    // Verify with DOM check for additional accuracy
    const domCheck = await this.checkMeetingDOM();

    console.log(`[BadgeStateManager] Meeting state - URL: ${urlCheck}, DOM: ${domCheck}`);

    return urlCheck && domCheck;
  }

  /**
   * Update badge immediately without debouncing (private method)
   *
   * Cancels any pending debounced update and immediately applies the badge
   * to the dock. Used when immediate accuracy is required (e.g., on focus).
   *
   * @private
   * @returns {void}
   */
  _updateBadgeImmediate() {
    // Clear any pending debounced update
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
      this.updateTimeout = null;
    }

    this._applyBadge();
  }

  /**
   * Update badge with debouncing to handle rapid title changes (private method)
   *
   * Schedules a badge update after a delay (DEBOUNCE_DELAY_MS). If called multiple times
   * within the delay period, only the last call takes effect (debouncing). This prevents
   * excessive badge updates when Google Meet rapidly changes the page title.
   *
   * @private
   * @returns {void}
   */
  _updateBadgeDebounced() {
    // Clear existing timeout
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }

    // Schedule new update
    this.updateTimeout = setTimeout(() => {
      this._applyBadge();
      this.updateTimeout = null;
    }, BadgeStateManager.DEBOUNCE_DELAY_MS);
  }

  /**
   * Apply badge to dock - the only place that calls app.dock.setBadge() (private method)
   *
   * This is the single point where the badge is actually written to the macOS dock.
   * Implements state locking to prevent concurrent updates, which could cause race
   * conditions and persistent badge dots.
   *
   * Behavior:
   * - If in meeting: displays "•" (bullet point) as badge
   * - If not in meeting: displays empty string to remove badge completely
   * - If already updating: queues a retry with limit (MAX_RETRIES)
   * - macOS only: no-op on other platforms
   *
   * @private
   * @returns {void}
   */
  _applyBadge() {
    if (process.platform !== 'darwin') {
      return;
    }

    // Prevent concurrent updates with retry limiting
    if (this.stateLock) {
      if (this.retryCount >= BadgeStateManager.MAX_RETRIES) {
        console.warn('[BadgeStateManager] Max retries reached, dropping update');
        this.retryCount = 0;
        return;
      }
      console.log(`[BadgeStateManager] State locked, queueing retry ${this.retryCount + 1}/${BadgeStateManager.MAX_RETRIES}`);
      this.retryCount++;
      setTimeout(() => this._applyBadge(), BadgeStateManager.RETRY_DELAY_MS);
      return;
    }

    this.stateLock = true;
    this.retryCount = 0; // Reset retry counter on successful entry

    try {
      const now = Date.now();
      const badgeValue = this.inMeeting ? '•' : '';

      console.log(`[BadgeStateManager] Applying badge: "${badgeValue}" (inMeeting: ${this.inMeeting}, focused: ${this.windowFocused})`);

      app.dock.setBadge(badgeValue);
      this.lastUpdateTime = now;

    } catch (error) {
      console.error('[BadgeStateManager] Error applying badge:', error);
    } finally {
      this.stateLock = false;
    }
  }

  /**
   * Reset badge and clear all state
   *
   * Immediately sets the meeting state to false and clears the window focus state.
   * Also clears any pending timeouts to prevent stale updates.
   * Used primarily during sign-out to ensure clean state before showing auth window.
   *
   * @returns {void}
   */
  reset() {
    console.log('[BadgeStateManager] Resetting all state');

    // Clear any pending debounced updates
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
      this.updateTimeout = null;
    }

    this.setMeetingState(false, true);
    this.windowFocused = false;
    this.retryCount = 0;
  }

  /**
   * Start periodic verification to catch drift
   *
   * Starts an interval that runs syncFromMeetingState() periodically when the window
   * is not focused. This failsafe mechanism catches any drift between the actual
   * meeting state and the badge state (e.g., if a URL change was missed).
   *
   * Safe to call multiple times - only creates one interval.
   *
   * @returns {void}
   */
  startVerification() {
    if (this.verificationInterval) {
      return;
    }

    this.verificationInterval = setInterval(() => {
      if (!this.windowFocused && mainWindow && !mainWindow.isDestroyed()) {
        console.log('[BadgeStateManager] Running periodic verification');
        this.syncFromMeetingState();
      }
    }, BadgeStateManager.VERIFICATION_INTERVAL_MS);

    console.log(`[BadgeStateManager] Started periodic verification (${BadgeStateManager.VERIFICATION_INTERVAL_MS}ms interval)`);
  }

  /**
   * Stop periodic verification
   *
   * Stops the periodic verification interval if it's running. Safe to call
   * even if verification is not running.
   *
   * Called during sign-out to clean up resources.
   *
   * @returns {void}
   */
  stopVerification() {
    if (this.verificationInterval) {
      clearInterval(this.verificationInterval);
      this.verificationInterval = null;
      console.log('[BadgeStateManager] Stopped periodic verification');
    }
  }
}

// Initialize global badge state manager
const badgeManager = new BadgeStateManager();

// Chrome user agent string - updated to latest stable version (Oct 2025)
const CHROME_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.7390.122 Safari/537.36';

// Set app user agent to mimic Chrome browser
app.commandLine.appendSwitch('user-agent', CHROME_USER_AGENT);

// Disable automation flags that Google detects
app.commandLine.appendSwitch('disable-blink-features', 'AutomationControlled');
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');

// Enable features that standard Chrome has
app.commandLine.appendSwitch('enable-features', 'NetworkService');

// Authentication state file
const userDataPath = app.getPath('userData');
const authStatePath = path.join(userDataPath, 'auth-state.json');

// Function to inject anti-detection code
function injectAntiDetection(webContents) {
  webContents.executeJavaScript(`
    // Hide webdriver property more effectively
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
      configurable: true
    });

    // Spoof Chrome vendor
    Object.defineProperty(navigator, 'vendor', {
      get: () => 'Google Inc.',
      configurable: true
    });

    // Hide that we're running in Electron
    if (window.chrome) {
      window.chrome.runtime = undefined;
    }

    // Modern Chrome has minimal or no plugins
    Object.defineProperty(navigator, 'plugins', {
      get: () => [],
      configurable: true
    });

    // Match Accept-Language header
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en'],
      configurable: true
    });
  `).catch(err => console.error('Failed to inject anti-detection code:', err));
}

// Check if user is authenticated
function checkAuthState() {
  try {
    if (fs.existsSync(authStatePath)) {
      const authState = JSON.parse(fs.readFileSync(authStatePath, 'utf8'));
      isAuthenticated = authState.authenticated === true;
      return isAuthenticated;
    }
  } catch (error) {
    console.error('Error checking auth state:', error);
  }
  return false;
}

// Save authentication state
function saveAuthState(authenticated) {
  try {
    fs.writeFileSync(authStatePath, JSON.stringify({ authenticated, timestamp: Date.now() }));
    isAuthenticated = authenticated;
  } catch (error) {
    console.error('Error saving auth state:', error);
  }
}

// Check if user is logged into Google
async function checkGoogleAuth() {
  try {
    const ses = session.fromPartition('persist:meetmac');
    const cookies = await ses.cookies.get({});
    const hasGoogleCookies = cookies.some(cookie =>
      cookie.domain.includes('google.com') &&
      (cookie.name === 'SID' || cookie.name === 'HSID' || cookie.name === 'SSID')
    );
    return hasGoogleCookies;
  } catch (error) {
    console.error('Error checking Google auth:', error);
    return false;
  }
}

// Request media permissions (camera and microphone)
async function requestMediaPermissions() {
  if (process.platform !== 'darwin') {
    console.log('[MediaPermissions] Not on macOS, skipping permission requests');
    return;
  }

  try {
    console.log('[MediaPermissions] Requesting camera and microphone access...');

    // Request camera permission
    const cameraStatus = systemPreferences.getMediaAccessStatus('camera');
    console.log(`[MediaPermissions] Camera status: ${cameraStatus}`);

    if (cameraStatus !== 'granted') {
      const cameraGranted = await systemPreferences.askForMediaAccess('camera');
      console.log(`[MediaPermissions] Camera access ${cameraGranted ? 'granted' : 'denied'}`);
    }

    // Request microphone permission
    const micStatus = systemPreferences.getMediaAccessStatus('microphone');
    console.log(`[MediaPermissions] Microphone status: ${micStatus}`);

    if (micStatus !== 'granted') {
      const micGranted = await systemPreferences.askForMediaAccess('microphone');
      console.log(`[MediaPermissions] Microphone access ${micGranted ? 'granted' : 'denied'}`);
    }

    console.log('[MediaPermissions] Media permission requests complete');
  } catch (error) {
    console.error('[MediaPermissions] Error requesting media permissions:', error);
  }
}

// Show screen sharing permission dialog
function showScreenSharingPermissionDialog() {
  if (process.platform !== 'darwin') {
    return;
  }

  // Check if screen recording permission is granted
  // Note: On macOS 10.15+, screen recording requires explicit permission
  const hasScreenPermission = systemPreferences.getMediaAccessStatus('screen');

  if (hasScreenPermission === 'granted') {
    console.log('[MediaPermissions] Screen recording permission already granted');
    return;
  }

  console.log('[MediaPermissions] Screen recording permission not granted');

  // Show dialog to guide user to System Preferences
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Screen Sharing Permission Required',
    message: 'To share your screen in Google Meet, MeetMac needs Screen Recording permission.',
    detail: 'Go to System Preferences > Privacy & Security > Screen Recording and enable MeetMac.\n\nNote: You may need to restart MeetMac after granting permission.',
    buttons: ['Open System Preferences', 'Later'],
    defaultId: 0,
    cancelId: 1
  }).then(result => {
    if (result.response === 0) {
      // Open System Preferences to Screen Recording section
      shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture');
    }
  }).catch(err => {
    console.error('[MediaPermissions] Error showing screen permission dialog:', err);
  });
}

// Get current media permission statuses
function getMediaPermissionStatuses() {
  if (process.platform !== 'darwin') {
    return {
      camera: 'not-applicable',
      microphone: 'not-applicable',
      screen: 'not-applicable'
    };
  }

  return {
    camera: systemPreferences.getMediaAccessStatus('camera'),
    microphone: systemPreferences.getMediaAccessStatus('microphone'),
    screen: systemPreferences.getMediaAccessStatus('screen')
  };
}

// Toggle microphone mute in Google Meet
async function toggleMute() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    console.log('[MeetingControls] Main window not available');
    return false;
  }

  try {
    const result = await mainWindow.webContents.executeJavaScript(`
      (function() {
        // Find the microphone button by common selectors
        const micButton = document.querySelector('[data-mute-button]') ||
                         document.querySelector('[aria-label*="microphone" i][role="button"]') ||
                         document.querySelector('[aria-label*="Turn on microphone" i]') ||
                         document.querySelector('[aria-label*="Turn off microphone" i]') ||
                         document.querySelector('[jsname="BOHaEe"]'); // Meet's mic button jsname

        if (micButton) {
          micButton.click();
          console.log('[MeetingControls] Microphone button clicked');

          // Try to determine mute state from aria-label
          const ariaLabel = micButton.getAttribute('aria-label') || '';
          const isMuted = ariaLabel.toLowerCase().includes('turn on');

          return { success: true, isMuted: !isMuted }; // Invert because we just clicked
        }

        console.log('[MeetingControls] Microphone button not found');
        return { success: false, error: 'Button not found' };
      })()
    `);

    if (result.success) {
      meetingState.isMuted = result.isMuted;
      console.log(`[MeetingControls] Mute toggled. Now: ${result.isMuted ? 'muted' : 'unmuted'}`);
      updateMenu(); // Refresh menu to show new state
    }

    return result.success;
  } catch (error) {
    console.error('[MeetingControls] Error toggling mute:', error);
    return false;
  }
}

// Toggle camera in Google Meet
async function toggleCamera() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    console.log('[MeetingControls] Main window not available');
    return false;
  }

  try {
    const result = await mainWindow.webContents.executeJavaScript(`
      (function() {
        // Find the camera button by common selectors
        const cameraButton = document.querySelector('[aria-label*="camera" i][role="button"]') ||
                            document.querySelector('[aria-label*="Turn on camera" i]') ||
                            document.querySelector('[aria-label*="Turn off camera" i]') ||
                            document.querySelector('[jsname="I5DLJc"]'); // Meet's camera button jsname

        if (cameraButton) {
          cameraButton.click();
          console.log('[MeetingControls] Camera button clicked');

          // Try to determine camera state from aria-label
          const ariaLabel = cameraButton.getAttribute('aria-label') || '';
          const isCameraOff = ariaLabel.toLowerCase().includes('turn on');

          return { success: true, isCameraOff: !isCameraOff }; // Invert because we just clicked
        }

        console.log('[MeetingControls] Camera button not found');
        return { success: false, error: 'Button not found' };
      })()
    `);

    if (result.success) {
      meetingState.isCameraOff = result.isCameraOff;
      console.log(`[MeetingControls] Camera toggled. Now: ${result.isCameraOff ? 'off' : 'on'}`);
      updateMenu(); // Refresh menu to show new state
    }

    return result.success;
  } catch (error) {
    console.error('[MeetingControls] Error toggling camera:', error);
    return false;
  }
}

// Get current meeting control states
async function getMeetingControlStates() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return { isMuted: false, isCameraOff: false };
  }

  try {
    const result = await mainWindow.webContents.executeJavaScript(`
      (function() {
        const micButton = document.querySelector('[data-mute-button]') ||
                         document.querySelector('[aria-label*="microphone" i][role="button"]');
        const cameraButton = document.querySelector('[aria-label*="camera" i][role="button"]');

        let isMuted = false;
        let isCameraOff = false;

        if (micButton) {
          const ariaLabel = micButton.getAttribute('aria-label') || '';
          isMuted = ariaLabel.toLowerCase().includes('turn on');
        }

        if (cameraButton) {
          const ariaLabel = cameraButton.getAttribute('aria-label') || '';
          isCameraOff = ariaLabel.toLowerCase().includes('turn on');
        }

        return { isMuted, isCameraOff };
      })()
    `);

    return result;
  } catch (error) {
    console.error('[MeetingControls] Error getting control states:', error);
    return { isMuted: false, isCameraOff: false };
  }
}

// Update meeting state and menu
async function updateMeetingState() {
  const inMeeting = await badgeManager.getCurrentMeetingState();

  if (inMeeting !== meetingState.inMeeting) {
    meetingState.inMeeting = inMeeting;
    console.log(`[MeetingState] In meeting: ${inMeeting}`);
  }

  if (inMeeting) {
    // Get control states
    const controlStates = await getMeetingControlStates();
    meetingState.isMuted = controlStates.isMuted;
    meetingState.isCameraOff = controlStates.isCameraOff;
  } else {
    // Reset states when not in meeting
    meetingState.isMuted = false;
    meetingState.isCameraOff = false;
    meetingState.participantCount = 0;
  }

  updateMenu();
}

// Register global keyboard shortcuts for meeting controls
function registerGlobalShortcuts() {
  try {
    // Cmd+Shift+D to toggle mute (global shortcut)
    const muteShortcut = globalShortcut.register('CommandOrControl+Shift+D', async () => {
      if (meetingState.inMeeting) {
        console.log('[GlobalShortcut] Mute toggle triggered');
        await toggleMute();
      }
    });

    if (muteShortcut) {
      console.log('[GlobalShortcut] Registered: Cmd+Shift+D for mute toggle');
    } else {
      console.warn('[GlobalShortcut] Failed to register mute shortcut');
    }

    // Cmd+Shift+E to toggle camera (global shortcut)
    const cameraShortcut = globalShortcut.register('CommandOrControl+Shift+E', async () => {
      if (meetingState.inMeeting) {
        console.log('[GlobalShortcut] Camera toggle triggered');
        await toggleCamera();
      }
    });

    if (cameraShortcut) {
      console.log('[GlobalShortcut] Registered: Cmd+Shift+E for camera toggle');
    } else {
      console.warn('[GlobalShortcut] Failed to register camera shortcut');
    }

  } catch (error) {
    console.error('[GlobalShortcut] Error registering shortcuts:', error);
  }
}

// Unregister global shortcuts (called on app quit)
function unregisterGlobalShortcuts() {
  globalShortcut.unregisterAll();
  console.log('[GlobalShortcut] All shortcuts unregistered');
}

// Create authentication welcome window
function createAuthWindow() {
  authWindow = new BrowserWindow({
    width: 500,
    height: 650,
    resizable: false,
    title: 'Sign in to MeetMac',
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    show: false
  });

  authWindow.loadFile(path.join(__dirname, 'auth.html'));

  authWindow.once('ready-to-show', () => {
    authWindow.show();
  });

  authWindow.on('closed', () => {
    authWindow = null;
    // If auth window is closed without authentication, quit the app
    if (!isAuthenticated && !mainWindow) {
      app.quit();
    }
  });
}

// Create Google Meet authentication window
function createGoogleAuthWindow() {
  return new Promise((resolve, reject) => {
    const googleAuthWindow = new BrowserWindow({
      width: 1000,
      height: 700,
      title: 'Sign in to Google',
      titleBarStyle: 'default',
      webPreferences: {
        partition: 'persist:meetmac',
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    // Set Chrome user agent for this window
    googleAuthWindow.webContents.setUserAgent(CHROME_USER_AGENT);

    // Load Google sign-in page with redirect to Meet after authentication
    // This ensures users see the proper Google authentication flow
    const authURL = 'https://accounts.google.com/ServiceLogin?continue=https://meet.google.com';
    googleAuthWindow.loadURL(authURL);

    console.log('Opening Google sign-in for authentication...');

    // Monitor navigation to detect successful login
    googleAuthWindow.webContents.on('did-navigate', async (event, url) => {
      console.log('Auth window navigated to:', url);

      // Check if we're on Google Meet
      if (url.includes('meet.google.com')) {
        // Check if we have auth cookies
        const hasAuth = await checkGoogleAuth();

        if (hasAuth) {
          console.log('Authentication successful!');
          saveAuthState(true);

          // Close the auth window
          if (!googleAuthWindow.isDestroyed()) {
            googleAuthWindow.close();
          }

          resolve(true);
        }
      }
    });

    // Also check on page load completion
    googleAuthWindow.webContents.on('did-finish-load', async () => {
      const currentURL = googleAuthWindow.webContents.getURL();
      console.log('Page loaded:', currentURL);

      // Inject anti-detection code on every page load
      injectAntiDetection(googleAuthWindow.webContents);

      // If we're on the Meet interface
      if (currentURL.includes('meet.google.com')) {
        const hasAuth = await checkGoogleAuth();

        if (hasAuth) {
          console.log('Authentication detected on page load!');
          saveAuthState(true);

          if (!googleAuthWindow.isDestroyed()) {
            googleAuthWindow.close();
          }

          resolve(true);
        }
      }
    });

    googleAuthWindow.on('closed', () => {
      if (!isAuthenticated) {
        console.log('Auth window closed without successful authentication');
        reject(new Error('Authentication window closed'));
      }
    });
  });
}

// Create main Google Meet window
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'MeetMac',
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      partition: 'persist:meetmac'
    },
    show: false
  });

  // Set Chrome user agent
  mainWindow.webContents.setUserAgent(CHROME_USER_AGENT);

  // Load Google Meet app
  mainWindow.loadURL(GOOGLE_MEET_APP_URL);

  mainWindow.once('ready-to-show', async () => {
    mainWindow.show();

    // Bring entire app and window into focus
    app.focus({ steal: true });
    mainWindow.focus();

    // Close auth window if it's still open
    if (authWindow && !authWindow.isDestroyed()) {
      authWindow.close();
    }

    // Request media permissions (camera and microphone)
    // This will show system permission dialogs on first run
    await requestMediaPermissions();

    // Initialize badge to clean state on startup
    // This prevents residual indicators from previous sessions
    badgeManager.setMeetingState(false, true);

    // Set window as focused to prevent attention indicators
    badgeManager.setWindowFocused(true);

    // Start periodic badge verification to catch any drift
    badgeManager.startVerification();
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // Handle navigation
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const allowedDomains = [
      'meet.google.com',
      'accounts.google.com',
      'google.com',
      'gstatic.com',
      'googleapis.com',
      'googleusercontent.com'
    ];

    const urlObj = new URL(url);

    if (!allowedDomains.some(domain => urlObj.hostname.endsWith(domain))) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Monitor navigation for meeting detection
  mainWindow.webContents.on('did-navigate', async (event, url) => {
    const inMeeting = badgeManager.isMeetingURL(url);
    console.log(`[MeetMac] Navigation detected: ${url} → inMeeting: ${inMeeting}`);
    badgeManager.setMeetingState(inMeeting);

    // Update full meeting state after navigation
    setTimeout(async () => {
      await updateMeetingState();
    }, 1000);
  });

  // Also monitor in-page navigation (for single-page app transitions)
  mainWindow.webContents.on('did-navigate-in-page', async (event, url) => {
    const inMeeting = badgeManager.isMeetingURL(url);
    console.log(`[MeetMac] In-page navigation detected: ${url} → inMeeting: ${inMeeting}`);
    badgeManager.setMeetingState(inMeeting);

    // Update full meeting state after navigation
    setTimeout(async () => {
      await updateMeetingState();
    }, 1000);
  });

  // Inject custom CSS and notification monitoring
  mainWindow.webContents.on('did-finish-load', () => {
    // Inject anti-detection code first
    injectAntiDetection(mainWindow.webContents);

    // Create a small buffer zone at the top for window controls and make Google Meet's header draggable
    mainWindow.webContents.executeJavaScript(`
      // Create a small draggable buffer at the very top for window controls
      if (!document.getElementById('window-controls-buffer')) {
        const buffer = document.createElement('div');
        buffer.id = 'window-controls-buffer';
        buffer.style.cssText = \`
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 22px;
          background: transparent;
          -webkit-app-region: drag;
          z-index: 999999;
          pointer-events: none;
        \`;
        document.body.insertBefore(buffer, document.body.firstChild);
      }

      // Find Google Meet's header and make it draggable
      const observer = new MutationObserver(() => {
        const header = document.querySelector('header[role="banner"]') ||
                       document.querySelector('[role="banner"]') ||
                       document.querySelector('header');

        if (header && !header.hasAttribute('data-drag-enabled')) {
          header.style.webkitAppRegion = 'drag';
          header.setAttribute('data-drag-enabled', 'true');

          // Make clickable elements within the header non-draggable
          const interactiveElements = header.querySelectorAll('button, a, input, [role="button"]');
          interactiveElements.forEach(el => {
            el.style.webkitAppRegion = 'no-drag';
          });
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });

      // Try immediately as well
      setTimeout(() => {
        const header = document.querySelector('header[role="banner"]') ||
                       document.querySelector('[role="banner"]') ||
                       document.querySelector('header');

        if (header && !header.hasAttribute('data-drag-enabled')) {
          header.style.webkitAppRegion = 'drag';
          header.setAttribute('data-drag-enabled', 'true');

          const interactiveElements = header.querySelectorAll('button, a, input, [role="button"]');
          interactiveElements.forEach(el => {
            el.style.webkitAppRegion = 'no-drag';
          });
        }
      }, 1000);
    `);

    mainWindow.webContents.insertCSS(`
      /* Add padding to body for window controls buffer */
      body {
        padding-top: 22px !important;
      }

      /* Make Google Meet's header draggable */
      header[role="banner"],
      [role="banner"] {
        -webkit-app-region: drag !important;
      }

      /* Keep interactive elements clickable */
      header[role="banner"] button,
      header[role="banner"] a,
      header[role="banner"] input,
      header[role="banner"] [role="button"],
      [role="banner"] button,
      [role="banner"] a,
      [role="banner"] input,
      [role="banner"] [role="button"] {
        -webkit-app-region: no-drag !important;
      }

      /* Hide install app banner */
      [role="banner"] [aria-label*="Install"] {
        display: none !important;
      }

      /* Improve scrollbars */
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }

      ::-webkit-scrollbar-track {
        background: transparent;
      }

      ::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.3);
        border-radius: 4px;
      }

      ::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 0, 0, 0.5);
      }
    `);

    // Inject enhanced notification monitoring
    mainWindow.webContents.executeJavaScript(`
      const originalNotification = window.Notification;

      // Override Notification constructor to intercept Google Meet notifications
      window.Notification = function(title, options) {
        if (window.electronAPI && options) {
          // Extract sender name and message preview
          let senderName = title;
          let messageBody = options.body || '';

          // Try to parse notification title for better formatting
          // Google Meet format is usually: "Sender Name" or "Sender Name in Chat Room"
          const match = title.match(/^(.+?)(?:\s+in\s+(.+))?$/);
          if (match) {
            senderName = match[1];
            if (match[2]) {
              // Include chat room info in body
              messageBody = match[2] + ': ' + messageBody;
            }
          }

          const serializableOptions = {
            title: senderName,
            body: messageBody,
            icon: options.icon || null,
            tag: options.tag || '',
            silent: options.silent || false,
            badge: options.badge || null,
            timestamp: Date.now()
          };

          // Send to native notification system
          window.electronAPI.sendNotification(serializableOptions);
        } else if (window.electronAPI) {
          window.electronAPI.sendNotification({
            title: title,
            body: '',
            timestamp: Date.now()
          });
        }

        // Return a mock notification object instead of creating a browser notification
        // This prevents any browser notification sound from playing
        return {
          close: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => true
        };
      };

      // Preserve original Notification properties
      window.Notification.permission = originalNotification.permission;
      window.Notification.requestPermission = originalNotification.requestPermission.bind(originalNotification);

      // Auto-grant notification permission
      Object.defineProperty(window.Notification, 'permission', {
        get: function() {
          return 'granted';
        }
      });

      console.log('Enhanced notification system initialized');
    `);

    // Check meeting state after page loads (with small delay for DOM to settle)
    setTimeout(async () => {
      const inMeeting = await badgeManager.getCurrentMeetingState();
      console.log(`[MeetMac] Page loaded, meeting state: ${inMeeting}`);
      badgeManager.setMeetingState(inMeeting);

      // Update full meeting state (controls, menu, etc.)
      await updateMeetingState();
    }, 1000);
  });

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Clear badge notification feedback when window gains focus
  mainWindow.on('focus', () => {
    if (mainWindow) {
      // Notify badge manager of window focus
      badgeManager.setWindowFocused(true);
    }
  });

  // Track window blur for badge manager
  mainWindow.on('blur', () => {
    if (mainWindow) {
      badgeManager.setWindowFocused(false);
    }
  });

  createMenu();
}

// Create preferences window
function createPreferencesWindow() {
  // If preferences window already exists, focus it
  if (preferencesWindow && !preferencesWindow.isDestroyed()) {
    preferencesWindow.focus();
    return;
  }

  preferencesWindow = new BrowserWindow({
    width: 650,
    height: 600,
    resizable: false,
    title: 'Preferences',
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    show: false
  });

  preferencesWindow.loadFile(path.join(__dirname, 'preferences.html'));

  preferencesWindow.once('ready-to-show', () => {
    preferencesWindow.show();
  });

  preferencesWindow.on('closed', () => {
    preferencesWindow = null;
  });
}

function createMenu() {
  const template = [
    {
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        {
          label: 'Preferences...',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            createPreferencesWindow();
          }
        },
        { type: 'separator' },
        {
          label: 'Check for Latest Release',
          click: async () => {
            await shell.openExternal('https://github.com/themikethompson/chatmac/releases');
          }
        },
        { type: 'separator' },
        {
          label: 'Sign Out',
          click: async () => {
            await signOut();
          }
        },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'pasteAndMatchStyle' },
        { role: 'delete' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'Meeting',
      submenu: [
        {
          label: meetingState.inMeeting ? '✓ In Meeting' : 'Not in Meeting',
          enabled: false
        },
        { type: 'separator' },
        {
          label: meetingState.isMuted ? '🎤 Unmute' : '🔇 Mute',
          accelerator: 'CmdOrCtrl+D',
          enabled: meetingState.inMeeting,
          click: async () => {
            await toggleMute();
          }
        },
        {
          label: meetingState.isCameraOff ? '📹 Turn On Camera' : '📷 Turn Off Camera',
          accelerator: 'CmdOrCtrl+E',
          enabled: meetingState.inMeeting,
          click: async () => {
            await toggleCamera();
          }
        },
        { type: 'separator' },
        {
          label: 'Refresh Meeting State',
          accelerator: 'CmdOrCtrl+R',
          click: async () => {
            await updateMeetingState();
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { type: 'separator' },
        { role: 'toggleDevTools' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' },
        { type: 'separator' },
        {
          label: 'MeetMac',
          accelerator: 'Cmd+0',
          click: () => {
            if (mainWindow) {
              mainWindow.show();
            }
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Open Google Meet Help',
          click: async () => {
            await shell.openExternal('https://support.google.com/meet');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Update menu to reflect current meeting state
function updateMenu() {
  createMenu();
}

// Note: updateUnreadCount function removed - MeetMac tracks meeting state instead of unread counts

async function signOut() {
  try {
    // Clear session data
    const ses = session.fromPartition('persist:meetmac');
    await ses.clearStorageData({
      storages: ['cookies', 'localstorage', 'cachestorage', 'indexdb', 'serviceworkers']
    });

    await session.defaultSession.clearStorageData({
      storages: ['cookies', 'localstorage', 'cachestorage', 'indexdb', 'serviceworkers']
    });

    // Clear auth state
    saveAuthState(false);

    // Reset badge manager
    badgeManager.reset();
    badgeManager.stopVerification();

    // Close main window
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.close();
      mainWindow = null;
    }

    // Show auth window again
    createAuthWindow();
  } catch (error) {
    console.error('Sign out error:', error);
  }
}

// IPC Handlers
ipcMain.handle('auth:sign-in', async (event) => {
  try {
    console.log('=== AUTH IPC HANDLER CALLED ===');
    console.log('Starting authentication flow...');

    if (authWindow && !authWindow.isDestroyed()) {
      console.log('Sending auth:status to auth window...');
      authWindow.webContents.send('auth:status', 'Opening Google sign-in...');
    }

    // Open Google auth window
    console.log('Creating Google auth window...');
    await createGoogleAuthWindow();

    if (authWindow && !authWindow.isDestroyed()) {
      authWindow.webContents.send('auth:success');
    }

    // Wait a moment for cookies to settle
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create main window
    createMainWindow();

    return { success: true };
  } catch (error) {
    console.error('Authentication error:', error);
    if (authWindow && !authWindow.isDestroyed()) {
      authWindow.webContents.send('auth:error', 'Authentication failed. Please try again.');
    }
    return { success: false, error: error.message };
  }
});

ipcMain.handle('auth:sign-out', async () => {
  await signOut();
  return { success: true };
});

ipcMain.handle('auth:check-status', () => {
  return { authenticated: isAuthenticated };
});

ipcMain.handle('permissions:get-statuses', () => {
  return getMediaPermissionStatuses();
});

ipcMain.handle('permissions:request-screen-sharing', () => {
  showScreenSharingPermissionDialog();
  return { success: true };
});

// Sanitize notification text to prevent XSS and injection attacks
function sanitizeNotificationText(text, maxLength = 500) {
  if (typeof text !== 'string') {
    return '';
  }

  const withoutTags = text.replace(/<[^>]*>/g, '');
  return withoutTags.substring(0, maxLength);
}

// Parse and categorize meeting notifications
function parseMeetingNotification(title, body) {
  const lowercaseTitle = title.toLowerCase();
  const lowercaseBody = body.toLowerCase();
  const combined = `${lowercaseTitle} ${lowercaseBody}`;

  // Detect notification types based on content
  const notificationTypes = {
    'participant-join': /joined|has joined|entered/i,
    'participant-leave': /left|has left|exited/i,
    'hand-raised': /raised.*hand|hand.*raised/i,
    'chat-message': /message|chat|says/i,
    'recording-start': /recording.*started|started.*recording/i,
    'recording-stop': /recording.*stopped|stopped.*recording/i,
    'meeting-start': /meeting.*starting|starting.*meeting|ready to join/i,
    'meeting-end': /meeting.*ended|ended.*meeting/i,
  };

  for (const [type, pattern] of Object.entries(notificationTypes)) {
    if (pattern.test(combined)) {
      console.log(`[Notifications] Detected ${type} notification`);
      return {
        type,
        title,
        body,
        timestamp: Date.now()
      };
    }
  }

  // Default type if no pattern matches
  return {
    type: 'general',
    title,
    body,
    timestamp: Date.now()
  };
}

ipcMain.on('notification', (event, data) => {
  if (Notification.isSupported()) {
    // Validate and sanitize notification data
    if (!data || typeof data !== 'object') {
      console.warn('Invalid notification data received:', data);
      return;
    }

    // Sanitize notification text to prevent XSS
    const sanitizedTitle = sanitizeNotificationText(data.title || 'MeetMac', 100);
    const sanitizedBody = sanitizeNotificationText(data.body || '', 500);

    // Parse notification to detect meeting event type
    const parsedNotification = parseMeetingNotification(sanitizedTitle, sanitizedBody);
    console.log(`[Notifications] Showing ${parsedNotification.type} notification`);

    // Native macOS notification with default system sound
    const notificationOptions = {
      title: sanitizedTitle,
      body: sanitizedBody
      // Note: No icon specified - macOS will use app icon by default
      // silent is false by default, which allows macOS to use its default notification sound
    };

    const notification = new Notification(notificationOptions);

    // Note: Removed app.dock.show() and manual badge setting
    // These were causing unwanted activity dots. The badge manager
    // handles all badge state automatically based on meeting state.

    // Handle notification click - bring app to focus and sync badge
    notification.on('click', () => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) {
          mainWindow.restore();
        }
        if (!mainWindow.isVisible()) {
          mainWindow.show();
        }
        mainWindow.focus();

        // Sync badge state from current meeting state after focusing
        // This ensures accurate badge after user interaction
        setTimeout(() => {
          badgeManager.syncFromMeetingState();
        }, BadgeStateManager.SYNC_DELAY_MS);
      }
    });

    notification.show();
  }
});

// App lifecycle
app.whenReady().then(async () => {
  // Set app name for notifications
  if (process.platform === 'darwin') {
    app.setName('MeetMac');
  }

  // Log notification support
  console.log('Notification support:', Notification.isSupported());

  // Configure session
  const ses = session.fromPartition('persist:meetmac');

  ses.webRequest.onBeforeSendHeaders((details, callback) => {
    const { requestHeaders } = details;
    requestHeaders['User-Agent'] = CHROME_USER_AGENT;

    // Add standard Chrome headers to appear more legitimate
    requestHeaders['Accept-Language'] = 'en-US,en;q=0.9';
    requestHeaders['sec-ch-ua'] = '"Chromium";v="141", "Not_A Brand";v="24"';
    requestHeaders['sec-ch-ua-mobile'] = '?0';
    requestHeaders['sec-ch-ua-platform'] = '"macOS"';

    callback({ requestHeaders });
  });

  // Register global shortcuts for meeting controls
  registerGlobalShortcuts();

  // Check if already authenticated
  const wasAuthenticated = checkAuthState();
  const hasGoogleAuth = await checkGoogleAuth();

  if (wasAuthenticated && hasGoogleAuth) {
    console.log('User already authenticated, loading main window...');
    createMainWindow();
  } else {
    console.log('No authentication found, showing welcome screen...');
    createAuthWindow();
  }

  // Create menu
  createMenu();

  // Start periodic meeting state updates (every 3 seconds when in a meeting)
  setInterval(async () => {
    if (mainWindow && !mainWindow.isDestroyed() && meetingState.inMeeting) {
      await updateMeetingState();
    }
  }, 3000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      if (isAuthenticated) {
        createMainWindow();
      } else {
        createAuthWindow();
      }
    } else if (mainWindow) {
      mainWindow.show();

      // Emergency badge sync when app is activated
      // Ensures badge is accurate after being in background
      setTimeout(() => {
        badgeManager.syncFromMeetingState();
      }, BadgeStateManager.SYNC_DELAY_MS);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  app.isQuitting = true;
  unregisterGlobalShortcuts();
});

// Certificate validation - DO NOT bypass certificate errors
// This was previously bypassed but created a critical MITM vulnerability
// If certificate issues occur, they should be investigated and fixed properly
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  // Log certificate errors for debugging but DO NOT bypass them
  console.error('Certificate error for URL:', url);
  console.error('Error details:', error);
  console.error('Certificate subject:', certificate.subjectName);

  // Always reject invalid certificates to maintain security
  callback(false);
});
