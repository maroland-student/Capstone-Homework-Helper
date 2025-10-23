# Expo & React Native Development Tools Research

## Command-Line Tools

### Expo CLI

The primary command-line interface for Expo projects.

**Installation:**

```bash
npm install -g expo-cli
# or use npx for latest version
npx expo
```

**Essential Commands:**

- `npx create-expo-app my-app` - Initialize new project
- `npx expo start` - Start development server
- `npx expo start --tunnel` - Start with tunnel for remote testing
- `npx expo install package-name` - Install SDK-compatible packages
- `npx expo doctor` - Diagnose project issues
- `npx expo prebuild` - Generate native code
- `npx expo run:ios` - Build and run on iOS
- `npx expo run:android` - Build and run on Android
- `eas build` - Build app in the cloud
- `eas submit` - Submit to app stores
- `eas update` - Push OTA updates

### React Native CLI

Command-line tool for bare React Native projects.

**Installation:**

```bash
npm install -g react-native-cli
```

**Key Commands:**

- `npx react-native init MyApp` - Create new project
- `npx react-native start` - Start Metro bundler
- `npx react-native run-ios` - Run on iOS simulator
- `npx react-native run-android` - Run on Android emulator
- `npx react-native log-ios` - View iOS logs
- `npx react-native log-android` - View Android logs

### EAS CLI

Expo Application Services command-line tool.

**Installation:**

```bash
npm install -g eas-cli
```

**Commands:**

- `eas login` - Authenticate with Expo account
- `eas build:configure` - Set up build configuration
- `eas build --platform ios` - Build iOS app
- `eas build --platform android` - Build Android app
- `eas build --platform all` - Build both platforms
- `eas submit` - Submit builds to stores
- `eas update` - Configure and publish updates
- `eas credentials` - Manage certificates and provisioning

## Mobile Testing Tools

### Expo Go App

**Platforms:** iOS, Android  
**Purpose:** Live preview of Expo apps on physical devices

**Features:**

- Scan QR code to load projects
- Shake device to access developer menu
- Hot reloading for instant updates
- Pre-loaded with all Expo SDK modules

**Download:**

- iOS: App Store
- Android: Google Play Store

### Physical Device Testing

**iOS:**

- Connect via USB or WiFi
- Requires Apple Developer account for production testing
- Use `npx expo run:ios --device` for physical device

**Android:**

- Enable Developer Options and USB Debugging
- Connect via USB or `adb connect` over WiFi
- Use `npx expo run:android --device` for physical device

## Debugging Tools

### React DevTools

Browser-based inspection tool for React components.

**Installation:**

```bash
npm install -g react-devtools
```

**Launch:**

```bash
react-devtools
```

**Features:**

- Component tree inspection
- Props and state viewing
- Profiler for performance analysis
- Hook inspection

### Flipper

Desktop debugging platform for mobile apps.

**Download:** https://fbflipper.com/

**Plugins:**

- Layout Inspector
- Network Inspector
- Logs
- Databases
- Crash Reporter
- React DevTools
- Redux Debugger
- AsyncStorage Inspector

**Setup for React Native:**

```bash
npx react-native doctor
# Follow instructions to install Flipper
```

### React Native Debugger

Standalone electron app combining multiple debugging tools.

**Download:** https://github.com/jhen0409/react-native-debugger

**Features:**

- Chrome DevTools integration
- React DevTools
- Redux DevTools
- Network inspection
- AsyncStorage viewer

**Usage:**

1. Open React Native Debugger
2. Set port (default: 19000 for Expo, 8081 for RN CLI)
3. Enable Debug Remote JS in app dev menu

### Reactotron

Desktop app for inspecting React Native apps.

**Download:** https://github.com/infinitered/reactotron

**Installation:**

```bash
npm install --save-dev reactotron-react-native
```

**Features:**

- API request/response monitoring
- State management tracking (Redux, MobX)
- Quick benchmarking
- Image overlay for UI alignment
- Custom commands
- Storybook integration

## Code Editors & IDEs

### Visual Studio Code

**Recommended Extensions:**

- React Native Tools (Microsoft)
- ES7+ React/Redux/React-Native snippets
- React Native Snippet
- Prettier - Code formatter
- ESLint
- Auto Import
- Path Intellisense
- GitLens
- Import Cost

### Android Studio

**Purpose:** Android development, emulator management, native debugging

**Tools:**

- AVD Manager (Android Virtual Devices)
- Layout Inspector
- Logcat
- APK Analyzer
- Profiler

### Xcode

**Purpose:** iOS development, simulator management, native debugging

**Tools:**

- iOS Simulator
- Device Manager
- Instruments (profiling)
- Console
- View Debugger

## Testing Tools

### Jest

Pre-configured testing framework in React Native.

