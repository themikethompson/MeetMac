# MeetMac Implementation Checklist

**Version:** 1.0
**Date:** November 6, 2025

---

## How to Use This Checklist

- [ ] = Not started
- [→] = In progress
- [✓] = Completed
- [⚠] = Blocked/Issues

**Instructions:** Copy this file to your project directory and check off items as you complete them.

---

## Phase 1: Project Setup & Foundation (Week 1)

### 1.1 Initial Project Setup

- [ ] Create new project directory `/Users/mikethompson/Desktop/MeetMac`
- [ ] Copy relevant files from ChatMac as starting point
  - [ ] Copy `src/main.js`
  - [ ] Copy `src/preload.js`
  - [ ] Copy `src/auth.html`
  - [ ] Copy `src/preferences.html`
  - [ ] Copy `package.json`
  - [ ] Copy `.gitignore`
  - [ ] Copy `build/entitlements.mac.plist`
  - [ ] Copy `scripts/notarize.js`
- [ ] Initialize git repository
  ```bash
  cd /Users/mikethompson/Desktop/MeetMac
  git init
  git add .
  git commit -m "Initial commit from ChatMac base"
  ```
- [ ] Create `.gitignore` (if not copied)
- [ ] Create `README.md` placeholder
- [ ] Create `assets/` directory

### 1.2 Global Rebranding

**Find and replace across all files:**

- [ ] Replace `chatmac` → `meetmac` (lowercase)
- [ ] Replace `ChatMac` → `MeetMac` (CamelCase)
- [ ] Replace `com.chatmac` → `com.meetmac` (bundle ID)
- [ ] Replace `chat.google.com` → `meet.google.com`
- [ ] Replace `mail.google.com/chat` → `meet.google.com`
- [ ] Replace `persist:chatmac` → `persist:meetmac` (session partition)

**Files to update:**
- [ ] `package.json`
- [ ] `src/main.js`
- [ ] `src/preload.js`
- [ ] `src/auth.html`
- [ ] `src/preferences.html`

### 1.3 Update package.json

- [ ] Change `name` to `"meetmac"`
- [ ] Change `version` to `"1.0.0"`
- [ ] Change `description` to `"Native macOS client for Google Meet"`
- [ ] Update `build.appId` to `"com.meetmac"`
- [ ] Update `build.productName` to `"MeetMac"`
- [ ] Update `build.mac.category` to `"public.app-category.productivity"`
- [ ] Add media permission descriptions to `build.mac.extendInfo`:
  ```json
  "NSCameraUsageDescription": "MeetMac needs access to your camera for video calls.",
  "NSMicrophoneUsageDescription": "MeetMac needs access to your microphone for audio."
  ```
- [ ] Verify `electron` version is `^28.3.3`
- [ ] Verify `electron-builder` version is `^24.9.1`

### 1.4 Update Entitlements

Edit `build/entitlements.mac.plist`:

- [ ] Add camera entitlement:
  ```xml
  <key>com.apple.security.device.camera</key>
  <true/>
  ```
- [ ] Add microphone entitlement:
  ```xml
  <key>com.apple.security.device.audio-input</key>
  <true/>
  ```
- [ ] Verify existing JIT entitlements are present
- [ ] Verify library validation is disabled (required for screen sharing)

### 1.5 Install Dependencies & Test

- [ ] Run `npm install`
- [ ] Fix any dependency issues
- [ ] Run `npm start` to test basic app
- [ ] Verify app opens and shows auth window
- [ ] Verify meet.google.com URL is attempted (even if auth fails)
- [ ] Check console for any errors
- [ ] Close app and verify it quits properly

### 1.6 Version Control

- [ ] Commit initial changes
  ```bash
  git add .
  git commit -m "Rebrand ChatMac to MeetMac"
  ```
- [ ] Create `.github` directory (if using GitHub)
- [ ] Create initial issue labels (optional)

---

## Phase 2: Core Application Updates (Week 1-2)

### 2.1 Update main.js - URLs and Domains

- [ ] Update primary URL to `https://meet.google.com`
  - Find: `https://mail.google.com/chat/`
  - Replace: `https://meet.google.com`
- [ ] Update allowed domains in `will-navigate` handler:
  - [ ] Add `meet.google.com`
  - [ ] Remove `chat.google.com` if not needed
  - [ ] Keep `accounts.google.com`, `google.com`, etc.
- [ ] Update allowed domains in `new-window` handler (same as above)
- [ ] Test navigation restrictions by trying to open external sites

### 2.2 Update main.js - Chrome User Agent

- [ ] Verify Chrome user agent is up to date (141.0 or later)
- [ ] Test that Meet loads without detection warnings
- [ ] Verify anti-detection code is present:
  - [ ] `navigator.webdriver` is undefined
  - [ ] `navigator.vendor` is "Google Inc."
  - [ ] `chrome.runtime` is deleted
  - [ ] `navigator.plugins` is empty array
  - [ ] `navigator.languages` is set

### 2.3 Update Authentication UI (auth.html)

- [ ] Update page title to "Welcome to MeetMac"
- [ ] Update main heading to "MeetMac"
- [ ] Update welcome text:
  - Current: "Your native macOS app for Google Chat"
  - New: "Your native macOS app for Google Meet"
- [ ] Update description text to mention video calling, meetings
- [ ] Update any chat-specific language to meeting-specific
- [ ] Update CSS color scheme (optional - can keep purple or change)
- [ ] Update icon reference (will add later)
- [ ] Test auth window appearance

### 2.4 Update Preferences UI (preferences.html)

