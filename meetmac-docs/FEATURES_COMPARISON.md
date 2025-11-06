# MeetMac vs ChatMac: Features Comparison

**Version:** 1.0
**Date:** November 6, 2025

---

## Overview

This document provides a comprehensive comparison between ChatMac and MeetMac, highlighting what features can be reused, what needs to be adapted, and what new features are required for the video conferencing use case.

---

## Core Features Comparison

### ✅ Features to Reuse Directly

These features can be copied from ChatMac with minimal or no changes:

| Feature | ChatMac Implementation | MeetMac Usage | Notes |
|---------|----------------------|---------------|-------|
| **Authentication System** | Google OAuth with cookie validation | ✅ Identical | Same Google account system |
| **Auth Window UI** | Welcome screen with sign-in button | ✅ Reuse with branding | Update logo and text only |
| **Session Management** | Persistent partition `persist:chatmac` | ✅ Change to `persist:meetmac` | Same pattern, different name |
| **IPC Security Model** | contextBridge with rate limiting | ✅ Identical | Proven security model |
| **Preload Script Structure** | Secure API exposure | ✅ Identical | Core structure unchanged |
| **Window Management** | BrowserWindow with custom titlebar | ✅ Identical | Same window architecture |
| **Menu Bar Integration** | Native macOS menus | ✅ Reuse with updates | Add meeting-specific items |
| **External Link Handling** | Open non-Google links in browser | ✅ Identical | Same security policy |
| **Preferences Window** | Settings and sign-out UI | ✅ Reuse with branding | Add new MeetMac preferences |
| **Security Hardening** | Certificate validation, CSP, sanitization | ✅ Identical | All security measures apply |
| **Build Configuration** | electron-builder for DMG | ✅ Reuse with new IDs | Update app ID and name |
| **Keyboard Shortcuts** | Cmd+0, Cmd+W, Cmd+Q, etc. | ✅ Identical | Standard shortcuts preserved |
| **Window State Persistence** | Save size/position | ✅ Identical | Same behavior |
| **Chrome User Agent Spoofing** | Required for Google compatibility | ✅ Identical | Critical for Meet too |
| **Anti-Detection Measures** | Hide webdriver, spoof vendor | ✅ Identical | Prevent blocking |

### 🔄 Features to Adapt

These features need modification for Google Meet:

| Feature | ChatMac Implementation | MeetMac Adaptation Required | Complexity |
|---------|----------------------|----------------------------|-----------|
| **Primary URL** | `https://mail.google.com/chat/` | `https://meet.google.com` | 🟢 Simple |
| **Badge Logic** | Parse `(N)` from page title for message count | Detect active meeting, show indicator or participant count | 🟡 Medium |
| **Notification Parsing** | Parse chat message notifications | Parse meeting event notifications (join, leave, start) | 🟡 Medium |
| **Notification Types** | New message, @mention, DM | Meeting start, participant join/leave, hand raised, chat | 🟡 Medium |
| **Icon/Branding** | Purple gradient with chat bubble | Video camera theme, different color scheme | 🟢 Simple |
| **App Name** | "ChatMac" throughout codebase | "MeetMac" throughout codebase | 🟢 Simple |
| **App Description** | "Native macOS client for Google Chat" | "Native macOS client for Google Meet" | 🟢 Simple |
| **Bundle ID** | `com.chatmac` | `com.meetmac` | 🟢 Simple |
| **Allowed Domains** | chat.google.com, mail.google.com | meet.google.com | 🟢 Simple |
| **Menu Items** | Chat-specific wording | Meeting-specific wording | 🟢 Simple |
| **Custom CSS Injection** | Hide Chat banners, style scrollbars | Hide Meet banners, style video grid | 🟡 Medium |
| **Title Monitoring** | Monitor for `(N)` pattern | Monitor for meeting codes (ABC-DEFG-HIJ) | 🟢 Simple |

### ➕ New Features for MeetMac

Features that don't exist in ChatMac and need to be built:

