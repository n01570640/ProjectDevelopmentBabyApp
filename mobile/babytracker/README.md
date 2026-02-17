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
├── services/                # API service layer
│   ├── api.js               # HTTP client (base URL, auth headers, GET/POST/PUT/DELETE)
│   ├── authService.js       # Authentication (register, login, logout)
│   ├── babyService.js       # Baby CRUD and growth metrics
│   ├── invitationService.js # Invitation system (create, accept, cancel)
│   ├── guidelineService.js  # Vaccine guidelines (CDC schedule)
│   └── userService.js       # User operations
├── src/
│   ├── components/          # Screen components
│   │   ├── landing.tsx      # Landing/welcome screen
│   │   ├── login.tsx        # Login screen
│   │   ├── register.tsx     # Registration screen
│   │   ├── children.tsx     # Baby list screen
│   │   └── navBar.tsx       # Navigation bar
│   └── images/              # App images and icons
├── App.js                   # Root component and navigation setup
├── index.js                 # Entry point
├── app.json                 # Expo config
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

### guidelineService.js — Vaccine Guidelines

| Function                       | Description                                                |
|--------------------------------|------------------------------------------------------------|
| `getAllVaccines()`             | List all 30 CDC-recommended vaccines.                      |
| `getVaccine(vaccineId)`        | Get details for a specific vaccine.                        |
| `getVaccineSchedule(ageWeeks)` | Get vaccines due and upcoming for a baby's age (in weeks). |
