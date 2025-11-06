# MeetMac Project Plan

**Version:** 1.0
**Date:** November 6, 2025
**Based on:** ChatMac v1.0.10 Architecture

---

## Executive Summary

MeetMac is a native macOS application for Google Meet, built using Electron. The project adapts the proven architecture of ChatMac to provide a seamless, native experience for Google Meet video conferencing on macOS.

### Key Objectives
- Create a native macOS wrapper for Google Meet
- Provide better integration than the web browser experience
- Implement native notifications, dock badge, and menu bar controls
- Ensure security and privacy with proper authentication
- Support camera, microphone, and screen sharing permissions

### Development Timeline
**Total Estimated Duration:** 4-6 weeks

---

## Phase 1: Core Application Framework (Week 1-2)

**Goal:** Establish basic MeetMac application with authentication

### 1.1 Project Setup & Initialization
**Duration:** 2-3 days

**Tasks:**
- [ ] Create new project directory structure
- [ ] Copy relevant files from ChatMac as starting point
- [ ] Update package.json with MeetMac branding
  - App ID: `com.meetmac`
  - Product name: `MeetMac`
  - Version: `1.0.0`
  - Description: "Native macOS client for Google Meet"
- [ ] Configure electron-builder for macOS builds
- [ ] Initialize git repository
- [ ] Create .gitignore for Node/Electron projects

**Deliverables:**
- Working project structure
- Clean git repository
- Build configuration ready

### 1.2 Core Application Structure
**Duration:** 3-4 days

**Tasks:**
- [ ] Adapt main.js for MeetMac
  - Change primary URL to `https://meet.google.com`
  - Update app name references throughout
  - Preserve BadgeStateManager class
  - Keep authentication system
- [ ] Update preload.js
  - Maintain security model (context isolation)
  - Keep IPC rate limiting
  - Update API naming if needed
- [ ] Create auth.html for MeetMac
  - Update branding and colors
  - Change welcome message
  - Update icon/logo
- [ ] Create preferences.html
  - Update branding
  - Maintain sign-out functionality

**Deliverables:**
- Functional Electron app loading meet.google.com
- Working authentication flow
- Secure IPC communication

### 1.3 Window Management & UI
**Duration:** 2-3 days

**Tasks:**
- [ ] Implement custom titlebar for Meet
- [ ] Configure drag regions
- [ ] Set up proper window sizing
  - Default: 1200x800 (larger than ChatMac for video)
  - Minimum: 800x600
- [ ] Implement window state persistence
- [ ] Add keyboard shortcuts
  - Cmd+0: Show MeetMac
  - Cmd+W: Hide window
  - Cmd+Q: Quit
  - Cmd+,: Preferences
- [ ] Configure menu bar
  - App menu
  - Window menu
  - Help menu

**Deliverables:**
- Native-feeling macOS window
- Working keyboard shortcuts
- Proper menu bar integration

---

## Phase 2: Meet-Specific Features (Week 2-3)

**Goal:** Adapt ChatMac features for Google Meet use cases

### 2.1 Meeting Detection & Badge Management
**Duration:** 3-4 days

**Tasks:**
- [ ] Research Google Meet DOM structure
- [ ] Implement meeting detection logic
  - Detect when user is in an active meeting
  - Count number of participants
  - Detect meeting state (waiting, active, ended)
- [ ] Adapt BadgeStateManager for meetings
  - Show indicator when in active meeting
  - Optional: Show participant count
  - Clear badge when no meetings
- [ ] Test badge updates with various scenarios
  - Joining meeting
  - Leaving meeting
  - Multiple meetings
  - Window focus changes

**Deliverables:**
- Accurate meeting detection
- Working dock badge for meetings
- Reliable state management

### 2.2 Notification System
**Duration:** 2-3 days

**Tasks:**
- [ ] Analyze Google Meet notification types
  - Meeting starting soon
  - User joined meeting
  - User left meeting
  - Chat messages during meeting
  - Hand raised
