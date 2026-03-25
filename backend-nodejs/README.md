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
│   ├── controllers/     # Route handlers (13 files)
│   ├── data/            # Hardcoded reference data (vaccines, symptoms catalogs)
│   ├── dtos/            # Data transfer objects / interfaces (14 files)
│   ├── jobs/            # Scheduled tasks (reminder notification cron)
│   ├── middleware/       # Auth, RBAC, validation
│   ├── models/          # Database queries (13 files)
│   ├── routes/          # API route definitions (13 files)
│   ├── scripts/         # Seed and cleanup scripts
│   ├── services/        # Business logic (12 files)
│   ├── utils/           # Helper functions (JWT, tokens, Expo Push)
│   ├── validators/      # Request validation rules (13 files)
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

Roles are stored in the `roles` database table and referenced by ID throughout the backend. The `caregiver_baby_access.access_role` and `share_invites.invited_role` columns are integer foreign keys to `roles.role_id`.

| Role ID | Role Name             | Description                                                             |
|---------|-----------------------|-------------------------------------------------------------------------|
| 1       | `PRIMARY_CAREGIVER`   | Baby creator. Full permissions including sharing and deleting the baby. |
| 2       | `SECONDARY_CAREGIVER` | Invited caregiver. Can edit health and activities. Cannot share.        |
| 3       | `PROFESSIONAL`        | Healthcare professional. Can edit health data only. Cannot share.       |

