# MeetMac

Native macOS client for Google Meet with advanced meeting controls and keyboard shortcuts.

![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![Platform](https://img.shields.io/badge/platform-macOS-lightgrey.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 🎯 Features

### Meeting Detection & Management
- **Automatic Meeting Detection**: Detects when you join/leave Google Meet meetings
- **Dock Badge Indicator**: Shows "•" in dock when in an active meeting
- **Real-time State Tracking**: Monitors mute and camera states

### Meeting Controls
- **Menu Bar Integration**: Dynamic "Meeting" menu with real-time status
- **Mute/Unmute**: Toggle microphone with Cmd+D or Cmd+Shift+D (global)
- **Camera Control**: Toggle camera with Cmd+E or Cmd+Shift+E (global)
- **Global Shortcuts**: Control meetings even when MeetMac is in the background

### Native macOS Integration
- **Camera & Microphone Permissions**: Auto-requested on first run
- **Screen Sharing Guidance**: Direct links to System Preferences
- **Native Notifications**: Meeting events with click-to-focus
- **Permission Status Display**: View all permissions in Preferences

### Security & Privacy
- **No Credential Storage**: Uses Google's OAuth (credentials handled by Google)
- **Context Isolation**: Sandboxed renderer process
- **Input Sanitization**: XSS prevention for notifications
- **Certificate Validation**: No certificate bypasses

## ⌨️ Keyboard Shortcuts

### App-Level Shortcuts (when MeetMac is focused)
- `Cmd+D` - Toggle mute
- `Cmd+E` - Toggle camera
- `Cmd+R` - Refresh meeting state
- `Cmd+,` - Open Preferences
- `Cmd+0` - Show MeetMac window

### Global Shortcuts (work system-wide)
- `Cmd+Shift+D` - Toggle mute (works from any app)
- `Cmd+Shift+E` - Toggle camera (works from any app)

## 🚀 Getting Started

### Prerequisites
- macOS 10.15 (Catalina) or later
- Node.js 14 or later (for development)

### Installation

#### Option 1: Download Release (Recommended)
1. Download the latest `.dmg` from [Releases](https://github.com/themikethompson/MeetMac/releases)
2. Open the `.dmg` file
3. Drag MeetMac to your Applications folder
4. Launch MeetMac from Applications
5. Grant camera and microphone permissions when prompted

#### Option 2: Build from Source
```bash
# Clone the repository
git clone https://github.com/themikethompson/MeetMac.git
cd MeetMac

# Install dependencies
npm install

# Run in development mode
npm start

# Build for production
npm run build
```

### First Run
1. Launch MeetMac
2. Sign in with your Google account
3. Grant camera and microphone permissions
4. Join a Google Meet meeting
5. Use keyboard shortcuts to control your meeting!

## 📖 Usage

### Joining a Meeting
- MeetMac opens directly to meet.google.com
- Navigate to your meeting URL or click a meeting link
- MeetMac automatically detects when you're in a meeting

### Using Controls
- **Mute/Unmute**: Press `Cmd+D` or use the Meeting menu
- **Camera On/Off**: Press `Cmd+E` or use the Meeting menu
- **Check Status**: Look at the Meeting menu to see your current state

### Managing Permissions
1. Open MeetMac → Preferences (Cmd+,)
2. Go to "Media Permissions" section
3. Check status of Camera, Microphone, Screen Recording
4. Click "Open Settings" to configure in System Preferences

## 🏗️ Architecture

### Core Components
- **BadgeStateManager**: Centralized meeting state management
- **Meeting Control System**: DOM-based button detection and control
- **Permission Manager**: Media permission request and status tracking
- **Notification System**: Meeting event detection and categorization

### Technology Stack
- **Electron 28.3.3**: Cross-platform desktop framework
- **electron-builder**: Packaging and distribution
- **Native macOS APIs**: System integrations and permissions

## 🛠️ Development

### Project Structure
```plaintext
MeetMac/
├── src/
│   ├── main.js           # Main process (meeting controls, state management)
│   ├── preload.js        # IPC bridge (secure renderer communication)
│   ├── auth.html         # Authentication UI
│   └── preferences.html  # Preferences window
├── build/
│   └── entitlements.mac.plist  # macOS entitlements
├── scripts/
│   └── notarize.js       # Notarization script
└── package.json          # Dependencies and build config
```

### Available Scripts
```bash
npm start          # Run in development mode
npm run dev        # Run with DevTools enabled
npm run build      # Build for production (creates .dmg)
npm run build:mac  # Build for macOS specifically
npm run clean      # Clean build artifacts
```

### Building
```bash
# Install dependencies
npm install

# Build the app
npm run build

# Output will be in dist/ folder
# MeetMac.app and MeetMac.dmg
```

## 🔍 Troubleshooting

### Camera/Microphone Not Working
1. Open System Preferences → Privacy & Security
2. Go to Camera and Microphone sections
3. Ensure MeetMac is checked
4. Restart MeetMac

### Screen Sharing Not Working
1. Open System Preferences → Privacy & Security
2. Go to Screen Recording
3. Add MeetMac and enable it
4. Restart MeetMac

### Keyboard Shortcuts Not Working
- Global shortcuts require Accessibility permissions on some macOS versions
- Go to System Preferences → Privacy & Security → Accessibility
- Add MeetMac if prompted

### Meeting Controls Don't Work
- Ensure you're in an active Google Meet meeting
- The controls only work when the meeting URL matches the pattern
- Try "Refresh Meeting State" from the Meeting menu (Cmd+R)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Based on the ChatMac project architecture
- Uses Electron for cross-platform desktop support
- Google Meet for the underlying video conferencing platform

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/themikethompson/MeetMac/issues)
- **Discussions**: [GitHub Discussions](https://github.com/themikethompson/MeetMac/discussions)

## 🗺️ Roadmap

### v0.2.0 (Planned)
- [ ] Participant count display
- [ ] Meeting history tracking
- [ ] Quick join from clipboard URL
- [ ] Custom keyboard shortcut configuration

### v0.3.0 (Planned)
- [ ] Picture-in-Picture mode
- [ ] Meeting notes integration
- [ ] Multiple account support
- [ ] Background blur support

---

**Made with ❤️ for the macOS community**