- [ ] Update page title to "MeetMac Preferences"
- [ ] Update heading to "MeetMac Preferences"
- [ ] Update account info section
- [ ] Update sign-out button text (if needed)
- [ ] Add new preferences sections (placeholders for now):
  - [ ] Notification preferences
  - [ ] Meeting preferences
  - [ ] Picture-in-Picture preferences
- [ ] Test preferences window appearance

### 2.5 Update Menu Bar

In `main.js`, find menu creation function:

- [ ] Update app name in menu to "MeetMac"
- [ ] Update "About ChatMac" to "About MeetMac"
- [ ] Keep standard menu items (Preferences, Quit, etc.)
- [ ] Add placeholder for meeting controls (will implement later)
- [ ] Update Help menu link if needed
- [ ] Test menu bar display and all menu items

### 2.6 Update Window Titles and Sizes

- [ ] Update auth window title to "MeetMac - Sign In"
- [ ] Update main window default size to 1200x800 (from 900x700)
- [ ] Update main window minimum size to 800x600 (from 600x500)
- [ ] Update preferences window title
- [ ] Test window sizes on different displays

### 2.7 Test Basic Application Flow

- [ ] Start app from scratch (delete userData if needed)
- [ ] Auth window should appear with MeetMac branding
- [ ] Click "Sign in with Google"
- [ ] Complete Google OAuth flow
- [ ] Main window should open with meet.google.com
- [ ] App should remember auth on restart
- [ ] Test preferences window (Cmd+,)
- [ ] Test sign out functionality
- [ ] Test quit (Cmd+Q)

### 2.8 Commit Progress

```bash
git add .
git commit -m "Update core app for Google Meet integration"
```

---

## Phase 3: Badge Management for Meetings (Week 2)

### 3.1 Remove ChatMac Badge Logic

In `src/main.js`:

- [ ] Find `BadgeStateManager` class
- [ ] Remove title parsing for `(N)` pattern
- [ ] Remove `unreadCount` related code
- [ ] Keep the basic badge manager structure

### 3.2 Implement Meeting Detection - URL Method

Add to `BadgeStateManager`:

- [ ] Create `isMeetingURL(url)` method
  ```javascript
  isMeetingURL(url) {
    return /meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}/.test(url);
  }
  ```
- [ ] Test URL detection with various Meet links:
  - [ ] `https://meet.google.com/abc-defg-hij`
  - [ ] `https://meet.google.com/lookup/something`
  - [ ] `https://meet.google.com/` (homepage - should be false)

### 3.3 Implement Meeting Detection - DOM Method

- [ ] Create `detectMeetingUI()` helper:
  ```javascript
  async detectMeetingUI() {
    const result = await mainWindow.webContents.executeJavaScript(`
      (function() {
        const videoGrid = document.querySelector('[data-self-video]');
        const controls = document.querySelector('[data-meeting-controls]');
        return !!(videoGrid && controls);
      })()
    `);
    return result;
  }
  ```
- [ ] Test DOM detection by inspecting Meet UI elements
- [ ] Document the selectors used for future reference
- [ ] Add fallback selectors if primary ones fail

### 3.4 Implement Meeting Detection - Combined

- [ ] Create `getCurrentMeetingState()` method:
  ```javascript
  async getCurrentMeetingState() {
    const url = mainWindow.webContents.getURL();
    const urlCheck = this.isMeetingURL(url);
    const domCheck = await this.detectMeetingUI();

    return {
      inMeeting: urlCheck && domCheck,
      url: url,
      timestamp: Date.now()
    };
  }
  ```
- [ ] Test detection in various states:
  - [ ] Homepage (not in meeting)
  - [ ] Meeting lobby (waiting to join)
  - [ ] Active meeting
  - [ ] Meeting ended

### 3.5 Update Badge Display Logic

- [ ] Replace message count logic with meeting indicator:
  ```javascript
  async updateBadge() {
    const state = await this.getCurrentMeetingState();

    if (state.inMeeting) {
      app.dock.setBadge('•'); // Bullet point for active meeting
    } else {
      app.dock.setBadge(''); // Clear badge
    }
  }
  ```
- [ ] Add debouncing (200ms delay) to prevent rapid updates
- [ ] Test badge updates when:
  - [ ] Joining a meeting
  - [ ] Leaving a meeting
  - [ ] Switching between meetings
  - [ ] Focusing/unfocusing window

### 3.6 Implement Badge Monitoring

- [ ] Keep `startVerification()` method for periodic checks
- [ ] Update to check meeting state instead of title
- [ ] Set interval to 5 seconds (when window unfocused)
- [ ] Add immediate update on window focus
- [ ] Test monitoring by leaving app in background during meeting

### 3.7 Test Badge Functionality

- [ ] Badge is empty when not in meeting ✓
- [ ] Badge shows "•" when in meeting ✓
- [ ] Badge updates within 2 seconds of joining ✓
- [ ] Badge clears within 2 seconds of leaving ✓
- [ ] No excessive badge flickering ✓
- [ ] Works when window is hidden ✓

### 3.8 Commit Progress

```bash
git add .
git commit -m "Implement meeting detection and badge management"
```

---

## Phase 4: Media Permissions (Week 2)

### 4.1 Verify Entitlements

- [ ] Check `build/entitlements.mac.plist` has camera entitlement
- [ ] Check microphone entitlement is present
- [ ] Rebuild app to apply entitlements: `npm run build:mac`

### 4.2 Add Permission Request Logic

In `src/main.js`, add new function:

