# Baby Tracking Application

A cross-platform mobile application for tracking baby activities and health.

## Project Status

**Base Structure & Configuration** - This is an initial project setup with foundational structure and configurations. Core features are not yet implemented.

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