Role ID constants are defined in `src/dtos/caregiver-access.dto.ts` (`ROLE_PRIMARY`, `ROLE_SECONDARY`, `ROLE_PROFESSIONAL`). API responses return the role name string (e.g. `"PRIMARY_CAREGIVER"`) via JOIN to the `roles` table, so frontend consumers receive human-readable role names.

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
  "invited_role": 2
}
```

Valid role IDs: `2` (SECONDARY_CAREGIVER), `3` (PROFESSIONAL)

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

### Activities

All routes require authentication and baby access.

| Method | Endpoint                                    | Permission            | Description        |
|--------|---------------------------------------------|-----------------------|--------------------|
| POST   | `/babies/:babyId/activities`                | `can_edit_activities` | Log an activity    |
| GET    | `/babies/:babyId/activities`                | Baby access           | List activities    |
| GET    | `/babies/:babyId/activities/:activityId`    | Baby access           | Get activity       |
| PUT    | `/babies/:babyId/activities/:activityId`    | `can_edit_activities` | Update activity    |
| DELETE | `/babies/:babyId/activities/:activityId`    | `can_edit_activities` | Delete activity    |

### Tasks

All routes require authentication and baby access.

| Method | Endpoint                          | Permission  | Description  |
|--------|-----------------------------------|-------------|--------------|
| POST   | `/babies/:babyId/tasks`           | Baby access | Create task  |
| GET    | `/babies/:babyId/tasks`           | Baby access | List tasks   |
| GET    | `/babies/:babyId/tasks/:taskId`   | Baby access | Get task     |
| PUT    | `/babies/:babyId/tasks/:taskId`   | Baby access | Update task  |
| DELETE | `/babies/:babyId/tasks/:taskId`   | Baby access | Delete task  |

### Reminders

All routes require authentication and baby access.

| Method | Endpoint                                  | Permission  | Description     |
|--------|-------------------------------------------|-------------|-----------------|
| POST   | `/babies/:babyId/reminders`               | Baby access | Create reminder |
| GET    | `/babies/:babyId/reminders`               | Baby access | List reminders  |
| GET    | `/babies/:babyId/reminders/:reminderId`   | Baby access | Get reminder    |
| PUT    | `/babies/:babyId/reminders/:reminderId`   | Baby access | Update reminder |
| DELETE | `/babies/:babyId/reminders/:reminderId`   | Baby access | Delete reminder |

### Symptoms Catalog

Read-only reference data. All routes require authentication.

| Method | Endpoint            | Description                       |
|--------|---------------------|-----------------------------------|
| GET    | `/symptoms`         | List all 15 common baby symptoms  |
| GET    | `/symptoms/:code`   | Get symptom by code (e.g. FEVER)  |

### Symptom Logs

All routes require authentication and baby access.

| Method | Endpoint                                          | Permission        | Description                         |
|--------|---------------------------------------------------|-------------------|-------------------------------------|
| POST   | `/babies/:babyId/symptoms`                        | `can_edit_health` | Log a symptom                       |
| GET    | `/babies/:babyId/symptoms`                        | Baby access       | List symptom logs (filterable)      |
| GET    | `/babies/:babyId/symptoms/:symptomLogId`          | Baby access       | Get specific symptom log            |
| PUT    | `/babies/:babyId/symptoms/:symptomLogId`          | `can_edit_health` | Update symptom log                  |
| DELETE | `/babies/:babyId/symptoms/:symptomLogId`          | `can_edit_health` | Delete symptom log                  |

**Query filters for GET list:**
- `?from=2026-01-01` - Filter from date (ISO 8601)
- `?to=2026-03-01` - Filter to date
- `?symptom_code=FEVER` - Filter by symptom

### Medications

All routes require authentication and baby access.

| Method | Endpoint                                          | Permission        | Description       |
|--------|---------------------------------------------------|-------------------|-------------------|
| POST   | `/babies/:babyId/medications`                     | `can_edit_health` | Add medication    |
| GET    | `/babies/:babyId/medications`                     | Baby access       | List medications  |
| GET    | `/babies/:babyId/medications/:medicationId`       | Baby access       | Get medication    |
| PUT    | `/babies/:babyId/medications/:medicationId`       | `can_edit_health` | Update medication |
| DELETE | `/babies/:babyId/medications/:medicationId`       | `can_edit_health` | Delete medication |

### Analytics

All routes require authentication and baby access.

| Method | Endpoint                              | Description                                    |
|--------|---------------------------------------|------------------------------------------------|
| GET    | `/analytics/baby/:babyId/summary`     | Dashboard summary (counts, latest growth, etc) |
| GET    | `/analytics/baby/:babyId/graphs`      | Graph data (growth trends, activity/symptom frequency) |

### Notifications

All routes require authentication.

| Method | Endpoint                            | Description                     |
|--------|-------------------------------------|---------------------------------|
| POST   | `/notifications/register-token`     | Register Expo push token        |
| POST   | `/notifications/unregister-token`   | Unregister push token (logout)  |
| GET    | `/notifications`                    | Get notification history        |

## Notification System

Push notifications are sent automatically when reminders come due.

**Architecture:** Expo Push Notifications + Firebase Cloud Messaging (FCM) + node-cron scheduler

```
Cron (every min) → due reminders → Expo Push API → FCM → Android device
                                        ↓
                              notifications_log table
```

- A cron job runs every minute checking for due reminders
- Sends push notifications via Expo Push API to all caregivers with access to the baby
- One-time reminders (no `rrule`) are deactivated after firing
- Recurring reminders (`rrule` in RFC 5545 format) stay active
- All send attempts are logged in `notifications_log` with `DELIVERED` or `FAILED` status
- 1-minute anti-spam window prevents duplicate sends

**Prerequisites (already configured):**
- Firebase project with Android app (`com.n01570640.babytracker`)
- `google-services.json` placed in `mobile/babytracker/android/app/`
- FCM V1 service account key uploaded to Expo via `eas credentials -p android`
- Google services Gradle plugin configured in Android build files

**Frontend integration:** The mobile app calls `POST /notifications/register-token` after login/registration with the Expo push token. Notifications only work with `npx expo run:android` (not Expo Go, which dropped push support in SDK 53).

## Input Validation

- `full_name`: Letters, spaces, hyphens, and apostrophes only. Max 200 characters.
- `email`: Valid email format, normalized.
- `password`: Minimum 8 characters.
- `phone`: Optional, max 40 characters.
- All ID parameters must be positive integers.
- Date fields must be ISO 8601 format.
