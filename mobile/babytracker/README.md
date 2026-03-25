# Baby Tracker - Mobile App

React Native mobile application for tracking baby activities and health built with Expo.

## Tech Stack

- React Native 0.81.5
- Expo 54.0.23
- React 19.1.0
- TypeScript (components) / JavaScript (services)
- Redux Toolkit + React Redux (centralized state management)
- React Navigation (Bottom Tabs + Native Stack)

## Project Structure

```
babytracker/
├── services/                    # API service layer (10 files)
│   ├── api.js                   # HTTP client (base URL, auth headers, GET/POST/PUT/DELETE)
│   ├── authService.js           # Authentication (register, login, logout)
│   ├── babyService.js           # Baby CRUD and growth metrics
│   ├── scheduleService.js       # Activities, tasks, reminders
│   ├── symptomService.js        # Symptoms catalog, trigger types, symptom logs
│   ├── medicationService.js     # Medications CRUD
│   ├── analyticsService.js      # Dashboard summary + graph data
│   ├── notificationService.js   # Push token registration + notification history
│   ├── invitationService.js     # Invitation system (create, accept, cancel)
│   ├── guidelineService.js      # Vaccine guidelines (CDC schedule)
│   └── userService.js           # Legacy (unused)
├── src/
│   ├── components/              # Screen components (10 screens + custom tab bar)
│   │   ├── landing.tsx          # Welcome page + invitation lookup modal
│   │   ├── login.tsx            # Email/password login + invite acceptance
│   │   ├── register.tsx         # User registration
│   │   ├── children.tsx         # Baby list dashboard
│   │   ├── BabyDetailScreen.tsx # Individual baby profile + growth
│   │   ├── AddChildScreen.tsx   # Create new baby form
│   │   ├── ScheduleScreen.tsx   # Calendar with activities/tasks/reminders
│   │   ├── ProfileScreen.tsx    # User profile, caregiver management, sharing
│   │   ├── HistoryScreen.tsx    # Activity timeline
│   │   ├── AcceptInvitationScreen.tsx # Deep link invitation acceptance
│   │   ├── navBar.tsx           # Custom bottom tab bar (used by Tab Navigator)
│   │   └── shared/
│   │       └── ModalWrapper.tsx # Reusable modal component
│   ├── store/                   # Redux Toolkit store
│   │   ├── index.ts             # Store configuration
│   │   ├── hooks.ts             # Typed useAppSelector / useAppDispatch
│   │   └── slices/
│   │       ├── babiesSlice.ts   # Babies list state + async thunk
│   │       ├── activitiesSlice.ts # Activities state + async thunk
│   │       ├── tasksSlice.ts    # Tasks state + async thunk
│   │       └── remindersSlice.ts # Reminders state + async thunk
│   ├── theme/
│   │   └── colors.ts            # Shared color tokens
│   ├── types/
│   │   └── baby.types.ts        # TypeScript interfaces
│   ├── utils/
│   │   └── responsive.ts        # Responsive scaling helpers
│   ├── fonts/                   # Custom fonts (Quicksand, Raleway)
│   └── images/                  # App images and icons
├── App.js                       # Root: Stack Navigator (auth) + Tab Navigator (main app)
├── index.js                     # Entry point
├── app.json                     # Expo config
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Android Emulator (Google Play image) or physical device
- For push notifications: must use `npx expo run:android` (Expo Go does not support push since SDK 53)

### Installation

```bash
npm install
```

### Configuration

Update the `LOCAL_IPV4` variable in `services/api.js` to your machine's local IP address so physical devices on the same WiFi can connect to the backend.

### Running

**With Expo Go (no push notifications):**
```bash
npx expo start
```

**With development build (full native support including push notifications):**
```bash
npx expo run:android
```

Note: Push notifications require the development build. Expo Go dropped push support in SDK 53.

## Architecture

### Navigation Structure

The app uses a **Tab Navigator** nested inside a **Stack Navigator**:

```
Root Stack (auth screens)
├── Landing
├── Login
├── SignUp
├── MainTabs (Bottom Tab Navigator — screens stay mounted)
│   ├── ChildrenTab (Stack) → Children → BabyDetail, AddChild
│   ├── ScheduleTab (Stack) → Schedule
│   └── ProfileTab (Stack) → Profile → History, BabyDetail, AddChild
└── AcceptInvitation (deep link)
```

Tab screens stay mounted in memory — switching tabs is instant with no remounting or data refetch.

### State Management (Redux Toolkit)

Shared data lives in the Redux store (`src/store/`). Screens read from the store via `useAppSelector` and dispatch actions via `useAppDispatch`.

| Slice | Data | Used By |
|-------|------|---------|
| `babiesSlice` | Baby list (all babies user has access to) | Children, Profile, Schedule, AddChild |
| `activitiesSlice` | Activities for selected baby | Schedule |
| `tasksSlice` | Tasks for selected baby | Schedule |
| `remindersSlice` | Reminders for selected baby | Schedule |

**To add a new slice** (e.g., medications):
1. Create `src/store/slices/medicationsSlice.ts` following the existing pattern
2. Register the reducer in `src/store/index.ts`
3. Use in screens: `useAppSelector(state => state.medications)` + `dispatch(fetchMedications(babyId))`

### SafeArea Handling

All screens use `useSafeAreaInsets()` from `react-native-safe-area-context` for dynamic top padding. `SafeAreaProvider` wraps the app in `App.js`. The custom tab bar handles bottom insets.

### Inline Feedback Pattern

All error/success messages display as inline banners (not Alert.alert popups). Pattern:
- Green left-border accent bar for success (`colors.successLight`)
- Red left-border accent bar for errors (`colors.errorLight`)
- Auto-dismiss after 2-3 seconds for success messages
- Only system permission prompts (camera, photo library) use native Alert

## Services

### api.js — HTTP Client

Base HTTP client used by all other services. Handles:
- Platform-aware base URL detection (Android emulator, iOS simulator, physical device)
- JWT token injection from AsyncStorage into `Authorization` header
- GET, POST, PUT, DELETE methods

### authService.js — Authentication

| Function                     | Description                                                                                        |
|------------------------------|----------------------------------------------------------------------------------------------------|
| `registerUser(userData)`     | Register a new user. Supports optional `invitationToken` for auto-accepting invitations on signup. |
| `loginUser(email, password)` | Login and store JWT token.                                                                         |
| `logoutUser()`               | Clear stored JWT token.                                                                            |
| `isAuthenticated()`          | Check if a token exists in storage.                                                                |
| `getAuthToken()`             | Retrieve the stored JWT token.                                                                     |

### babyService.js — Baby Management

| Function                           | Description                                                              |
|------------------------------------|--------------------------------------------------------------------------|
| `getBabies()`                      | List all babies the user has access to (with growth and caregiver info). |
| `getBaby(babyId)`                  | Get a single baby's details.                                             |
| `createBaby(babyData)`             | Create a new baby (user becomes PRIMARY_CAREGIVER).                      |
| `updateBaby(babyId, babyData)`     | Update baby details.                                                     |
| `deleteBaby(babyId)`               | Primary: deletes baby entirely. Others: removes own access.              |
| `getGrowthHistory(babyId)`         | Get growth metric history for a baby.                                    |
| `getLatestGrowth(babyId)`          | Get the most recent growth record.                                       |
| `recordGrowth(babyId, growthData)` | Record new growth metrics.                                               |

### invitationService.js — Invitation System

| Function                                |  Description                                                       |
|-----------------------------------------|--------------------------------------------------------------------|
| `createInvitation(babyId, email, roleId)` | Invite a user by email with role ID (`2` = SECONDARY_CAREGIVER, `3` = PROFESSIONAL). |
| `getInvitations(babyId)`                | List pending invitations for a baby.                               |
| `cancelInvitation(babyId, inviteId)`    | Cancel a pending invitation.                                       |
| `getInvitationByToken(token)`           | View public invitation details (no auth required).                 |
| `acceptInvitation(token)`               | Accept an invitation (email must match).                           |

### scheduleService.js — Activities, Tasks, Reminders

| Function | Description |
|---|---|
| `getActivities(babyId)` | List all activities for a baby. |
| `createActivity(babyId, data)` | Log a new activity (feeding, sleep, diaper, etc). |
| `getTasks(babyId)` | List all tasks for a baby. |
| `createTask(babyId, data)` | Create a new task. |
| `updateTask(babyId, taskId, data)` | Update a task. |
| `getReminders(babyId)` | List all reminders for a baby. |
| `createReminder(babyId, data)` | Create a new reminder. |

### symptomService.js — Symptom Tracking

| Function | Description |
|---|---|
| `getAllSymptoms()` | List all 15 common baby symptoms from catalog. |
| `getSymptomByCode(code)` | Get symptom details by code (e.g. FEVER). |
| `createSymptomLog(babyId, data)` | Log a symptom with severity, trigger note, notes. |
| `getSymptomLogs(babyId, filters)` | List symptom logs with optional date/code filters. |
| `getSymptomLog(babyId, symptomLogId)` | Get a single symptom log. |
| `updateSymptomLog(babyId, symptomLogId, data)` | Update a symptom log. |
| `deleteSymptomLog(babyId, symptomLogId)` | Delete a symptom log. |

### medicationService.js — Medications

| Function | Description |
|---|---|
| `createMedication(babyId, data)` | Add a medication (name, dosage, form, dates). |
| `getMedications(babyId)` | List all medications for a baby. |
| `getMedication(babyId, medicationId)` | Get a single medication. |
| `updateMedication(babyId, medicationId, data)` | Update a medication. |
| `deleteMedication(babyId, medicationId)` | Delete a medication. |

### analyticsService.js — Dashboard Analytics

| Function | Description |
|---|---|
| `getBabySummary(babyId)` | Dashboard summary (activity counts, growth, symptoms, medications, tasks, reminders). |
| `getBabyGraphs(babyId)` | Graph data (growth trends, activity frequency, symptom frequency over time). |

### notificationService.js — Push Notifications

| Function | Description |
|---|---|
| `registerForPushNotifications()` | Full device registration flow: requests permissions, gets Expo push token, sends to backend. Called automatically on login/register. |
| `registerPushToken(deviceToken, platform)` | Register Expo push token with backend (used internally by `registerForPushNotifications`). |
| `unregisterPushToken(deviceToken)` | Unregister push token (call on logout). |
| `getNotifications(limit)` | Get notification history for the user. |

**Push notification setup (already configured):**
- Firebase project: `babyapp-cd958` with Android app `com.n01570640.babytracker`
- `google-services.json` in `android/app/`
- FCM V1 service account key uploaded to Expo via `eas credentials -p android`
- `App.js` includes `setNotificationHandler` for foreground notification display
- Token registration happens automatically after login/register in `login.tsx` and `register.tsx`

### guidelineService.js — Vaccine Guidelines

| Function                       | Description                                                |
|--------------------------------|------------------------------------------------------------|
| `getAllVaccines()`             | List all 30 CDC-recommended vaccines.                      |
| `getVaccine(vaccineId)`        | Get details for a specific vaccine.                        |
| `getVaccineSchedule(ageWeeks)` | Get vaccines due and upcoming for a baby's age (in weeks). |
