import { webcrypto } from "crypto";
if (!globalThis.crypto) (globalThis as any).crypto = webcrypto;

import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { getDb } from './db';
import authRoutes from "./routes/auth.routes";
import babyRoutes from "./routes/baby.routes";
import invitationRoutes from "./routes/invitation.routes";
import guidelineRoutes from "./routes/guideline.routes";
import vaccinationRoutes from "./routes/vaccination.routes";
import growthRoutes from "./routes/growth.routes";
import activityRoutes from "./routes/activity.routes";
import taskRoutes from "./routes/task.routes";
import reminderRoutes from "./routes/reminder.routes";
import symptomRoutes from "./routes/symptom.routes";
import medicationRoutes from "./routes/medication.routes";
import analyticsRoutes from "./routes/analytics.routes";
import notificationRoutes from "./routes/notification.routes";
import userRoutes from "./routes/user.routes";
import { startReminderCron } from "./jobs/reminder-cron";

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// ------------------------------------------------------------
// GLOBAL MIDDLEWARE (CORS MUST COME BEFORE ROUTES)
// ------------------------------------------------------------
const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map(o => o.trim())
  : (process.env.NODE_ENV === "production" ? [] : "*");

app.use(cors({
  origin: corsOrigin,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Handle preflight requests
app.options("*", cors());

app.use(helmet());
app.use(morgan('dev')); // HTTP request logging
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true }));

// ------------------------------------------------------------
// ROUTES
// ------------------------------------------------------------
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/babies", babyRoutes);
app.use("/api/v1/babies", vaccinationRoutes); // Handles /babies/:babyId/vaccinations
app.use("/api/v1/babies", growthRoutes);       // /babies/:babyId/growth
app.use("/api/v1/babies", activityRoutes);     // /babies/:babyId/activities
app.use("/api/v1/babies", taskRoutes);         // /babies/:babyId/tasks
app.use("/api/v1/babies", reminderRoutes);     // /babies/:babyId/reminders
app.use("/api/v1", invitationRoutes); // Handles both /babies/:babyId/invitations and /invitations/:token
app.use("/api/v1", symptomRoutes);              // /symptoms, /babies/:babyId/symptoms
app.use("/api/v1/babies", medicationRoutes);    // /babies/:babyId/medications
app.use("/api/v1/analytics", analyticsRoutes);      // /analytics/baby/:babyId/summary, /graphs
app.use("/api/v1/notifications", notificationRoutes); // /notifications/register-token, /notifications
app.use("/api/v1/guidelines", guidelineRoutes);
app.use("/api/v1/users", userRoutes);                // /users/me/profile-photo

// SQL test route (non-production only)
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/v1/test-db', async (req, res) => {
    try {
      const db = await getDb();
      const result = await db.request().query("SELECT 1 AS test");

      res.status(200).json({
        success: true,
        message: 'Connected to Azure SQL successfully!',
        result: result.recordset
      });
    } catch (err: any) {
      console.error("DB Test Error:", err);
      res.status(500).json({
        success: false,
        message: 'Failed to connect to Azure SQL',
        error: err.message
      });
    }
  });
}

// Health Check
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Baby Tracking API is running',
    timestamp: new Date().toISOString()
  });
});

// Root API index
app.get('/api/v1', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Baby Tracking API v1.0',
    endpoints: {
      auth: '/api/v1/auth',
      babies: '/api/v1/babies',
      vaccinations: '/api/v1/babies/:babyId/vaccinations',
      invitations: '/api/v1/babies/:babyId/invitations',
      symptoms_catalog: '/api/v1/symptoms',
      symptom_logs: '/api/v1/babies/:babyId/symptoms',
      medications: '/api/v1/babies/:babyId/medications',
      analytics_summary: '/api/v1/analytics/baby/:babyId/summary',
      analytics_graphs: '/api/v1/analytics/baby/:babyId/graphs',
      notifications: '/api/v1/notifications',
      guidelines: '/api/v1/guidelines',
      profile_photo_get: '/api/v1/users/me/profile-photo',
      profile_photo_upload: '/api/v1/users/me/profile-photo',
      user_profile_get: '/api/v1/users/me',
      user_profile_update: '/api/v1/users/me',
      baby_profile_photo_get: '/api/v1/babies/:babyId/profile-photo',
      baby_profile_photo_upload: '/api/v1/babies/:babyId/profile-photo',
      health: '/api/v1/health',
      ...(process.env.NODE_ENV !== 'production' ? { test_db: '/api/v1/test-db' } : {})
    }
  });
});

// ------------------------------------------------------------
// 404 CATCH-ALL
// ------------------------------------------------------------
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ------------------------------------------------------------
// ERROR HANDLING
// ------------------------------------------------------------
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    }
  });
});

// ------------------------------------------------------------
// START SERVER
// ------------------------------------------------------------
app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`Baby Tracking API listening on 0.0.0.0:${PORT} (all interfaces)`);
  console.log(`API Documentation: http://localhost:${PORT}/api/v1`);
  console.log(`DB Test Endpoint: http://localhost:${PORT}/api/v1/test-db`);

  // Start reminder notification cron job
  try {
    startReminderCron();
  } catch (err: any) {
    console.error("Failed to start reminder cron job:", err.message);
  }
});