- [ ] Create `setupMediaPermissions()` function:
  ```javascript
  async function setupMediaPermissions() {
    const { systemPreferences } = require('electron');

    // Camera
    const cameraStatus = await systemPreferences.getMediaAccessStatus('camera');
    if (cameraStatus !== 'granted') {
      await systemPreferences.askForMediaAccess('camera');
    }

    // Microphone
    const micStatus = await systemPreferences.getMediaAccessStatus('microphone');
    if (micStatus !== 'granted') {
      await systemPreferences.askForMediaAccess('microphone');
    }
  }
  ```
- [ ] Call `setupMediaPermissions()` after main window is created
- [ ] Test permission prompts appear on first run

### 4.3 Add Screen Sharing Permission Guidance

- [ ] Create `showScreenPermissionDialog()` function:
  ```javascript
  function showScreenPermissionDialog() {
    const { dialog, shell } = require('electron');

    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Screen Sharing Permission',
      message: 'To share your screen, enable Screen Recording permission.',
      detail: 'Go to System Preferences > Security & Privacy > Screen Recording',
      buttons: ['Open System Preferences', 'Later'],
    }).then(result => {
      if (result.response === 0) {
        shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture');
      }
    });
  }
  ```
- [ ] Add check for screen recording permission (macOS 10.15+)
- [ ] Show dialog if permission not granted
- [ ] Add "Don't show again" preference (optional)

### 4.4 Test Media Permissions

- [ ] Clean install app (reset permissions)
- [ ] Start app and check for camera permission prompt
- [ ] Grant camera permission
- [ ] Check for microphone permission prompt
- [ ] Grant microphone permission
- [ ] Join a test meeting
- [ ] Verify camera works in meeting
- [ ] Verify microphone works in meeting
- [ ] Test screen sharing:
  - [ ] Click "Present now" in Meet
  - [ ] Check if screen recording prompt appears (first time)
  - [ ] Grant screen recording permission in System Preferences
  - [ ] Verify screen sharing works

### 4.5 Add Permission Status to Preferences

In `preferences.html`:

- [ ] Add section showing permission status
- [ ] Show camera permission status (granted/denied)
- [ ] Show microphone permission status
- [ ] Show screen recording permission status
- [ ] Add buttons to open System Preferences for each
- [ ] Test preference panel displays correct status

### 4.6 Commit Progress

```bash
git add .
git commit -m "Add media permission handling"
```

---

## Phase 5: Notification System (Week 2-3)

### 5.1 Keep Existing Notification Infrastructure

From ChatMac, keep:

- [ ] `window.Notification` override in renderer
- [ ] IPC message for `notification:send`
- [ ] Native notification creation in main process
- [ ] Click handler to focus window
- [ ] Input sanitization

### 5.2 Update Notification Parsing

In `src/main.js`, update notification handler:

- [ ] Remove chat-specific parsing (sender/message format)
- [ ] Add meeting-specific parsing:
  ```javascript
  function parseMeetingNotification(title, body) {
    const types = {
      'meeting started': 'meeting-start',
      'joined': 'participant-join',
      'left': 'participant-leave',
      'raised': 'hand-raised',
      'message': 'chat',
      'recording': 'recording-start',
    };

    for (const [keyword, type] of Object.entries(types)) {
      if (title.toLowerCase().includes(keyword) ||
          body.toLowerCase().includes(keyword)) {
        return { type, title, body };
      }
    }

    return { type: 'general', title, body };
  }
  ```
- [ ] Test parsing with different notification texts

### 5.3 Test Notification Delivery

- [ ] Join a test meeting
- [ ] Have someone else join and verify "joined" notification
- [ ] Have someone leave and verify "left" notification
- [ ] Send a chat message and verify notification
- [ ] Raise hand and verify notification (if applicable)
- [ ] Verify all notifications are sanitized (no XSS)
- [ ] Verify rate limiting works (max 20/minute)

### 5.4 Add Notification Preferences

In `preferences.html`:

- [ ] Add notification enable/disable toggle
- [ ] Add sound enable/disable
- [ ] Add per-type toggles:
  - [ ] Meeting start
  - [ ] Participant join
  - [ ] Participant leave
  - [ ] Chat messages
  - [ ] Hand raised
- [ ] Save preferences to file
- [ ] Load preferences on startup
- [ ] Respect preferences in notification handler

### 5.5 Commit Progress

```bash
git add .
git commit -m "Update notification system for meeting events"
```

---

## Phase 6: Meeting State Tracking (Week 3)

### 6.1 Create meeting-detector.js

- [ ] Create new file `src/meeting-detector.js`
- [ ] Add class structure:
  ```javascript
  class MeetingDetector {
    constructor() {
      this.observer = null;
      this.checkInterval = null;
      this.currentState = null;
    }

    start() { }
    stop() { }
    detectMeeting() { }
    getCurrentState() { }
  }
  ```

### 6.2 Implement URL Detection

- [ ] Add `detectMeetingFromURL()` method
- [ ] Parse meeting code from URL
- [ ] Return meeting info object:
  ```javascript
  {
    inMeeting: true,
    meetingCode: 'abc-defg-hij',
    url: 'https://meet.google.com/abc-defg-hij'
  }
  ```

### 6.3 Implement DOM Detection

- [ ] Add `detectMeetingFromDOM()` method
- [ ] Query for meeting UI elements:
  - [ ] Video grid: `[data-self-video]`
  - [ ] Controls bar: `[data-meeting-controls]`
  - [ ] Participant list: `[data-participant-id]`
- [ ] Extract participant count from DOM
- [ ] Extract meeting code from title
- [ ] Return meeting state object

