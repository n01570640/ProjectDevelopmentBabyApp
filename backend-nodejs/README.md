# Baby Tracking API - Node.js Backend

Express.js REST API built with TypeScript for the Baby Tracking Application.

## Tech Stack

- Node.js 18.x LTS
- Express.js 4.x
- TypeScript 5.x
- OracleDB (Oracle driver)
- JWT (JSON Web Tokens)
- BCryptjs (Password hashing)

## Project Structure

```
backend-nodejs/
├── src/
│   ├── config/          # Configuration (database, JWT, etc.)
│   ├── controllers/     # Route handlers
│   ├── services/        # Business logic
│   ├── models/          # Data models (database schemas)
│   ├── middleware/      # Auth, validation, error handling
│   ├── routes/          # API route definitions
│   ├── utils/           # Helper functions
│   ├── types/           # TypeScript type definitions
│   ├── constants/       # Constants and enums
│   ├── errors/          # Custom error classes
│   └── server.ts        # Entry point
├── tests/               # Test files (to be created)
├── dist/                # Compiled JavaScript (after build)
├── docs/                # API documentation (to be created)
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18.x LTS or later
- npm or yarn
- Oracle Database access

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# Update: DB_HOST, DB_USER, DB_PASSWORD, JWT_SECRET
```

### Running

**Development** (with hot reload):
```bash
npm run dev
```

**Production** (compiled):
```bash
npm run build
npm start
```

API will be available at: `http://localhost:3000/api/v1`

## Configuration

Edit `.env` file to configure:
- Database connection (Oracle)
- Server port
- JWT secrets
- Logging level

## Scripts

```bash
npm run dev        # Start development server (ts-node-dev)
npm run build      # Compile TypeScript to JavaScript
npm start          # Run compiled app
npm test           # Run tests
npm run test:watch # Run tests in watch mode
npm run lint       # Check code style
npm run lint:fix   # Fix code style issues
```

## API Endpoints

### Current Endpoints

#### Health Check
```
GET /api/v1/health
```

#### API Overview
```
GET /api/v1
```

### Planned Endpoints (Suggestive)

*The following endpoints are planned and will be implemented as features are developed.*

- User Management (registration, login, profile)
- Baby Profile Management
- Activity Tracking
- Health Metrics
- Notifications
