# Baby Tracking Application

A cross-platform mobile application for tracking baby activities and health.

## Project Status

Backend and mobile app are implemented. The backend (Node.js, Express, TypeScript) provides JWT authentication, role-based access for caregivers with per-baby permissions, caregiver invitations, tracking for activities, growth, medications, symptoms, vaccinations and tasks, a timeline and analytics, and a scheduled job that sends push-notification reminders. The mobile app is built with React Native (Expo) and Redux Toolkit.

## Team Workflow

The team worked in feature branches that were merged into `develop` through pull requests, then merged into `main`. The full history is in the closed pull requests and on the `develop` branch.

## Tech Stack

- **Backend:** Node.js + Express.js with TypeScript
- **Frontend:** React Native (Expo)
- **Language:** JavaScript/TypeScript throughout the stack

## Project Structure

```
ProjectDev_BabyApp/
├── backend-nodejs/              # Node.js + Express backend (TypeScript)
│   ├── src/                     # TypeScript source files
│   ├── dist/                    # Compiled JavaScript
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── mobile/
│   └── babytracker/             # React Native mobile app (Expo)
│       ├── .expo/               # Expo cache
│       ├── assets/              # Images and resources
│       ├── services/            # API services
│       ├── App.js               # Main component
│       ├── index.js             # Entry point
│       ├── app.json             # Expo config
│       ├── package.json
│       └── README.md
│
├── LICENSE
├── .gitignore
└── README.md                    # This file
```

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Git

### Backend Setup

```bash
cd backend-nodejs
npm install
npm run dev
```

API runs on: `http://localhost:3000`

### Mobile App Setup

```bash
cd mobile/babytracker
npm install
npm start
```

## Available Commands

### Backend Commands
```bash
npm run dev          # Start development server with auto-reload
npm run build        # Compile TypeScript to JavaScript
npm start            # Run compiled JavaScript (production)
npm test             # Run tests
npm run lint         # Check code style
npm run lint:fix     # Fix code style issues
```

### Mobile App Commands
```bash
npm start            # Start Expo development server
npm run android      # Run on Android emulator
npm run ios          # Run on iOS simulator
npm run web          # Run in web browser
```

## Configuration

**Backend (Node.js):**
- Copy `.env.example` to `.env` in `backend-nodejs/`
- Configure environment variables (port, database, API keys, etc.)

**Mobile App:**
- Edit `mobile/babytracker/app.json` for Expo configuration

## Documentation

For detailed information, refer to:
- Backend API: `backend-nodejs/README.md`
- Mobile App: `mobile/babytracker/README.md`