| Feature | Description | Priority | Complexity |
|---------|-------------|----------|-----------|
| **Meeting Detection** | Detect when user is in an active meeting via URL and DOM | 🔴 Critical | 🟡 Medium |
| **Participant Counter** | Count number of participants in current meeting | 🟡 High | 🟡 Medium |
| **Meeting State Tracker** | Track mute, camera, presenting status | 🟡 High | 🟡 Medium |
| **Camera Permission** | Request and manage camera access | 🔴 Critical | 🟢 Simple |
| **Microphone Permission** | Request and manage microphone access | 🔴 Critical | 🟢 Simple |
| **Screen Capture Permission** | Request and manage screen sharing | 🔴 Critical | 🟡 Medium |
| **Picture-in-Picture Window** | Small always-on-top window for video during hide | 🟡 High | 🔴 Complex |
| **Meeting Controls in Menu** | Mute/unmute, camera on/off from menu bar | 🟡 High | 🟡 Medium |
| **Always-On-Top Mode** | Keep window above others during meetings | 🟢 Medium | 🟢 Simple |
| **Meeting Start Notifications** | Proactive reminders when meetings begin | 🟢 Medium | 🟡 Medium |
| **VIP Participant Alerts** | Notify when specific people join | 🟢 Low | 🟢 Simple |
| **Meeting End Detection** | Detect when meeting ends, clean up state | 🟡 High | 🟢 Simple |
| **Quick Join from Link** | Menu option to paste meeting link and join | 🟢 Medium | 🟢 Simple |
| **System Tray Controls** | Quick meeting controls from tray | 🟢 Low | 🟡 Medium |
| **Background Blur Control** | Toggle background blur from menu | 🟢 Low | 🟡 Medium |
| **Virtual Background Mgmt** | Manage virtual backgrounds | 🟢 Low | 🔴 Complex |

---

## Detailed Feature Analysis

### 1. Authentication System

#### ChatMac Implementation
- Two-stage verification (auth-state.json + cookies)
- Welcome screen with Google OAuth
- Persistent session partition
- Cookie validation (SID, HSID, SSID)

#### MeetMac Adaptation
**Changes Required:** Minimal - just branding
- ✅ Same Google OAuth flow
- ✅ Same cookie validation
- ✅ Same persistent session
- 🔄 Update welcome screen text and logo
- 🔄 Change partition name to `persist:meetmac`

**Effort:** 1 hour

---

### 2. Badge Management

#### ChatMac Implementation
```javascript
// Monitors page title for "(N)" pattern
// N = unread message count
// Updates dock badge with count
```

**Title Pattern:** `(5) Google Chat` → Badge shows "5"

#### MeetMac Adaptation
```javascript
// Two options for badge:
// Option A: Show indicator when in meeting (•)
// Option B: Show participant count when in meeting
```

**Title Pattern:** `ABC-DEFG-HIJ - Google Meet` → Badge shows "•" or participant count

**Detection Methods:**
1. **URL-based**: Check if URL matches meeting pattern
2. **DOM-based**: Query for meeting UI elements
3. **Title-based**: Extract meeting code from title

**Example Implementation:**
```javascript
class MeetingBadgeManager extends BadgeStateManager {
  async updateBadgeFromMeeting() {
    const meetingState = await this.detectMeetingState();

    if (meetingState.inMeeting) {
      if (meetingState.participantCount > 0) {
        app.dock.setBadge(meetingState.participantCount.toString());
      } else {
        app.dock.setBadge('•'); // Generic "in meeting" indicator
      }
    } else {
      app.dock.setBadge('');
    }
  }
}
```

**Effort:** 4-6 hours

---

### 3. Notification System

#### ChatMac Notification Types
1. New message in chat
2. @mention
3. Direct message
4. Missed calls

**Parsing Example:**
```
Title: "John Doe"
Body: "Hey, did you see the report?"
```

#### MeetMac Notification Types
1. Meeting starting soon (5 min warning)
2. Meeting started
3. Participant joined
4. Participant left
5. Hand raised
6. In-meeting chat message
7. Recording started
8. Breakout room assigned

**Parsing Example:**
```
Title: "Meeting Started"
Body: "Project Sync (ABC-DEFG-HIJ) has started"

Title: "Jane Smith joined"
Body: "Jane Smith has joined the meeting"
```

**Adaptation Required:**
- Different notification format parsing
- Different notification types
- Meeting-specific click actions (focus and navigate to meeting)
- Meeting code extraction and storage