- [ ] Adapt notification interception code
  - Parse Meet-specific notification format
  - Extract relevant information
  - Sanitize inputs (XSS prevention)
- [ ] Implement native macOS notifications
  - Title: Meeting name or participant
  - Body: Action (joined, left, etc.)
  - Click handler: Focus window and navigate to meeting
- [ ] Add notification preferences
  - Enable/disable different types
  - Sound on/off

**Deliverables:**
- Native notifications for meeting events
- Click-to-focus functionality
- User-configurable preferences

### 2.3 Media Permissions
**Duration:** 2-3 days

**Tasks:**
- [ ] Configure camera permission
  - Add `NSCameraUsageDescription` to Info.plist
  - Test camera access from Meet
- [ ] Configure microphone permission
  - Add `NSMicrophoneUsageDescription` to Info.plist
  - Test microphone access
- [ ] Configure screen sharing
  - Add screen capture entitlements
  - Update entitlements.mac.plist
  - Test screen sharing functionality
- [ ] Handle permission denials gracefully
  - Show helpful error messages
  - Link to System Preferences

**Deliverables:**
- Working camera access
- Working microphone access
- Working screen sharing
- Proper permission prompts

### 2.4 External Link Handling
**Duration:** 1 day

**Tasks:**
- [ ] Configure allowed domains for Meet
  - meet.google.com
  - accounts.google.com
  - google.com
  - googleapis.com
  - gstatic.com
  - googleusercontent.com
- [ ] Open external links in default browser
- [ ] Handle calendar invite links
- [ ] Test various link scenarios

**Deliverables:**
- Proper link handling
- Security maintained (no navigation outside Google)

---

## Phase 3: Enhanced Meeting Experience (Week 3-4)

**Goal:** Add MeetMac-specific features beyond ChatMac

### 3.1 Picture-in-Picture Mode
**Duration:** 3-4 days

**Tasks:**
- [ ] Research Electron overlay windows
- [ ] Implement PiP window
  - Small, always-on-top window
  - Shows active video feed
  - Draggable and resizable
- [ ] Add PiP controls
  - Mute/unmute toggle
  - Camera on/off toggle
  - Return to main window button
- [ ] Integrate with main window
  - Trigger PiP when hiding main window during meeting
  - Sync state between PiP and main window
- [ ] Add preferences for PiP
  - Enable/disable PiP
  - Default size and position

**Deliverables:**
- Working picture-in-picture mode
- Basic meeting controls in PiP
- Seamless transition between modes

### 3.2 Menu Bar Quick Controls
**Duration:** 2-3 days

**Tasks:**
- [ ] Add meeting status to menu bar
  - "In Meeting" indicator
  - Current meeting name
  - Participant count
- [ ] Implement quick actions
  - Mute/unmute (with keyboard shortcut)
  - Camera on/off (with keyboard shortcut)
  - Leave meeting
  - Join from link
- [ ] Add system tray menu
  - Show/hide window
  - Quick meeting controls
  - Settings
  - Quit
- [ ] Test menu responsiveness

**Deliverables:**
- Meeting status in menu
- Quick controls without opening window
- System tray integration

### 3.3 Meeting Notifications & Reminders
**Duration:** 2-3 days

**Tasks:**
- [ ] Implement meeting start reminders
  - Parse Google Calendar integration (if available)
  - Show notification 5 minutes before meeting
  - Show notification at meeting start time
- [ ] Add participant alerts
  - Notify when specific people join
  - Configurable VIP list
- [ ] Implement meeting end detection
  - Detect when meeting ends
  - Show summary notification
  - Clear badge
- [ ] Add notification actions
  - "Join Now" button
  - "Snooze" button
  - "Dismiss" button

**Deliverables:**
- Proactive meeting reminders
- Participant join notifications
- Actionable notifications

### 3.4 Advanced Window Features
**Duration:** 2 days