### 6.4 Implement State Extraction

- [ ] Add `getParticipantCount()` method
  - Look for participant counter element
  - Count video elements as fallback
- [ ] Add `getMutedState()` method
  - Query microphone button state
  - Return true if muted
- [ ] Add `getCameraState()` method
  - Query camera button state
  - Return true if camera is on
- [ ] Add `isPresentingScreen()` method
  - Query presentation indicator
  - Return true if presenting

### 6.5 Implement State Monitoring

- [ ] Add interval-based checking (every 1 second)
- [ ] Add MutationObserver for DOM changes
- [ ] Send state updates via IPC to main process
- [ ] Debounce rapid changes

### 6.6 Inject Detector into Renderer

In `src/main.js`:

- [ ] Inject meeting-detector.js after page load:
  ```javascript
  mainWindow.webContents.on('did-finish-load', () => {
    const detectorScript = fs.readFileSync(
      path.join(__dirname, 'meeting-detector.js'),
      'utf8'
    );
    mainWindow.webContents.executeJavaScript(detectorScript);
  });
  ```
- [ ] Verify detector starts automatically
- [ ] Test state updates are received in main process

### 6.7 Create MeetingStateManager Class

In `src/main.js`:

- [ ] Create new class:
  ```javascript
  class MeetingStateManager {
    constructor() {
      this.state = {
        inMeeting: false,
        meetingCode: null,
        participants: 0,
        isMuted: false,
        cameraEnabled: false,
      };
    }

    updateState(newState) {
      const changed = JSON.stringify(this.state) !== JSON.stringify(newState);
      this.state = { ...newState };
      if (changed) {
        this.onStateChanged();
      }
    }

    onStateChanged() {
      // Update badge
      // Update menu
      // Send notifications
    }

    getCurrentState() {
      return { ...this.state };
    }
  }
  ```
- [ ] Initialize manager on app start
- [ ] Connect to IPC updates from detector

### 6.8 Test State Tracking

- [ ] Start app and join meeting
- [ ] Verify `inMeeting` becomes true
- [ ] Verify meeting code is detected
- [ ] Mute microphone and verify `isMuted` updates
- [ ] Turn camera off and verify `cameraEnabled` updates
- [ ] Check participant count updates as people join/leave
- [ ] Share screen and verify `isPresenting` updates
- [ ] Leave meeting and verify state resets

### 6.9 Commit Progress

```bash
git add .
git commit -m "Implement meeting state detection and tracking"
```

---

## Phase 7: Menu Bar Controls (Week 3-4)

### 7.1 Update Menu Structure

In `src/main.js`:

- [ ] Find menu creation function
- [ ] Add meeting info section (dynamic):
  ```javascript
  {
    label: state.inMeeting
      ? `In Meeting: ${state.meetingCode} (${state.participants} participants)`
      : 'Not in a meeting',
    enabled: false,
  }
  ```
- [ ] Add separator
- [ ] Add meeting control items (when in meeting):
  - [ ] Mute/Unmute (Cmd+Shift+M)
  - [ ] Camera On/Off (Cmd+Shift+C)
  - [ ] Leave Meeting (Cmd+Shift+L)
- [ ] Add separator
- [ ] Add "Join from Link..." option (Cmd+J)

### 7.2 Implement Toggle Mute

- [ ] Create `toggleMute()` function:
  ```javascript
  function toggleMute() {
    mainWindow.webContents.executeJavaScript(`
      const muteButton = document.querySelector('[data-mute-button]');
      if (muteButton) muteButton.click();
    `);
  }
  ```
- [ ] Register keyboard shortcut (Cmd+Shift+M)
- [ ] Add menu item click handler
- [ ] Test mute toggle from menu
- [ ] Test keyboard shortcut

### 7.3 Implement Toggle Camera

- [ ] Create `toggleCamera()` function:
  ```javascript
  function toggleCamera() {
    mainWindow.webContents.executeJavaScript(`
      const camButton = document.querySelector('[data-camera-button]');
      if (camButton) camButton.click();
    `);
  }
  ```
- [ ] Register keyboard shortcut (Cmd+Shift+C)
- [ ] Add menu item click handler
- [ ] Test camera toggle from menu
- [ ] Test keyboard shortcut

### 7.4 Implement Leave Meeting

- [ ] Create `leaveMeeting()` function:
  ```javascript
  function leaveMeeting() {
    mainWindow.webContents.executeJavaScript(`
      const leaveButton = document.querySelector('[aria-label*="Leave"]');
      if (leaveButton) leaveButton.click();
    `);
  }
  ```
- [ ] Register keyboard shortcut (Cmd+Shift+L)
- [ ] Add menu item click handler
- [ ] Add confirmation dialog (optional)
- [ ] Test leave from menu
- [ ] Test keyboard shortcut

### 7.5 Implement Join from Link

- [ ] Create `joinFromLink()` function:
  ```javascript
  function joinFromLink() {
    dialog.showInputBox({
      title: 'Join Meeting',
      message: 'Enter meeting link or code:',
      buttons: ['Join', 'Cancel'],
    }).then(result => {
      if (result.response === 0 && result.value) {
        const url = parseM meetingInput(result.value);
        mainWindow.loadURL(url);
      }
    });
  }
  ```
- [ ] Add helper to parse meeting codes (abc-defg-hij → full URL)
- [ ] Register keyboard shortcut (Cmd+J)
- [ ] Add menu item click handler
- [ ] Test joining with:
  - [ ] Full URL
  - [ ] Meeting code only
  - [ ] Invalid input (should show error)

