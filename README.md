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

### 3. Native iOS Tab Bar (UITabBarController) & Multiplatform Tabs
- **Decision**: Implemented native platform tab navigation via `expo-router/native-tabs` ([`_layout.native.tsx`](file:///d:/Projects/habit-tracker/mobile/app/%28tabs%29/_layout.native.tsx)):
  - Directly binds to iOS UIKit `UITabBarController` with SF Symbols (`checkmark.circle`, `chart.bar.xaxis`, `square.stack.3d.up`, `gearshape`), system material vibrancy, native minimize-on-scroll behavior, and haptic tab switching.
  - Retains web navigation shell in `_layout.tsx` for desktop and responsive browsers.

### 4. Native iOS Collapsible Large Title Headers
- **Decision**: Created [`CollapsibleHeader.tsx`](file:///d:/Projects/habit-tracker/mobile/components/CollapsibleHeader.tsx) wired to `Animated.ScrollView` across Today, Stats, Habits, and Settings:
  - Renders a prominent, bold iOS large title (34pt) that smoothly collapses into a centered navigation bar title with a translucent glass blur background (`BlurView`) as the user scrolls.

### 5. Minimal Form Design & Native Sheet-over-Sheet UX
- **Decision**: Refactored [`HabitSheet.tsx`](file:///d:/Projects/habit-tracker/mobile/components/HabitSheet.tsx):
  - Removed redundant section labels ("Habit Name", "Daily Target") in favor of self-explanatory placeholders and clean segmented pills.
  - Translucent native blurred sheet backdrop on iOS (`BlurView`).
  - Sheet-over-sheet presentation for both the centered Icon selector and Color palette.
  - Native iOS time picker integration using `@react-native-community/datetimepicker` (`display="compact"`).

### 6. Zero Rubber-Band Drag and Direct 1:1 Swipe Physics
- **Decision**: Eliminated all artificial rubber-band bounce in [`HabitCard.tsx`](file:///d:/Projects/habit-tracker/mobile/components/HabitCard.tsx) and [`habits.tsx`](file:///d:/Projects/habit-tracker/mobile/app/%28tabs%29/habits.tsx):
  - Left swipe opens Skip and Archive with a firm clamp at -110px.
  - Right swipe tracks the finger 1:1 across the row and settles with clean linear timing.
  - Reordering list uses linear layout transitions (`LinearTransition.duration(180)`) without spring oscillation.

### 7. 60fps Smooth Continuous Timer Ring
- **Decision**: Upgraded [`RunningHabitTimer.tsx`](file:///d:/Projects/habit-tracker/mobile/components/RunningHabitTimer.tsx) to animate SVG stroke offset via Reanimated `AnimatedCircle` with high-frequency interpolation, eliminating visual stuttering.

### 6. Bulletproof Week-Wise Scrollable Strip
- **Decision**: Completely refactored `components/WeekStrip.tsx` with a static 41-week timeline anchored to the current calendar week.
  - Swiping horizontally snaps cleanly to exactly 1 week at a time with native momentum and zero double-jumping.
  - The "Today" button and date selector smoothly scroll the carousel to the selected week without offset jitter.

### 7. Direct 1:1 Drag-to-Reorder Habits
- **Decision**: Replaced rubber-band bounce reordering with direct 1:1 finger tracking in `mobile/app/(tabs)/habits.tsx`.
  - The dragged item lifts with subtle scale and shadow, follows the finger directly without mid-gesture array mutation, and settles cleanly into its target slot with a critically damped transition.

### 8. Theme-Aware Confirmation & Subtle Danger Reset
- **Decision**: Built `components/ConfirmModal.tsx` for Android and Web:
  - Replaced harsh solid-red reset button with a tasteful, subtle danger row (`rgba(239, 68, 68, 0.08)` soft tint).
  - Eliminates un-themed raw Android alerts in favor of an in-app modal matching the active dark/light palette.
  - Resetting data sets `hasCompletedOnboarding: false` and redirects immediately to Onboarding.

### 9. Multi-Interest Onboarding Flow
- **Decision**: Enhanced onboarding to allow multi-selection of interests (Study & Coding, Gym & Fitness, Mindful Routine, Balanced Life Mix):
  - Aggregates all matching starter habits (DSA problems, Gym workout, Sleep by 10:30 PM, Study session, GitHub commit) into the starter ritual.
  - Allows individual habit toggling and personalization before entering the app.

### 10. Android Notifications & Channel Setup
- **Decision**: Configured explicit Android Notification Channel (`setNotificationChannelAsync('habit_reminders')`) with `importance: MAX` and added a "Test reminder" action button in Settings to verify immediate notification delivery.

### 11. Responsive Web & PWA
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