**Tasks:**
- [ ] Add always-on-top option
  - Toggle from menu
  - Keyboard shortcut
  - Persist preference
- [ ] Implement window transparency
  - Optional semi-transparent background
  - Better for screencasting
- [ ] Add fullscreen mode
  - Native macOS fullscreen
  - Exit fullscreen when leaving meeting
- [ ] Optimize for multiple displays
  - Remember last display
  - Handle display changes

**Deliverables:**
- Always-on-top functionality
- Fullscreen support
- Multi-display support

---

## Phase 4: Polish & Distribution (Week 5-6)

**Goal:** Finalize application for release

### 4.1 Icon & Branding
**Duration:** 2-3 days

**Tasks:**
- [ ] Design MeetMac icon
  - Video camera theme (vs. chat bubble)
  - Gradient color scheme
  - Professional appearance
- [ ] Create icon in multiple resolutions
  - 16x16 through 512x512@2x
  - Generate .icns file
  - Update icon.svg source
- [ ] Update all branding materials
  - Application name in all files
  - Menu text
  - Window titles
  - About dialog
- [ ] Create app screenshots
  - Main window
  - Authentication flow
  - Notification examples
  - PiP mode

**Deliverables:**
- Professional icon design
- Complete branding update
- Marketing screenshots

### 4.2 Security Audit & Hardening
**Duration:** 2-3 days

**Tasks:**
- [ ] Review all security measures from ChatMac
  - Certificate validation enabled
  - No MITM vulnerabilities
  - Proper CSP headers
- [ ] Additional security for Meet
  - Media permission handling
  - Screen capture security
  - WebRTC security
- [ ] Input sanitization review
  - All user inputs validated
  - XSS prevention
  - Injection attack prevention
- [ ] IPC security verification
  - Rate limiting working
  - No exposed Node.js APIs
  - Context isolation enforced
- [ ] Create SECURITY_AUDIT.md
- [ ] Document security measures

**Deliverables:**
- Comprehensive security audit
- Documentation of security measures
- No critical vulnerabilities

### 4.3 Testing & Quality Assurance
**Duration:** 3-4 days

**Tasks:**
- [ ] Functional testing
  - Authentication flow (first-time, returning user)
  - Meeting joining and leaving
  - Camera/microphone permissions
  - Screen sharing
  - Notifications
  - Badge updates
  - PiP mode
  - Menu controls
- [ ] Edge case testing
  - No internet connection
  - Meeting timeouts
  - Invalid credentials
  - Permission denials
  - Multiple meetings
  - Rapid window state changes
- [ ] Performance testing
  - Memory usage during long meetings
  - CPU usage with video
  - Battery impact
  - Startup time
- [ ] Compatibility testing
  - macOS Sonoma (14.x)
  - macOS Ventura (13.x)
  - macOS Monterey (12.x)
- [ ] Create test documentation

**Deliverables:**
- Comprehensive test coverage
- Bug fixes for discovered issues
- Performance optimization
- Test documentation

### 4.4 Documentation
**Duration:** 2-3 days

**Tasks:**
- [ ] Write README.md
  - Project description
  - Features list
  - Installation instructions
  - Usage guide
  - Screenshots
  - Troubleshooting
- [ ] Write INSTALL.md
  - Detailed installation steps
  - Gatekeeper bypass instructions
  - Permission setup guide
- [ ] Write CLAUDE.md
  - Developer guide
  - Architecture overview
  - Contribution guidelines
- [ ] Write CHANGELOG.md
  - Version history
  - Feature additions
  - Bug fixes
- [ ] Create issue templates
  - Bug report
  - Feature request
- [ ] Add LICENSE file
  - Choose appropriate license
  - Add copyright notice

**Deliverables:**
- Complete documentation
- User-friendly guides
- Developer resources

### 4.5 Build & Distribution
**Duration:** 2-3 days

