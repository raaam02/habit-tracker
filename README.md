# Habit Tracker

A polished, production-grade, local-first habit tracker for Android, iOS, and Web from a single codebase built with **Expo SDK 58**, **Expo Router**, and **TypeScript strict mode**.

Designed around speed and feel: open the app, see today's habits, log one with a single gesture, and watch streaks grow in under two seconds.

---

## Decisions

### 1. Rebuilding with Expo SDK 58 & Strict Typing
- **Initial Inspection**: The previous repository used Expo SDK 56 with incompatible dependencies, an unstable SQLite repository layer that failed on web, and NativeWind v4 with monkey patches that clashed with React 19.3.0 and Expo SDK 58.
- **Decision**: Rebuilt `mobile/` from a clean SDK 58 template using Expo Router file-based routing and TypeScript strict mode. Kept Git history intact. 20/20 `npx expo-doctor` checks pass cleanly with zero warnings or deprecations.

### 2. State & Storage Architecture (Zustand + AsyncStorage)
- **Decision**: Replaced raw SQLite with `zustand` and its `persist` middleware backed by `@react-native-async-storage/async-storage`.
- **Rationale**:
  - Eliminates native binary dependencies for SQLite, enabling identical, lightning-fast persistence across native Android and browser `localStorage`.
  - Offline-first: state hydrates instantaneously on the first frame with no loading spinners or blank screens.
  - Safe, deterministic JSON export and import for seamless multi-device backups.

### 3. Styling & Theme System
- **Decision**: Built a dedicated theme module (`constants/theme.ts` & `constants/useAppTheme.ts`) using plain React Native `StyleSheet` without external UI kits or Tailwind overhead.
- **Rationale**:
  - Dark-first aesthetic with rich dark tones (`#0B0D10` background, `#14171C` surface, `#1B1F26` elevated), balanced with a clean light theme following system settings.
  - 10 contrast-checked habit colors with designated foreground text colors.
  - Consistent 4pt spacing scale, 16px card radii, 24px sheet radii, and standard >=48dp touch targets.

### 4. Streak Rules: Never-Miss-Twice
- **Decision**: Stored raw daily logs (`YYYY-MM-DD` local date strings, never UTC timestamps). Streaks are never persisted in state—they are computed on demand using pure, unit-tested functions (`utils/streaks.ts`).
- **Rules**:
  - **Never-Miss-Twice**: One missed scheduled day does **not** break a streak; two consecutive missed scheduled days do.
  - **At-Risk Indicator**: When yesterday was missed and today is scheduled but not yet completed, a subtle warning indicator alerts the user to preserve their streak today.
  - **Skipping**: Skipping a habit does not count as a miss and preserves the streak.
  - **Unscheduled Days**: Days outside a habit's scheduled days are ignored.

### 5. Gesture-Driven 60fps UX
- **Decision**: Powered by `react-native-gesture-handler` and `react-native-reanimated`:
  - **Swipe Right**: Fills card with habit color following the finger, snaps at 75dp threshold with spring and haptic feedback to mark completed.
  - **Swipe Left**: Reveals quick action drawer (Skip, Edit, Archive).
  - **Count / Minutes Habits**: Tap on count adds +1; long-press opens numeric input sheet. Minutes habits open quick value presets (`15m`, `30m`, `45m`, `60m`).
  - **Undo Snackbar**: 5-second undo toast allows instant reversal of completions without annoying confirmation dialogs.
  - **Accessibility Fallbacks**: Every gesture has clickable button fallbacks for mouse users on web and screen readers.
  - **First-Run Nudge**: On first launch, a gentle nudge animation demonstrates the swipe-right gesture, then stays quiet.
  - **Reduced Motion**: Respects `reduceMotion` setting by switching springs to subtle fades.

### 6. Responsive Web & PWA
- **Decision**: On desktop screens, centers the app in a column of max 520px with the bottom tab bar anchored for natural ergonomics. Includes a PWA manifest (`public/manifest.json`), favicon, and full keyboard navigation.

---

## Screens

1. **Today (Home)**:
   - Header with active date, quick day navigation, and pull-down to return to today.
   - Horizontal 7-day week strip with completion indicator dots.
   - SVG circular progress ring showing completed vs. scheduled habits.
   - List of scheduled habit cards with swipe gestures, count incrementing, and restrained celebration on 100% completion.
   - 5-second undo toast.

2. **Stats & Analytics**:
   - Aggregate streak cards (Peak active streak, All-time best, 7-day rate, 30-day rate).
   - GitHub-style 24-week contribution heatmap drawn with `react-native-svg`.
   - Weekly bar chart displaying completion rates across days of the week.
   - Habit performance drilldown with per-habit streaks and tap-to-inspect modal.

3. **Habits Management**:
   - Active and Archived tabs.
   - Reorder habits up/down.
   - Edit, archive, restore, and delete actions.

4. **Add / Edit Habit Sheet**:
   - Smooth bottom sheet with drag-to-dismiss gesture.
   - Name input (autofocused).
   - Type selector: Yes/No (`check`), `count`, or `minutes`.
   - Daily target input.
   - 10-color contrast-checked palette.
   - Scheduled days toggle pills (Mon–Sun).
   - Daily reminder notification toggle and time picker.
   - Curated Ionicons picker.

5. **Settings**:
   - Theme toggle: System, Light, Dark.
   - Calendar start day: Sunday or Monday.
   - Daily reminders notification toggle.
   - Reduce motion toggle.
   - Export backup as JSON (file share on Android/iOS, instant download on Web).
   - Import backup from JSON file.
   - Reset all data with confirmation.

6. **Onboarding**:
   - Starter template selector with curated habits (DSA problems, study, gym, git commit, sleep, weekly review) or option to start empty.

---

## Getting Started

### Prerequisites
- Node.js >= 20.x or 22.x
- npm >= 10.x
- Expo CLI (`npx expo`)

### Installation
```bash
cd mobile
npm install
```

### Running Locally
```bash
# Start Metro bundler (interactive menu)
npm run start

# Run in Web Browser
npm run web

# Run on Android Device / Emulator
npm run android
```

### Verification & Testing
```bash
# Run TypeScript strict typecheck
npm run typecheck

# Run Jest unit tests for streak & date logic
npm test

# Run Expo Doctor dependency & configuration check
npx expo-doctor@latest

# Test Static Web Export
npx expo export --platform web
```

---

## Deployment & Building

### Web Deployment (Vercel / Netlify)
1. Run static web export:
   ```bash
   cd mobile
   npx expo export --platform web
   ```
2. The production web bundle is generated in `mobile/dist/`.
3. **Vercel**:
   - Framework Preset: **Other**
   - Root Directory: `mobile`
   - Build Command: `npx expo export --platform web`
   - Output Directory: `dist`
4. **Netlify**:
   - Base Directory: `mobile`
   - Build Command: `npx expo export --platform web`
   - Publish Directory: `mobile/dist`

### Android APK Build (EAS Build)
The project includes an EAS preview profile configured for standalone APK generation in `mobile/eas.json`:
```bash
cd mobile
# Install EAS CLI globally if needed
npm install -g eas-cli

# Log in to Expo
eas login

# Build standalone APK
eas build --profile preview --platform android
```
The resulting `.apk` file can be downloaded and installed directly on any Android device without Google Play.

---

## CI / CD
A GitHub Actions workflow is configured at `.github/workflows/ci.yml` that automatically validates:
- `npm run typecheck` (TypeScript strict mode)
- `npm test` (Jest unit tests for streak algorithms)
- `npx expo export --platform web` (Production web static export)