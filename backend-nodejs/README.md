# Baby Tracking API - Node.js Backend

Express.js REST API built with TypeScript for the Baby Tracking Application.

## Tech Stack

- Node.js 18.x LTS
- Express.js 4.x
- TypeScript 5.x
- Azure SQL (via mssql/tedious)
- JWT (JSON Web Tokens)
- BCryptjs (Password hashing)
- express-validator (Input validation)

## Project Structure

```
backend-nodejs/
├── src/
│   ├── controllers/     # Route handlers
│   ├── data/            # Hardcoded reference data (vaccine catalog)
│   ├── dtos/            # Data transfer objects / interfaces
│   ├── middleware/       # Auth, RBAC, validation
│   ├── models/          # Database queries
│   ├── routes/          # API route definitions
│   ├── scripts/         # Seed and cleanup scripts
│   ├── services/        # Business logic
│   ├── utils/           # Helper functions (JWT, tokens)
│   ├── validators/      # Request validation rules
│   ├── db.ts            # Database connection
│   └── server.ts        # Entry point
├── package.json
├── tsconfig.json
├── .env
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18.x LTS or later
- Azure SQL Database access

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file with your database and JWT configuration.

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

API available at: `http://localhost:3000/api/v1`

## Scripts

```bash
npm run dev        # Start development server
npm run build      # Compile TypeScript
npm start          # Run compiled app
```

### Database Scripts

```bash
# Seed vaccines_catalog table (clean load - drops and reinserts)
npx ts-node src/scripts/seed.ts

# Delete orphaned babies (babies with no caregiver access)
npx ts-node src/scripts/cleanup-orphaned-babies.ts
```

## RBAC (Role-Based Access Control)

### Roles

| Role                  | Description                                                             |
|-----------------------|-------------------------------------------------------------------------|
| `PRIMARY_CAREGIVER`   | Baby creator. Full permissions including sharing and deleting the baby. |
| `SECONDARY_CAREGIVER` | Invited caregiver. Can edit health and activities. Cannot share.        |
| `PROFESSIONAL`        | Healthcare professional. Can edit health data only. Cannot share.       |

### Permissions

| Permission                  | PRIMARY | SECONDARY | PROFESSIONAL |
|-----------------------------|---------|-----------|--------------|
| `can_edit_health`           | Yes     | Yes       | Yes          |
| `can_edit_activities`       | Yes     | Yes       | No           |
| `can_share` (invite others) | Yes     | No        | No           |

### Delete Behavior

- **Primary caregiver deletes baby**: Baby and all related data (vaccinations, growth, invitations, access) are permanently deleted.
- **Secondary/Professional deletes baby**: Only their own access is removed. Baby and data remain for other caregivers.

## Invitation System

### Flow for New Users
1. Primary caregiver creates invitation with an email and role
2. Invitation token (UUID) is returned in the response
3. Invited person views public invitation details via the token (no auth required)
4. Invited person registers with the same email + `invitation_token` field
5. Access is auto-granted on registration (email must match invitation)

### Flow for Existing Users
1. Primary caregiver creates invitation
2. Existing user logs in and calls the accept endpoint with the invitation token
3. Access is granted after email verification

## API Endpoints

Base URL: `http://localhost:3000/api/v1`

All endpoints except auth and public invitation view require a Bearer token in the `Authorization` header.

### Health & Info

| Method | Endpoint   | Description              |
|--------|------------|--------------------------|
| GET    | `/health`  | Health check             |
| GET    | `/`        | API overview             |
| GET    | `/test-db` | Database connection test |

### Authentication

| Method | Endpoint         | Description                                                     |
|--------|------------------|-----------------------------------------------------------------|
| POST   | `/auth/register` | Register new user. Optional `invitation_token` for auto-accept. |
| POST   | `/auth/login`    | Login and receive JWT token                                     |

**Register body:**
```json
{
  "email": "user@example.com",
  "password": "min8chars",
  "full_name": "John Doe",
  "phone": "+1234567890",
  "invitation_token": "optional-uuid"
}
```