**Run Tests:**

```bash
npm test
```

**Watch Mode:**

```bash
npm test -- --watch
```

### Detox

End-to-end testing framework.

**Installation:**

```bash
npm install --save-dev detox
```

**Commands:**

```bash
detox build
detox test
detox test --debug-synchronization
```

### Maestro

Modern mobile UI testing tool.

**Installation:**

```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

**Commands:**

```bash
maestro test flow.yaml
maestro studio
maestro record
```

## Build & Deployment Tools

### Fastlane

Automation tool for iOS and Android deployment.

**Installation:**

```bash
sudo gem install fastlane
```

**Setup:**

```bash
fastlane init
```

**Common Actions:**

- Automated screenshots
- Beta deployment (TestFlight, Firebase)
- App Store/Play Store submission
- Code signing management

### Android Studio Build Tools

- **Gradle**: Build automation
- **ADB (Android Debug Bridge)**: Device communication
- **Bundletool**: AAB manipulation

**Useful ADB Commands:**

```bash
adb devices
adb logcat
adb install app.apk
adb uninstall com.package.name
adb reverse tcp:8081 tcp:8081
```

### Xcode Build Tools

- **xcodebuild**: Command-line builds
- **xcrun**: Run Xcode tools
- **simctl**: Simulator control

**Simulator Commands:**

```bash
xcrun simctl list
xcrun simctl boot "iPhone 14"
xcrun simctl install booted app.app
```

## Performance Profiling Tools

### Flipper Performance Plugin

Real-time performance metrics in Flipper.

### React Native Performance Monitor

Built-in FPS monitor.

**Enable:**

- Shake device
- Select "Perf Monitor"

### Xcode Instruments

Profiling tools for iOS apps:

- Time Profiler
- Allocations
- Leaks
- Network
- Energy Log

### Android Studio Profiler

Performance monitoring for Android:

- CPU Profiler
- Memory Profiler
- Network Profiler
- Energy Profiler

## Version Control & Collaboration

### GitHub Actions

CI/CD automation for React Native.

**Example workflows:**

- Automated testing on PR
- EAS Build triggers
- Automated deployments

### GitLab CI/CD

Alternative CI/CD platform with similar capabilities.

### Bitrise

Mobile-focused CI/CD platform.

**Features:**

- Pre-configured React Native workflows
- Device testing integration
- Automatic deployment

## Asset Management Tools

### Expo Asset Tools

```bash
npx expo-optimize
```

**Purpose:** Optimize images for mobile

### React Native Asset

Generate different resolutions for images.

### App Icon Generator

Tools for generating app icons:

- https://www.appicon.co
- https://icon.kitchen
- `expo-icon` command

### Splash Screen Tools

```bash
npx expo install expo-splash-screen
```

## Package Management

### npm

Default package manager.

```bash
npm install
npm install package-name
npm update
```

### Yarn

Alternative package manager.

```bash
yarn install
yarn add package-name
yarn upgrade
```

### pnpm

Fast, disk-efficient package manager.

```bash
pnpm install
pnpm add package-name
```

## Network Tools

### Charles Proxy

HTTP proxy for monitoring network traffic.

**Use Cases:**

- API debugging
- Request/response inspection
- SSL certificate handling
- Network throttling

### Postman

API testing platform.

**Features:**

- API request builder
- Collection management
- Environment variables
- Mock servers

## Documentation Tools

### Storybook

UI component development environment.

**Installation:**

```bash
npx sb init --type react_native
```

**Commands:**

```bash
npm run storybook
```

### Docusaurus

Documentation website generator.

**Use Case:** Project documentation, component libraries

## Monitoring & Analytics Tools

### Sentry

Error tracking and performance monitoring.

**Installation:**

```bash
npx @sentry/wizard -i reactNative
```

### Firebase

Google's mobile development platform.

**Tools:**

- Crashlytics (crash reporting)
- Performance Monitoring
- Analytics
- Remote Config
- App Distribution

### Bugsnag

Error monitoring and reporting.

## Useful Utilities

### react-native-rename

Rename React Native projects.

```bash
npx react-native-rename "New Name"
```

### patch-package

Fix npm dependencies locally.

```bash
npx patch-package package-name
```

### expo-doctor

Diagnose Expo project issues.

```bash
npx expo-doctor
```

### npx react-native info

Display environment information.

```bash
npx react-native info
```

## Resources & References

- **Expo Tools Documentation**: https://docs.expo.dev/workflow/overview/
- **React Native Debugging**: https://reactnative.dev/docs/debugging
- **Flipper Setup**: https://fbflipper.com/docs/getting-started/
- **EAS Documentation**: https://docs.expo.dev/eas/
- **React DevTools**: https://react.dev/learn/react-developer-tools