### 7.6 Implement Dynamic Menu Updates

- [ ] Create `updateMenu()` function
- [ ] Call when meeting state changes
- [ ] Update menu labels based on state:
  - "Mute" vs "Unmute"
  - "Turn Camera Off" vs "Turn Camera On"
  - Show/hide meeting controls
- [ ] Test menu updates dynamically during meeting

### 7.7 Test All Menu Controls

- [ ] Join a meeting
- [ ] Menu shows "In Meeting: ..." with code and participant count
- [ ] Click Mute - microphone mutes
- [ ] Click Unmute - microphone unmutes
- [ ] Use Cmd+Shift+M - toggles mute
- [ ] Click Turn Camera Off - camera turns off
- [ ] Click Turn Camera On - camera turns on
- [ ] Use Cmd+Shift+C - toggles camera
- [ ] Click Leave Meeting - leaves meeting
- [ ] Use Cmd+Shift+L - leaves meeting
- [ ] Use "Join from Link" to join new meeting

### 7.8 Commit Progress

```bash
git add .
git commit -m "Implement menu bar meeting controls"
```

---

## Phase 8: Picture-in-Picture Mode (Week 4-5)

### 8.1 Create PiP Window

In `src/main.js`:

- [ ] Add global variable for PiP window
- [ ] Create `createPiPWindow()` function:
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
        partition: 'persist:meetmac',
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
      }
    });

    pipWindow.loadURL(mainWindow.webContents.getURL());
  }
  ```
- [ ] Add window close handler
- [ ] Add window position persistence

### 8.2 Create PiP UI Customization

- [ ] Create `src/pip-styles.css`:
  ```css
  /* Hide everything except video and controls */
  body > *:not([data-meeting-container]) {
    display: none !important;
  }

  /* Compact layout */
  [data-meeting-container] {
    height: 100vh !important;
  }

  /* Focus on self video */
  [data-self-video] {
    width: 100% !important;
    height: calc(100% - 60px) !important;
  }

  /* Compact controls */
  [data-meeting-controls] {
    height: 60px !important;
    transform: scale(0.8);
  }
  ```
- [ ] Inject CSS into PiP window after load
- [ ] Test PiP appearance

### 8.3 Implement PiP Trigger

- [ ] Add logic to show PiP when:
  - Main window is hidden (Cmd+W)
  - User is in an active meeting
- [ ] Add preference to enable/disable auto-PiP
- [ ] Add menu option to toggle PiP manually
- [ ] Test PiP appears when hiding window during meeting

### 8.4 Implement PiP Controls

- [ ] Add custom control bar to PiP window:
  - Return to main window button
  - Mute toggle
  - Camera toggle
  - Leave meeting button
- [ ] Style controls to match macOS design
- [ ] Test all controls work in PiP

### 8.5 Sync State Between Main and PiP

- [ ] Share meeting state between windows
- [ ] Update both windows when state changes
- [ ] Prevent duplicate audio/video streams
- [ ] Test state synchronization:
  - [ ] Mute in main, reflects in PiP
  - [ ] Mute in PiP, reflects in main
  - [ ] Same for camera, participants, etc.

### 8.6 Handle PiP Window Lifecycle

- [ ] Show PiP when main window hides (if in meeting)
- [ ] Hide PiP when main window shows
- [ ] Close PiP when meeting ends
- [ ] Persist PiP size and position
- [ ] Handle multiple displays

### 8.7 Add PiP Preferences

In `preferences.html`:

- [ ] Add "Enable Picture-in-Picture" checkbox
- [ ] Add "Auto-show PiP when hiding window" checkbox
- [ ] Add default PiP size sliders
- [ ] Add "Always on top" checkbox
- [ ] Save preferences
- [ ] Load and apply preferences

### 8.8 Test PiP Thoroughly

- [ ] Join meeting
- [ ] Hide main window (Cmd+W)
- [ ] PiP appears with video
- [ ] Video and audio work in PiP
- [ ] Controls work in PiP
- [ ] Click "Return to main" - main window shows, PiP hides
- [ ] PiP stays on top of other windows
- [ ] PiP is draggable and resizable
- [ ] Position persists across sessions
- [ ] Leave meeting - PiP closes automatically
- [ ] Join meeting, disable PiP in prefs, hide window - no PiP

### 8.9 Commit Progress

```bash
git add .
git commit -m "Implement Picture-in-Picture mode"
```

---

## Phase 9: Icon & Branding (Week 5)

### 9.1 Design MeetMac Icon

- [ ] Create concept for icon (video camera theme)
- [ ] Choose color scheme (different from ChatMac's purple)
  - Suggested: Blue/green gradient for video/call theme
- [ ] Create vector design (SVG)
- [ ] Ensure icon is recognizable at small sizes (16x16)

### 9.2 Create Icon Assets

- [ ] Create `assets/icon.svg` (vector source)
- [ ] Generate PNG at multiple sizes:
  - [ ] 16x16
  - [ ] 16x16@2x (32x32)
  - [ ] 32x32
  - [ ] 32x32@2x (64x64)
  - [ ] 128x128
  - [ ] 128x128@2x (256x256)
  - [ ] 256x256
  - [ ] 256x256@2x (512x512)
  - [ ] 512x512
  - [ ] 512x512@2x (1024x1024)
- [ ] Create `assets/icon.iconset/` with all sizes
- [ ] Run `iconutil` to create `assets/icon.icns`:
  ```bash
  iconutil -c icns assets/icon.iconset -o assets/icon.icns
  ```
- [ ] Update `package.json` icon path to `assets/icon.icns`

### 9.3 Update Branding in UI Files

- [ ] Update `auth.html`:
  - [ ] Add icon image
  - [ ] Update color scheme
  - [ ] Polish typography
- [ ] Update `preferences.html`:
  - [ ] Add icon/logo
  - [ ] Update color scheme
  - [ ] Polish UI
- [ ] Test both windows look professional

### 9.4 Create About Dialog

- [ ] Add "About MeetMac" menu item
- [ ] Create about dialog with:
  - [ ] MeetMac icon
  - [ ] Version number
  - [ ] Copyright notice
  - [ ] Credits
  - [ ] Link to GitHub/website (optional)
- [ ] Test about dialog

### 9.5 Commit Progress

```bash
git add .
git commit -m "Add MeetMac icon and branding"
```

---

## Phase 10: Testing & Quality Assurance (Week 5-6)

### 10.1 Functional Testing - Authentication

- [ ] First-time user flow:
  - [ ] Install app
  - [ ] Open app (auth window appears)
  - [ ] Click "Sign in with Google"
  - [ ] Complete OAuth flow
  - [ ] Main window opens with meet.google.com
- [ ] Returning user flow:
  - [ ] Open app (no auth window, directly to main window)
  - [ ] meet.google.com loads immediately
- [ ] Sign out and sign back in
- [ ] Test with multiple Google accounts
- [ ] Test auth failure scenarios

### 10.2 Functional Testing - Meeting Flow

- [ ] Join a meeting via link
- [ ] Badge updates to show meeting status
- [ ] Camera permission prompt (first time)
- [ ] Microphone permission prompt (first time)
- [ ] Camera and microphone work in meeting
- [ ] Participant count updates as people join/leave
- [ ] Notifications for participant join/leave
- [ ] Share screen (permission prompt first time)
- [ ] Screen sharing works
- [ ] Leave meeting
- [ ] Badge clears

### 10.3 Functional Testing - Controls

- [ ] Mute/unmute from menu
- [ ] Mute/unmute with Cmd+Shift+M
- [ ] Camera on/off from menu
- [ ] Camera on/off with Cmd+Shift+C
- [ ] Leave meeting from menu
- [ ] Leave meeting with Cmd+Shift+L
- [ ] Join from link (Cmd+J) with:
  - [ ] Full URL
  - [ ] Meeting code only
- [ ] All keyboard shortcuts work

### 10.4 Functional Testing - PiP

- [ ] Join meeting
- [ ] Hide window (Cmd+W)
- [ ] PiP appears with video
- [ ] Controls work in PiP
- [ ] Audio works (no echo)
- [ ] Show main window (Cmd+0 or click dock)
- [ ] PiP hides
- [ ] PiP stays on top of other apps
- [ ] PiP size and position persist

### 10.5 Functional Testing - Notifications

- [ ] Join meeting, minimize window
- [ ] Someone joins - notification appears
- [ ] Someone leaves - notification appears
- [ ] Chat message - notification appears
- [ ] Click notification - window focuses
- [ ] Test notification preferences (enable/disable)
- [ ] Verify rate limiting (max 20/minute)

### 10.6 Functional Testing - Window Management

- [ ] Window size persists
- [ ] Window position persists
- [ ] Custom titlebar works
- [ ] Traffic lights work (close/minimize/maximize)
- [ ] Close button hides window (doesn't quit)
- [ ] Cmd+Q quits app
- [ ] Dock icon shows/hides window on click
- [ ] Preferences window opens (Cmd+,)

### 10.7 Edge Case Testing

- [ ] No internet connection - error handling
- [ ] Poor connection - app remains stable
- [ ] Very long meeting (2+ hours) - memory stable
- [ ] Rapid meeting join/leave - no crashes
- [ ] Multiple simultaneous meetings - handles gracefully
- [ ] Invalid meeting link - shows error
- [ ] Permission denied - shows helpful message
- [ ] Window hidden before meeting ends
- [ ] Quit app during meeting - clean exit

### 10.8 Performance Testing

- [ ] Memory usage at idle: < 200 MB
- [ ] Memory usage during meeting: < 500 MB
- [ ] CPU usage during video call: < 30%
- [ ] App startup time: < 3 seconds
- [ ] Meeting join time: matches web browser
- [ ] Badge update latency: < 2 seconds
- [ ] Notification delivery: < 1 second
- [ ] No memory leaks after extended use

### 10.9 Compatibility Testing

Test on different macOS versions:

- [ ] macOS Sonoma (14.x):
  - [ ] All features work
  - [ ] Permissions work
  - [ ] Screen sharing works
- [ ] macOS Ventura (13.x):
  - [ ] All features work
  - [ ] Permissions work
  - [ ] Screen sharing works
- [ ] macOS Monterey (12.x):
  - [ ] All features work
  - [ ] Permissions work
  - [ ] Screen sharing works

Test on different hardware:

- [ ] Apple Silicon (M1/M2/M3):
  - [ ] App runs natively
  - [ ] Performance is excellent
  - [ ] No Rosetta needed
- [ ] Intel Mac:
  - [ ] App runs correctly
  - [ ] Performance is acceptable

### 10.10 Security Testing

- [ ] All inputs are sanitized
- [ ] No XSS vulnerabilities in notifications
- [ ] Certificate validation enabled
- [ ] Context isolation enabled
- [ ] Node integration disabled
- [ ] IPC rate limiting works
- [ ] Navigation restricted to Google domains
- [ ] CSP headers present
- [ ] No MITM vulnerabilities

### 10.11 User Acceptance Testing

- [ ] Give app to 3-5 users
- [ ] Collect feedback on:
  - [ ] Installation process
  - [ ] First-time experience
  - [ ] Daily usage
  - [ ] Feature usefulness
  - [ ] Performance
  - [ ] Bugs found
- [ ] Address feedback

### 10.12 Create Test Documentation

- [ ] Document test cases
- [ ] Document test results
- [ ] List known issues (if any)
- [ ] Create bug report template

---

## Phase 11: Documentation (Week 6)

### 11.1 Write README.md

- [ ] Project description
- [ ] Features list with screenshots:
  - [ ] Native macOS integration
  - [ ] Dock badge for meetings
  - [ ] Native notifications
  - [ ] Picture-in-Picture mode
  - [ ] Menu bar controls
  - [ ] Keyboard shortcuts
- [ ] Installation instructions
- [ ] System requirements
- [ ] Usage guide
- [ ] Troubleshooting section
- [ ] FAQ
- [ ] Links to other docs
- [ ] Credits and license

### 11.2 Write INSTALL.md

- [ ] Detailed installation steps
- [ ] Gatekeeper bypass instructions:
  - [ ] Right-click > Open
  - [ ] System Preferences steps
- [ ] Permission setup guide:
  - [ ] Camera permission
  - [ ] Microphone permission
  - [ ] Screen recording permission
- [ ] Screenshots for each step
- [ ] Uninstallation instructions

### 11.3 Write CLAUDE.md (Developer Guide)

- [ ] Project overview
- [ ] Architecture description
- [ ] Technology stack
- [ ] Code structure
- [ ] Key files and their purposes
- [ ] Development setup:
  ```bash
  git clone <repo>
  cd meetmac
  npm install
  npm start
  ```
- [ ] Build instructions:
  ```bash
  npm run build:mac
  ```
- [ ] Contribution guidelines
- [ ] Code style guide
- [ ] How to add new features

### 11.4 Write SECURITY_AUDIT.md

- [ ] Security measures implemented
- [ ] Threat model
- [ ] Mitigation strategies
- [ ] Known limitations
- [ ] Best practices followed
- [ ] Responsible disclosure policy

### 11.5 Write CHANGELOG.md

- [ ] Version 1.0.0 (initial release)
- [ ] List all features
- [ ] Known issues
- [ ] Future roadmap

### 11.6 Create LICENSE File

- [ ] Choose license (MIT, Apache, GPL, etc.)
- [ ] Add license text
- [ ] Add copyright notice

### 11.7 Create Issue Templates (for GitHub)

- [ ] Bug report template:
  - [ ] Description
  - [ ] Steps to reproduce
  - [ ] Expected behavior
  - [ ] Actual behavior
  - [ ] System info
  - [ ] Screenshots
- [ ] Feature request template:
  - [ ] Description
  - [ ] Use case
  - [ ] Proposed solution
  - [ ] Alternatives considered

### 11.8 Create Pull Request Template

- [ ] Description of changes
- [ ] Issue reference
- [ ] Testing done
- [ ] Screenshots (if UI changes)
- [ ] Checklist (tests pass, docs updated, etc.)

---

## Phase 12: Build & Distribution (Week 6)

### 12.1 Verify Build Configuration

- [ ] `package.json` is correct
- [ ] `build.appId` is `com.meetmac`
- [ ] `build.productName` is `MeetMac`
- [ ] Icon path is correct
- [ ] Entitlements file is referenced
- [ ] All files are included in `build.files`

### 12.2 Clean Build

- [ ] Run `npm run clean` to remove old builds
- [ ] Delete `node_modules` and reinstall:
  ```bash
  rm -rf node_modules
  npm install
  ```
- [ ] Delete user data for clean test:
  ```bash
  rm -rf ~/Library/Application\ Support/meetmac
  ```

### 12.3 Create Development Build

- [ ] Run `npm run build:mac`
- [ ] Check `dist/` directory for output:
  - [ ] `MeetMac.app` (unpacked app)
  - [ ] `MeetMac-1.0.0.dmg` (installer)
  - [ ] `MeetMac-1.0.0-mac.zip` (portable)
- [ ] Test unpacked app:
  - [ ] Run `dist/mac/MeetMac.app`
  - [ ] Complete fresh install flow
  - [ ] Test all features

### 12.4 Test DMG Installation

- [ ] Mount `MeetMac-1.0.0.dmg`
- [ ] Drag to Applications folder
- [ ] Eject DMG
- [ ] Run from Applications
- [ ] Verify works correctly
- [ ] Check Gatekeeper warning (expected for unsigned app)

### 12.5 Optional: Code Signing

**Note:** Requires Apple Developer account ($99/year)

If signing:

- [ ] Enroll in Apple Developer Program
- [ ] Generate certificates in Xcode
- [ ] Update `package.json`:
  ```json
  "build": {
    "mac": {
      "identity": "Developer ID Application: Your Name (TEAM_ID)",
      "hardenedRuntime": true,
      "gatekeeperAssess": false
    }
  }
  ```
- [ ] Rebuild: `npm run build:mac`
- [ ] Verify signature:
  ```bash
  codesign -dv --verbose=4 dist/mac/MeetMac.app
  ```

### 12.6 Optional: Notarization

**Note:** Requires code signing first

If notarizing:

- [ ] Create app-specific password in Apple ID
- [ ] Store credentials in keychain:
  ```bash
  xcrun notarytool store-credentials "meetmac-notarization" \
    --apple-id "your@email.com" \
    --team-id "TEAM_ID" \
    --password "app-specific-password"
  ```
- [ ] Update `package.json`:
  ```json
  "build": {
    "afterSign": "scripts/notarize.js"
  }
  ```
- [ ] Build and notarize: `npm run build:mac`
- [ ] Verify notarization:
  ```bash
  spctl -a -vv dist/mac/MeetMac.app
  ```

### 12.7 Create Release Package

- [ ] Rename DMG to `MeetMac-1.0.0-macos.dmg`
- [ ] Create ZIP of app bundle:
  ```bash
  cd dist/mac
  zip -r ../../MeetMac-1.0.0-macos.zip MeetMac.app
  ```
- [ ] Calculate checksums:
  ```bash
  shasum -a 256 MeetMac-1.0.0-macos.dmg > checksums.txt
  shasum -a 256 MeetMac-1.0.0-macos.zip >> checksums.txt
  ```

### 12.8 Prepare Release Notes

Create `RELEASE_NOTES.md`:

- [ ] Version number
- [ ] Release date
- [ ] Feature list
- [ ] Installation instructions
- [ ] Known issues
- [ ] System requirements
- [ ] Changelog

### 12.9 Create GitHub Release

- [ ] Push code to GitHub
- [ ] Create tag: `v1.0.0`
- [ ] Create release on GitHub
- [ ] Upload DMG
- [ ] Upload ZIP
- [ ] Upload checksums
- [ ] Copy release notes
- [ ] Mark as "Latest Release"

### 12.10 Test Distribution

- [ ] Download DMG from GitHub
- [ ] Verify checksum matches
- [ ] Install from downloaded DMG
- [ ] Verify all features work
- [ ] Test on fresh machine (if possible)

---

## Phase 13: Post-Launch (Ongoing)

### 13.1 Monitor for Issues

- [ ] Watch GitHub issues
- [ ] Respond to bug reports
- [ ] Collect feature requests
- [ ] Monitor crash reports (if analytics added)

### 13.2 Plan Updates

- [ ] Review feedback
- [ ] Prioritize bug fixes
- [ ] Plan new features for v1.1:
  - [ ] Calendar integration
  - [ ] Meeting history
  - [ ] Enhanced PiP features
  - [ ] Customizable keyboard shortcuts
  - [ ] Themes

### 13.3 Maintain Documentation

- [ ] Update README for new features
- [ ] Keep installation guide current
- [ ] Update security audit as needed
- [ ] Maintain changelog

### 13.4 Build Community (Optional)

- [ ] Create discussions forum
- [ ] Write blog post about MeetMac
- [ ] Share on social media
- [ ] Gather user testimonials
- [ ] Create video demo

---

## Final Checklist

### Pre-Release Verification

- [ ] All Phase 1-12 tasks completed
- [ ] All features working
- [ ] All tests passing
- [ ] No critical bugs
- [ ] Documentation complete
- [ ] Build successful
- [ ] DMG tested
- [ ] Fresh install tested
- [ ] Performance acceptable
- [ ] Security audit passed

### Release Criteria

- [ ] Version 1.0.0 tagged
- [ ] GitHub release created
- [ ] Binaries uploaded
- [ ] README complete
- [ ] Installation guide complete
- [ ] License added
- [ ] Changelog updated

### Post-Release

- [ ] Announcement published
- [ ] Issues monitoring active
- [ ] Community engagement started
- [ ] v1.1 planning begun

---

## Estimated Time Breakdown

| Phase | Duration | Completion |
|-------|----------|-----------|
| Phase 1: Setup | 2-3 days | ___ / ___ |
| Phase 2: Core Updates | 3-4 days | ___ / ___ |
| Phase 3: Badge Management | 2-3 days | ___ / ___ |
| Phase 4: Media Permissions | 2-3 days | ___ / ___ |
| Phase 5: Notifications | 3-4 days | ___ / ___ |
| Phase 6: State Tracking | 4-5 days | ___ / ___ |
| Phase 7: Menu Controls | 3-4 days | ___ / ___ |
| Phase 8: Picture-in-Picture | 5-6 days | ___ / ___ |
| Phase 9: Icon & Branding | 2-3 days | ___ / ___ |
| Phase 10: Testing | 5-6 days | ___ / ___ |
| Phase 11: Documentation | 3-4 days | ___ / ___ |
| Phase 12: Build & Distribution | 2-3 days | ___ / ___ |
| **Total** | **4-6 weeks** | |

---

## Tips for Success

1. **Test frequently** - Don't wait until the end to test
2. **Commit often** - Make small, focused commits
3. **Document as you go** - Write docs while code is fresh
4. **Ask for help** - ChatMac author may have insights
5. **Start simple** - Get basic wrapper working first
6. **Iterate** - Add features incrementally
7. **Get feedback** - Show to users early and often

---

## Troubleshooting Common Issues

### App Won't Start
- Check console for errors: `Console.app`
- Verify Node.js and Electron versions
- Delete `node_modules` and reinstall
- Check file permissions

### Google Meet Won't Load
- Verify URL is correct
- Check user agent is set
- Check navigation restrictions
- Check network connectivity

### Permissions Not Working
- Verify entitlements in built app:
  ```bash
  codesign -d --entitlements - dist/mac/MeetMac.app
  ```
- Check Info.plist has usage descriptions
- Reset permissions in System Preferences

### Badge Not Updating
- Check meeting detection logic
- Add logging to badge manager
- Verify DOM selectors are correct
- Check for JavaScript errors in console

### PiP Not Working
- Verify session partition is shared
- Check window creation code
- Test CSS injection
- Check for audio duplication

---

**Good luck building MeetMac! 🚀**
