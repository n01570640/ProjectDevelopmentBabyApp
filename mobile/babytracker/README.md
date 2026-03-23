# Baby Tracker - Mobile App

React Native mobile application for tracking baby activities and health built with Expo.

## Tech Stack

- React Native 0.81.5
- Expo 54.0.23
- React 19.1.0
- TypeScript (components) / JavaScript (services)

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
│   ├── components/              # Screen components (9 screens + navbar)
│   │   ├── landing.tsx          # Welcome page
│   │   ├── login.tsx            # Email/password login
│   │   ├── register.tsx         # User registration
│   │   ├── children.tsx         # Baby list dashboard
│   │   ├── BabyDetailScreen.tsx # Individual baby profile + growth
│   │   ├── AddChildScreen.tsx   # Create new baby form
│   │   ├── ScheduleScreen.tsx   # Calendar with activities/tasks/reminders
│   │   ├── ProfileScreen.tsx    # User profile, caregiver management
│   │   ├── HistoryScreen.tsx    # Activity timeline
│   │   └── navBar.tsx           # Reusable bottom navigation bar
│   ├── fonts/                   # Custom fonts (Quicksand, Raleway)
│   └── images/                  # App images and icons
├── App.js                       # Root component - NativeStackNavigator (9 screens)
├── index.js                     # Entry point
├── app.json                     # Expo config
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Expo Go app on your phone, or iOS Simulator / Android Emulator

### Installation

```bash
npm install
```

### Configuration

Update the `LOCAL_IPV4` variable in `services/api.js` to your machine's local IP address so physical devices on the same WiFi can connect to the backend.

### Running

```bash
npm start
```

Press `a` for Android, `i` for iOS, or `w` for web.

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
| `createInvitation(babyId, email, role)` | Invite a user by email as `SECONDARY_CAREGIVER` or `PROFESSIONAL`. |
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
| `getTriggerTypes()` | List all 6 trigger types for dropdowns. |
| `createSymptomLog(babyId, data)` | Log a symptom with severity, trigger, notes. |
| `getSymptomLogs(babyId, filters)` | List symptom logs with optional date/code/trigger filters. |
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
| `registerPushToken(deviceToken, platform)` | Register Expo push token with backend (call on app startup). |
| `unregisterPushToken(deviceToken)` | Unregister push token (call on logout). |
| `getNotifications(limit)` | Get notification history for the user. |

### guidelineService.js — Vaccine Guidelines

| Function                       | Description                                                |
|--------------------------------|------------------------------------------------------------|
| `getAllVaccines()`             | List all 30 CDC-recommended vaccines.                      |
| `getVaccine(vaccineId)`        | Get details for a specific vaccine.                        |
| `getVaccineSchedule(ageWeeks)` | Get vaccines due and upcoming for a baby's age (in weeks). |