**Tasks:**
- [ ] Configure electron-builder
  - DMG creation
  - Proper app bundle
  - Icon integration
- [ ] Create build scripts
  - `npm run build`
  - `npm run build:mac`
  - `npm run clean`
- [ ] Test builds
  - Clean install testing
  - DMG mounting and installation
  - First-run experience
- [ ] Optional: Code signing setup
  - Apple Developer account
  - Certificates
  - Notarization
- [ ] Create release checklist
- [ ] Prepare for distribution
  - GitHub releases
  - Download page
  - Version numbering

**Deliverables:**
- Working build process
- Distributable DMG
- Release preparation
- Optional: Signed and notarized app

---

## Risk Management

### Technical Risks

**Risk:** Google Meet may block Electron user agents
**Mitigation:** Use Chrome user agent spoofing (proven in ChatMac)
**Likelihood:** Low | **Impact:** High

**Risk:** Meeting detection may be fragile (DOM changes)
**Mitigation:** Use multiple detection methods, robust selectors
**Likelihood:** Medium | **Impact:** Medium

**Risk:** Media permissions may not work in Electron
**Mitigation:** Test early, use proper entitlements, follow Electron best practices
**Likelihood:** Low | **Impact:** High

**Risk:** Performance issues with video in Electron
**Mitigation:** Profile early, optimize where needed, leverage Chromium's optimizations
**Likelihood:** Low | **Impact:** Medium

### Business Risks

**Risk:** Google may not allow third-party wrappers
**Mitigation:** App uses official web interface, no API abuse, similar to ChatMac
**Likelihood:** Low | **Impact:** Critical

**Risk:** Low user adoption
**Mitigation:** Focus on quality, unique features (PiP, native integration)
**Likelihood:** Medium | **Impact:** Medium

**Risk:** Maintenance burden
**Mitigation:** Clean code, good documentation, automated testing
**Likelihood:** Medium | **Impact:** Medium

---

## Success Metrics

### Technical Metrics
- App starts in < 3 seconds
- Memory usage < 500MB during video call
- CPU usage < 30% during video call
- Zero critical security vulnerabilities
- 100% of core features working

### User Experience Metrics
- Authentication success rate > 95%
- No crashes during normal use
- Notifications delivered within 1 second
- Badge updates within 2 seconds

### Quality Metrics
- Code coverage > 70% (if tests added)
- Zero memory leaks
- Clean security audit
- Comprehensive documentation

---

## Post-Launch Roadmap

### Version 1.1 (Future)
- Calendar integration
  - Show upcoming meetings
  - Quick join from menu
  - Meeting list view
- Enhanced notifications
  - Notification history
  - Do Not Disturb mode
  - Custom notification sounds

### Version 1.2 (Future)
- Meeting recording controls
- Background blur controls
- Virtual background management
- Layout preferences
- Auto-join for recurring meetings

### Version 2.0 (Future)
- Multi-account support
- Meeting analytics
- Keyboard shortcut customization
- Themes and appearance options
- Plugin system for extensions

---

## Resource Requirements

### Development Resources
- 1 developer (full-time)
- Estimated hours: 160-200 hours
- Tools: VS Code, Electron DevTools, Xcode (for signing)

### Hardware Requirements
- macOS development machine (Apple Silicon or Intel)
- Test devices with different macOS versions
- Camera and microphone for testing

### Accounts Needed
- Google account (for testing)
- Apple Developer account (optional, for signing)
- GitHub account (for repository)

---

## Conclusion

MeetMac leverages the proven architecture of ChatMac to create a superior native macOS experience for Google Meet. By following this structured plan, the project can be completed in 4-6 weeks with a high-quality, secure, and user-friendly application.

The phased approach ensures that core functionality is established early, with enhanced features added progressively. Risk mitigation strategies address potential technical and business challenges.

Success depends on maintaining the security and architectural principles of ChatMac while adapting and extending features specifically for video conferencing use cases.
