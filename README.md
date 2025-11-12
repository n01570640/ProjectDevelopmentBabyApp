# Baby Tracking Application

A cross-platform mobile application for tracking baby activities and health.

## Dual Backend Architecture

This project includes **TWO backend implementations**. Choose the one that best fits your needs!

## Backend Options

### Option 1: Spring Boot (Java)
- **Location:** `Springboot_IP/backend/`
- **Tech:** Spring Boot 3.x, Java 17, Maven
- **Port:** 8080
- **Run:** `cd Springboot_IP/backend && mvn spring-boot:run`

**Choose this if:**
- You prefer Java/enterprise-grade framework
- You want built-in security features (Spring Security)
- You need strong typing and structure
- You have Java developers on the team

---

### Option 2: Node.js + Express (TypeScript)
- **Location:** `backend-nodejs/`
- **Tech:** Express.js, TypeScript, Node.js 18
- **Port:** 3000
- **Run:** `cd backend-nodejs && npm run dev`

**Choose this if:**
- You prefer JavaScript/TypeScript (same as React Native frontend)
- You want faster development with hot reload
- You want a lighter-weight solution
- You have JavaScript developers on the team

---

## Project Structure

```
ProjectDev_BabyApp/
├── Springboot_IP/          # Spring Boot (Java) backend
│   ├── backend/
│   └── README.md
│
├── backend-nodejs/         # Express.js (Node.js) backend
│   ├── src/
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── mobile/                 # React Native app (iOS/Android)
│   ├── services/
│   ├── assets/
│   ├── App.js
│   ├── index.js
│   ├── package.json
│   └── README.md
│
├── claudedocs/            # Requirements & specifications
├── .gitignore
└── README.md              # This file
```

## Mobile App

- **Framework:** React Native (Expo)
- **Language:** JavaScript
- **Build Tool:** npm

Location: `/mobile/babytracker`

## Quick Start

### Backend (Choose One)

**Spring Boot:**
```bash
cd Springboot_IP/backend
mvn clean install
mvn spring-boot:run
```
API: `http://localhost:8080/api/v1`

**Node.js:**
```bash
cd backend-nodejs
npm install
npm run dev
```
API: `http://localhost:3000/api/v1`

### Mobile App

```bash
cd mobile/babytracker
npm install
npm start
```

---

## Configuration

**Spring Boot:** Edit `Springboot_IP/backend/src/main/resources/application.properties`

**Node.js:** Copy `.env.example` to `.env` in `backend-nodejs/`

## Testing Backends

You can run **both backends simultaneously** on different ports:
- Spring Boot on port 8080
- Node.js on port 3000

The mobile app is currently configured to connect to Node.js on port 3000.

---

For detailed documentation, see:
- Implementation Plan: `claudedocs/implementation_plan.md`
- Node.js Backend: `backend-nodejs/README.md`
- Mobile App: `mobile/babytracker/README.md`
