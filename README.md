# Baby Tracking Application

A cross-platform mobile application for tracking baby activities and health.

## Dual Backend Architecture

This project includes **TWO backend implementations**. Choose the one that best fits your needs!

## Backend Options

### Option 1: Spring Boot (Java)
- **Location:** `backend/`
- **Tech:** Spring Boot 3.x, Java 17, Maven
- **Port:** 8080
- **Run:** `cd backend && mvn spring-boot:run`

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
├── backend/                # Spring Boot (Java) backend
│   ├── src/
│   ├── pom.xml
│   └── README.md
│
├── backend-nodejs/         # Express.js (Node.js) backend
│   ├── src/
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── mobile/                 # React Native app (iOS/Android)
│   ├── src/
│   ├── package.json
│   └── README.md
│
├── claudedocs/            # Requirements & specifications
├── .gitignore
└── README.md              # This file
```

## Mobile App

- **Framework:** React Native
- **Language:** TypeScript
- **Build Tool:** npm

Location: `/mobile`

## Quick Start

### Backend (Choose One)

**Spring Boot:**
```bash
cd backend
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
cd mobile
npm install
npm start
```

---

## Configuration

**Spring Boot:** Edit `backend/src/main/resources/application.properties`

**Node.js:** Copy `.env.example` to `.env` in `backend-nodejs/`

## Testing Backends

You can run **both backends simultaneously** on different ports:
- Spring Boot on port 8080
- Node.js on port 3000

Switch between them in mobile app by changing `API_BASE_URL`.

---

For detailed documentation, see:
- Implementation Plan: `claudedocs/implementation_plan.md`
- Spring Boot Backend: `backend/README.md`
- Node.js Backend: `backend-nodejs/README.md`
- Mobile App: `mobile/README.md`