**Effort:** 6-8 hours

---

### 4. Meeting Detection (NEW)

#### Purpose
Detect when the user is in an active Google Meet call.

#### Detection Methods

##### Method 1: URL Pattern
```javascript
function isInMeeting() {
  const url = window.location.href;
  return /meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}/.test(url);
}
```

**Pros:** Simple, reliable
**Cons:** Doesn't detect lobby state

##### Method 2: DOM Elements
```javascript
function isInMeeting() {
  // Look for video grid container
  const videoGrid = document.querySelector('[data-self-video]');

  // Look for controls bar
  const controls = document.querySelector('[jsname="mE5g3b"]');

  return !!(videoGrid && controls);
}
```

**Pros:** Detects actual meeting state
**Cons:** Fragile if Google changes DOM

##### Method 3: Title Pattern
```javascript
function getMeetingCode() {
  const match = document.title.match(/([A-Z]{3}-[A-Z]{4}-[A-Z]{3})/);
  return match ? match[1] : null;
}
```

**Pros:** Extracts meeting code
**Cons:** Title may not always contain code

#### Recommended: Combined Approach
Use all three methods for robustness:
```javascript
function detectMeetingState() {
  const urlCheck = isInMeetingURL();
  const domCheck = hasMeetingUI();
  const titleCode = getMeetingCode();

  return {
    inMeeting: urlCheck && domCheck,
    meetingCode: titleCode,
    confidence: (urlCheck + domCheck + !!titleCode) / 3
  };
}
```

**Effort:** 8-10 hours

---

### 5. Media Permissions (NEW)

#### Required Permissions

##### Camera
**Info.plist:**
```xml
<key>NSCameraUsageDescription</key>
<string>MeetMac needs access to your camera for video calls.</string>
```

**Code:**
```javascript
const cameraStatus = await systemPreferences.getMediaAccessStatus('camera');
if (cameraStatus !== 'granted') {
  await systemPreferences.askForMediaAccess('camera');
}
```

##### Microphone
**Info.plist:**
```xml
<key>NSMicrophoneUsageDescription</key>
<string>MeetMac needs access to your microphone for audio.</string>
```

**Code:**
```javascript
const micStatus = await systemPreferences.getMediaAccessStatus('microphone');
if (micStatus !== 'granted') {
  await systemPreferences.askForMediaAccess('microphone');
}
```

##### Screen Capture
**Entitlements:**
```xml
<key>com.apple.security.cs.disable-library-validation</key>
<true/>
```

**Handling:**
Screen recording permission can't be requested programmatically on macOS 10.15+. Must guide user to System Preferences.

**Effort:** 4-6 hours (including UI for permission guidance)

---

### 6. Picture-in-Picture Mode (NEW)

#### Purpose
Keep video visible when main window is hidden.

#### Implementation

**Window Creation:**
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
    hasShadow: true,
    webPreferences: {
      partition: 'persist:meetmac', // Share session with main window
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    }
  });

  // Clone current meeting URL
  pipWindow.loadURL(mainWindow.webContents.getURL());
}
```

**CSS Customization:**
```css
/* Hide everything except video and controls */
body > *:not([data-meeting-container]) {
  display: none !important;
}

/* Compact controls */
[data-meeting-controls] {
  transform: scale(0.8);
}