**Login body:**
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

### Babies

All routes require authentication. `:babyId` must be a positive integer.

| Method | Endpoint          | Permission        | Description                                        |
|--------|-------------------|-------------------|----------------------------------------------------|
| POST   | `/babies`         | Authenticated     | Create baby (user becomes PRIMARY_CAREGIVER)       |
| GET    | `/babies`         | Authenticated     | List all babies the user has access to             |
| GET    | `/babies/:babyId` | Baby access       | Get baby details                                   |
| PUT    | `/babies/:babyId` | PRIMARY_CAREGIVER | Update baby details                                |
| DELETE | `/babies/:babyId` | Baby access       | Primary: deletes baby. Others: removes own access. |

### Invitations

| Method | Endpoint                                | Permission       | Description                             |
|--------|-----------------------------------------|------------------|-----------------------------------------|
| POST   | `/babies/:babyId/invitations`           | `can_share`      | Create invitation                       |
| GET    | `/babies/:babyId/invitations`           | `can_share`      | List pending invitations for a baby     |
| DELETE | `/babies/:babyId/invitations/:inviteId` | Inviter only     | Cancel a pending invitation             |
| GET    | `/invitations/:token`                   | Public (no auth) | View invitation details by token        |
| POST   | `/invitations/:token/accept`            | Authenticated    | Accept an invitation (email must match) |

**Create invitation body:**
```json
{
  "invited_email": "caregiver@example.com",
  "invited_role": "SECONDARY_CAREGIVER"
}
```

Valid roles: `SECONDARY_CAREGIVER`, `PROFESSIONAL`

### Vaccinations

All routes require authentication and baby access.

| Method | Endpoint                                      | Permission        | Description               |
|--------|-----------------------------------------------|-------------------|---------------------------|
| POST   | `/babies/:babyId/vaccinations`                | `can_edit_health` | Record a vaccination      |
| GET    | `/babies/:babyId/vaccinations`                | Baby access       | List vaccination history  |
| GET    | `/babies/:babyId/vaccinations/:vaccinationId` | Baby access       | Get specific vaccination  |
| PUT    | `/babies/:babyId/vaccinations/:vaccinationId` | `can_edit_health` | Update vaccination record |
| DELETE | `/babies/:babyId/vaccinations/:vaccinationId` | `can_edit_health` | Delete vaccination record |

### Growth Metrics

All routes require authentication and baby access.

| Method | Endpoint                           | Permission        | Description                |
|--------|------------------------------------|-------------------|----------------------------|
| POST   | `/babies/:babyId/growth`           | `can_edit_health` | Record growth metrics      |
| GET    | `/babies/:babyId/growth`           | Baby access       | List growth history        |
| GET    | `/babies/:babyId/growth/latest`    | Baby access       | Get latest growth record   |
| GET    | `/babies/:babyId/growth/:growthId` | Baby access       | Get specific growth record |
| PUT    | `/babies/:babyId/growth/:growthId` | `can_edit_health` | Update growth record       |
| DELETE | `/babies/:babyId/growth/:growthId` | `can_edit_health` | Delete growth record       |

### Vaccine Guidelines

All routes require authentication. Read-only reference data.

| Method | Endpoint                                  | Description |
|--------|-------------------------------------------|----------------------------------------------|
| GET    | `/guidelines/vaccines`                    | List all 30 CDC-recommended vaccines         |
| GET    | `/guidelines/vaccines/:vaccineId`         | Get specific vaccine details                 |
| GET    | `/guidelines/vaccines/schedule/:ageWeeks` | Get vaccines due/upcoming for age (in weeks) |

## Input Validation

- `full_name`: Letters, spaces, hyphens, and apostrophes only. Max 200 characters.
- `email`: Valid email format, normalized.
- `password`: Minimum 8 characters.
- `phone`: Optional, max 40 characters.
- All ID parameters must be positive integers.
- Date fields must be ISO 8601 format.