/* Focus on self video */
[data-self-video] {
  width: 100% !important;
  height: 100% !important;
}
```

**Challenges:**
- Syncing state between main and PiP window
- Preventing duplicate audio
- Handling window transitions
- Persisting PiP position

**Effort:** 16-20 hours

---

### 7. Meeting Controls in Menu Bar (NEW)

#### Purpose
Quick access to meeting controls without opening window.

#### Menu Structure

```
MeetMac
├── About MeetMac
├── Preferences...       Cmd+,
├── ──────────────────
├── In Meeting: Project Sync (5 participants)  [grayed out, info only]
├── Mute                 Cmd+Shift+M
├── Turn Camera Off      Cmd+Shift+C
├── Leave Meeting        Cmd+Shift+L
├── ──────────────────
├── Join from Link...    Cmd+J
├── ──────────────────
├── Sign Out
├── Quit MeetMac         Cmd+Q
```

#### Implementation

**Dynamic Menu:**
```javascript
function buildMeetingMenu(meetingState) {
  const meetingMenu = [];

  if (meetingState.inMeeting) {
    meetingMenu.push({
      label: `In Meeting: ${meetingState.meetingCode} (${meetingState.participantCount} participants)`,
      enabled: false,
    });

    meetingMenu.push({
      label: meetingState.isMuted ? 'Unmute' : 'Mute',
      accelerator: 'CommandOrControl+Shift+M',
      click: () => toggleMute(),
    });

    meetingMenu.push({
      label: meetingState.cameraEnabled ? 'Turn Camera Off' : 'Turn Camera On',
      accelerator: 'CommandOrControl+Shift+C',
      click: () => toggleCamera(),
    });

    meetingMenu.push({
      label: 'Leave Meeting',
      accelerator: 'CommandOrControl+Shift+L',
      click: () => leaveMeeting(),
    });
  } else {
    meetingMenu.push({
      label: 'Not in a meeting',
      enabled: false,
    });
  }

  return meetingMenu;
}
```

**Executing Controls:**
```javascript
function toggleMute() {
  mainWindow.webContents.executeJavaScript(`
    document.querySelector('[data-mute-button]').click();
  `);
}
```

**Effort:** 8-10 hours

---

### 8. Window Management

#### ChatMac Behavior
- Default size: 900x700
- Custom titlebar with drag regions
- Close button hides window (doesn't quit)
- Cmd+Q to quit

#### MeetMac Behavior
**Changes Required:**
- Default size: 1200x800 (larger for video)
- Minimum size: 800x600 (vs ChatMac's 600x500)
- ✅ Same titlebar behavior
- ✅ Same hide/quit behavior
- ➕ Add always-on-top option
- ➕ PiP transition when hiding during meeting

**Effort:** 2-4 hours

---

## Feature Priority Matrix

### Phase 1: Must-Have (MVP)
These features are required for a functional MeetMac v1.0:

| Feature | Reason |
|---------|--------|
| Authentication | Can't use Meet without Google account |
| Basic window management | Core app functionality |
| URL change to meet.google.com | Core functionality |
| Meeting detection | Need to know when in meeting |
| Camera permission | Required for video calls |
| Microphone permission | Required for audio |
| Screen sharing permission | Common use case |
| Basic badge indicator | Show meeting status |
| Meeting notifications | User awareness |
| Branding update | Professional appearance |

### Phase 2: Should-Have (v1.1)
Enhance user experience significantly:

| Feature | Reason |
|---------|--------|
| Participant counter | Better meeting awareness |
| Meeting state tracking | Enable smart features |
| Menu bar controls | Convenience |
| Meeting start reminders | Proactive assistance |
| Meeting end detection | Clean state management |
| Quick join from link | Time saver |

### Phase 3: Nice-to-Have (v1.2+)
Advanced features for power users:

| Feature | Reason |
|---------|--------|
| Picture-in-Picture | Advanced multitasking |
| Always-on-top mode | Flexibility |
| VIP participant alerts | Personalization |
| System tray integration | Alternative UI |
| Background blur control | Video preferences |
| Virtual background management | Video preferences |
| Calendar integration | Proactive joining |

---

## Code Reusability Analysis

### Files That Can Be Reused Directly

✅ **Copy with minimal changes:**
- `src/preload.js` (95% reusable - just update API names)
- `build/entitlements.mac.plist` (add camera/mic entitlements)
- `scripts/notarize.js` (100% reusable)
- `.gitignore` (100% reusable)

### Files That Need Adaptation

🔄 **Modify significantly:**
- `src/main.js` (70% reusable - update URLs, badge logic, add meeting detection)
- `src/auth.html` (90% reusable - update branding)
- `src/preferences.html` (80% reusable - update branding, add new preferences)
- `package.json` (80% reusable - change IDs and names)
- `README.md` (50% reusable - rewrite for Meet features)

### Files That Need to Be Created

➕ **Build from scratch:**
- `src/meeting-detector.js` (NEW - meeting detection logic)
- `src/pip-window.html` (NEW - PiP UI)
- `assets/icon.*` (NEW - video camera icon design)
- `FEATURES_COMPARISON.md` (NEW - this document)

---

## Effort Estimation

### Total Development Effort

| Phase | Features | Estimated Hours |
|-------|----------|----------------|
| Phase 1: Foundation | Auth, windows, basic Meet wrapper | 40-50 hours |
| Phase 2: Meeting Features | Detection, permissions, notifications | 40-50 hours |
| Phase 3: Enhanced UX | PiP, menu controls, advanced features | 50-60 hours |
| Phase 4: Polish | Testing, docs, build, icon | 30-40 hours |
| **Total** | | **160-200 hours** |

### Breakdown by Feature Category

| Category | Hours | Percentage |
|----------|-------|------------|
| Reusable from ChatMac | 20-30 | 12-15% |
| Adaptations | 40-50 | 25% |
| New features | 70-90 | 45% |
| Testing & QA | 20-30 | 15% |
| Documentation | 10-15 | 5-7% |

---

## Risk Analysis

### Low Risk (Can reuse from ChatMac)
- Authentication system ✅
- IPC security model ✅
- Window management ✅
- Build configuration ✅

### Medium Risk (Need adaptation)
- Badge management (different detection method) 🟡
- Notification parsing (different format) 🟡
- Meeting detection (DOM may change) 🟡

### High Risk (Complex new features)
- Picture-in-Picture mode (complex state management) 🔴
- Media permissions (OS-dependent behavior) 🟡
- Meeting state tracking (fragile DOM queries) 🟡

---

## Migration Path from ChatMac

### Step-by-Step Approach

1. **Clone ChatMac repository**
   - Create new `meetmac` directory
   - Copy all files from ChatMac
   - Initialize new git repository

2. **Global find-and-replace**
   - `chatmac` → `meetmac`
   - `ChatMac` → `MeetMac`
   - `com.chatmac` → `com.meetmac`
   - `chat.google.com` → `meet.google.com`
   - `mail.google.com/chat` → `meet.google.com`

3. **Update package.json**
   - Change app name and description
   - Update version to 1.0.0
   - Add new dependencies if needed

4. **Test basic wrapper**
   - Run `npm install`
   - Run `npm start`
   - Verify meet.google.com loads
   - Verify auth flow works

5. **Remove ChatMac-specific code**
   - Remove message count parsing from badge manager
   - Remove chat notification parsing

6. **Add MeetMac-specific code**
   - Implement meeting detection
   - Add media permission requests
   - Create new notification parsers
   - Update badge logic for meetings

7. **Create new assets**
   - Design MeetMac icon
   - Update branding in UI files

8. **Test thoroughly**
   - All meeting scenarios
   - Permission flows
   - Notifications
   - Badge updates

9. **Update documentation**
   - README
   - INSTALL.md
   - CLAUDE.md

10. **Build and distribute**
    - Create DMG
    - Test installation
    - Prepare release

---

## Conclusion

### Summary of Differences

**What's the Same:**
- Core Electron architecture (70% code reuse)
- Authentication system (100% reuse)
- Security model (100% reuse)
- Window management (90% reuse)
- IPC communication (95% reuse)

**What's Different:**
- Primary URL (meet.google.com vs chat.google.com)
- Badge logic (meeting status vs message count)
- Notification types (meeting events vs chat messages)
- Media permissions (camera, mic, screen vs none)
- State detection (meeting status vs unread count)

**What's New:**
- Meeting detection system
- Picture-in-Picture mode
- Media permission management
- Meeting controls in menu bar
- Participant tracking
- Meeting-specific notifications

### Development Strategy

**Recommended Approach:**
1. Start with ChatMac as foundation (saves 40-50 hours)
2. Adapt core features for Meet (40-50 hours)
3. Add new meeting-specific features (70-90 hours)
4. Polish and test (30-40 hours)

**Total Timeline:** 4-6 weeks for full-time developer

### Success Metrics

MeetMac will be successful if it:
1. ✅ Maintains ChatMac's security and stability
2. ✅ Provides seamless Google Meet integration
3. ✅ Feels like a native macOS app
4. ✅ Adds value over browser experience (PiP, menu controls, native notifications)
5. ✅ Performs well during video calls (low CPU/memory)

---

**End of Features Comparison Document**
